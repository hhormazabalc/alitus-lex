'use client';

import { useState, useTransition } from 'react';
import { BarChart3, Briefcase, ClipboardList, Loader2, UserCircle2 } from 'lucide-react';
import type { Role } from '@/lib/auth/roles';
import { setDemoPersona } from '@/lib/actions/saas';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type PersonaOption = {
  role: Role;
  label: string;
  tagline: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string | undefined }>;
};

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    role: 'admin_firma',
    label: 'Dirección SaaS',
    tagline: 'Panel ejecutivo',
    description: 'Supervisa métricas globales, facturación y configuración de firmas.',
    href: '/dashboard/admin',
    icon: BarChart3,
  },
  {
    role: 'abogado',
    label: 'Abogado',
    tagline: 'Gestión de casos',
    description: 'Administra expedientes, tareas y seguimiento del workflow legal.',
    href: '/dashboard/abogado',
    icon: Briefcase,
  },
  {
    role: 'analista',
    label: 'Analista',
    tagline: 'Bandeja de ingreso',
    description: 'Clasifica solicitudes, prepara expedientes y coordina asignaciones.',
    href: '/dashboard/analista',
    icon: ClipboardList,
  },
  {
    role: 'cliente',
    label: 'Cliente',
    tagline: 'Portal seguro',
    description: 'Revisa avances, comparte documentos y sigue hitos clave del caso.',
    href: '/dashboard/cliente',
    icon: UserCircle2,
  },
];

type DemoPersonaNavProps = {
  activeRole: Role;
};

export function DemoPersonaNav({ activeRole }: DemoPersonaNavProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  const handleSelect = (role: Role, href: string) => {
    if (role === activeRole && !isPending) {
      window.location.href = href;
      return;
    }

    if (isPending && pendingRole === role) {
      return;
    }

    setPendingRole(role);
    startTransition(async () => {
      try {
        const result = await setDemoPersona(role);
        if (result.success) {
          window.location.href = href;
          return;
        }
        toast({
          title: 'No se pudo cambiar de perfil',
          description: result.error ?? 'Inténtalo nuevamente en unos segundos.',
          variant: 'destructive',
        });
      } catch (error) {
        console.error('[DemoPersonaNav] setDemoPersona failed', error);
        toast({
          title: 'Error inesperado',
          description: 'No pudimos activar este perfil. Inténtalo nuevamente.',
          variant: 'destructive',
        });
      } finally {
        setPendingRole(null);
      }
    });
  };

  return (
    <div className='relative z-20 w-full px-2 sm:px-4 lg:px-6'>
      <div className='mx-auto w-full max-w-[1800px]'>
        <div className='relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.08] px-4 py-5 shadow-[0_28px_95px_-48px_rgba(12,20,52,0.55)] backdrop-blur-[28px]'>
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_-10%,rgba(255,255,255,0.24),transparent_45%),radial-gradient(90%_90%_at_100%_120%,rgba(96,191,255,0.18),transparent_55%)]' />
          <div className='relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='max-w-sm space-y-1 text-white/80'>
              <p className='text-[11px] uppercase tracking-[0.32em] text-white/60'>Explora la plataforma</p>
              <h2 className='text-lg font-semibold text-white'>Cambia entre perfiles demo</h2>
              <p className='text-sm text-white/65'>
                Visualiza la experiencia real de cada rol. Los cambios sólo afectan la sesión de demostración.
              </p>
            </div>
            <div className='flex flex-1 flex-wrap items-stretch gap-3'>
              {PERSONA_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActiveOption = option.role === activeRole;
                const isLoading = isPending && pendingRole === option.role;
                return (
                  <button
                    key={option.role}
                    type='button'
                    onClick={() => handleSelect(option.role, option.href)}
                    disabled={isLoading}
                    className={cn(
                      'group relative flex min-w-[220px] flex-1 flex-col gap-3 rounded-[22px] border px-4 py-4 text-left transition-all duration-300',
                      'border-white/15 bg-white/[0.06] text-white/85 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.12] hover:shadow-[0_25px_80px_-40px_rgba(45,90,180,0.45)]',
                      isActiveOption &&
                        'border-cyan-300/60 bg-cyan-300/15 text-white shadow-[0_28px_90px_-38px_rgba(62,165,255,0.6)]',
                      isLoading && 'opacity-75',
                    )}
                  >
                    <div className='flex items-center gap-3'>
                      <span
                        className={cn(
                          'inline-flex h-11 w-11 items-center justify-center rounded-[16px] border text-white transition-colors duration-300',
                          isActiveOption
                            ? 'border-cyan-200/70 bg-cyan-200/15 text-white'
                            : 'border-white/15 bg-white/8 text-white/80 group-hover:border-white/25 group-hover:text-white',
                        )}
                      >
                        {isLoading ? <Loader2 className='h-5 w-5 animate-spin' /> : <Icon className='h-5 w-5' />}
                      </span>
                      <div>
                        <p className='text-sm font-semibold leading-tight'>{option.label}</p>
                        <p className='text-[11px] uppercase tracking-[0.28em] text-white/50'>{option.tagline}</p>
                      </div>
                    </div>
                    <p className='text-xs text-white/65'>{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
