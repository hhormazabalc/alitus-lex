'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import LogoutButton from '@/components/LogoutButton';
import { Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface SidebarItem {
  href: string;
  label: string;
  description?: string;
  icon: ReactNode;
  badge?: string;
}

interface AppSidebarProps {
  items: SidebarItem[];
  profile: {
    nombre: string;
    role: string;
    email: string | null;
  };
  footer?: ReactNode;
  variant?: 'default' | 'super';
}

export function AppSidebar({ items, profile, footer, variant = 'default' }: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [floatingEnabled, setFloatingEnabled] = useState(false);
  const [floatingOffset, setFloatingOffset] = useState(0);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const isSuperSidebar = variant === 'super';
  const profileDelay = `${items.length * 0.06 + 0.06}s`;
  const footerDelay = `${items.length * 0.06 + 0.12}s`;
  const sidebarStyle: CSSProperties | undefined = floatingEnabled
    ? { transform: `translate3d(0, ${floatingOffset}px, 0)`, willChange: 'transform' }
    : undefined;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    let frameId: number | null = null;
    const state = { current: 0, target: 0 };

    const animate = () => {
      if (!mediaQuery.matches) {
        frameId = null;
        return;
      }

      state.current += (state.target - state.current) * 0.16;

      if (Math.abs(state.target - state.current) < 0.5) {
        state.current = state.target;
      }

      setFloatingOffset(state.current);

      if (Math.abs(state.target - state.current) >= 0.5) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        frameId = null;
      }
    };

    const updateTarget = () => {
      if (!mediaQuery.matches) {
        return;
      }

      const sidebarEl = sidebarRef.current;
      const viewportHeight = window.innerHeight;
      const sidebarHeight = sidebarEl?.offsetHeight ?? 0;
      const documentMax = Math.max(0, document.body.scrollHeight - viewportHeight);
      const sidebarSurplus = Math.max(0, sidebarHeight - viewportHeight);
      const maxOffset = Math.max(0, documentMax - sidebarSurplus - 48);

      state.target = Math.min(window.scrollY, maxOffset);

      if (!frameId) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const syncMedia = () => {
      setFloatingEnabled(mediaQuery.matches);

      if (!mediaQuery.matches) {
        state.current = 0;
        state.target = 0;
        setFloatingOffset(0);
        if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
      } else {
        updateTarget();
      }
    };

    const handleResize = () => {
      syncMedia();
      updateTarget();
    };

    syncMedia();
    updateTarget();

    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', handleResize);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMedia);
    } else {
      mediaQuery.addListener(syncMedia);
    }

    return () => {
      window.removeEventListener('scroll', updateTarget);
      window.removeEventListener('resize', handleResize);
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', syncMedia);
      } else {
        mediaQuery.removeListener(syncMedia);
      }
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const renderLink = (item: SidebarItem, index: number) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const animationDelay = `${index * 0.06}s`;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          isSuperSidebar
            ? 'group relative flex items-start gap-3 rounded-3xl border border-[#30407b]/50 bg-gradient-to-r from-[#141e3a]/70 via-[#0d142e]/80 to-[#070c1e]/80 px-5 py-4 text-sm font-semibold text-[#c9d4ff]/90 shadow-[0_25px_60px_-35px_rgba(42,67,165,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5164ff]/60 hover:from-[#1a274b]/80 hover:via-[#111b36]/85 hover:to-[#091024]/80 hover:text-white hover:shadow-[0_32px_70px_-32px_rgba(80,112,255,0.8)]'
            : 'group relative flex items-start gap-3 rounded-3xl border border-white/12 bg-gradient-to-r from-white/[0.18] via-white/[0.08] to-white/[0.04] px-5 py-4 text-sm font-semibold text-foreground/80 shadow-[0_28px_80px_-52px_rgba(24,40,92,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:from-white/[0.24] hover:via-white/[0.12] hover:to-white/[0.06] hover:text-primary hover:shadow-[0_36px_95px_-50px_rgba(54,112,214,0.55)]',
          'animate-super-up',
          isSuperSidebar && isActive && 'border-[#6b7fff]/70 from-[#1c2d5a]/85 via-[#132144]/90 to-[#0a122d]/90 text-white shadow-[0_35px_85px_-40px_rgba(86,108,255,0.9)]',
          !isSuperSidebar && isActive && 'border-primary/65 bg-primary/12 text-primary shadow-[0_34px_95px_-48px_rgba(44,120,255,0.58)]',
        )}
        style={{ animationDelay }}
      >
        <span
          className={cn(
            'mt-0.5 inline-flex items-center justify-center rounded-full border',
            isSuperSidebar
              ? 'h-9 w-9 border-[#4253a3]/40 bg-gradient-to-br from-[#2e3d75]/65 via-[#1a2453]/70 to-[#0e1434]/80 text-[#9fb2ff] shadow-[inset_0_0_25px_rgba(15,24,54,0.65)]'
              : 'h-10 w-10 border-white/40 bg-gradient-to-br from-white/45 via-white/15 to-white/6 text-primary shadow-[inset_0_0_22px_rgba(255,255,255,0.22)]',
          )}
        >
          {item.icon}
        </span>
        <span className='flex-1 leading-snug'>
          <span
            className={cn(
              'flex items-center gap-2 text-[0.92rem] font-semibold tracking-tight',
              isSuperSidebar ? 'text-slate-100' : undefined,
            )}
          >
            {item.label}
            {item.badge && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-[0_0_0_1px_rgba(41,121,255,0.3)]',
                  isSuperSidebar ? 'bg-[#213064]/80 text-[#a5b9ff]' : 'bg-primary/20 text-primary',
                )}
              >
                {item.badge}
              </span>
            )}
          </span>
          {item.description && (
            <span
              className={cn(
                'mt-0.5 block text-xs',
                isSuperSidebar ? 'text-[#9ba7d8]/75' : 'text-foreground/55',
              )}
            >
              {item.description}
            </span>
          )}
        </span>
      </Link>
    );
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        style={sidebarStyle}
        className={cn(
          'relative hidden min-h-[calc(100vh-3.5rem)] w-72 flex-col px-7 py-8 lg:flex',
          isSuperSidebar
            ? 'rounded-[32px] border border-[#2b3b82]/40 bg-[#050a1d]/90 text-[#cfd8ff] shadow-[0_45px_120px_-60px_rgba(25,38,89,0.95)] backdrop-blur-2xl'
            : 'glass-panel floating-sidebar default-sidebar text-foreground',
        )}
      >
        <div className='space-y-8'>
          <div>
            <p
              className={cn(
                'text-[10px] uppercase tracking-[0.28em]',
                isSuperSidebar ? 'text-[#7f8ac6]/70' : 'text-foreground/45',
              )}
            >
              Navegación
            </p>
            <div className='mt-4 flex flex-col gap-2.5'>{items.map((item, index) => renderLink(item, index))}</div>
        </div>
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm shadow-inner shadow-black/20 animate-super-up',
            isSuperSidebar
              ? 'border-[#34427b]/50 bg-gradient-to-br from-[#0d1330]/90 via-[#0a1028]/90 to-[#05091a]/90 text-[#b5c0f5]'
              : 'border-white/15 bg-white/12 text-foreground/80',
            )}
          style={{ animationDelay: profileDelay }}
        >
            <div className='flex items-start justify-between gap-2'>
              <div>
                <p className={cn('font-semibold', isSuperSidebar ? 'text-slate-100' : 'text-foreground')}>
                  {profile.nombre}
                </p>
                <p
                  className={cn(
                    'text-xs uppercase tracking-[0.22em]',
                    isSuperSidebar ? 'text-[#7d89cb]/70' : 'text-foreground/55',
                  )}
                >
                  {profile.role.replace('_', ' ')}
                </p>
                {profile.email && (
                  <p className={cn('mt-1 text-xs', isSuperSidebar ? 'text-[#8f9ad6]/60' : 'text-foreground/45')}>
                    {profile.email}
                  </p>
                )}
              </div>
            </div>
            <div className='mt-4 flex items-center gap-2'>
              <LogoutButton />
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]',
                  isSuperSidebar ? 'bg-[#1a2553]/70 text-[#b3c2ff]' : 'bg-white/10 text-white/70',
                )}
              >
                Sesión
              </span>
            </div>
          </div>
        </div>
        {footer && (
          <div
            className={cn(
              'mt-6 rounded-2xl border px-4 py-4 text-xs shadow-inner shadow-black/10 animate-super-up',
              isSuperSidebar
                ? 'border-dashed border-[#3f4f94]/50 bg-[#0a1128]/85 text-[#92a3e8]/70'
                : 'border-dashed border-white/20 bg-white/10 text-foreground/65',
            )}
            style={{ animationDelay: footerDelay }}
          >
            {footer}
          </div>
        )}
      </aside>

      <div
        className={cn(
          'sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur-2xl lg:hidden',
          isSuperSidebar ? 'border-[#2b3f80]/40 bg-[#060b1a]/80 text-[#cad5ff]' : 'border-white/15 bg-white/10',
        )}
      >
        <button
          type='button'
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-[0_12px_35px_rgba(8,15,38,0.25)]',
            isSuperSidebar
              ? 'border-[#2e3d74]/60 bg-[#121c3c]/80 text-[#d2dbff]'
              : 'border-white/20 bg-white/20 text-foreground',
          )}
        >
          <Menu className='h-5 w-5' />
        </button>
        <div
          className={cn(
            'text-right text-xs',
            isSuperSidebar ? 'text-[#9aa6dc]' : 'text-foreground/60',
          )}
        >
          <p className={cn('font-semibold', isSuperSidebar ? 'text-slate-100' : 'text-foreground')}>
            {profile.nombre}
          </p>
          <p className='uppercase tracking-wider text-[10px]'>{profile.role.replace('_', ' ')}</p>
        </div>
      </div>

      {open && (
        <div
          className={cn(
            'fixed inset-x-4 top-20 z-30 rounded-3xl border p-5 shadow-[0_40px_120px_rgba(6,12,32,0.55)] lg:hidden',
            isSuperSidebar
              ? 'border-[#334281]/60 bg-[#050a20]/95 text-[#c7d4ff]'
              : 'glass-panel border-white/15 bg-white/18 default-sidebar-mobile text-foreground',
          )}
        >
          <div className='flex flex-col gap-2.5'>{items.map((item, index) => renderLink(item, index))}</div>
          <div
            className={cn(
              'mt-4 rounded-2xl border px-4 py-3 text-sm shadow-inner shadow-black/20 animate-super-up',
              isSuperSidebar
                ? 'border-[#334281]/60 bg-[#0c1330]/85 text-[#c4cffd]'
                : 'border-white/15 bg-white/12 text-foreground/75',
            )}
            style={{ animationDelay: profileDelay }}
          >
            <p className={cn('font-medium', isSuperSidebar ? 'text-slate-100' : 'text-foreground')}>
              {profile.nombre}
            </p>
            <p
              className={cn(
                'text-xs uppercase tracking-wider',
                isSuperSidebar ? 'text-[#8b98da]/70' : 'text-foreground/55',
              )}
            >
              {profile.role.replace('_', ' ')}
            </p>
            {profile.email && (
              <p className={cn('mt-1 text-xs', isSuperSidebar ? 'text-[#a0acde]/65' : 'text-foreground/45')}>
                {profile.email}
              </p>
            )}
            <div className='mt-3 flex items-center gap-2'>
              <LogoutButton />
            </div>
          </div>
          {footer && (
            <div
              className={cn(
                'mt-4 rounded-2xl border border-dashed px-4 py-3 text-xs animate-super-up',
                isSuperSidebar
                  ? 'border-[#3a4a8f]/60 bg-[#0a122d]/85 text-[#9cafeb]/70'
                  : 'border-white/20 bg-white/10 text-foreground/60',
              )}
              style={{ animationDelay: footerDelay }}
            >
              {footer}
            </div>
          )}
        </div>
      )}
    </>
  );
}
