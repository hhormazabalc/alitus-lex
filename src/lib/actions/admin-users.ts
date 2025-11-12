'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import type {
  Database,
  ProfileInsert,
  ProfileUpdate,
  MembershipRole,
  MembershipStatus,
  ProfileStatus,
} from '@/lib/supabase/types';
import { requireAuth, type AuthenticatedProfile } from '@/lib/auth/roles';
import {
  createManagedUserSchema,
  updateManagedUserSchema,
  type CreateManagedUserInput,
  type UpdateManagedUserInput,
  type ManagedUserRole,
} from '@/lib/validators/admin-users';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

const ADMIN_USERS_PATH = '/dashboard/admin/users';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type MembershipRow = Database['public']['Tables']['memberships']['Row'];
type ServiceClient = ReturnType<typeof createServiceClient>;
type AuthUserLite = {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
};

type MembershipWithProfile = MembershipRow & {
  user: Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'rut' | 'phone' | 'activo' | 'created_at' | 'status'> | null;
};

const AUTH_USER_CACHE_TTL_MS = 60_000;
let authUserCache: Map<string, AuthUserLite> | null = null;
let authUserCacheFetchedAt = 0;

const MEMBERSHIP_TO_MANAGED_ROLE: Record<MembershipRole, ManagedUserRole> = {
  owner: 'admin_firma',
  admin: 'admin_firma',
  lawyer: 'abogado',
  analyst: 'analista',
  client_guest: 'cliente',
};

const MANAGED_TO_MEMBERSHIP_ROLE: Record<ManagedUserRole, MembershipRole> = {
  admin_firma: 'admin',
  abogado: 'lawyer',
  analista: 'analyst',
  cliente: 'client_guest',
};

const membershipRoleFromManaged = (role: ManagedUserRole): MembershipRole =>
  MANAGED_TO_MEMBERSHIP_ROLE[role] ?? 'client_guest';

const managedRoleFromMembership = (role: MembershipRole): ManagedUserRole =>
  MEMBERSHIP_TO_MANAGED_ROLE[role] ?? 'cliente';

const membershipStatusFromActive = (active: boolean): MembershipStatus => (active ? 'active' : 'suspended');
const profileStatusFromActive = (active: boolean): ProfileStatus => (active ? 'active' : 'blocked');

export type ManagedUser = {
  profileId: string;
  userId: string;
  email: string;
  nombre: string;
  role: ManagedUserRole;
  rut: string | null;
  telefono: string | null;
  activo: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export type ManagedUsersResult = {
  success: boolean;
  users?: ManagedUser[];
  error?: string;
};

function mapMembershipToManagedUser(
  row: MembershipWithProfile,
  authUser?: AuthUserLite | null,
): ManagedUser | null {
  if (!row.user) return null;

  const membershipRole = row.role as MembershipRole;
  const managedRole = managedRoleFromMembership(membershipRole);
  const email = row.user.email ?? authUser?.email ?? null;
  if (!email) return null;

  const profileStatus = (row.user.status as ProfileStatus | null) ?? 'pending';
  const membershipStatus = (row.status as MembershipStatus | null) ?? 'invited';
  const isActive = membershipStatus === 'active' && profileStatus === 'active';

  return {
    profileId: row.user.id,
    userId: row.user.id,
    email,
    nombre: row.user.full_name ?? row.user.email ?? 'Usuario',
    role: managedRole,
    rut: row.user.rut ?? null,
    telefono: row.user.phone ?? null,
    activo: isActive,
    createdAt: authUser?.created_at ?? row.user.created_at ?? null,
    lastSignInAt: authUser?.last_sign_in_at ?? null,
  };
}

async function ensureAdminAccess(): Promise<AuthenticatedProfile> {
  const profile = await requireAuth('admin_firma');
  if (profile.role !== 'admin_firma') throw new Error('Sin permisos administrativos');
  if (!profile.org_id) throw new Error('Selecciona una organización activa para administrar usuarios.');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Falta configurar SUPABASE_SERVICE_ROLE_KEY');
  }

  return profile;
}

function parseCheckbox(value: FormDataEntryValue | null) {
  if (typeof value === 'string') return ['on', 'true', '1'].includes(value.toLowerCase());
  return Boolean(value);
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeCreateInput(formData: FormData) {
  const tentative: Partial<CreateManagedUserInput> = {
    email: getStringValue(formData, 'email'),
    password: getStringValue(formData, 'password'),
    nombre: getStringValue(formData, 'nombre'),
    role: getStringValue(formData, 'role') as ManagedUserRole,
    rut: getStringValue(formData, 'rut') || undefined,
    telefono: getStringValue(formData, 'telefono') || undefined,
    activo: parseCheckbox(formData.get('activo')),
  };
  const result = createManagedUserSchema.safeParse(tentative);
  if (!result.success) return { error: result.error.errors[0]?.message ?? 'Datos inválidos' };
  return { data: result.data };
}

function sanitizeUpdateInput(formData: FormData) {
  const tentative: Partial<UpdateManagedUserInput> = {
    email: getStringValue(formData, 'email'),
    password: getStringValue(formData, 'password') || undefined,
    nombre: getStringValue(formData, 'nombre'),
    role: getStringValue(formData, 'role') as ManagedUserRole,
    rut: getStringValue(formData, 'rut') || undefined,
    telefono: getStringValue(formData, 'telefono') || undefined,
    activo: parseCheckbox(formData.get('activo')),
  };
  const result = updateManagedUserSchema.safeParse(tentative);
  if (!result.success) return { error: result.error.errors[0]?.message ?? 'Datos inválidos' };
  return { data: result.data };
}

function sortUsers(users: ManagedUser[]) {
  return [...users].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

async function buildAuthUserMap(client: ServiceClient) {
  const now = Date.now();
  if (authUserCache && now - authUserCacheFetchedAt < AUTH_USER_CACHE_TTL_MS) {
    return authUserCache;
  }

  const map = new Map<string, AuthUserLite>();
  const perPage = 200;
  let page = 1;

  let hasMore = true;

  while (hasMore) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    for (const user of users) {
      map.set(user.id, {
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
      });
    }

    if (users.length < perPage) {
      hasMore = false;
    } else {
      page += 1;
    }
  }

  return map;
}

async function getAuthUserMap(client: ServiceClient) {
  try {
    const map = await buildAuthUserMap(client);
    authUserCache = map;
    authUserCacheFetchedAt = Date.now();
    return map;
  } catch (error) {
    console.warn('[admin-users] fetch auth users fallback', error);
    return null;
  }
}

export async function fetchManagedUsers(): Promise<ManagedUsersResult> {
  try {
    const adminProfile = await ensureAdminAccess();
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('memberships')
      .select(`
        user_id,
        role,
        status,
        org_id,
        created_at,
        user:profiles(
          id,
          email,
          full_name,
          rut,
          phone,
          activo,
          created_at,
          status
        )
      `)
      .eq('org_id', adminProfile.org_id);

    if (error) {
      console.error('[fetchManagedUsers] error', error);
      return { success: false, error: 'No se pudieron obtener los usuarios' };
    }

    const authUserMap = await getAuthUserMap(supabase);

    const users = (data ?? [])
      .map((row) =>
        mapMembershipToManagedUser(row as MembershipWithProfile, authUserMap?.get(row.user_id)),
      )
      .filter((u): u is ManagedUser => Boolean(u));

    return { success: true, users: sortUsers(users) };
  } catch (error) {
    console.error('[fetchManagedUsers] unexpected', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error inesperado' };
  }
}

export async function createManagedUser(formData: FormData): Promise<ManagedUsersResult> {
  try {
    const adminProfile = await ensureAdminAccess();
    const parsed = sanitizeCreateInput(formData);
    const createData = parsed.data as CreateManagedUserInput | undefined;
    if (!createData) return { success: false, error: parsed.error ?? 'Datos inválidos' };

    const { email, password, role, nombre, rut, telefono, activo } = createData;
    const rutValue = typeof rut === 'string' ? rut : null;
    const telefonoValue = typeof telefono === 'string' ? telefono : null;
    const activoValue = typeof activo === 'boolean' ? activo : true;

    const supabase = await createServiceClient();

    const created = await supabase.auth.admin.createUser({
      email: email as string,
      password: password as string,
      email_confirm: true,
      app_metadata: { role: role as ManagedUserRole },
      user_metadata: { nombre, role },
    });

    if (created.error) return { success: false, error: created.error.message };

    const userId = created.data.user?.id;
    if (!userId) return { success: false, error: 'Supabase no devolvió el ID del nuevo usuario' };

    // 🔧 FIX: añadimos el email en el payload
    const profilePayload: ProfileInsert = {
      id: userId,
      email: email as string,
      full_name: nombre as string,
      role: role as ManagedUserRole,
      rut: rutValue,
      phone: telefonoValue,
      activo: activoValue,
      status: profileStatusFromActive(activoValue),
    };

    const { error: profileError } = await supabase.from('profiles').upsert(profilePayload, {
      onConflict: 'id',
    });

    if (profileError) {
      console.error('[createManagedUser] profile error', profileError);
      await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
      return { success: false, error: 'No se pudo guardar el perfil del usuario' };
    }

    const membershipPayload = {
      user_id: userId,
      org_id: adminProfile.org_id,
      role: membershipRoleFromManaged(role),
      status: membershipStatusFromActive(activoValue),
    } satisfies Partial<MembershipRow>;

    const { error: membershipError } = await supabase.from('memberships').upsert(membershipPayload, {
      onConflict: 'user_id,org_id',
    });

    if (membershipError) {
      console.error('[createManagedUser] membership error', membershipError);
      const { error: deleteProfileError } = await supabase.from('profiles').delete().eq('id', userId);
      if (deleteProfileError) {
        console.error('[createManagedUser] failed to rollback profile', deleteProfileError);
      }
      await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
      return { success: false, error: 'No se pudo asignar la organización al usuario' };
    }

    authUserCacheFetchedAt = 0;
    revalidatePath(ADMIN_USERS_PATH);
    return fetchManagedUsers();
  } catch (error) {
    console.error('[createManagedUser] unexpected', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error inesperado al crear el usuario' };
  }
}

export async function updateManagedUser(userId: string, formData: FormData): Promise<ManagedUsersResult> {
  try {
    const adminProfile = await ensureAdminAccess();
    const parsed = sanitizeUpdateInput(formData);
    const updateData = parsed.data as UpdateManagedUserInput | undefined;
    if (!updateData) return { success: false, error: parsed.error ?? 'Datos inválidos' };

    const { email, password, role, nombre, rut, telefono, activo } = updateData;
    const rutValue = typeof rut === 'string' ? rut : null;
    const telefonoValue = typeof telefono === 'string' ? telefono : null;
    const activoValue = typeof activo === 'boolean' ? activo : true;

    const supabase = await createServiceClient();

    const userUpdatePayload: Record<string, unknown> = {
      email,
      email_confirm: true,
      app_metadata: { role: role as ManagedUserRole },
      user_metadata: { nombre, role: role as ManagedUserRole },
    };
    if (password) userUpdatePayload.password = password;

    const { error: authError } = await supabase.auth.admin.updateUserById(userId, userUpdatePayload);
    if (authError) return { success: false, error: authError.message };

    const profileUpdatePayload: ProfileUpdate = {
      full_name: nombre as string,
      email: email as string,
      role: role as ManagedUserRole,
      rut: rutValue,
      phone: telefonoValue,
      activo: activoValue,
      status: profileStatusFromActive(activoValue),
    };

    const { error: profileError } = await supabase.from('profiles')
      .update(profileUpdatePayload)
      .eq('id', userId);

    if (profileError) {
      console.error('[updateManagedUser] profile error', profileError);
      return { success: false, error: 'No se pudo actualizar el perfil del usuario' };
    }

    const membershipPayload = {
      user_id: userId,
      org_id: adminProfile.org_id,
      role: membershipRoleFromManaged(role),
      status: membershipStatusFromActive(activoValue),
    } satisfies Partial<MembershipRow>;

    const { error: membershipError } = await supabase
      .from('memberships')
      .upsert(membershipPayload, { onConflict: 'user_id,org_id' });

    if (membershipError) {
      console.error('[updateManagedUser] membership error', membershipError);
      return { success: false, error: 'No se pudo actualizar la membresía del usuario' };
    }

    authUserCacheFetchedAt = 0;
    revalidatePath(ADMIN_USERS_PATH);
    return fetchManagedUsers();
  } catch (error) {
    console.error('[updateManagedUser] unexpected', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error inesperado al actualizar el usuario' };
  }
}

export async function deactivateManagedUser(userId: string): Promise<ManagedUsersResult> {
  try {
    const adminProfile = await ensureAdminAccess();
    const supabase = await createServiceClient();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ activo: false, status: profileStatusFromActive(false) })
      .eq('id', userId);

    if (profileError) {
      console.error('[deactivateManagedUser] profile error', profileError);
      return { success: false, error: 'No se pudo desactivar la cuenta' };
    }

    const { error: membershipError } = await supabase
      .from('memberships')
      .update({ status: membershipStatusFromActive(false) })
      .eq('user_id', userId)
      .eq('org_id', adminProfile.org_id);

    if (membershipError) {
      console.error('[deactivateManagedUser] membership error', membershipError);
      return { success: false, error: 'No se pudo desactivar la membresía del usuario' };
    }

    authUserCacheFetchedAt = 0;
    revalidatePath(ADMIN_USERS_PATH);
    return fetchManagedUsers();
  } catch (error) {
    console.error('[deactivateManagedUser] unexpected', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error inesperado al desactivar el usuario' };
  }
}

export async function deleteManagedUser(userId: string): Promise<ManagedUsersResult> {
  try {
    const adminProfile = await ensureAdminAccess();
    const supabase = await createServiceClient();

    // Remove membership for current organization first
    const { error: membershipDeleteError } = await supabase
      .from('memberships')
      .delete()
      .eq('user_id', userId)
      .eq('org_id', adminProfile.org_id);

    if (membershipDeleteError) {
      console.error('[deleteManagedUser] membership delete error', membershipDeleteError);
      return { success: false, error: 'No se pudo desvincular al usuario de la organización' };
    }

    const { data: remainingMemberships, error: remainingError } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', userId);

    if (remainingError) {
      console.error('[deleteManagedUser] remaining memberships error', remainingError);
      return { success: false, error: 'No se pudo verificar la membresía del usuario' };
    }

    if ((remainingMemberships?.length ?? 0) > 0) {
      // User still belongs to other organizations; stop here.
      revalidatePath(ADMIN_USERS_PATH);
      return fetchManagedUsers();
    }

    const attemptDelete = async () => supabase.auth.admin.deleteUser(userId);

    const deletion = await attemptDelete();

    if (!deletion.error) {
      revalidatePath(ADMIN_USERS_PATH);
      return fetchManagedUsers();
    }

    console.error('[deleteManagedUser] auth delete error', deletion.error);

    const message = deletion.error.message || '';
    const shouldAttemptCascade =
      /foreign key/i.test(message) ||
      /constraint/i.test(message) ||
      /database error deleting user/i.test(message);

    if (shouldAttemptCascade) {
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (!profileDeleteError) {
        const retry = await attemptDelete();
        if (!retry.error) {
          revalidatePath(ADMIN_USERS_PATH);
          return fetchManagedUsers();
        }
        console.error('[deleteManagedUser] retry auth delete error', retry.error);
      } else {
        console.error('[deleteManagedUser] profile delete error', profileDeleteError);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ activo: false, status: profileStatusFromActive(false) })
        .eq('id', userId);

      if (profileError) {
        console.error('[deleteManagedUser] deactivate fallback error', profileError);
        return { success: false, error: profileDeleteError?.message ?? message };
      }

      revalidatePath(ADMIN_USERS_PATH);
      const refreshed = await fetchManagedUsers();
      return {
        success: false,
        users: refreshed.users ?? [],
        error: 'El usuario tiene registros asociados y no se puede eliminar. Se desactivó la cuenta.',
      };
    }

    return { success: false, error: deletion.error.message };
  } catch (error) {
    console.error('[deleteManagedUser] unexpected', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error inesperado al eliminar el usuario' };
  }
}
