import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-2xl border-2 border-[#2b5dff] bg-white/5 px-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-offset-transparent transition-all placeholder:text-white/45 focus-visible:border-[#47b6ff] focus-visible:bg-white/8 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#47b6ff]/35 focus-visible:shadow-[0_0_25px_rgba(60,150,255,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
