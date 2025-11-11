import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[120px] w-full rounded-2xl border-2 border-[#2b5dff] bg-white/6 px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all placeholder:text-white/45 focus-visible:border-[#47b6ff] focus-visible:bg-white/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#47b6ff]/35 focus-visible:shadow-[0_0_25px_rgba(60,150,255,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
