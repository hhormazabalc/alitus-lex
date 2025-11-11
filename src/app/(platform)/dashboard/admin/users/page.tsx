export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/roles';
import { fetchManagedUsers } from '@/lib/actions/admin-users';
import { AdminUserManager } from '@/components/AdminUserManager';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Gestión de usuarios - LEX Altius',
  description: 'Administra las cuentas y permisos del equipo.',
};

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'admin_firma') {
    redirect(profile.role === 'analista' ? '/dashboard/analista' : '/dashboard/abogado');
  }

  const usersResult = await fetchManagedUsers();

  if (!usersResult.success) {
    return (
      <div className='mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-4 sm:px-6 lg:px-10'>
        <div className='glass-panel w-full border-white/15 bg-white/8 p-8 text-center sm:p-10'>
          <h1 className='text-2xl font-semibold text-foreground'>No se pudieron cargar los usuarios</h1>
          <p className='mt-3 text-sm text-foreground/70'>{usersResult.error}.</p>
          <div className='mt-6 flex justify-center'>
            <Button asChild className='rounded-full px-5'>
              <Link href='/dashboard/admin'>Volver al dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10'>
      <AdminUserManager initialUsers={usersResult.users ?? []} />
    </div>
  );
}
