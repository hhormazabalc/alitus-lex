import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  label: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ label, title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <section
      className={cn(
        'glass-panel panel-minimal panel-no-accent px-8 py-7 sm:px-9 sm:py-8',
        'flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {Icon ? (
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-sm border border-white/18 bg-white/10 text-primary shadow-[0_18px_42px_-28px_rgba(62,120,220,0.65)]">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">{label}</p>
          <h1 className="text-[28px] font-semibold leading-snug tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="text-sm leading-relaxed text-foreground/70">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-shrink-0 items-center gap-3">{actions}</div> : null}
    </section>
  );
}
