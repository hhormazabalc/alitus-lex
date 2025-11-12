import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors focus:outline-none focus:ring-0',
  {
    variants: {
      variant: {
        default:
          'border-white/25 bg-white/12 text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]',
        secondary:
          'border-white/18 bg-white/8 text-white/65',
        destructive:
          'border-destructive/40 bg-destructive/15 text-destructive-foreground',
        outline: 'border-white/28 text-white/70',
        success:
          'border-emerald-400/50 bg-emerald-400/12 text-emerald-200',
        warning:
          'border-amber-300/55 bg-amber-300/12 text-amber-200',
        info:
          'border-sky-400/55 bg-sky-400/12 text-sky-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
