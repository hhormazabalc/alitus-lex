'use client';

import { useTransition } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { exitDemoMode } from '@/lib/actions/saas';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function DemoModeBanner() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleExit = () => {
    startTransition(async () => {
      const result = await exitDemoMode();
      if (result.success) {
        toast({
          title: 'Modo demo desactivado',
          description: 'Volvemos al panel SaaS.',
        });
        window.location.href = '/super/dashboard';
      } else {
        toast({
          title: 'No se pudo salir del modo demo',
          description: 'Inténtalo nuevamente.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className='mb-6 rounded-xl border border-yellow-400/30 bg-yellow-50/60 px-4 py-3 text-sm text-yellow-800 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='mt-0.5 h-5 w-5 flex-none text-yellow-500' />
          <p>
            <span className='font-medium'>Estás en modo demo.</span> Todas las vistas muestran datos ficticios para
            presentaciones. Cualquier cambio no afectará tus clientes reales.
          </p>
        </div>
        <Button variant='outline' onClick={handleExit} disabled={isPending} className='sm:w-auto'>
          {isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saliendo…
            </>
          ) : (
            'Volver al panel SaaS'
          )}
        </Button>
      </div>
    </div>
  );
}
