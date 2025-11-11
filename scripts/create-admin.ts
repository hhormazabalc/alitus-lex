import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carga las variables desde .env.local (si existe)
config({ path: '.env.local' });

/**
 * Crea o actualiza un usuario administrador directamente con la Admin API.
 * Se ejecuta con las variables de entorno:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 */
async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  }

  const client = createClient(supabaseUrl, serviceRoleKey);

  const email = 'hh2fc24@gmail.com';
  const password = 'CambiaEsto123!';
  const nombre = 'Admin Principal';

  // ¿Ya existe?
  const { data: existing, error: listError } = await client.auth.admin.listUsers({
    email,
    perPage: 1
  });

  if (listError) {
    throw new Error(`No se pudo verificar usuario existente: ${listError.message}`);
  }

  let userId: string;

  if (existing?.users?.length) {
    userId = existing.users[0].id;
    const { error: updateError } = await client.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { nombre }
    });

    if (updateError) {
      throw new Error(`Error al actualizar usuario existente: ${updateError.message}`);
    }
  } else {
    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre }
    });

    if (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }

    userId = data.user.id;
  }

  const { error: profileError } = await client.from('profiles').upsert({
    id: userId,
    user_id: userId,
    email,
    nombre,
    role: 'admin_firma',
    activo: true
  }, { onConflict: 'user_id' });

  if (profileError) {
    throw new Error(`Error al sincronizar perfil: ${profileError.message}`);
  }

  console.log('✅ Usuario admin listo:', userId);
}

main().catch((err) => {
  console.error('❌', err.message ?? err);
  process.exit(1);
});
