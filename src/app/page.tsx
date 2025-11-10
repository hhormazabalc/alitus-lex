import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Layers,
  LineChart,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';

const solutionHighlights = [
  {
    icon: Workflow,
    title: 'Operación unificada',
    description:
      'Expedientes con NUREJ, actuaciones y métricas financieras se sincronizan en un tablero vivo diseñado para firmas bolivianas.',
  },
  {
    icon: Layers,
    title: 'Documentación orquestada',
    description:
      'Memoriales, proveídos, oficios y anexos clasificados por visibilidad. Firma electrónica, control de versiones y enlaces seguros.',
  },
  {
    icon: LineChart,
    title: 'Finanzas en Bolivianos',
    description:
      'Modelos de honorarios en prepago, mixto o variable. Distribuye cobros por etapa, registra abonos y concilia contra UFV o USD.',
  },
  {
    icon: BadgeCheck,
    title: 'Cumplimiento reforzado',
    description:
      'Auditoría en tiempo real, bitácora de seguridad y permisos granulares alineados a la normativa de confidencialidad en Bolivia.',
  },
] as const;

const runway = [
  {
    title: 'Onboarding guiado',
    summary:
      'Habilita la firma en menos de 48 horas: estructura de áreas, roles y catálogos legales personalizados.',
    detail: 'Incluye checklist operativo, plantillas de timelines y capacitación remota con el equipo de Altius Ignite.',
  },
  {
    title: 'Ejecución diaria',
    summary:
      'Coordina abogados, analistas y clientes sobre el mismo expediente: timeline procesal, SLA internos y tareas accionables.',
    detail: 'Automatiza recordatorios de audiencias, vencimientos de plazos y solicitudes de evidencia.',
  },
  {
    title: 'Escalado estratégico',
    summary:
      'Visualiza indicadores de rentabilidad y desempeño por área, materia o responsable para tomar decisiones informadas.',
    detail: 'Dashboards listos para consejo directivo, exportaciones controladas y modo cliente corporativo.',
  },
] as const;

const actionTiles = [
  {
    label: 'Registrar cliente corporativo',
    body: 'Directorio con CI/NIT, poderes, matrices y contactos clave.',
    hrefAuth: '/dashboard/clients/new',
  },
  {
    label: 'Crear expediente con NUREJ',
    body: 'Configura materia, juzgado público, fechas y responsables.',
    hrefAuth: '/dashboard/cases/new',
  },
  {
    label: 'Diseñar timeline y cobros',
    body: 'Etapas preconfiguradas con hitos de honorarios en Bolivianos.',
    hrefAuth: '/dashboard/cases',
  },
] as const;

export default async function Home() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getSession();
  const isAuthenticated = Boolean(data.session);

  const primaryCtaHref = isAuthenticated ? '/dashboard' : '/login';
  const actionTilesWithHref = actionTiles.map(tile => ({
    ...tile,
    href: isAuthenticated ? tile.hrefAuth : '/login',
  }));

  return (
    <main className="relative min-h-screen overflow-hidden pb-24 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(150%_95%_at_18%_-8%,rgba(86,156,255,0.52),rgba(3,14,36,0)_60%),radial-gradient(120%_80%_at_82%_12%,rgba(42,206,255,0.32),rgba(3,14,36,0)_58%),linear-gradient(150deg,#030f27_0%,#041c3e_45%,#06326a_100%)]" />
        <div className="absolute inset-0 opacity-25 mix-blend-screen bg-[radial-gradient(circle_at_45%_-10%,rgba(255,255,255,0.4),transparent_60%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.18),transparent_55%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pt-16 sm:px-8 lg:px-10">
        <section className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div className="space-y-10">
            <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.38em] text-cyan-100 shadow-lg shadow-altius-navy-900/40 backdrop-blur">
              <Sparkles className="h-4 w-4 text-altius-cyan-300" />
              Plataforma corporativa legal · Bolivia
            </span>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                La suite jurídica que combina rigor procesal boliviano con experiencia premium para clientes corporativos.
              </h1>
              <p className="max-w-2xl text-lg text-altius-neutral-200/90">
                Centraliza expedientes, actuaciones y cobranza en Bolivianos. LEX Altius entrega visibilidad ejecutiva, colaboración segura y cumplimiento auditado de extremo a extremo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-gradient-to-r from-[#1a5bff] via-[#2787ff] to-[#30c2ff] px-8 text-base font-semibold text-white shadow-[0_25px_70px_-30px_rgba(18,82,178,0.8)] transition hover:brightness-110"
              >
                <Link href={primaryCtaHref}>
                  {isAuthenticated ? 'Entrar al panel' : 'Solicitar acceso'}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border border-white/20 bg-white/5 px-8 text-base text-altius-neutral-200 hover:border-altius-cyan-400/60 hover:text-white"
              >
                <Link href="#suite">
                  Explorar la suite
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 text-sm text-altius-neutral-200/80">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-altius-cyan-300" />
                Seguridad multicapa: RLS en Supabase, auditoría en tiempo real y controles de sesión corporativos.
              </p>
              <p className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-altius-aurora-300" />
                Diseñada por Altius Ignite con foco en firmas de litigios, corporativo y energía.
              </p>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_35px_80px_-40px_rgba(7,15,44,0.85)] backdrop-blur">
            <div className="absolute -right-10 top-6 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <CardHeader className="space-y-2 pb-2">
              <CardTitle className="text-lg font-semibold text-white">Activar tu operación en minutos</CardTitle>
              <p className="text-sm text-altius-neutral-200/75">
                Tres acciones para liberar valor desde el primer expediente con LEX Altius.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {actionTilesWithHref.map((tile) => (
                <Link
                  key={tile.label}
                  href={tile.href}
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/3 px-5 py-4 text-sm text-altius-neutral-100 transition hover:border-altius-cyan-300/60 hover:bg-white/10"
                >
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-altius-cyan-400/20 via-transparent to-transparent text-altius-cyan-200">
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium text-white">{tile.label}</p>
                    <p className="text-xs text-altius-neutral-200/70">{tile.body}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="suite" className="space-y-10">
          <header className="max-w-3xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-altius-cyan-200/80">
              Capacidades clave
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-[2.2rem]">
              Una plataforma diseñada para firmas que lideran litigios complejos, energía, infraestructura y gestión de riesgo.
            </h2>
            <p className="text-base text-altius-neutral-200/85">
              Cada módulo está alineado a las exigencias de compliance y performance de firmas corporativas bolivianas. Controla el expediente, el equipo y la relación con clientes estratégicos desde un mismo flujo.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            {solutionHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="group h-full rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_60px_-40px_rgba(3,13,37,0.8)] backdrop-blur transition hover:border-altius-cyan-400/60 hover:bg-white/10"
                >
                  <CardContent className="space-y-4 px-6 py-7">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-altius-cyan-400/25 via-transparent to-transparent text-altius-cyan-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-altius-neutral-200/80">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-10">
          <header className="max-w-3xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-altius-aurora-500/10 px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-altius-aurora-200/90">
              Hoja de ruta operativa
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-[2.1rem]">
              Del intake al cierre: flujos que combinan eficiencia, cumplimiento y reputación frente al cliente.
            </h2>
          </header>

          <div className="grid gap-6 lg:grid-cols-3">
            {runway.map((stage, index) => (
              <Card
                key={stage.title}
                className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/6 backdrop-blur transition hover:border-altius-aurora-400/60 hover:bg-white/12"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-altius-aurora-400/20 blur-3xl" />
                <CardContent className="space-y-4 px-6 py-7">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.32em] text-altius-neutral-200/60">
                      Paso {index + 1}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-altius-aurora-200/80">
                      {stage.title}
                    </span>
                  </div>
                  <p className="text-base font-medium text-white">{stage.summary}</p>
                  <p className="text-sm text-altius-neutral-200/80 leading-relaxed">{stage.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
