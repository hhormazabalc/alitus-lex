'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { getCases } from '@/lib/actions/cases';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen } from 'lucide-react';
import type { Case } from '@/lib/supabase/types';
import type { CaseFiltersInput } from '@/lib/validators/case';

const PRIMARY_PANEL = 'glass-panel panel-muted';
const TABLE_SHELL = 'glass-panel panel-minimal panel-no-accent panel-compact';

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CaseFiltersInput>({
    page: 1,
    limit: 10,
  });
  const { toast } = useToast();

  const loadCases = async (newFilters: CaseFiltersInput = filters) => {
    setIsLoading(true);
    try {
      const result = await getCases(newFilters);
      
      if (result.success) {
        setCases(result.cases);
        setTotal(result.total);
        setPage(result.page || 1);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al cargar casos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading cases:', error);
      toast({
        title: 'Error',
        description: 'Error inesperado al cargar casos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    loadCases(newFilters);
  };

  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search, page: 1 };
    setFilters(newFilters);
    loadCases(newFilters);
  };

  const handleFilter = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    loadCases(updatedFilters);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <section className={`${PRIMARY_PANEL} px-8 py-9 sm:px-10 sm:py-11`}>
          <div className='space-y-6 animate-pulse text-white/70'>
            <div className='h-4 w-56 bg-white/15' />
            <div className='h-72 border border-white/12 bg-white/8' />
          </div>
        </section>
      );
    }

    if (cases.length === 0 && !filters.search) {
      return (
        <section className={`${PRIMARY_PANEL} px-8 py-10 text-center sm:px-10 sm:py-12`}>
          <EmptyState
            icon={FolderOpen}
            title='No hay casos registrados'
            description='Aún no se han creado casos en el sistema. Crea tu primer caso para comenzar.'
            action={{
              label: 'Crear primer caso',
              onClick: () => {
                window.location.href = '/cases/new';
              },
              className:
                'border border-primary/45 bg-primary/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-primary/22',
            }}
          />
        </section>
      );
    }

    return (
      <div className={`${TABLE_SHELL} p-0`}>
        <div className='border border-white/12 bg-white/6 p-6 sm:p-8'>
          <DataTable
            cases={cases}
            total={total}
            page={page}
            limit={filters.limit}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onFilter={handleFilter}
            canCreate
            canEdit
          />
        </div>
      </div>
    );
  };

  return (
    <div className='relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-10'>
      <div className='space-y-10'>
        <section className={`${PRIMARY_PANEL} px-8 py-9 sm:px-10 sm:py-10`}>
          <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-start gap-4'>
              <span className='flex h-12 w-12 items-center justify-center rounded-sm border border-primary/40 bg-primary/15 text-white shadow-[0_26px_75px_-42px_rgba(72,132,255,0.6)]'>
                <FolderOpen className='h-5 w-5' />
              </span>
              <div className='space-y-3'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65'>Gestión de cartera</p>
                <h1 className='text-3xl font-semibold tracking-tight text-white'>Casos de la firma</h1>
                <p className='max-w-2xl text-sm leading-relaxed text-white/75'>
                  Consulta y actualiza el estado de cada expediente. Usa los filtros para priorizar según vencimientos, estado o tipo de materia.
                </p>
              </div>
            </div>
          </div>
        </section>

        {renderContent()}
      </div>
    </div>
  );
}
