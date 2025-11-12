import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-55 ring-offset-transparent',
  {
    variants: {
      variant: {
        default:
          'border border-white/15 bg-gradient-to-r from-[#1f4fd8] via-[#2563eb] to-[#36b0ff] text-white shadow-[0_22px_70px_-34px_rgba(26,74,188,0.85)] hover:brightness-110 focus-visible:ring-primary/35 focus-visible:ring-offset-transparent',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 focus-visible:ring-destructive/35 focus-visible:ring-offset-transparent',
        outline:
          'border border-white/20 bg-transparent text-white/75 hover:bg-white/10 focus-visible:ring-primary/30 focus-visible:ring-offset-transparent',
        secondary:
          'border border-white/15 bg-white/15 text-white/85 shadow-[0_18px_55px_-30px_rgba(36,84,196,0.65)] hover:bg-white/22 focus-visible:ring-primary/32 focus-visible:ring-offset-transparent',
        ghost:
          'border border-transparent bg-transparent text-white/70 hover:bg-white/10',
        link: 'text-primary/90 underline-offset-4 hover:underline hover:text-primary',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-9 rounded-sm px-3.5 text-xs font-medium',
        lg: 'h-12 rounded-md px-7 text-base',
        icon: 'h-10 w-10 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
