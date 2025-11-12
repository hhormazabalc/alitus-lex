import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    className?: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center text-center text-white/80'>
      <Icon className='h-12 w-12 text-white/60' />
      <h3 className='mt-4 text-xl font-semibold text-white'>{title}</h3>
      <p className='mt-2 max-w-md text-sm leading-relaxed text-white/70'>{description}</p>
      {action && (
        <div className='mt-6'>
          <Button onClick={action.onClick} className={action.className}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
