'use server';

import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/roles';
import type { Profile } from '@/lib/supabase/types';

interface DirectoryProfile extends Pick<Profile, 'id' | 'nombre' | 'role' | 'telefono' | 'rut' | 'email'> {}

function canUseServiceClient(role: Profile['role']) {
  return role === 'admin_firma' || role === 'analista';
}

async function getSupabaseClientForDirectory(role: Profile['role']) {
  if (canUseServiceClient(role) && process.env.SUPABASE_SERVICE_KEY) {
    return createServiceClient();
  }
  return createServerClient();
}

async function fetchProfilesByRole(targetRole: Profile['role']): Promise<DirectoryProfile[]> {
  const authProfile = await requireAuth();
  if (!authProfile.org_id) throw new Error('Selecciona una organización activa.');
  const supabase = await getSupabaseClientForDirectory(authProfile.role);

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
        id,
        full_name,
        role,
        phone,
        rut,
        email,
        status,
        memberships:memberships!inner (
          org_id,
          status
        )
      `,
    )
    .eq('memberships.org_id', authProfile.org_id)
    .eq('memberships.status', 'active')
    .eq('status', 'active')
    .eq('role', targetRole)
    .order('full_name');

  if (error) {
    console.error(`Error fetching profiles for role ${targetRole}:`, error);
    return [];
  }

  return (
    data?.map((row: any) => ({
      id: row.id,
      nombre: row.full_name,
      role: row.role,
      telefono: row.phone,
      rut: row.rut,
      email: row.email,
    })) ?? []
  );
}

export async function getAssignableLawyers() {
  return fetchProfilesByRole('abogado');
}

export async function getActiveClientsDirectory() {
  return fetchProfilesByRole('cliente');
}
