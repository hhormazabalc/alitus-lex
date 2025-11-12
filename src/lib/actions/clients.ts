'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { createServiceClient, createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/roles';
import { createClientSchema, type CreateClientInput } from '@/lib/validators/clients';

export type CreateClientResult =
  | { success: true; client: { id: string; nombre: string; email: string; rut: string | null; telefono: string | null } }
  | { success: false; error: string };

const DEFAULT_ERROR_MESSAGE = 'No se pudo crear el cliente. Inténtalo nuevamente.';

function resolveDefaultPassword() {
  const envPassword = process.env.DEFAULT_PASSWORD?.trim();
  if (envPassword) return envPassword;
  return randomBytes(12).toString('base64url');
}

export async function createClientProfile(input: CreateClientInput): Promise<CreateClientResult> {
  try {
    const profile = await requireAuth(['analista', 'admin_firma']);
    const orgId = profile.org_id;
    if (!orgId) throw new Error('Selecciona una organización activa.');

    if (!process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Falta configurar SUPABASE_SERVICE_KEY en el entorno.');
    }

    const payload: CreateClientInput = createClientSchema.parse(input);
    const supabase = await createServiceClient();

    const password = resolveDefaultPassword();

    const createdUser = await supabase.auth.admin.createUser({
      email: payload.email,
      password,
      email_confirm: true,
      app_metadata: { role: 'cliente' },
      user_metadata: { nombre: payload.nombre, role: 'cliente' },
    });

    if (createdUser.error || !createdUser.data?.user?.id) {
      throw new Error(createdUser.error?.message ?? 'Supabase no devolvió el ID del nuevo cliente');
    }

    const userId = createdUser.data.user.id;
    const nowIso = new Date().toISOString();

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: payload.email,
          full_name: payload.nombre,
          role: 'cliente',
          rut: payload.rut || null,
          phone: payload.telefono || null,
          activo: true,
          status: 'active',
          updated_at: nowIso,
        },
        { onConflict: 'id' },
      )
      .select('id, full_name, email, rut, phone')
      .single();

    if (profileError || !profileRow) {
      await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
      throw new Error(profileError?.message ?? 'No se pudo guardar el perfil del cliente');
    }

    const { error: membershipError } = await supabase
      .from('memberships')
      .upsert(
        {
          user_id: userId,
          org_id: orgId,
          role: 'client_guest',
          status: 'active',
        },
        { onConflict: 'user_id,org_id' },
      );

    if (membershipError) {
      await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
      throw new Error(membershipError.message ?? 'No se pudo asignar la organización al cliente');
    }

    revalidatePath('/cases/new');
    revalidatePath('/dashboard/analista');
    revalidatePath('/clients');

    return {
      success: true,
      client: {
        id: profileRow.id,
        nombre: profileRow.full_name,
        email: profileRow.email,
        rut: profileRow.rut,
        telefono: profileRow.phone,
      },
    };
  } catch (error) {
    console.error('Error in createClientProfile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
    };
  }
}

export type ListClientsResult =
  | {
      success: true;
      clients: Array<{
        id: string;
        nombre: string;
        email: string;
        telefono: string | null;
        rut: string | null;
        created_at: string | null;
      }>;
    }
  | { success: false; error: string };

function resolveClientSupabase() {
  if (process.env.SUPABASE_SERVICE_KEY) {
    return createServiceClient();
  }
  return createServerClient();
}

export async function listClients(params: { search?: string } = {}): Promise<ListClientsResult> {
  try {
    const profile = await requireAuth(['analista', 'admin_firma']);
    const orgId = profile.org_id;
    if (!orgId) throw new Error('Selecciona una organización activa.');

    const supabase = await resolveClientSupabase();

    let query = supabase
      .from('memberships')
      .select(
        `
        user:profiles!inner(
          id,
          full_name,
          email,
          phone,
          rut,
          created_at
        )
      `,
      )
      .eq('org_id', orgId)
      .eq('status', 'active')
      .eq('role', 'client_guest')
      .order('created_at', { ascending: true });

    const search = params.search?.trim();
    if (search) {
      query = query.or(
        `user.full_name.ilike.%${search}%,user.email.ilike.%${search}%,user.rut.ilike.%${search}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      success: true,
      clients:
        data?.map((row: any) => ({
          id: row.user.id,
          nombre: row.user.full_name,
          email: row.user.email,
          telefono: row.user.phone,
          rut: row.user.rut,
          created_at: row.user.created_at,
        })) ?? [],
    };
  } catch (error) {
    console.error('Error in listClients:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudieron obtener los clientes',
    };
  }
}
