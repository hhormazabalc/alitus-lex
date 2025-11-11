'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { getCases } from '@/lib/actions/cases';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen } from 'lucide-react';
import type { Case } from '@/lib/supabase/types';
import type { CaseFiltersInput } from '@/lib/validators/case';

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
        <section className='glass-panel border-white/12 bg-white/8 p-6 sm:p-7'>
          <div className='space-y-5 animate-pulse'>
            <div className='h-4 w-52 rounded-full bg-white/12' />
            <div className='h-72 rounded-2xl border border-white/12 bg-white/6' />
          </div>
        </section>
      );
    }

    if (cases.length === 0 && !filters.search) {
      return (
        <section className='glass-panel border-white/12 bg-white/8 p-8 text-center sm:p-10'>
          <EmptyState
            icon={FolderOpen}
            title='No hay casos registrados'
            description='Aún no se han creado casos en el sistema. Crea tu primer caso para comenzar.'
            action={{
              label: 'Crear primer caso',
              onClick: () => {
                window.location.href = '/cases/new';
              },
            }}
          />
        </section>
      );
    }

    return (
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
    );
  };

  return (
    <div className='mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6 lg:px-10'>
      <div className='space-y-8'>
        <section className='glass-panel border-white/12 bg-white/8 p-6 sm:p-7'>
          <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-start gap-4'>
              <span className='flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-primary shadow-inner shadow-black/20'>
                <FolderOpen className='h-5 w-5' />
              </span>
              <div className='space-y-2'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55'>Gestión de cartera</p>
                <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Casos de la firma</h1>
                <p className='max-w-2xl text-sm leading-relaxed text-foreground/70'>
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
