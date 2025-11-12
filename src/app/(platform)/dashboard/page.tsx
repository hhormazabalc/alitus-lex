'use server';

import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/roles';

export default async function DashboardIndexPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const role = (profile as any)._role_override ?? profile.role;

  if (role === 'admin_firma' && profile.membership_role === 'owner') {
    redirect('/super/dashboard');
  }

  const target =
    role === 'admin_firma' ? '/dashboard/admin' :
    role === 'abogado'     ? '/dashboard/abogado' :
    role === 'analista'    ? '/dashboard/analista' :
                             '/dashboard/cliente';

  redirect(target);
}
