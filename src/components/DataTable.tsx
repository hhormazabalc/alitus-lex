'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Search, Filter, Plus, Eye, Edit, X } from 'lucide-react';
import type { Case } from '@/lib/supabase/types';

type CaseWithParties = Case & {
  counterparties?: Array<{ nombre: string; tipo: string }>;
};

interface DataTableProps {
  cases: CaseWithParties[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onFilter: (filters: any) => void;
  canCreate?: boolean;
  canEdit?: boolean;
}

const STATUS_VARIANTS: Record<string, { label: string; chipClass: string }> = {
  activo: {
    label: 'Activo',
    chipClass: 'border border-emerald-300/45 bg-emerald-500/15 text-emerald-100',
  },
  suspendido: {
    label: 'Suspendido',
    chipClass: 'border border-amber-300/45 bg-amber-500/14 text-amber-100',
  },
  archivado: {
    label: 'Archivado',
    chipClass: 'border border-white/12 bg-white/6 text-foreground/70',
  },
  terminado: {
    label: 'Terminado',
    chipClass: 'border border-sky-300/45 bg-sky-500/14 text-sky-100',
  },
};

const PRIORITY_VARIANTS: Record<string, string> = {
  baja: 'border border-emerald-300/45 bg-emerald-500/15 text-emerald-100',
  media: 'border border-sky-300/45 bg-sky-500/15 text-sky-100',
  alta: 'border border-amber-300/45 bg-amber-500/14 text-amber-100',
  urgente: 'border border-red-400/45 bg-red-500/14 text-red-100',
};

export function DataTable({
  cases,
  total,
  page,
  limit,
  onPageChange,
  onSearch,
  onFilter,
  canCreate = false,
  canEdit = false,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState<{ estado: string; prioridad: string; materia: string }>({
    estado: '',
    prioridad: '',
    materia: '',
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(searchTerm.trim());
  };

  const handleFilterChange = (field: 'estado' | 'prioridad' | 'materia') => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFilterValues((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    const cleaned = Object.fromEntries(
      Object.entries(filterValues)
        .filter(([, value]) => value)
        .map(([key, value]) => [key, value])
    );
    onFilter(cleaned);
  };

  const resetFilters = () => {
    setFilterValues({ estado: '', prioridad: '', materia: '' });
    onFilter({});
  };

  const activeFilters = Object.values(filterValues).filter(Boolean).length;

  const renderStatusBadge = (status?: string | null) => {
    const key = (status ?? '').toLowerCase();
    const config = STATUS_VARIANTS[key];
    if (!config) {
      return (
        <span className='inline-flex items-center rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-xs font-medium text-foreground/70'>
          Sin estado
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${config.chipClass}`}>
        {config.label}
      </span>
    );
  };

  const renderPriorityBadge = (priority?: string | null) => {
    const key = (priority ?? 'media').toLowerCase();
    const classes = PRIORITY_VARIANTS[key] ?? 'border border-white/15 bg-white/8 text-foreground/75';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${classes}`}>
        {key}
      </span>
    );
  };

  return (
    <div className='space-y-7 text-foreground'>
      <Card className='border-white/12 bg-white/8 shadow-[0_35px_120px_-35px_rgba(5,15,40,0.65)]'>
        <div className='flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-1.5'>
            <p className='text-sm font-semibold text-foreground'>Casos ({total})</p>
            <p className='text-sm text-foreground/65'>Monitorea el avance y prioriza dónde actuar primero.</p>
          </div>

          <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center'>
            <form
              onSubmit={handleSearchSubmit}
              className='flex w-full items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:w-[300px]'
            >
              <Search className='h-4 w-4 text-white/55' />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='Buscar casos o clientes'
                className='h-11 border-0 bg-transparent px-0 text-sm text-white placeholder:text-white/45 focus-visible:ring-0'
              />
              <Button type='submit' size='sm' className='rounded-xl px-4'>Buscar</Button>
            </form>

            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <Button
                variant='outline'
                onClick={() => setShowFilters((prev) => !prev)}
                className='flex items-center gap-2 rounded-xl border-white/15 bg-white/10 px-4 text-sm font-medium text-white/80 hover:bg-white/14'
              >
                <Filter className='h-4 w-4' />
                Filtros{' '}
                {activeFilters > 0 && (
                  <span className='rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary'>{activeFilters}</span>
                )}
              </Button>

              {canCreate && (
                <Button
                  asChild
                  className='rounded-xl px-4 text-sm font-semibold shadow-[0_22px_55px_-25px_rgba(38,140,255,0.65)]'
                >
                  <Link href='/cases/new'>
                    <Plus className='mr-2 h-4 w-4' />
                    Nuevo caso
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className='border-t border-white/12 bg-white/4 px-6 py-5'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div>
                <label className='text-xs font-semibold uppercase tracking-[0.18em] text-white/60'>Estado</label>
                <select
                  value={filterValues.estado}
                  onChange={handleFilterChange('estado')}
                  className='mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30'
                >
                  <option value=''>Todos</option>
                  <option value='activo'>Activo</option>
                  <option value='suspendido'>Suspendido</option>
                  <option value='archivado'>Archivado</option>
                  <option value='terminado'>Terminado</option>
                </select>
              </div>

              <div>
                <label className='text-xs font-semibold uppercase tracking-[0.18em] text-white/60'>Prioridad</label>
                <select
                  value={filterValues.prioridad}
                  onChange={handleFilterChange('prioridad')}
                  className='mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30'
                >
                  <option value=''>Todas</option>
                  <option value='baja'>Baja</option>
                  <option value='media'>Media</option>
                  <option value='alta'>Alta</option>
                  <option value='urgente'>Urgente</option>
                </select>
              </div>

              <div>
                <label className='text-xs font-semibold uppercase tracking-[0.18em] text-white/60'>Materia</label>
                <select
                  value={filterValues.materia}
                  onChange={handleFilterChange('materia')}
                  className='mt-2 w-full rounded-2xl border border-white/15 bg-white/8 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30'
                >
                  <option value=''>Todas</option>
                  <option value='Laboral'>Laboral</option>
                  <option value='Civil'>Civil</option>
                  <option value='Comercial'>Comercial</option>
                  <option value='Penal'>Penal</option>
                </select>
              </div>

              <div className='flex items-end gap-2'>
                <Button
                  onClick={applyFilters}
                  className='w-full rounded-xl text-sm font-semibold shadow-[0_22px_55px_-25px_rgba(38,140,255,0.65)]'
                >
                  Aplicar filtros
                </Button>
                {activeFilters > 0 && (
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={resetFilters}
                    className='h-10 w-10 rounded-xl border border-transparent text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className='overflow-hidden border-white/12 bg-white/6 shadow-[0_35px_120px_-38px_rgba(6,15,40,0.65)]'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-white/10 text-sm text-foreground/85'>
            <thead className='bg-white/4 text-xs font-semibold uppercase tracking-[0.18em] text-white/60'>
              <tr>
                <th scope='col' className='px-5 py-3 text-left'>Caso</th>
                <th scope='col' className='px-5 py-3 text-left'>Cliente</th>
                <th scope='col' className='px-5 py-3 text-left'>Contrapartes</th>
                <th scope='col' className='px-5 py-3 text-left'>Estado</th>
                <th scope='col' className='px-5 py-3 text-left'>Prioridad</th>
                <th scope='col' className='px-5 py-3 text-left'>Etapa</th>
                <th scope='col' className='px-5 py-3 text-left whitespace-nowrap'>Inicio</th>
                <th scope='col' className='px-5 py-3 text-left'>Valor</th>
                <th scope='col' className='px-5 py-3 text-right'>Acciones</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-white/10'>
              {cases.map((caseItem) => (
                <tr key={caseItem.id} className='transition-colors hover:bg-white/6'>
                  <td className='px-5 py-4 align-top'>
                    <div className='space-y-1'>
                      <p className='text-sm font-semibold text-foreground'>{caseItem.caratulado}</p>
                      {caseItem.numero_causa && (
                        <p className='text-xs font-medium uppercase tracking-[0.18em] text-white/55'>{caseItem.numero_causa}</p>
                      )}
                      {caseItem.materia && (
                        <span className='inline-flex items-center rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[11px] font-medium text-foreground/75'>
                          {caseItem.materia}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className='px-5 py-4 align-top'>
                    <div className='space-y-1'>
                      <p className='text-sm font-medium text-foreground/90'>{caseItem.nombre_cliente}</p>
                      {caseItem.rut_cliente && <p className='text-xs text-foreground/60'>{caseItem.rut_cliente}</p>}
                    </div>
                  </td>
                  <td className='px-5 py-4 align-top'>
                    {caseItem.counterparties && caseItem.counterparties.length > 0 ? (
                      <div className='space-y-1 text-xs text-foreground/70'>
                        {caseItem.counterparties.slice(0, 3).map((party, index) => (
                          <div key={`${party.nombre}-${index}`} className='flex items-center gap-2'>
                            <Badge
                              variant='outline'
                              className='border-white/15 bg-white/10 text-[10px] font-semibold uppercase tracking-wide text-foreground/70'
                            >
                              {party.tipo}
                            </Badge>
                            <span className='text-foreground/80'>{party.nombre}</span>
                          </div>
                        ))}
                        {caseItem.counterparties.length > 3 && (
                          <span className='text-[11px] font-medium text-white/55'>+{caseItem.counterparties.length - 3} más</span>
                        )}
                      </div>
                    ) : (
                      <span className='text-xs text-white/55'>Sin registrar</span>
                    )}
                  </td>
                  <td className='px-5 py-4 align-top'>{renderStatusBadge(caseItem.estado)}</td>
                  <td className='px-5 py-4 align-top'>{renderPriorityBadge(caseItem.prioridad)}</td>
                  <td className='px-5 py-4 align-top text-sm text-foreground/75'>{caseItem.etapa_actual || 'Sin definir'}</td>
                  <td className='px-5 py-4 align-top text-sm'>
                    {caseItem.fecha_inicio ? (
                      formatDate(caseItem.fecha_inicio)
                    ) : (
                      <span className='text-white/55'>Pendiente</span>
                    )}
                  </td>
                  <td className='px-5 py-4 align-top text-sm font-semibold text-foreground'>
                    {caseItem.valor_estimado ? (
                      formatCurrency(caseItem.valor_estimado)
                    ) : (
                      <span className='font-normal text-white/55'>-</span>
                    )}
                  </td>
                  <td className='px-5 py-4 align-top'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-9 w-9 rounded-full border border-transparent text-white/65 hover:border-white/20 hover:bg-white/10 hover:text-white'
                        asChild
                      >
                        <Link href={`/cases/${caseItem.id}`}>
                          <Eye className='h-4 w-4' />
                        </Link>
                      </Button>
                      {canEdit && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-9 w-9 rounded-full border border-transparent text-white/65 hover:border-white/20 hover:bg-white/10 hover:text-white'
                          asChild
                        >
                          <Link href={`/cases/${caseItem.id}/edit`}>
                            <Edit className='h-4 w-4' />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cases.length === 0 && (
          <div className='flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-foreground/75'>
            <div className='rounded-full border border-white/15 bg-white/8 p-3 text-white/65'>
              <Search className='h-5 w-5' />
            </div>
            <h3 className='text-base font-semibold text-foreground'>Sin resultados</h3>
            <p className='max-w-md text-sm text-foreground/70'>
              Ajusta la búsqueda o crea un nuevo caso para poblar el pipeline.
            </p>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className='flex flex-wrap items-center justify-center gap-3 text-foreground'>
          <Button
            variant='outline'
            className='rounded-xl border-white/20 px-4 text-white/80 hover:bg-white/10'
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <div className='flex items-center gap-2'>
            {(() => {
              const pagesToShow = Math.min(5, totalPages);
              const startPage = Math.max(1, Math.min(page - Math.floor(pagesToShow / 2), totalPages - pagesToShow + 1));

              return Array.from({ length: pagesToShow }, (_, index) => {
                const pageNum = startPage + index;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    className={`rounded-xl px-3 ${
                      pageNum === page
                        ? 'shadow-[0_20px_45px_-25px_rgba(40,140,255,0.7)]'
                        : 'border-white/20 text-white/80 hover:bg-white/10'
                    }`}
                    size='sm'
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              });
            })()}
          </div>
          <Button
            variant='outline'
            className='rounded-xl border-white/20 px-4 text-white/80 hover:bg-white/10'
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
