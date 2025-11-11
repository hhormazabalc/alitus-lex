import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/roles';
import { SecurityDashboard } from '@/components/SecurityDashboard';

export const metadata: Metadata = {
  title: 'Seguridad - LEX Altius',
  description: 'Panel de administración de seguridad y auditoría',
};

export default async function SecurityPage() {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      redirect('/login');
    }

    // Solo admin puede acceder al panel de seguridad
    if (profile.role !== 'admin_firma') {
      redirect('/dashboard');
    }

    return (
      <div className='mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8'>
        <div className='space-y-8'>
          <section className='glass-panel border-white/12 bg-white/8 p-6 sm:p-8'>
            <SecurityDashboard canManage />
          </section>
        </div>
      </div>
    );
  } catch {
    redirect('/login');
  }
}
