import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-transparent',
  {
    variants: {
      variant: {
        default:
          'border border-white/10 bg-gradient-to-r from-[#1a4fff] via-[#2877ff] to-[#37c5ff] text-white shadow-[0_25px_70px_-30px_rgba(18,58,150,0.85)] backdrop-blur-2xl hover:brightness-110 focus-visible:ring-primary/40 focus-visible:ring-offset-transparent',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 focus-visible:ring-destructive/40 focus-visible:ring-offset-transparent',
        outline:
          'border border-white/25 bg-transparent text-white/80 hover:bg-white/10 focus-visible:ring-primary/30 focus-visible:ring-offset-transparent',
        secondary:
          'border border-transparent bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:ring-primary/40 focus-visible:ring-offset-transparent',
        ghost:
          'border border-transparent bg-transparent text-white/75 hover:bg-white/10',
        link: 'text-primary/90 underline-offset-4 hover:underline hover:text-primary',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-9 rounded-xl px-3.5',
        lg: 'h-12 rounded-2xl px-8 text-base',
        icon: 'h-10 w-10 rounded-xl',
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
