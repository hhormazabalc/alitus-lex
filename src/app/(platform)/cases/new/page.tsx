import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FilePlus2 } from 'lucide-react';
import { CaseForm } from '@/components/CaseForm';
import { requireAuth } from '@/lib/auth/roles';
import { getAssignableLawyers, getActiveClientsDirectory } from '@/lib/actions/profiles';

export const metadata: Metadata = {
  title: 'Nuevo Caso - LEX Altius',
  description: 'Crear un nuevo caso jurídico',
};

export default async function NewCasePage() {
  // Verificar que el usuario sea abogado o admin
  try {
    const profile = await requireAuth();
    if (!['abogado', 'admin_firma', 'analista'].includes(profile.role)) {
      redirect('/dashboard');
    }

    const [lawyers, clients] = await Promise.all([
      getAssignableLawyers(),
      getActiveClientsDirectory(),
    ]);

    return (
      <div className='mx-auto w-full max-w-[1320px] px-6 pb-14 pt-6 sm:px-8 lg:px-10'>
        <div className='space-y-8'>
          <section className='glass-panel border-white/12 bg-white/10 p-6 sm:p-7'>
            <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
              <div className='flex items-start gap-4'>
                <span className='flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-primary shadow-inner shadow-black/20'>
                  <FilePlus2 className='h-5 w-5' />
                </span>
                <div className='space-y-2'>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55'>Gestión de casos</p>
                  <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Registrar nuevo caso</h1>
                  <p className='text-sm leading-relaxed text-foreground/70'>
                    Completa el formulario para registrar un expediente y asignarlo al equipo correcto.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <CaseForm
            lawyers={lawyers}
            clients={clients}
            currentProfile={profile}
          />
        </div>
      </div>
    );
  } catch {
    redirect('/login');
  }
}
