export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppSidebar, type SidebarItem } from '@/components/layout/AppSidebar';
import { getCurrentProfile, type Role } from '@/lib/auth/roles';
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  ShieldAlert,
  Users,
  UserPlus,
  Briefcase,
  ClipboardList,
  FilePlus2,
} from 'lucide-react';
import MarketingHeader from '@/components/layout/MarketingHeader';

interface PlatformLayoutProps {
  children: ReactNode;
}

function buildSidebarItems(role: Role): SidebarItem[] {
  if (role === 'admin_firma') {
    return [
      {
        href: '/dashboard/admin',
        label: 'Panel ejecutivo',
        description: 'Indicadores clave de la firma',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        href: '/cases',
        label: 'Casos de la firma',
        description: 'Visión global de expedientes activos',
        icon: <FolderOpen className="h-4 w-4" />,
      },
      {
        href: '/clients',
        label: 'Clientes',
        description: 'Crea perfiles antes de asignar casos',
        icon: <UserPlus className="h-4 w-4" />,
      },
      {
        href: '/dashboard/admin/users',
        label: 'Equipo y permisos',
        description: 'Roles, accesos y estados',
        icon: <Users className="h-4 w-4" />,
      },
      {
        href: '/admin/security',
        label: 'Seguridad',
        description: 'Auditoría y alertas críticas',
        icon: <ShieldAlert className="h-4 w-4" />,
        badge: 'Nuevo',
      },
      {
        href: '/settings',
        label: 'Configuración',
        description: 'Preferencias, catálogos y plantillas',
        icon: <Settings className="h-4 w-4" />,
      },
    ];
  }

  if (role === 'abogado') {
    return [
      {
        href: '/dashboard/abogado',
        label: 'Mi tablero',
        description: 'Resumen diario y vencimientos próximos',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        href: '/cases',
        label: 'Mis casos',
        description: 'Gestiona expedientes asignados',
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        href: '/cases/new',
        label: 'Registrar caso',
        description: 'Crea un nuevo expediente para la firma',
        icon: <FilePlus2 className="h-4 w-4" />,
      },
    ];
  }

  if (role === 'analista') {
    return [
      {
        href: '/dashboard/analista',
        label: 'Bandeja de analista',
        description: 'Priorización de ingresos y validación',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        href: '/cases',
        label: 'Casos en preparación',
        description: 'Seguimiento de expedientes asignados',
        icon: <ClipboardList className="h-4 w-4" />,
      },
      {
        href: '/cases/new',
        label: 'Nuevo caso',
        description: 'Inicia la recopilación y asignación',
        icon: <FilePlus2 className="h-4 w-4" />,
      },
      {
        href: '/clients',
        label: 'Clientes',
        description: 'Registra personas y empresas',
        icon: <UserPlus className="h-4 w-4" />,
      },
    ];
  }

  // cliente
  return [
    {
      href: '/dashboard/cliente',
      label: 'Portal cliente',
      description: 'Seguimiento de tus procesos y avances',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: '/cases',
      label: 'Documentos y expedientes',
      description: 'Consulta los casos compartidos con tu firma',
      icon: <FolderOpen className="h-4 w-4" />,
    },
  ];
}

export default async function PlatformLayout({ children }: PlatformLayoutProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login');
  }

  const role = ((profile as any)._role_override as Role | null) ?? profile.role;
  const sidebarItems = buildSidebarItems(role);

  const footerHint = (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">¿Necesitas soporte?</p>
      <p className="text-xs leading-relaxed text-foreground/70">
        Escríbenos a <span className="font-medium text-primary">soporte@altiusignite.com</span> o agenda una asesoría
        onboarding desde tu dashboard.
      </p>
    </div>
  );

  const sidebarProfile = {
    nombre: profile.nombre,
    role,
    email: (profile as any)?.email ?? null,
  };

  return (
    <div className="relative isolate min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_12%_8%,rgba(88,139,255,0.18),transparent_55%),radial-gradient(circle_at_85%_-5%,rgba(59,204,255,0.22),transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-12rem] mx-auto h-[26rem] w-[140%] max-w-[1800px] rounded-[50%] bg-white/8 blur-[220px]" />
        <div className="absolute inset-x-0 bottom-[-18rem] mx-auto h-[32rem] w-[120%] max-w-[1600px] rounded-[50%] bg-primary/10 blur-[240px]" />
      </div>

      <div className="relative flex min-h-screen flex-col gap-8 px-4 pb-12 pt-2 lg:flex-row lg:items-start lg:gap-12 lg:px-12 lg:pb-16 lg:pt-6">
        <AppSidebar items={sidebarItems} profile={sidebarProfile} footer={footerHint} />

        <main className="relative flex-1">
          <div className="pb-10 pt-6 lg:pb-16">
            <div className="mx-auto w-full max-w-[1800px] space-y-8 px-2 sm:px-4 lg:px-6">
              <MarketingHeader />
              <div className="central-shell px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
                <div className="space-y-10 lg:space-y-12">{children}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
