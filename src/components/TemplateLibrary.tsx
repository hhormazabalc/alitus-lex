'use client';

import { useRef, useTransition, useState } from 'react';
import type { LegalTemplate } from '@/lib/supabase/types';
import { createLegalTemplate, listLegalTemplates } from '@/lib/actions/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, Loader2 } from 'lucide-react';

interface TemplateLibraryProps {
  templates: LegalTemplate[];
}

export function TemplateLibrary({ templates }: TemplateLibraryProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const [isSubmitting, startSubmit] = useTransition();
  const [items, setItems] = useState(templates);

  const handleSubmit = (formData: FormData) => {
    startSubmit(async () => {
      try {
        await createLegalTemplate(formData);
        toast({ title: 'Plantilla guardada', description: 'Disponible para el equipo.' });
        formRef.current?.reset();
        const refreshed = await listLegalTemplates().catch(() => items);
        setItems(refreshed);
      } catch (error: any) {
        toast({
          title: 'No se pudo guardar',
          description: error?.message ?? 'Intenta nuevamente más tarde.',
          variant: 'destructive',
        });
      }
    });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast({ title: 'Plantilla copiada' });
    });
  };

  return (
    <Card className='glass-panel border-white/12 bg-white/8 text-foreground shadow-[0_35px_110px_rgba(6,15,40,0.65)]'>
      <CardHeader className='p-6 pb-4'>
        <CardTitle className='flex items-center justify-between text-sm font-semibold text-foreground'>
          Plantillas de gestión
          {isSubmitting && <Loader2 className='h-4 w-4 animate-spin text-primary/80' />}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6 px-6 pb-6 pt-0'>
        <form ref={formRef} action={handleSubmit} className='space-y-3'>
          <div className='grid gap-3 md:grid-cols-3'>
            <Input
              name='title'
              placeholder='Título'
              required
              disabled={isSubmitting}
              className='input-field h-12 rounded-2xl bg-white/8'
            />
            <Input
              name='category'
              placeholder='Categoría (opcional)'
              disabled={isSubmitting}
              className='input-field h-12 rounded-2xl bg-white/8'
            />
            <Button type='submit' disabled={isSubmitting} className='h-12 rounded-2xl px-6'>
              Guardar plantilla
            </Button>
          </div>
          <Textarea
            name='content'
            placeholder='Cuerpo de la plantilla (compatible con copiar/pegar)'
            required
            disabled={isSubmitting}
            className='min-h-[160px] rounded-2xl border-white/15 bg-white/8 text-sm text-white/90 placeholder:text-white/40 focus:border-primary/60 focus:bg-white/10'
          />
        </form>

        <div className='space-y-3'>
          {items.length === 0 && (
            <p className='text-sm text-foreground/60'>Aún no hay plantillas guardadas.</p>
          )}
          {items.map((template) => (
            <div
              key={template.id}
              className='rounded-2xl border border-white/10 bg-white/8 p-4 text-foreground backdrop-blur-xl transition-all duration-300 hover:border-primary/25 hover:bg-white/12'
            >
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='font-semibold text-foreground'>{template.title}</p>
                  {template.category && <p className='text-xs text-foreground/60'>{template.category}</p>}
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => copyToClipboard(template.content)}
                  className='border-none bg-primary/20 text-primary hover:bg-primary/30'
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
              <pre className='mt-3 whitespace-pre-wrap rounded-2xl border border-white/12 bg-black/30 p-3 text-xs text-white/80 shadow-inner shadow-black/40'>
                {template.content}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
