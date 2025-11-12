export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AppSidebar, type SidebarItem } from '@/components/layout/AppSidebar';
import { getCurrentProfile, type Role } from '@/lib/auth/roles';
import type { MembershipRole } from '@/lib/supabase/types';
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
  Building2,
  BarChart3,
} from 'lucide-react';
import MarketingHeader from '@/components/layout/MarketingHeader';
import { DemoModeBanner } from '@/components/layout/DemoModeBanner';
import { DemoPersonaNav } from '@/components/layout/DemoPersonaNav';
import { cn } from '@/lib/utils';

interface PlatformLayoutProps {
  children: ReactNode;
}

function buildSidebarItems(role: Role, membershipRole: MembershipRole, mode: 'super' | 'demo'): SidebarItem[] {
  if (role === 'admin_firma') {
    if (membershipRole === 'owner' && mode === 'super') {
      return [
        {
          href: '/super/dashboard',
          label: 'Panel SaaS',
          description: 'Métricas, facturación y clientes',
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          href: '/admin/org',
          label: 'Empresas',
          description: 'Workspaces, dominios y ownership',
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          href: '/admin/security',
          label: 'Seguridad global',
          description: 'Auditoría y alertas críticas',
          icon: <ShieldAlert className="h-4 w-4" />,
        },
        {
          href: '/settings',
          label: 'Configuración SaaS',
          description: 'Planes, catálogos y branding',
          icon: <Settings className="h-4 w-4" />,
        },
      ];
    }

    const baseItems: SidebarItem[] = [
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

    if (mode !== 'demo') {
      baseItems.splice(4, 0, {
        href: '/admin/org',
        label: 'Empresas',
        description: 'Workspaces, dominios y ownership',
        icon: <Building2 className="h-4 w-4" />,
      });
    }

    return baseItems;
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
  const cookieStore = await cookies();
  const modeCookie = (profile.membership_role === 'owner'
    ? (cookieStore.get('lex_mode')?.value ?? 'super')
    : 'demo') as 'super' | 'demo';
  const isSuperOwner = role === 'admin_firma' && profile.membership_role === 'owner' && modeCookie === 'super';
  const sidebarVariant = isSuperOwner ? 'super' : 'default';
  const sidebarItems = buildSidebarItems(role, profile.membership_role, modeCookie);

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
    nombre: profile.nombre ?? profile.full_name ?? profile.email ?? 'Usuario',
    role,
    email: profile.email ?? null,
  };

  return (
    <div
      className={cn(
        'relative isolate min-h-screen',
        isSuperOwner ? 'bg-[#020513]' : undefined,
      )}
    >
      {isSuperOwner ? (
        <>
          <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(110%_80%_at_10%_0%,rgba(90,132,255,0.2),transparent_65%),radial-gradient(90%_85%_at_90%_-10%,rgba(35,186,255,0.18),transparent_70%),linear-gradient(125deg,#05091e_0%,#04061a_45%,#01030c_100%)]" />
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-x-0 top-[-16rem] mx-auto h-[30rem] w-[150%] max-w-[2100px] rounded-[60%] bg-gradient-to-br from-[#26357a]/35 via-[#111d46]/45 to-[#060b26]/55 blur-[240px]" />
            <div className="absolute inset-x-0 bottom-[-20rem] mx-auto h-[36rem] w-[150%] max-w-[2100px] rounded-[60%] bg-gradient-to-tl from-[#05102f]/75 via-[#040a22]/70 to-[#01030c]/80 blur-[260px]" />
          </div>
        </>
      ) : (
        <>
          <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_12%_8%,rgba(88,139,255,0.18),transparent_55%),radial-gradient(circle_at_85%_-5%,rgba(59,204,255,0.22),transparent_60%)]" />
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-x-0 top-[-12rem] mx-auto h-[26rem] w-[140%] max-w-[1800px] rounded-[50%] bg-white/8 blur-[220px]" />
            <div className="absolute inset-x-0 bottom-[-18rem] mx-auto h-[32rem] w-[120%] max-w-[1600px] rounded-[50%] bg-primary/10 blur-[240px]" />
          </div>
        </>
      )}

      <div className="relative flex min-h-screen flex-col gap-8 px-4 pb-12 pt-2 lg:flex-row lg:items-start lg:gap-12 lg:px-12 lg:pb-16 lg:pt-6">
        <AppSidebar
          items={sidebarItems}
          profile={sidebarProfile}
          footer={footerHint}
          variant={sidebarVariant}
        />

        <main className="relative flex-1">
          <div className="pb-10 pt-6 lg:pb-16">
            <div className="mx-auto w-full max-w-[1800px] space-y-8 px-2 sm:px-4 lg:px-6">
              {!isSuperOwner && <MarketingHeader />}
              {modeCookie === 'demo' && profile.membership_role === 'owner' && <DemoPersonaNav activeRole={role} />}
              {modeCookie === 'demo' && <DemoModeBanner />}
              <div
                className={cn(
                  'central-shell px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10',
                  isSuperOwner && 'super-shell',
                )}
              >
                <div className="space-y-10 lg:space-y-12">{children}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
