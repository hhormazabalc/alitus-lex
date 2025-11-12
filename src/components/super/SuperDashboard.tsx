'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { BillingEvent, SaaSOrganization, SaaSOverview } from '@/lib/actions/saas';
import { createBillingEventAction, enterDemoMode } from '@/lib/actions/saas';
import {
  ArrowRight,
  Building2,
  DollarSign,
  Factory,
  Loader2,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Diamond,
} from 'lucide-react';

type Props = {
  overview: SaaSOverview;
  organizations: SaaSOrganization[];
  billingEvents: BillingEvent[];
};

type BillingFormState = {
  orgId: string;
  amount: string;
  currency: string;
  billingPeriod: string;
  paidAt: string;
  description: string;
};

const initialFormState: BillingFormState = {
  orgId: '',
  amount: '',
  currency: 'USD',
  billingPeriod: '',
  paidAt: '',
  description: '',
};

const INPUT_STYLE =
  'flex h-11 w-full rounded-2xl border border-[#2b3d7c]/55 bg-[#060d25]/85 px-3.5 py-2 text-sm text-[#d4dcff] shadow-inner shadow-black/30 placeholder:text-[#6f7fb8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f7dff] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-70';

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(value);
}

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(value);
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return '—';
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: es });
}

export function SuperDashboard({ overview, organizations, billingEvents }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<BillingFormState>(initialFormState);
  const [isSubmitting, startSubmit] = useTransition();
  const [isDemoLoading, setDemoLoading] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateBillingEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startSubmit(async () => {
      const payload: Parameters<typeof createBillingEventAction>[0] = {
        orgId: form.orgId,
        amount: Number(form.amount),
        currency: form.currency || 'USD',
      };

      if (form.billingPeriod) {
        payload.billingPeriod = form.billingPeriod;
      }

      if (form.paidAt) {
        payload.billedAt = form.paidAt;
      }

      if (form.description) {
        payload.description = form.description;
      }

      const result = await createBillingEventAction(payload);

      if (result.success) {
        toast({
          title: 'Pago registrado',
          description: 'Actualizamos el historial de facturación.',
        });
        setForm(initialFormState);
      } else {
        toast({
          title: 'No se pudo registrar el pago',
          description: result.error ?? 'Inténtalo nuevamente.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDemoMode = async () => {
    setDemoLoading(true);
    try {
      const result = await enterDemoMode();
      if (result.success) {
        toast({
          title: 'Modo demo activado',
          description: 'Redirigiendo al panel operativo…',
        });
        window.location.href = '/dashboard/admin';
      } else {
        toast({
          title: 'No se pudo iniciar el modo demo',
          description: result.error ?? 'Revisa la configuración de DEMO_ORG_ID.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[SuperDashboard] enter demo', error);
      toast({
        title: 'Error inesperado',
        description: 'No pudimos iniciar el demo, inténtalo más tarde.',
        variant: 'destructive',
      });
    } finally {
      setDemoLoading(false);
    }
  };

  const stats = [
    {
      label: 'Empresas activas',
      value: formatNumber(overview.totalOrganizations),
      description: `${overview.newOrganizations} nuevas en los últimos 30 días`,
      icon: Factory,
    },
    {
      label: 'Usuarios totales',
      value: formatNumber(overview.totalMembers),
      description: `${overview.averageUsersPerOrg} usuarios promedio por empresa`,
      icon: Users,
    },
    {
      label: 'MRR estimado',
      value: formatCurrency(overview.monthlyRevenue),
      description: 'Sumatoria de pagos registrados este mes',
      icon: DollarSign,
    },
    {
      label: 'Última actualización',
      value: formatDateTime(overview.lastUpdated),
      description: 'Datos actualizados en tiempo real',
      icon: Diamond,
    },
  ] as const;

  const accentStyles = [
    {
      gradient: 'from-[#2f46ad]/55 via-[#1a2c6b]/65 to-[#081030]/90',
      glow: 'bg-[#5975ff]/40',
      iconRing: 'border-[#3c519f]/65 bg-[#16254f]/80',
      iconColor: 'text-[#b7c7ff]',
    },
    {
      gradient: 'from-[#233c95]/55 via-[#101f56]/70 to-[#050b27]/90',
      glow: 'bg-[#45e0ff]/25',
      iconRing: 'border-[#2f4f87]/60 bg-[#102040]/80',
      iconColor: 'text-[#94e3ff]',
    },
    {
      gradient: 'from-[#503a9f]/60 via-[#281c6b]/70 to-[#0a082d]/90',
      glow: 'bg-[#9e65ff]/28',
      iconRing: 'border-[#4c3fa3]/60 bg-[#20145b]/80',
      iconColor: 'text-[#d6c4ff]',
    },
    {
      gradient: 'from-[#26407f]/55 via-[#121f52]/65 to-[#040b24]/90',
      glow: 'bg-[#36d8ff]/25',
      iconRing: 'border-[#2f4a86]/60 bg-[#14244c]/80',
      iconColor: 'text-[#a7c9ff]',
    },
  ];

  return (
    <div className='space-y-12 text-[#d7deff]'>
      <section className='relative overflow-hidden rounded-[42px] border border-[#283a7b]/45 bg-gradient-to-br from-[#141f48]/88 via-[#0b112c]/92 to-[#050a1e]/95 p-8 shadow-[0_60px_160px_-70px_rgba(11,16,42,0.9)] sm:p-10'>
        <div className='pointer-events-none absolute -left-[18%] -top-40 h-[360px] w-[360px] rounded-full bg-[#5c72ff]/32 blur-[140px] aurora-glow' />
        <div className='pointer-events-none absolute -right-[12%] -bottom-48 h-[420px] w-[420px] rounded-full bg-[#1ad4ff]/24 blur-[180px] aurora-glow' />

        <div className='relative z-10 flex flex-col gap-8'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
            <div className='space-y-5'>
              <div className='flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8fa2ff]/70'>
                <span className='rounded-full border border-[#3d4f97]/55 bg-[#17214a]/80 px-3 py-1 text-[#c2ccff] backdrop-blur'>
                  Lex Altius • SaaS
                </span>
                <span className='rounded-full border border-[#3d4f97]/55 bg-[#17214a]/65 px-3 py-1 text-[#c2ccff] backdrop-blur'>
                  Suite legal
                </span>
              </div>
              <div className='space-y-3'>
                <h1 className='text-4xl font-semibold text-white sm:text-5xl'>Panel SaaS</h1>
                <p className='max-w-2xl text-sm leading-relaxed text-[#a8b6ff]/80 sm:text-base'>
                  Controla clientes, facturación y métricas globales del producto. Activa el modo demo para mostrar la
                  experiencia operativa sin tocar tus datos reales.
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-2 text-[11px] tracking-[0.24em] text-[#8ca0ff]/75'>
                <span className='inline-flex items-center gap-2 rounded-full border border-[#3950a4]/60 bg-[#121c46]/85 px-3 py-1 font-semibold text-[#c7d3ff]'>
                  <span className='h-2 w-2 rounded-full bg-[#5ce8ff] shadow-[0_0_12px_rgba(92,232,255,0.75)]' />
                  Operación en línea
                </span>
                <span className='rounded-full border border-[#31437c]/60 bg-[#0f1635]/75 px-3 py-1 font-semibold text-[#b5c3ff]'>
                  Experiencia diseñada por Altius Ignite
                </span>
                <span className='rounded-full border border-[#31437c]/60 bg-[#0f1635]/75 px-3 py-1 font-semibold text-[#b5c3ff]'>
                  lex.altiusignite.com
                </span>
              </div>
            </div>

            <div className='flex w-full max-w-xs flex-col gap-4 rounded-[28px] border border-[#304085]/55 bg-[#091235]/80 p-5 text-xs text-[#97a9f0]/85 shadow-[0_45px_120px_-60px_rgba(22,36,96,0.9)] lg:items-end'>
              <div className='flex w-full items-center justify-between text-sm text-[#b5caff]'>
                <div className='flex items-center gap-2 uppercase tracking-[0.28em] text-[#80b9ff]/85'>
                  <ShieldCheck className='h-4 w-4 text-[#80b9ff]' />
                  SLA
                </div>
                <span className='font-semibold text-white'>{formatDateTime(overview.lastUpdated)}</span>
              </div>
              <div className='h-px w-full bg-gradient-to-r from-transparent via-[#4155a6]/50 to-transparent' />
              <div className='space-y-1 text-right'>
                <p>www.altiusignite.com</p>
                <p>soporte@altiusignite.com</p>
                <p>+56 2 1234 5678</p>
              </div>
              <div className='flex w-full items-center justify-between text-[11px] text-[#7f90d8]/80'>
                <span className='uppercase tracking-[0.36em]'>Versión 1.0.0</span>
                <span>Mar, 11 Nov</span>
              </div>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const accent = accentStyles[index % accentStyles.length]!;
              return (
                <div
                  key={stat.label}
                  className={`animate-super-up relative overflow-hidden rounded-[28px] border border-[#2a3b7d]/50 bg-gradient-to-br ${accent.gradient} p-6 shadow-[0_45px_120px_-70px_rgba(26,38,96,0.85)]`}
                  style={{ animationDelay: `${index * 0.08 + 0.12}s` }}
                >
                  <div className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full ${accent.glow} blur-[100px]`} />
                  <div className='relative z-10 flex h-full flex-col gap-3'>
                    <div className='flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-[#90a2ff]/80'>
                      {stat.label}
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${accent.iconRing}`}
                      >
                        <Icon className={`h-4 w-4 ${accent.iconColor}`} />
                      </span>
                    </div>
                    <div className='text-3xl font-semibold text-white'>{stat.value}</div>
                    <p className='text-xs leading-relaxed text-[#a9b6ff]/75'>{stat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className='grid gap-7 xl:grid-cols-3'>
        <Card className='relative overflow-hidden rounded-[36px] border border-[#2b3c7f]/55 bg-[#070f2a]/88 shadow-[0_55px_150px_-80px_rgba(10,16,44,0.85)] xl:col-span-2'>
          <div className='pointer-events-none absolute -left-32 top-[-18%] h-64 w-64 rounded-full bg-[#4a64ff]/24 blur-[120px]' />
          <CardHeader className='relative z-10 space-y-3 border-b border-[#1f2c58]/60 pb-6'>
            <CardTitle className='text-2xl font-semibold text-white'>Empresas contratadas</CardTitle>
            <CardDescription className='text-sm text-[#9eacff]/70'>
              Resumen de clientes SaaS, planes y dominios asociados.
            </CardDescription>
          </CardHeader>
          <CardContent className='relative z-10 pt-6'>
            <div className='max-h-[380px] overflow-hidden rounded-[26px] border border-[#1f2c58]/70 bg-[#090f2b]/80'>
              <Table>
                <TableHeader className='bg-[#111839]/80'>
                  <TableRow className='border-b border-[#1f2b56]/70'>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9eb1ff]'>Empresa</TableHead>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9eb1ff]'>Plan</TableHead>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9eb1ff]'>Dominios</TableHead>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9eb1ff]'>Usuarios</TableHead>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9eb1ff]'>Alta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='py-10 text-center text-sm text-[#8392c9]'>
                        Aún no registras clientes activos.
                      </TableCell>
                    </TableRow>
                  )}
                  {organizations.map((org) => (
                    <TableRow
                      key={org.id}
                      className='border-b border-[#1e2852]/70 transition-colors hover:bg-[#111c40]/75'
                    >
                      <TableCell className='font-medium text-[#e2e8ff]'>{org.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className='border-[#4153a8]/60 bg-[#18224d]/70 text-[#c7d4ff] uppercase tracking-[0.24em]'
                        >
                          {org.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-sm text-[#9aa9df]'>
                        {org.domains.length > 0 ? (
                          <div className='space-y-1.5'>
                            {org.domains.map((domain) => (
                              <div key={domain.host} className='text-xs'>
                                {domain.host} {!domain.active && <span className='text-[#ff9aa8]/80'>(inactivo)</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className='text-xs text-[#576196]'>—</span>
                        )}
                      </TableCell>
                      <TableCell className='text-[#c2ceff]'>{org.memberCount}</TableCell>
                      <TableCell className='text-xs text-[#8fa0d9]'>
                        {org.created_at ? formatDateTime(org.created_at) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className='relative overflow-hidden rounded-[36px] border border-[#333f7f]/55 bg-gradient-to-br from-[#101c4b]/85 via-[#0c1332]/92 to-[#070b1f]/95 shadow-[0_55px_150px_-80px_rgba(20,30,68,0.85)]'>
          <div className='pointer-events-none absolute -top-24 right-[-30%] h-64 w-64 rounded-full bg-[#6d84ff]/28 blur-[120px]' />
          <CardHeader className='relative z-10 space-y-3'>
            <CardTitle className='flex items-center gap-3 text-xl font-semibold text-white'>
              <Building2 className='h-5 w-5 text-[#8da7ff]' />
              Registrar pago
            </CardTitle>
            <CardDescription className='text-sm text-[#9fb0ff]/70'>
              Control manual de suscripciones o cobros extraordinarios.
            </CardDescription>
          </CardHeader>
          <CardContent className='relative z-10'>
            <form className='space-y-5' onSubmit={handleCreateBillingEvent}>
              <div className='space-y-2'>
                <Label htmlFor='orgId' className='text-[11px] uppercase tracking-[0.28em] text-[#8596d3]/80'>
                  Empresa
                </Label>
                <select
                  id='orgId'
                  name='orgId'
                  value={form.orgId}
                  onChange={handleInputChange}
                  className={INPUT_STYLE}
                  required
                  disabled={isSubmitting}
                >
                  <option value=''>Selecciona la empresa</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid grid-cols-3 gap-3'>
                <div className='col-span-2 space-y-2'>
                  <Label htmlFor='amount' className='text-[11px] uppercase tracking-[0.28em] text-[#8596d3]/80'>
                    Monto
                  </Label>
                  <Input
                    id='amount'
                    name='amount'
                    type='number'
                    step='0.01'
                    value={form.amount}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className={INPUT_STYLE}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='currency' className='text-[11px] uppercase tracking-[0.28em] text-[#8596d3]/80'>
                    Moneda
                  </Label>
                  <Input
                    id='currency'
                    name='currency'
                    value={form.currency}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-2'>
                  <Label htmlFor='billingPeriod' className='text-[11px] uppercase tracking-[0.28em] text-[#8596d3]/80'>
                    Periodo (aaaa-mm)
                  </Label>
                  <Input
                    id='billingPeriod'
                    name='billingPeriod'
                    placeholder='2025-02'
                    value={form.billingPeriod}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={INPUT_STYLE}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='paidAt' className='text-[11px] uppercase tracking-[0.28em] text-[#8596d3]/80'>
                    Fecha de pago
                  </Label>
                  <Input
                    id='paidAt'
                    name='paidAt'
                    type='datetime-local'
                    value={form.paidAt}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description' className='text-[11px] uppercase tracking-[0.28em] text-[#8596d3]/80'>
                  Notas
                </Label>
                <Textarea
                  id='description'
                  name='description'
                  value={form.description}
                  onChange={handleInputChange}
                  rows={3}
                  disabled={isSubmitting}
                  className={`${INPUT_STYLE} min-h-[110px]`}
                />
              </div>

              <Button
                type='submit'
                className='w-full rounded-2xl bg-gradient-to-r from-[#4f79ff] via-[#5c83ff] to-[#6d8eff] text-white shadow-[0_25px_70px_-38px_rgba(76,110,255,0.9)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_32px_85px_-36px_rgba(90,120,255,0.9)]'
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Receipt className='mr-2 h-4 w-4' />
                    Registrar pago
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-7 xl:grid-cols-3'>
        <Card className='relative overflow-hidden rounded-[36px] border border-[#233576]/55 bg-[#080f28]/90 shadow-[0_55px_150px_-80px_rgba(14,20,52,0.9)] xl:col-span-2'>
          <div className='pointer-events-none absolute -left-24 bottom-[-30%] h-56 w-56 rounded-full bg-[#4a6bff]/20 blur-[110px]' />
          <CardHeader className='relative z-10 border-b border-[#1c284f]/55 pb-6'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle className='text-2xl font-semibold text-white'>Historial de pagos</CardTitle>
                <CardDescription className='text-sm text-[#9caeff]/75'>
                  Últimos movimientos registrados en la plataforma.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='relative z-10 pt-6'>
            <div className='max-h-[340px] overflow-hidden rounded-[26px] border border-[#1e2952]/65 bg-[#0a112f]/85'>
              <Table>
                <TableHeader className='bg-[#111739]/85'>
                  <TableRow className='border-b border-[#1d264c]/65'>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9fb1ff]'>Fecha</TableHead>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9fb1ff]'>Empresa</TableHead>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9fb1ff]'>Monto</TableHead>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9fb1ff]'>Estado</TableHead>
                    <TableHead className='text-[11px] uppercase tracking-[0.2em] text-[#9fb1ff]'>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='py-10 text-center text-sm text-[#8392c9]'>
                        No hay pagos registrados aún.
                      </TableCell>
                    </TableRow>
                  )}
                  {billingEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      className='border-b border-[#1b2549]/60 transition-colors hover:bg-[#111c40]/75'
                    >
                      <TableCell className='text-xs text-[#8fa0d9]'>{formatDateTime(event.paid_at)}</TableCell>
                      <TableCell className='font-medium text-[#dde4ff]'>
                        {event.organization?.name ?? '—'}
                      </TableCell>
                      <TableCell className='text-[#cdd6ff]'>
                        {formatCurrency(Number(event.amount ?? 0), event.currency ?? 'USD')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={`border ${event.status === 'paid' ? 'border-[#3ecf93]/50 bg-[#112f25]/75 text-[#98f0cd]' : 'border-[#6b58ff]/45 bg-[#1a1540]/75 text-[#c8bdff]'} uppercase tracking-[0.28em]`}
                        >
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-xs text-[#9aa9df]'>
                        {event.description ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className='relative overflow-hidden rounded-[36px] border border-[#3b3f92]/55 bg-gradient-to-br from-[#231c5f]/85 via-[#16124b]/88 to-[#080a29]/95 shadow-[0_55px_150px_-80px_rgba(38,27,102,0.85)]'>
          <div className='pointer-events-none absolute -right-28 top-[-25%] h-64 w-64 rounded-full bg-[#9f58ff]/35 blur-[140px]' />
          <CardHeader className='relative z-10 space-y-4'>
            <CardTitle className='flex items-center gap-3 text-xl font-semibold text-white'>
              <span className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#5342ba]/55 bg-[#1e1551]/80 text-[#d6c8ff] shadow-[inset_0_0_35px_rgba(18,10,52,0.6)]'>
                <Sparkles className='h-5 w-5' />
              </span>
              Modo demo
            </CardTitle>
            <CardDescription className='text-sm text-[#c6bfff]/75'>
              Enseña la experiencia operativa con datos ficticios y vuelve al modo SaaS cuando termines.
            </CardDescription>
          </CardHeader>
          <CardContent className='relative z-10 space-y-6'>
            <ul className='space-y-2 text-sm text-[#d0c9ff]/75'>
              <li className='flex items-start gap-2'>
                <ArrowRight className='mt-0.5 h-4 w-4 text-[#9f8aff]' />
                Activa dashboards con información preparada para demos o capacitaciones.
              </li>
              <li className='flex items-start gap-2'>
                <ArrowRight className='mt-0.5 h-4 w-4 text-[#9f8aff]' />
                No toca la facturación ni tus métricas reales.
              </li>
              <li className='flex items-start gap-2'>
                <ArrowRight className='mt-0.5 h-4 w-4 text-[#9f8aff]' />
                El banner superior te permite regresar al panel SaaS cuando quieras.
              </li>
            </ul>

            <Button
              onClick={handleDemoMode}
              disabled={isDemoLoading}
              className='w-full rounded-2xl bg-gradient-to-r from-[#7048ff] via-[#875cff] to-[#b16aff] text-white shadow-[0_32px_95px_-48px_rgba(164,110,255,0.95)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_38px_110px_-50px_rgba(176,126,255,0.9)]'
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Activando…
                </>
              ) : (
                <>
                  Activar modo demo
                  <ArrowRight className='ml-2 h-4 w-4' />
                </>
              )}
            </Button>

            <p className='text-xs text-[#b9b0ff]/65'>
              Define <code className='rounded-md bg-[#312a66]/80 px-1 py-0.5 text-[#f2efff]'>DEMO_ORG_ID</code> en tu
              entorno para habilitar este acceso.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
