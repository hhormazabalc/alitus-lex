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
}

export function AppSidebar({ items, profile, footer }: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [floatingEnabled, setFloatingEnabled] = useState(false);
  const [floatingOffset, setFloatingOffset] = useState(0);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
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

  const renderLink = (item: SidebarItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          'group relative flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-foreground/80 transition-all duration-300 hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
          isActive && 'border-primary/50 bg-primary/20 text-primary shadow-[0_18px_55px_rgba(24,119,242,0.25)]',
        )}
      >
        <span className='mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-white/30 via-white/15 to-white/5 text-primary shadow-inner shadow-black/20'>
          {item.icon}
        </span>
        <span className='flex-1 leading-snug'>
          <span className='flex items-center gap-2 text-[0.92rem] font-semibold tracking-tight'>
            {item.label}
            {item.badge && (
              <span className='rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-[0_0_0_1px_rgba(41,121,255,0.3)]'>
                {item.badge}
              </span>
            )}
          </span>
          {item.description && (
            <span className='mt-0.5 block text-xs text-foreground/55'>{item.description}</span>
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
        className='relative glass-panel floating-sidebar hidden min-h-[calc(100vh-3.5rem)] w-72 flex-col px-7 py-8 text-foreground lg:flex'
      >
        <div className='space-y-8'>
          <div>
            <p className='text-[10px] uppercase tracking-[0.28em] text-foreground/45'>Navegación</p>
            <div className='mt-4 flex flex-col gap-2.5'>{items.map(renderLink)}</div>
          </div>
          <div className='rounded-2xl border border-white/15 bg-white/12 px-4 py-3 text-sm text-foreground/80 shadow-inner shadow-black/20'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <p className='font-semibold text-foreground'>{profile.nombre}</p>
                <p className='text-xs uppercase tracking-[0.22em] text-foreground/55'>{profile.role.replace('_', ' ')}</p>
                {profile.email && <p className='mt-1 text-xs text-foreground/45'>{profile.email}</p>}
              </div>
            </div>
            <div className='mt-4 flex items-center gap-2'>
              <LogoutButton />
              <span className='rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70'>Sesión</span>
            </div>
          </div>
        </div>
        {footer && (
          <div className='mt-6 rounded-2xl border border-dashed border-white/20 bg-white/10 px-4 py-4 text-xs text-foreground/65 shadow-inner shadow-black/10'>
            {footer}
          </div>
        )}
      </aside>

      <div className='sticky top-0 z-30 flex items-center justify-between border-b border-white/15 bg-white/10 px-4 py-3 backdrop-blur-2xl lg:hidden'>
        <button
          type='button'
          onClick={() => setOpen((prev) => !prev)}
          className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/20 text-foreground shadow-[0_12px_35px_rgba(8,15,38,0.25)]'
        >
          <Menu className='h-5 w-5' />
        </button>
        <div className='text-right text-xs text-foreground/60'>
          <p className='font-semibold text-foreground'>{profile.nombre}</p>
          <p className='uppercase tracking-wider text-[10px]'>{profile.role.replace('_', ' ')}</p>
        </div>
      </div>

      {open && (
        <div className='glass-panel fixed inset-x-4 top-20 z-30 rounded-3xl border-white/15 bg-white/14 p-5 shadow-[0_40px_120px_rgba(6,12,32,0.55)] lg:hidden'>
          <div className='flex flex-col gap-2.5'>{items.map(renderLink)}</div>
          <div className='mt-4 rounded-2xl border border-white/15 bg-white/12 px-4 py-3 text-sm text-foreground/75 shadow-inner shadow-black/20'>
            <p className='font-medium text-foreground'>{profile.nombre}</p>
            <p className='text-xs uppercase tracking-wider text-foreground/55'>{profile.role.replace('_', ' ')}</p>
            {profile.email && <p className='mt-1 text-xs text-foreground/45'>{profile.email}</p>}
            <div className='mt-3 flex items-center gap-2'>
              <LogoutButton />
            </div>
          </div>
          {footer && (
            <div className='mt-4 rounded-2xl border border-dashed border-white/20 bg-white/10 px-4 py-3 text-xs text-foreground/60'>
              {footer}
            </div>
          )}
        </div>
      )}
    </>
  );
}
