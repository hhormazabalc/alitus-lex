'use server';

import 'server-only';

import { cookies, headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';

import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import type {
  Database,
  MembershipRole,
  MembershipStatus,
  ProfileStatus,
} from '@/lib/supabase/types';
import {
  AuthError,
  AuthMissingError,
  PendingAccountError,
  OrganizationSelectionError,
  OrganizationAccessDeniedError,
} from '@/lib/auth/errors';

export type Role = 'admin_firma' | 'abogado' | 'analista' | 'cliente';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type MembershipRow = Database['public']['Tables']['memberships']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

type MembershipWithOrg = MembershipRow & {
  organization: Pick<OrganizationRow, 'id' | 'name' | 'plan'>;
};

export type AuthContext = {
  profile: ProfileRow & { role: Role; status: ProfileStatus };
  membership: MembershipWithOrg;
  memberships: MembershipWithOrg[];
  membershipRole: MembershipRole;
  organization: MembershipWithOrg['organization'];
  roleOverride?: Role | null;
};

const ACTIVE_ORG_COOKIE = 'lex_active_org';
const MODE_COOKIE = 'lex_mode';
const PERSONA_COOKIE = 'lex_persona';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

const DEFAULT_ORG_FALLBACK: Pick<OrganizationRow, 'id' | 'name' | 'plan'> = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Organización',
  plan: 'standard',
};

const MEMBERSHIP_TO_APP_ROLE: Record<MembershipRole, Role> = {
  owner: 'admin_firma',
  admin: 'admin_firma',
  lawyer: 'abogado',
  analyst: 'analista',
  client_guest: 'cliente',
};

const APP_ROLE_TO_MEMBERSHIPS: Record<Role, MembershipRole[]> = {
  admin_firma: ['owner', 'admin'],
  abogado: ['lawyer'],
  analista: ['analyst'],
  cliente: ['client_guest'],
};

type MembershipQueryRow = MembershipRow & {
  organizations: {
    id: string;
    name: string;
    plan: string;
  } | null;
};

const nowIso = () => new Date().toISOString();
const ROLE_VALUES: Role[] = ['admin_firma', 'abogado', 'analista', 'cliente'];

function parseRoleOverride(value: string | null | undefined): Role | null {
  if (!value) return null;
  return ROLE_VALUES.includes(value as Role) ? (value as Role) : null;
}

function mapRolesToMemberships(roles?: Role | Role[]): MembershipRole[] | undefined {
  if (!roles) return undefined;
  const roleList = Array.isArray(roles) ? roles : [roles];
  const result = new Set<MembershipRole>();
  for (const role of roleList) {
    (APP_ROLE_TO_MEMBERSHIPS[role] ?? []).forEach((item) => result.add(item));
  }
  return result.size > 0 ? Array.from(result) : undefined;
}

function normalizeMembership(row: MembershipQueryRow): MembershipWithOrg {
  const { organizations, ...rest } = row;
  const organization =
    organizations != null
      ? {
          id: organizations.id,
          name: organizations.name,
          plan: organizations.plan,
        }
      : { ...DEFAULT_ORG_FALLBACK, id: row.org_id };

  return {
    ...(rest as MembershipRow),
    organization,
  };
}

async function resolveDomainOrgId(host: string | null): Promise<string | null> {
  if (!host) return null;
  const cleanHost = host.split(':')[0]?.toLowerCase();
  if (!cleanHost) return null;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('domains')
      .select('org_id')
      .eq('host', cleanHost)
      .eq('active', true)
      .maybeSingle();
    if (error) {
      console.warn('[AUTH] Error resolving domain', cleanHost, error);
      return null;
    }
    return data?.org_id ?? null;
  } catch (error) {
    console.warn('[AUTH] Exception resolving domain', error);
    return null;
  }
}

async function ensureProfileExists(client: Awaited<ReturnType<typeof createServerClient>>, user: User) {
  const { data: existing, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  const email = user.email ?? existing?.email ?? '';
  const fullName =
    (user.user_metadata as any)?.nombre ??
    (user.user_metadata as any)?.name ??
    (email ? email.split('@')[0] : 'Usuario');

  if (existing) {
    const updates: Partial<ProfileRow> = {};
    if (email && email !== existing.email) updates.email = email;
    if (fullName && fullName !== existing.full_name) updates.full_name = String(fullName);
    if (existing.status == null) updates.status = 'pending';

    if (Object.keys(updates).length > 0) {
      updates.updated_at = nowIso();
      const { data: updated, error: updateError } = await client
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('*')
        .maybeSingle();
      if (updateError) throw updateError;
      return updated ?? existing;
    }

    return existing;
  }

  const insertPayload: ProfileRow = {
    id: user.id,
    email,
    full_name: String(fullName || 'Usuario'),
    activo: false,
    created_at: nowIso(),
    updated_at: nowIso(),
    role: 'cliente',
    rut: null,
    phone: null,
    status: 'pending',
  };

  const { data: inserted, error: insertError } = await client
    .from('profiles')
    .insert(insertPayload satisfies Partial<ProfileRow>)
    .select('*')
    .maybeSingle();

  if (insertError) throw insertError;

  return inserted!;
}

async function getAuthContextInternal(options?: {
  allowedMembershipRoles?: MembershipRole[];
  allowPending?: boolean;
}): Promise<AuthContext> {
  const supabase = await createServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!authData?.user) throw new AuthMissingError();

  const profileRow = await ensureProfileExists(supabase, authData.user);

  const profileStatus = (profileRow.status ?? 'pending') as ProfileStatus;
  const profileBase: ProfileRow & { role: Role; status: ProfileStatus } = {
    ...profileRow,
    role: MEMBERSHIP_TO_APP_ROLE.lawyer, // placeholder, overwritten later
    status: profileStatus,
  };

  const { data: membershipRows, error: membershipsError } = await supabase
    .from('memberships')
    .select('id, user_id, org_id, role, status, created_at, organizations(id, name, plan)')
    .eq('user_id', profileRow.id);

  if (membershipsError) throw membershipsError;

  const normalizedMemberships = (membershipRows ?? [])
    .filter((row) => (row.status as MembershipStatus) === 'active')
    .map((row) => normalizeMembership(row as MembershipQueryRow));

  const cookieStore = await cookies();
  const modeCookie = cookieStore.get(MODE_COOKIE)?.value ?? 'super';
  const personaRole = modeCookie === 'demo' ? parseRoleOverride(cookieStore.get(PERSONA_COOKIE)?.value ?? null) : null;
  const personaMembershipRoles = personaRole ? mapRolesToMemberships(personaRole) ?? [] : [];

  if (profileStatus !== 'active' && !options?.allowPending) {
    throw new PendingAccountError<ProfileRow & { role: Role; status: ProfileStatus }>(profileBase);
  }

  if (normalizedMemberships.length === 0) {
    throw new OrganizationSelectionError<MembershipWithOrg>([]);
  }

  const allowedRoles = options?.allowedMembershipRoles;
  let filteredMemberships =
    allowedRoles && allowedRoles.length > 0
      ? normalizedMemberships.filter((m) => allowedRoles.includes(m.role))
      : normalizedMemberships;

  if (
    filteredMemberships.length === 0 &&
    allowedRoles &&
    allowedRoles.length > 0 &&
    personaRole &&
    personaMembershipRoles.some((mRole) => allowedRoles.includes(mRole)) &&
    normalizedMemberships.length > 0
  ) {
    filteredMemberships = normalizedMemberships;
  }

  if (filteredMemberships.length === 0) {
    throw new OrganizationAccessDeniedError(null);
  }

  const headerStore = await headers();
  const domainOrgId = await resolveDomainOrgId(headerStore.get('host'));

  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;

  let selected: MembershipWithOrg | undefined;

  if (domainOrgId) {
    selected = filteredMemberships.find((m) => m.org_id === domainOrgId);
    if (!selected) throw new OrganizationAccessDeniedError(domainOrgId);
  } else if (cookieOrgId) {
    selected = filteredMemberships.find((m) => m.org_id === cookieOrgId);
  }

  if (!selected) {
    selected = filteredMemberships[0];
  }

  if (!selected) {
    throw new OrganizationSelectionError<MembershipWithOrg>(filteredMemberships);
  }

  if (!domainOrgId && selected.org_id !== cookieOrgId) {
    try {
      cookieStore.set(ACTIVE_ORG_COOKIE, selected.org_id, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE_SECONDS,
      });
    } catch {
      // Ignorar contextos donde no se pueden mutar cookies (p.e. render RSC)
    }
  }

  const membershipRole = selected.role;
  const appRole = MEMBERSHIP_TO_APP_ROLE[membershipRole];

  const profile: ProfileRow & { role: Role; status: ProfileStatus } = {
    ...profileRow,
    role: appRole,
    status: profileStatus,
  };

  return {
    profile,
    membership: selected,
    memberships: normalizedMemberships,
    membershipRole,
    organization: selected.organization,
    roleOverride: personaRole ?? null,
  };
}

export async function requireAuthContext(roles?: Role | Role[]): Promise<AuthContext> {
  const allowedMembershipRoles = mapRolesToMemberships(roles);
  const options = allowedMembershipRoles ? { allowedMembershipRoles } : {};
  return getAuthContextInternal(options);
}

export type AuthenticatedProfile = AuthContext['profile'] & {
  org_id: string;
  organization: AuthContext['organization'];
  memberships: MembershipWithOrg[];
  membership_role: MembershipRole;
  membership: MembershipWithOrg;
  nombre?: string;
  telefono?: string | null;
  _role_override?: Role | null;
};

export async function requireAuth(roles?: Role | Role[]): Promise<AuthenticatedProfile> {
  const ctx = await requireAuthContext(roles);

  const profileWithAliases: AuthenticatedProfile = {
    ...ctx.profile,
    org_id: ctx.organization.id,
    organization: ctx.organization,
    memberships: ctx.memberships,
    membership_role: ctx.membershipRole,
    membership: ctx.membership,
    // alias para compatibilidad con código existente
    nombre: (ctx.profile as any).nombre ?? ctx.profile.full_name,
    telefono: (ctx.profile as any).telefono ?? ctx.profile.phone,
    _role_override: ctx.roleOverride ?? null,
  };

  return profileWithAliases;
}

export async function getCurrentProfile(): Promise<
  (AuthenticatedProfile & { status: ProfileStatus }) | null
> {
  try {
    return await requireAuth();
  } catch (error) {
    if (error instanceof PendingAccountError) {
      return {
        ...(error.profile as AuthenticatedProfile),
        org_id: '',
        organization: DEFAULT_ORG_FALLBACK,
        memberships: [],
        membership_role: 'client_guest',
        membership: {
          id: '',
          user_id: error.profile.id,
          org_id: '',
          role: 'client_guest',
          status: 'invited',
          created_at: nowIso(),
          organization: DEFAULT_ORG_FALLBACK,
        },
        nombre: (error.profile as any).nombre ?? error.profile.full_name,
        telefono: (error.profile as any).telefono ?? error.profile.phone,
        _role_override: null,
      };
    }
    if (error instanceof AuthMissingError) {
      return null;
    }
    if (error instanceof OrganizationSelectionError || error instanceof OrganizationAccessDeniedError) {
      return null;
    }
    throw error;
  }
}

export async function canAccessCase(caseId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc('has_case_access', { case_uuid: caseId });
    if (error) {
      console.warn('[AUTH] Error checking case access', error);
      return false;
    }
    return Boolean(data);
  } catch (error) {
    console.warn('[AUTH] Exception checking case access', error);
    return false;
  }
}

export async function setActiveOrganization(orgId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });
}

export async function getActiveOrganizationId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
}

export async function listUserMemberships(): Promise<MembershipWithOrg[]> {
  const ctx = await requireAuthContext();
  return ctx.memberships;
}
