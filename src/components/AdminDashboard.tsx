'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatRelativeTime, getInitials, stringToColor } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Scale,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Target,
  User,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { KpiCards } from '@/components/KpiCards';
import type { Profile } from '@/lib/supabase/types';
import type {
  DashboardStats,
  CasesByStatus,
  CasesByMateria,
  CasesByPriority,
  MonthlyStats,
  AbogadoWorkload,
  DashboardHighlights,
} from '@/lib/actions/analytics';
import LogoutButton from '@/components/LogoutButton';

interface AdminDashboardProps {
  profile: Profile;
  data: {
    stats: DashboardStats | null;
    casesByStatus: CasesByStatus[];
    casesByMateria: CasesByMateria[];
    casesByPriority: CasesByPriority[];
    monthlyStats: MonthlyStats[];
    abogadoWorkload: AbogadoWorkload[];
    upcomingDeadlines: any[];
    highlights: DashboardHighlights;
  };
}

const STATUS_COLORS: Record<string, string> = {
  activo: '#10B981',
  suspendido: '#F59E0B',
  archivado: '#6B7280',
  terminado: '#3B82F6',
};

const PRIORITY_COLORS: Record<string, string> = {
  baja: '#10B981',
  media: '#3B82F6',
  alta: '#F59E0B',
  urgente: '#EF4444',
};

const GLASS_CARD =
  'glass-panel border-white/10 bg-white/8 text-foreground';

export function AdminDashboard({ profile, data }: AdminDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '12m'>('6m');
  const stats = data.stats;

  if (!stats) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-[#07112c] via-[#091a3c] to-[#0c224f] text-foreground'>
        <div className='glass-panel space-y-3 border-white/12 bg-white/8 p-8 text-center'>
          <AlertTriangle className='mx-auto h-12 w-12 text-amber-400' />
          <h2 className='text-xl font-semibold'>No se pudieron cargar los datos</h2>
          <p className='text-foreground/70'>Intenta nuevamente en unos minutos.</p>
        </div>
      </div>
    );
  }

  const getFilteredMonthlyStats = () => {
    const months = selectedPeriod === '3m' ? 3 : selectedPeriod === '6m' ? 6 : 12;
    return data.monthlyStats.slice(-months);
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || '#6B7280';
  const getPriorityColor = (priority: string) => PRIORITY_COLORS[priority] || '#6B7280';

  return (
    <div className='min-h-screen text-foreground'>
      <main>
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8'>
          <section className='glass-panel border-white/12 bg-white/8 p-6 sm:p-7'>
            <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex items-start gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12 text-primary shadow-[0_18px_45px_-28px_rgba(40,120,255,0.6)]'>
                  <Scale className='h-5 w-5' />
                </div>
                <div>
                  <p className='text-[11px] uppercase tracking-[0.32em] text-white/60'>Panel ejecutivo</p>
                  <h1 className='mt-1 text-xl font-semibold tracking-tight text-foreground'>LEX Altius · visión consolidada</h1>
                  <p className='mt-2 max-w-xl text-xs leading-relaxed text-foreground/70'>
                    Supervisa indicadores clave, vencimientos y rendimiento del equipo desde una experiencia compacta alineada al nuevo sidebar.
                  </p>
                </div>
              </div>
              <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5'>
                <div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 shadow-[0_20px_60px_-32px_rgba(6,15,40,0.6)]'>
                  <div
                    className='flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/20 font-medium text-foreground shadow-inner'
                    style={{
                      background: `linear-gradient(135deg, ${stringToColor(profile.nombre)} 0%, rgba(255,255,255,0.92) 100%)`,
                    }}
                  >
                    {getInitials(profile.nombre)}
                  </div>
                  <div>
                    <p className='text-sm font-medium leading-none text-foreground'>{profile.nombre}</p>
                    <p className='mt-1 text-[11px] text-foreground/70 capitalize'>{profile.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2.5'>
                  <Button
                    asChild
                    size='sm'
                    className='rounded-full border border-white/20 bg-primary/40 px-4 text-sm font-medium text-white shadow-[0_22px_55px_-28px_rgba(38,140,255,0.7)] hover:bg-primary/55'
                  >
                    <Link href='/dashboard/admin/users'>Gestionar usuarios</Link>
                  </Button>
                  <LogoutButton />
                </div>
              </div>
            </div>
          </section>

          <section className='space-y-5'>
            <h2 className='text-base font-semibold text-foreground'>Indicadores destacados</h2>
            <KpiCards stats={stats} highlights={data.highlights} />
          </section>

          {(stats.overdueStages > 0 || data.upcomingDeadlines.length > 0) && (
            <section className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {stats.overdueStages > 0 && (
                <Card className={`${GLASS_CARD} border-red-200`}>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-red-600'>
                      <AlertTriangle className='h-5 w-5' />
                      Etapas vencidas ({stats.overdueStages})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-red-600/80'>
                      Hay {stats.overdueStages} etapas que superaron su fecha programada. Prioriza su revisión para mantener la continuidad del caso.
                    </p>
                  </CardContent>
                </Card>
              )}
              {data.upcomingDeadlines.length > 0 && (
                <Card className={GLASS_CARD}>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Calendar className='h-5 w-5 text-sky-500' />
                      Próximos vencimientos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {data.upcomingDeadlines.map((deadline, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-foreground/75'
                        >
                          <div>
                            <p className='text-sm font-medium text-foreground'>{deadline.caratulado}</p>
                            <p className='text-xs text-foreground/65'>Próxima etapa: {deadline.proxima_etapa}</p>
                          </div>
                          <p className='text-xs text-foreground/65'>{formatDate(deadline.fecha)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>
          )}

          <section className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card className={GLASS_CARD}>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <Activity className='h-5 w-5 text-emerald-500' />
                    Distribución por estado
                  </CardTitle>
                  <Badge variant='outline' className='border-white/20 bg-white/10 text-white/75 backdrop-blur'>
                    {stats.totalCases} casos totales
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={320}>
                  <PieChart>
                    <Pie
                      data={data.casesByStatus}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ status, percentage }) => `${status} (${percentage}%)`}
                      outerRadius={90}
                      dataKey='count'
                    >
                      {data.casesByStatus.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(8,15,32,0.92)',
                        borderRadius: 14,
                        border: '1px solid rgba(148,163,184,0.35)',
                        color: '#E2E8F0',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={GLASS_CARD}>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='h-5 w-5 text-indigo-600' />
                  Casos por materia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={320}>
                  <BarChart data={data.casesByMateria}>
                    <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,0.25)' />
                    <XAxis
                      dataKey='materia'
                      stroke='rgba(226,232,240,0.35)'
                      tick={{ fill: 'rgba(226,232,240,0.7)', fontSize: 12 }}
                    />
                    <YAxis stroke='rgba(226,232,240,0.35)' tick={{ fill: 'rgba(226,232,240,0.7)', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(8,15,32,0.92)',
                        borderRadius: 14,
                        border: '1px solid rgba(148,163,184,0.35)',
                        color: '#E2E8F0',
                      }}
                    />
                    <Bar dataKey='count' fill='url(#materiaGradient)' radius={[9, 9, 0, 0]} />
                    <defs>
                      <linearGradient id='materiaGradient' x1='0' x2='0' y1='0' y2='1'>
                        <stop offset='0%' stopColor='#6366F1' stopOpacity={0.9} />
                        <stop offset='100%' stopColor='#14B8A6' stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className={`${GLASS_CARD} mb-2`}>
              <CardHeader>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5 text-amber-500' />
                    Evolución mensual
                  </CardTitle>
                  <div className='flex gap-2'>
                    {(['3m', '6m', '12m'] as const).map((period) => (
                      <Button
                        key={period}
                        size='sm'
                        variant={selectedPeriod === period ? 'default' : 'outline'}
                        className={
                          selectedPeriod === period
                            ? 'rounded-full border-white/25 bg-primary/55 text-white shadow-[0_22px_55px_-28px_rgba(38,140,255,0.7)] hover:bg-primary/65'
                            : 'rounded-full border-white/20 bg-white/12 text-white/75 hover:bg-white/16'
                        }
                        onClick={() => setSelectedPeriod(period)}
                      >
                        {period === '3m' ? '3 meses' : period === '6m' ? '6 meses' : '12 meses'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={380}>
                  <LineChart data={getFilteredMonthlyStats()}>
                    <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,0.25)' />
                    <XAxis dataKey='month' stroke='rgba(226,232,240,0.35)' tick={{ fill: 'rgba(226,232,240,0.75)' }} />
                    <YAxis yAxisId='left' stroke='rgba(226,232,240,0.35)' tick={{ fill: 'rgba(226,232,240,0.7)' }} />
                    <YAxis yAxisId='right' orientation='right' stroke='rgba(226,232,240,0.35)' tick={{ fill: 'rgba(226,232,240,0.7)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(8,15,32,0.92)',
                        borderRadius: 14,
                        border: '1px solid rgba(148,163,184,0.35)',
                        color: '#E2E8F0',
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'newCases' ? 'Casos nuevos' : name === 'completedCases' ? 'Casos completados' : 'Ingresos',
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ color: 'rgba(226,232,240,0.75)' }}
                      payload={[
                        { value: 'Casos nuevos', type: 'square', color: '#38BDF8' },
                        { value: 'Casos completados', type: 'square', color: '#22C55E' },
                        { value: 'Ingresos', type: 'line', color: '#FACC15' },
                      ]}
                    />
                    <Bar yAxisId='left' dataKey='newCases' fill='#38BDF8' name='Casos nuevos' radius={[8, 8, 0, 0]} />
                    <Bar yAxisId='left' dataKey='completedCases' fill='#22C55E' name='Casos completados' radius={[8, 8, 0, 0]} />
                    <Line yAxisId='right' type='monotone' dataKey='revenue' stroke='#FACC15' strokeWidth={2} name='Ingresos' />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          {profile.role === 'admin_firma' && data.abogadoWorkload.length > 0 && (
            <section>
              <Card className={GLASS_CARD}>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <User className='h-5 w-5 text-fuchsia-500' />
                    Carga de trabajo por abogado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {data.abogadoWorkload.map((abogado) => (
                      <Link
                        key={abogado.abogado_id}
                        href={`/dashboard/admin/lawyers/${abogado.abogado_id}`}
                        className='flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-foreground/80 transition-colors hover:border-primary/30 hover:bg-primary/10'
                      >
                        <div className='flex items-center gap-3'>
                          <div
                            className='flex h-10 w-10 items-center justify-center rounded-full border border-white/20 font-medium text-white shadow-[0_12px_35px_-18px_rgba(6,15,40,0.6)]'
                            style={{ background: stringToColor(abogado.nombre) }}
                          >
                            {getInitials(abogado.nombre)}
                          </div>
                          <div>
                            <p className='font-medium text-foreground'>{abogado.nombre}</p>
                            <p className='text-xs text-foreground/65'>
                              {abogado.activeCases} casos activos • {abogado.completedCases} completados
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='font-semibold text-foreground'>{formatCurrency(abogado.totalValue)}</p>
                          <p className='text-xs text-foreground/65'>Promedio: {formatCurrency(abogado.avgCaseValue)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          <section className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card className={GLASS_CARD}>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingDown className='h-5 w-5 text-rose-500' />
                  Prioridad de los casos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {data.casesByPriority.map((priority) => (
                    <div
                      key={priority.priority}
                      className='flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-foreground/75'
                    >
                      <div className='flex items-center gap-3'>
                        <span
                          className='h-3 w-3 rounded-full'
                          style={{ backgroundColor: getPriorityColor(priority.priority) }}
                        />
                        <p className='text-sm font-medium text-foreground capitalize'>{priority.priority}</p>
                      </div>
                      <p className='text-sm text-foreground/70'>
                        {priority.count} ({priority.percentage}%)
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={GLASS_CARD}>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <DocumentIcon />
                  Últimas notas y documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {data.highlights.documents.slice(0, 4).map((doc) => (
                    <div key={doc.id} className='rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-foreground/75'>
                      <p className='text-sm font-medium text-foreground'>{doc.nombre}</p>
                      <p className='text-xs text-foreground/65'>{doc.created_at ? formatRelativeTime(doc.created_at) : 'Fecha no disponible'}</p>
                      {doc.case_id && (
                        <Link
                          href={`/cases/${doc.case_id}`}
                          className='mt-1 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80'
                        >
                          Ver caso
                          <ArrowIcon />
                        </Link>
                      )}
                    </div>
                  ))}
                  {data.highlights.documents.length === 0 && (
                    <p className='text-sm text-foreground/65'>No se han cargado documentos recientemente.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

/* Icon helpers */
const DocumentIcon = () => <FileText className='h-5 w-5 text-primary' />;
const ArrowIcon = () => <ArrowUpRight className='h-3 w-3 text-primary' />;
