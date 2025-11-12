import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <div
      role='separator'
      aria-orientation={orientation}
      className={cn(
        'bg-border',
        orientation === 'vertical' ? 'h-full w-px shrink-0' : 'h-px w-full shrink-0',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
