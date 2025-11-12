'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { requireAuth, setActiveOrganization, type Role } from '@/lib/auth/roles';
import { logAuditAction } from '@/lib/audit/log';
import { switchOrganization } from '@/lib/actions/organizations';
import type { Database } from '@/lib/supabase/types';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type DomainRow = Database['public']['Tables']['domains']['Row'];
type BillingEventRow = {
  id: string;
  org_id: string;
  amount: number | null;
  currency: string | null;
  description: string | null;
  paid_at: string | null;
  billing_period: string | null;
  status: string | null;
  created_at?: string | null;
  created_by?: string | null;
};
const MODE_COOKIE = 'lex_mode';
const PERSONA_COOKIE = 'lex_persona';
const PERSONA_ROLES: Role[] = ['admin_firma', 'abogado', 'analista', 'cliente'];

export type SaaSOverview = {
  totalOrganizations: number;
  newOrganizations: number;
  totalMembers: number;
  averageUsersPerOrg: number;
  monthlyRevenue: number;
  lastUpdated: string;
};

export type SaaSOrganization = {
  id: string;
  name: string;
  plan: string;
  created_at: string | null;
  domains: Array<{ host: string; active: boolean }>;
  memberCount: number;
};

export type BillingEvent = BillingEventRow & {
  organization: Pick<OrganizationRow, 'id' | 'name' | 'plan'> | null;
};

function assertSuperAdmin() {
  // requireAuth('admin_firma') already verifies role; we additionally check membership_role === owner
  return requireAuth('admin_firma');
}

export async function getSaaSOverview(): Promise<SaaSOverview> {
  const profile = await assertSuperAdmin();
  if (profile.membership_role !== 'owner') {
    throw new Error('Solo propietarios del SaaS pueden ver este panel.');
  }

  const service = await createServiceClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    orgAggregate,
    memberRows,
    billingRows,
  ] = await Promise.all([
    service
      .from('organizations')
      .select('id, created_at', { count: 'exact' }),
    service
      .from('memberships')
      .select('user_id, org_id'),
    service
      .from('billing_events' as never)
      .select('amount, paid_at'),
  ]);

  if (orgAggregate.error) throw orgAggregate.error;
  if (memberRows.error) throw memberRows.error;
  if (billingRows.error) throw billingRows.error;

  const billingData = (billingRows.data ?? []) as Array<Pick<BillingEventRow, 'amount' | 'paid_at'>>;

  const totalOrganizations = orgAggregate.count ?? (orgAggregate.data?.length ?? 0);
  const newOrganizations =
    orgAggregate.data?.filter((org) => org.created_at && org.created_at >= last30).length ?? 0;

  const distinctMembers = new Set<string>();
  memberRows.data?.forEach((row) => {
    if (row.user_id) distinctMembers.add(row.user_id);
  });
  const totalMembers = distinctMembers.size;
  const averageUsersPerOrg =
    totalOrganizations > 0 ? Number((totalMembers / totalOrganizations).toFixed(1)) : 0;

  const monthlyRevenue = billingData
    .filter((event) => event.paid_at && event.paid_at >= startOfMonth)
    .reduce((sum, event) => sum + Number(event.amount ?? 0), 0);

  return {
    totalOrganizations,
    newOrganizations,
    totalMembers,
    averageUsersPerOrg,
    monthlyRevenue,
    lastUpdated: now.toISOString(),
  };
}

export async function listSaaSOrganizations(): Promise<SaaSOrganization[]> {
  const profile = await assertSuperAdmin();
  if (profile.membership_role !== 'owner') {
    throw new Error('Solo propietarios del SaaS pueden ver este panel.');
  }

  const service = await createServiceClient();
  const { data, error } = await service
    .from('organizations')
    .select(
      `
        id,
        name,
        plan,
        created_at,
        domains (
          host,
          active
        ),
        memberships (
          id
        )
      `,
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (
    data?.map((row: any) => ({
      id: row.id,
      name: row.name,
      plan: row.plan,
      created_at: row.created_at,
      domains: (row.domains as DomainRow[] | null)?.map((d) => ({ host: d.host, active: d.active })) ?? [],
      memberCount: Array.isArray(row.memberships) ? row.memberships.length : 0,
    })) ?? []
  );
}

export async function listBillingEvents(limit = 10): Promise<BillingEvent[]> {
  const profile = await assertSuperAdmin();
  if (profile.membership_role !== 'owner') {
    throw new Error('Solo propietarios del SaaS pueden ver este panel.');
  }

  const service = await createServiceClient();
  const { data, error } = await service
    .from('billing_events' as never)
    .select(
      `
        *,
        organization:organizations (
          id,
          name,
          plan
        )
      `,
    )
    .order('paid_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

type CreateBillingEventInput = {
  orgId: string;
  amount: number;
  currency?: string;
  billedAt?: string;
  description?: string;
  status?: 'paid' | 'pending' | 'failed';
  billingPeriod?: string;
};

export async function createBillingEventAction(input: CreateBillingEventInput) {
  const profile = await assertSuperAdmin();
  if (profile.membership_role !== 'owner') {
    throw new Error('Solo propietarios del SaaS pueden registrar pagos.');
  }

  const payload = {
    org_id: input.orgId,
    amount: Number.isFinite(input.amount) ? Number(input.amount) : 0,
    currency: (input.currency ?? 'USD').toUpperCase(),
    description: input.description ?? null,
    status: input.status ?? 'paid',
    paid_at: input.billedAt ?? new Date().toISOString(),
    billing_period: input.billingPeriod ?? null,
    created_by: profile.id,
  };

  if (!payload.org_id) {
    return { success: false, error: 'Debes seleccionar una organización.' };
  }
  if (payload.amount <= 0) {
    return { success: false, error: 'El monto debe ser mayor a cero.' };
  }

  const service = await createServiceClient();
  const { error } = await service.from('billing_events' as never).insert(payload as never);
  if (error) {
    console.error('[billing] createBillingEvent', error);
    return { success: false, error: error.message ?? 'No se pudo registrar el pago.' };
  }

  await logAuditAction({
    action: 'BILLING_EVENT',
    entity_type: 'billing_events',
    entity_id: payload.org_id,
    diff_json: payload,
  });

  revalidatePath('/super/dashboard');
  return { success: true };
}

export async function enterDemoMode() {
  const profile = await assertSuperAdmin();
  if (profile.membership_role !== 'owner') {
    throw new Error('Solo propietarios pueden iniciar el modo demo.');
  }

  const demoOrgId = process.env.DEMO_ORG_ID?.trim();
  if (!demoOrgId) {
    return { success: false, error: 'Configura la variable DEMO_ORG_ID para usar el modo demo.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(MODE_COOKIE, 'demo', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });

  const result = await switchOrganization(demoOrgId);
  if (!result.success) {
    return { success: false, error: result.error ?? 'No se pudo activar la organización demo.' };
  }

  revalidatePath('/dashboard/admin');
  revalidatePath('/cases');
  return { success: true };
}

export async function exitDemoMode() {
  const profile = await assertSuperAdmin();
  if (profile.membership_role !== 'owner') {
    throw new Error('Solo propietarios pueden salir del modo demo.');
  }

  const cookieStore = await cookies();
  cookieStore.set(MODE_COOKIE, 'super', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });

  const homeMembership =
    profile.memberships.find((m) => m.role === 'owner') ?? profile.memberships[0] ?? null;

  if (homeMembership) {
    await setActiveOrganization(homeMembership.organization.id);
  }

  revalidatePath('/super/dashboard');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function setDemoPersona(role: Role) {
  const profile = await requireAuth();
  if (profile.membership_role !== 'owner') {
    return { success: false, error: 'Solo el propietario demo puede cambiar de perfil.' };
  }

  const cookieStore = await cookies();
  const mode = cookieStore.get(MODE_COOKIE)?.value ?? 'super';
  if (mode !== 'demo') {
    return { success: false, error: 'Activa el modo demo para explorar otros perfiles.' };
  }

  if (!PERSONA_ROLES.includes(role)) {
    return { success: false, error: 'Perfil de demostración no válido.' };
  }

  cookieStore.set(PERSONA_COOKIE, role, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 6, // 6 horas
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/abogado');
  revalidatePath('/dashboard/analista');
  revalidatePath('/dashboard/cliente');
  revalidatePath('/cases');
  revalidatePath('/clients');
  return { success: true };
}
