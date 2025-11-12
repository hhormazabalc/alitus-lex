'use server';

import { revalidatePath } from 'next/cache';

import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { requireAuth, setActiveOrganization } from '@/lib/auth/roles';
import { logAuditAction } from '@/lib/audit/log';
import type {
  Database,
  MembershipRole,
  MembershipStatus,
  ProfileInsert,
} from '@/lib/supabase/types';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type MembershipRow = Database['public']['Tables']['memberships']['Row'];
type DomainRow = Database['public']['Tables']['domains']['Row'];

type InitialAdminPayload = {
  email: string;
  name?: string;
  phone?: string | null;
  sendInvite: boolean;
};

type InitialAdminResult = {
  email: string;
  invited: boolean;
  existingUser: boolean;
};

export type OrganizationSummary = {
  organization: Pick<OrganizationRow, 'id' | 'name' | 'plan' | 'created_at'>;
  membership: Pick<MembershipRow, 'id' | 'role' | 'status' | 'created_at'>;
  domains: Array<Pick<DomainRow, 'host' | 'active' | 'created_at'>>;
};

export type CreateOrganizationResult =
  | { success: true; organization: OrganizationSummary['organization']; initialAdmin?: InitialAdminResult }
  | { success: false; error: string };

const REVALIDATE_PATHS = [
  '/dashboard',
  '/cases',
  '/clients',
  '/admin/org',
  '/admin/users',
  '/settings',
  '/super/dashboard',
];

function sanitizeDomain(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function normalizeEmail(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return null;
  return trimmed;
}

function parseBoolean(value: FormDataEntryValue | null | undefined, fallback = true) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'on', 'yes'].includes(normalized);
  }
  return Boolean(value);
}

const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function findAuthUserIdByEmail(service: ReturnType<typeof createServiceClient>, email: string) {
  const normalizedEmail = email.toLowerCase();
  const perPage = 100;
  let page: number | null = 1;

  while (page !== null) {
    const currentPage = page;
    const result = await service.auth.admin.listUsers({ page: currentPage, perPage });
    if (result.error) {
      return { userId: null as string | null, error: result.error };
    }

    const { users, nextPage } = result.data;
    const match = users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (match) {
      return { userId: match.id, error: null };
    }

    page = nextPage;
  }

  return { userId: null as string | null, error: null };
}

export async function listOrganizations(): Promise<OrganizationSummary[]> {
  const profile = await requireAuth();
  if (profile.role !== 'admin_firma') {
    return [];
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('memberships')
    .select(
      `
        id,
        org_id,
        role,
        status,
        created_at,
        organizations (
          id,
          name,
          plan,
          created_at,
          domains (
            host,
            active,
            created_at
          )
        )
      `,
    )
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[organizations] listOrganizations error', error);
    return [];
  }

  const results: OrganizationSummary[] = (data ?? [])
    .map((row: any) => {
      const org = row.organizations;
      if (!org) return null;

      return {
        organization: {
          id: org.id,
          name: org.name,
          plan: org.plan,
          created_at: org.created_at,
        },
        membership: {
          id: row.id,
          role: row.role as MembershipRole,
          status: row.status as MembershipStatus,
          created_at: row.created_at,
        },
        domains:
          (org.domains as DomainRow[] | null)?.map((domain) => ({
            host: domain.host,
            active: domain.active,
            created_at: domain.created_at,
          })) ?? [],
      } satisfies OrganizationSummary;
    })
    .filter((item): item is OrganizationSummary => Boolean(item));

  return results;
}

async function provisionInitialAdmin(params: {
  service: ReturnType<typeof createServiceClient>;
  orgId: string;
  admin: InitialAdminPayload;
}): Promise<InitialAdminResult> {
  const { service, orgId, admin } = params;
  const email = admin.email;
  const displayName = admin.name?.trim() || email;
  const phone = admin.phone?.trim() || null;
  let userId: string | null = null;
  let invited = false;
  let existingUser = false;

  const existingLookup = await findAuthUserIdByEmail(service, email);
  if (existingLookup.error) {
    console.warn('[organizations] listUsers error for', email, existingLookup.error);
  }
  if (existingLookup.userId) {
    userId = existingLookup.userId;
    existingUser = true;
  }

  if (!userId && admin.sendInvite) {
    const invite = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_BASE_URL}/login`,
      data: {
        nombre: displayName,
        role: 'admin_firma',
        orgId,
      },
    });

    if (invite.error) {
      const message = invite.error.message ?? '';
      if (!message.toLowerCase().includes('already registered')) {
        throw new Error(`No se pudo enviar la invitación: ${message || 'error desconocido'}`);
      }
      const fallback = await findAuthUserIdByEmail(service, email);
      if (fallback.error) {
        console.warn('[organizations] fallback listUsers error', fallback.error);
      }
      if (fallback.userId) {
        userId = fallback.userId;
        existingUser = true;
      }
    } else {
      invited = true;
      userId = invite.data?.user?.id ?? userId;
    }
  }

  if (!userId) {
    const created = await service.auth.admin.createUser({
      email,
      email_confirm: false,
      app_metadata: { role: 'admin_firma' },
      user_metadata: { nombre: displayName, role: 'admin_firma' },
    });
    if (created.error) {
      throw new Error(created.error.message ?? 'No se pudo crear la cuenta del administrador.');
    }
    userId = created.data.user?.id ?? null;
  }

  if (!userId) {
    throw new Error('No fue posible obtener la cuenta del administrador inicial.');
  }

  const { data: existingProfile, error: existingProfileError } = await service
    .from('profiles')
    .select('full_name, phone, status, activo')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfileError) {
    console.warn('[organizations] existing profile lookup error', existingProfileError);
  }

  const profilePayload: ProfileInsert = {
    id: userId,
    email,
    full_name: displayName,
    role: 'admin_firma',
    phone: phone ?? existingProfile?.phone ?? null,
    activo: existingProfile?.activo ?? true,
    status: existingProfile?.status ?? 'active',
  };

  const { error: profileError } = await service.from('profiles').upsert(profilePayload, {
    onConflict: 'id',
  });
  if (profileError) {
    throw new Error(profileError.message ?? 'No se pudo actualizar el perfil del administrador.');
  }

  const membershipPayload: Pick<MembershipRow, 'user_id' | 'org_id' | 'role' | 'status'> = {
    user_id: userId,
    org_id: orgId,
    role: 'owner',
    status: 'active',
  };

  const { data: membershipRow, error: membershipError } = await service
    .from('memberships')
    .upsert(membershipPayload, { onConflict: 'user_id,org_id' })
    .select('id')
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message ?? 'No se pudo asignar la organización al administrador.');
  }

  await logAuditAction({
    action: 'SAAS_ORG_INITIAL_ADMIN',
    entity_type: 'membership',
    entity_id: membershipRow?.id ?? `${orgId}:${userId}`,
    diff_json: {
      org_id: orgId,
      user_id: userId,
      email,
      invited,
      existing_user: existingUser,
    },
  });

  return { email, invited, existingUser };
}

type CreateOrganizationInput = {
  name: string;
  plan?: string;
  domain?: string | null;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  adminSendInvite?: boolean;
};

type ParsedOrganizationInput = {
  name: string;
  plan: string;
  domain: string | null;
  initialAdmin?: InitialAdminPayload;
  error?: string;
};

function parseFormInput(formData: FormData): ParsedOrganizationInput {
  const name = String(formData.get('name') ?? '').trim();
  const plan = String(formData.get('plan') ?? '').trim() || 'standard';
  const domain = sanitizeDomain(formData.get('domain')?.toString());
  const rawAdminEmail = String(formData.get('adminEmail') ?? '').trim();
  if (!rawAdminEmail) {
    return { name, plan, domain, error: 'Debes ingresar un correo corporativo para el administrador.' };
  }
  const adminEmail = normalizeEmail(rawAdminEmail);
  if (!adminEmail) {
    return { name, plan, domain, error: 'Debes ingresar un correo válido para el administrador.' };
  }

  const adminNameValue = String(formData.get('adminName') ?? '').trim();
  const adminPhoneValue = String(formData.get('adminPhone') ?? '').trim();
  const adminSendInvite = parseBoolean(formData.get('sendInvite'), true);

  const adminPayload: InitialAdminPayload | undefined = adminEmail
    ? {
        email: adminEmail,
        sendInvite: adminSendInvite,
        ...(adminNameValue ? { name: adminNameValue } : {}),
        ...(adminPhoneValue ? { phone: adminPhoneValue } : {}),
      }
    : undefined;
  return adminPayload ? { name, plan, domain, initialAdmin: adminPayload } : { name, plan, domain };
}

function parseObjectInput(input: CreateOrganizationInput): ParsedOrganizationInput {
  const name = input.name?.trim() ?? '';
  const plan = (input.plan ?? 'standard').trim() || 'standard';
  const domain = sanitizeDomain(input.domain ?? null);
  const rawAdminEmail = input.adminEmail?.trim() ?? '';
  if (!rawAdminEmail) {
    return { name, plan, domain, error: 'Debes ingresar un correo corporativo para el administrador.' };
  }
  const adminEmail = normalizeEmail(rawAdminEmail);
  if (!adminEmail) {
    return { name, plan, domain, error: 'El correo del administrador no es válido.' };
  }

  const adminNameValue = input.adminName?.trim() ?? '';
  const adminPhoneValue = input.adminPhone?.trim() ?? '';
  const adminSendInvite = input.adminSendInvite ?? true;

  const adminPayload: InitialAdminPayload | undefined = adminEmail
    ? {
        email: adminEmail,
        sendInvite: adminSendInvite,
        ...(adminNameValue ? { name: adminNameValue } : {}),
        ...(adminPhoneValue ? { phone: adminPhoneValue } : {}),
      }
    : undefined;
  return adminPayload ? { name, plan, domain, initialAdmin: adminPayload } : { name, plan, domain };
}

export async function createOrganization(formData: FormData | CreateOrganizationInput): Promise<CreateOrganizationResult> {
  try {
    const profile = await requireAuth('admin_firma');

    const parsed = formData instanceof FormData ? parseFormInput(formData) : parseObjectInput(formData);

    if (parsed.error) {
      return { success: false, error: parsed.error };
    }

    if (!parsed.name) {
      return { success: false, error: 'Debes ingresar un nombre para la empresa.' };
    }

    const service = await createServiceClient();

    const { data: organization, error: orgError } = await service
      .from('organizations')
      .insert({
        name: parsed.name,
        plan: parsed.plan,
      })
      .select('id, name, plan, created_at')
      .single();

    if (orgError || !organization) {
      throw new Error(orgError?.message ?? 'No se pudo crear la organización.');
    }

    const { error: membershipError } = await service.from('memberships').insert({
      user_id: profile.id,
      org_id: organization.id,
      role: 'owner',
      status: 'active',
    });

    if (membershipError) {
      console.error('[organizations] membershipError', membershipError);
      throw new Error('La organización se creó, pero no se pudo asignar tu membresía.');
    }

    let initialAdminResult: InitialAdminResult | undefined;

    if (parsed.initialAdmin && parsed.initialAdmin.email) {
      const adminEmailMatchesCreator =
        normalizeEmail(profile.email ?? '') === parsed.initialAdmin.email;
      if (adminEmailMatchesCreator) {
        initialAdminResult = {
          email: parsed.initialAdmin.email,
          invited: false,
          existingUser: true,
        };
      } else {
        try {
          initialAdminResult = await provisionInitialAdmin({
            service,
            orgId: organization.id,
            admin: parsed.initialAdmin,
          });
        } catch (adminError) {
          console.error('[organizations] initial admin provisioning error', adminError);
          const { error: rollbackMembershipsError } = await service.from('memberships').delete().eq('org_id', organization.id);
          if (rollbackMembershipsError) {
            console.error('[organizations] rollback memberships error', rollbackMembershipsError);
          }
          const { error: rollbackDomainsError } = await service.from('domains').delete().eq('org_id', organization.id);
          if (rollbackDomainsError) {
            console.error('[organizations] rollback domains error', rollbackDomainsError);
          }
          const { error: rollbackOrgError } = await service.from('organizations').delete().eq('id', organization.id);
          if (rollbackOrgError) {
            console.error('[organizations] rollback organization error', rollbackOrgError);
          }
          return {
            success: false,
            error:
              adminError instanceof Error
                ? adminError.message
                : 'No se pudo invitar al administrador inicial.',
          };
        }
      }
    }

    if (parsed.domain) {
      const { error: domainError } = await service.from('domains').upsert({
        host: parsed.domain,
        org_id: organization.id,
        active: true,
      });
      if (domainError) {
        console.warn('[organizations] domain upsert error', domainError);
      }
    }

    await logAuditAction({
      action: 'CREATE_ORGANIZATION',
      entity_type: 'organization',
      entity_id: organization.id,
      diff_json: {
        name: parsed.name,
        plan: parsed.plan,
        domain: parsed.domain,
        initial_admin: parsed.initialAdmin?.email ?? null,
        initial_admin_invited: initialAdminResult?.invited ?? false,
        initial_admin_existing: initialAdminResult?.existingUser ?? false,
      },
    });

    REVALIDATE_PATHS.forEach((path) => revalidatePath(path));

    return initialAdminResult
      ? { success: true, organization, initialAdmin: initialAdminResult }
      : { success: true, organization };
  } catch (error) {
    console.error('[organizations] createOrganization error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo crear la organización.',
    };
  }
}

export async function switchOrganization(orgId: string) {
  const profile = await requireAuth();

  const supabase = await createServerClient();
  const { data: membership, error } = await supabase
    .from('memberships')
    .select('id, status')
    .eq('user_id', profile.id)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('[organizations] switchOrganization membership error', error);
    return { success: false, error: 'No se pudo verificar tu acceso a la organización.' };
  }

  if (!membership || membership.status !== 'active') {
    return { success: false, error: 'No tienes acceso activo a esta organización.' };
  }

  await setActiveOrganization(orgId);

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));

  return { success: true };
}
