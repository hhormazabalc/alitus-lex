import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    const baseClass =
      type === 'file'
        ? 'flex h-12 w-full cursor-pointer items-center overflow-hidden rounded-2xl border-2 border-[#2b5dff] bg-white/6 px-3 text-sm text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all file:mr-4 file:rounded-xl file:border file:border-white/25 file:bg-white/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white/90 file:shadow-[0_18px_45px_rgba(66,170,255,0.28)] file:transition file:hover:bg-white/22 file:focus:outline-none file:cursor-pointer focus-visible:border-[#47b6ff] focus-visible:bg-white/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#47b6ff]/35 focus-visible:shadow-[0_0_25px_rgba(60,150,255,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-60'
        : 'flex h-12 w-full rounded-2xl border-2 border-[#2b5dff] bg-white/5 px-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-offset-transparent transition-all placeholder:text-white/45 focus-visible:border-[#47b6ff] focus-visible:bg-white/8 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#47b6ff]/35 focus-visible:shadow-[0_0_25px_rgba(60,150,255,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-60';

    return (
      <input
        type={type}
        className={cn(baseClass, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
