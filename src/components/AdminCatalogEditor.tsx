'use client';

import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import {
  Check,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { CatalogKey } from '@/lib/actions/settings';
import { updateMasterCatalog } from '@/lib/actions/settings';

type AdminCatalogEditorProps = {
  catalogKey: CatalogKey;
  title: string;
  description: string;
  placeholder?: string;
  helperText?: string;
  items: string[];
};

function normalizeList(list: string[]): string[] {
  return list.map(item => item.trim()).filter(Boolean);
}

export function AdminCatalogEditor({
  catalogKey,
  title,
  description,
  placeholder,
  helperText,
  items,
}: AdminCatalogEditorProps) {
  const { toast } = useToast();
  const [itemsState, setItemsState] = useState<string[]>(() => [...items]);
  const [baseline, setBaseline] = useState<string[]>(() => [...items]);
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItemsState([...items]);
    setBaseline([...items]);
  }, [JSON.stringify(items)]);

  const hasChanges = useMemo(() => {
    const current = normalizeList(itemsState);
    const saved = normalizeList(baseline);
    if (current.length !== saved.length) return true;
    return current.some((value, index) => value !== saved[index]);
  }, [itemsState, baseline]);

  const entriesCount = itemsState.length;

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = newItem.trim();
    if (!value) return;

    const normalized = value.replace(/\s+/g, ' ');
    const exists = itemsState.some(item => item.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      toast({
        title: 'Elemento duplicado',
        description: 'Ese valor ya existe en el catálogo.',
        variant: 'destructive',
      });
      return;
    }

    setItemsState(prev => [...prev, normalized]);
    setNewItem('');
  };

  const handleRemove = (index: number) => {
    setItemsState(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(itemsState[index] ?? '');
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const commitEditing = (index: number) => {
    const value = editingValue.trim();
    if (!value) {
      toast({
        title: 'Valor inválido',
        description: 'Ingresa un texto antes de guardar.',
        variant: 'destructive',
      });
      return;
    }
    const normalized = value.replace(/\s+/g, ' ');
    const exists = itemsState.some((item, idx) => idx !== index && item.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      toast({
        title: 'Elemento duplicado',
        description: 'Ese valor ya existe en el catálogo.',
        variant: 'destructive',
      });
      return;
    }

    setItemsState(prev => {
      const next = [...prev];
      next[index] = normalized;
      return next;
    });
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDragStart = (index: number) => () => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => (event: React.DragEvent<HTMLLIElement>) => {
    event.preventDefault();
    if (index === draggedIndex) return;
    setDragOverIndex(index);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLIElement>) => {
    event.preventDefault();
  };

  const handleDrop = (index: number) => (event: React.DragEvent<HTMLLIElement>) => {
    event.preventDefault();
    if (draggedIndex === null) return;

    setItemsState(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      if (typeof moved === 'undefined') {
        return prev;
      }
      updated.splice(index, 0, moved);
      return updated;
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleReset = () => {
    setItemsState([...baseline]);
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateMasterCatalog(catalogKey, itemsState);
        setItemsState(result.items);
        setBaseline(result.items);
        setEditingIndex(null);
        setEditingValue('');

        toast({
          title: 'Catálogo guardado',
          description: 'Los cambios ya están disponibles en formularios y sugerencias.',
        });
      } catch (error: any) {
        toast({
          title: 'Error al guardar',
          description: error?.message ?? 'No se pudieron aplicar los cambios.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className='space-y-4 rounded-xl border border-white/10 bg-white/6 p-4 shadow-[0_18px_40px_rgba(6,15,40,0.35)] backdrop-blur sm:p-5'>
      <div className='space-y-1.5'>
        <h3 className='text-base font-semibold text-foreground'>{title}</h3>
        <p className='text-xs text-foreground/60'>{description}</p>
      </div>

      <form
        onSubmit={handleAdd}
        className='flex flex-col gap-2 rounded-lg border border-white/8 bg-white/5 p-3 sm:flex-row sm:items-center sm:gap-3'
      >
        <Input
          value={newItem}
          onChange={event => setNewItem(event.target.value)}
          placeholder={placeholder ?? 'Añadir nuevo elemento'}
          className='h-9 rounded-md border-white/15 bg-white/10 text-sm text-foreground placeholder:text-foreground/45 focus:border-primary/60 focus:bg-white/16 focus:ring-2 focus:ring-primary/30'
          disabled={isPending}
        />
        <Button
          type='submit'
          size='sm'
          className='h-9 rounded-md bg-primary px-3 text-xs font-semibold text-slate-950 shadow-[0_8px_20px_rgba(29,155,240,0.35)] transition hover:-translate-y-0.5 hover:bg-primary/90'
          disabled={isPending}
        >
          <Plus className='mr-2 h-3.5 w-3.5' />
          Agregar
        </Button>
      </form>

      {helperText && <p className='text-xs text-foreground/50'>{helperText}</p>}

      <div className='space-y-2.5'>
        {itemsState.length === 0 ? (
          <div className='rounded-lg border border-dashed border-white/12 bg-white/5 p-6 text-center text-sm text-foreground/50'>
            No hay elementos en este catálogo. Agrega al menos uno para habilitar la configuración.
          </div>
        ) : (
          <ul className='space-y-2'>
            {itemsState.map((item, index) => {
              const isEditing = editingIndex === index;
              const isDragging = draggedIndex === index;
              const isDragTarget = dragOverIndex === index;
              return (
                <li
                  key={`${item}-${index}`}
                  draggable
                  onDragStart={handleDragStart(index)}
                  onDragEnter={handleDragEnter(index)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-sm transition-all duration-150',
                    isDragging && 'border-primary/60 bg-primary/12 ring-1 ring-primary/40',
                    !isDragging && isDragTarget && 'border-primary/40 bg-primary/8'
                  )}
                >
                  <span className='flex h-8 w-8 shrink-0 cursor-grab select-none items-center justify-center rounded-md border border-white/10 bg-white/10 text-foreground/45 transition group-hover:text-primary'>
                    <GripVertical className='h-4 w-4' />
                  </span>

                  <div className='flex flex-1 flex-col gap-0.5'>
                    {isEditing ? (
                      <Input
                        value={editingValue}
                        autoFocus
                        onChange={event => setEditingValue(event.target.value)}
                        className='h-8 rounded-md border-white/20 bg-white/12 text-sm text-foreground focus:border-primary/50 focus:bg-white/18 focus:ring-2 focus:ring-primary/30'
                      />
                    ) : (
                      <span className='text-sm text-foreground'>{item}</span>
                    )}
                    <span className='text-[11px] font-medium text-foreground/35'>
                      #{index + 1}
                    </span>
                  </div>

                  <div className='flex items-center gap-1'>
                    {isEditing ? (
                      <>
                        <Button
                          type='button'
                          size='icon'
                          className='h-8 w-8 rounded-full bg-emerald-500/90 text-white hover:bg-emerald-500'
                          onClick={() => commitEditing(index)}
                        >
                          <Check className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          className='h-8 w-8 rounded-full border border-white/10 bg-white/12 text-foreground/55 hover:bg-white/20'
                          onClick={cancelEditing}
                        >
                          <X className='h-3.5 w-3.5' />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          className='h-8 w-8 rounded-full border border-white/10 bg-white/12 text-foreground/65 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/20'
                          onClick={() => startEditing(index)}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          className='h-8 w-8 rounded-full border border-white/10 bg-white/12 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/20'
                          onClick={() => handleRemove(index)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3 pt-1'>
        <span className='text-xs text-foreground/40'>
          {entriesCount} elemento{entriesCount === 1 ? '' : 's'} registrados
        </span>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='ghost'
            className='h-9 rounded-md border border-white/10 bg-white/6 px-4 text-xs text-foreground/70 transition hover:bg-white/14 hover:text-foreground'
            onClick={handleReset}
            disabled={isPending || !hasChanges}
          >
            Deshacer cambios
          </Button>
          <Button
            type='button'
            className='h-9 rounded-md bg-primary px-4 text-xs font-semibold text-slate-950 shadow-[0_10px_30px_rgba(29,155,240,0.35)] transition hover:-translate-y-0.5 hover:bg-primary/90'
            onClick={handleSave}
            disabled={isPending || !hasChanges}
          >
            {isPending ? (
              <Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' />
            ) : (
              <Save className='mr-2 h-3.5 w-3.5' />
            )}
            Guardar catálogo
          </Button>
        </div>
      </div>
    </div>
  );
}
