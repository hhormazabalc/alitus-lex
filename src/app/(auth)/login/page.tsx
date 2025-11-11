import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from '@/components/LoginForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Iniciar Sesión - LEX Altius',
  description: 'Accede a tu cuenta de LEX Altius',
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(145%_95%_at_18%_-5%,rgba(90,160,255,0.55),rgba(3,14,36,0)_60%),radial-gradient(115%_80%_at_86%_12%,rgba(42,206,255,0.34),rgba(3,14,36,0)_58%),linear-gradient(150deg,#030f27_0%,#051a3d_48%,#06316a_100%)]" />
        <div className="absolute inset-0 opacity-28 mix-blend-screen bg-[radial-gradient(circle_at_45%_-10%,rgba(255,255,255,0.4),transparent_60%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.2),transparent_55%)]" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="hidden rounded-3xl bg-white/6 p-10 shadow-[0_40px_90px_-50px_rgba(5,10,38,0.9)] backdrop-blur-2xl lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-white/80">
              Arquitectura Altius Ignite
            </div>
            <h1 className="text-3xl font-semibold leading-snug text-white">
              Dirección legal con ritmo SaaS y precisión corporativa.
            </h1>
            <p className="text-sm text-white/75">
              LEX Altius combina litigación, relación con clientes y seguimiento financiero en una capa ejecutiva diseñada específicamente para firmas corporativas bolivianas.
            </p>
          </div>
          <div className="space-y-5 text-sm text-white/75">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white">
                01
              </div>
              <div>
                <p className="font-semibold text-white">Operación sin fricción</p>
                <p className="text-xs leading-relaxed text-white/70">
                  Workflows inteligentes, plantillas procesales y dashboards accionables para socios y gerencias legales.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white">
                02
              </div>
              <div>
                <p className="font-semibold text-white">Clientes informados 24/7</p>
                <p className="text-xs leading-relaxed text-white/70">
                  Portales ejecutivos con timelines, entregables y honorarios en tiempo real para directorios y CFOs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white">
                03
              </div>
              <div>
                <p className="font-semibold text-white">Confianza regulatoria</p>
                <p className="text-xs leading-relaxed text-white/70">
                  Controles MFA, registros auditables y políticas de compliance revestidas por consultores de Altius Ignite.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-to-b from-white/10 via-white/5 to-transparent p-8 text-white shadow-[0_35px_90px_-45px_rgba(6,11,34,0.95)] backdrop-blur-[36px]">
          <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center">
              <Link href="https://www.altiusignite.com" target="_blank" rel="noopener noreferrer" aria-label="Ir a Altius Ignite">
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0e1c3f] via-[#142c63] to-[#2f9eff] px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_45px_rgba(8,20,51,0.55)]">
                  <span className="tracking-[0.4em]">LEX</span>
                  <span className="text-sm tracking-normal">Altius</span>
                  <CheckCircle2 className="h-4 w-4 text-[#74f3ff]" />
                </span>
              </Link>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-white">Acceso ejecutivo</CardTitle>
              <CardDescription className="text-sm text-white/75">
                Ingresa con tus credenciales corporativas y continúa donde tu equipo legal quedó.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense fallback={<p className="text-center text-sm text-white/70">Cargando formulario...</p>}>
              <LoginForm />
            </Suspense>
            <p className="text-center text-xs text-white/70">
              ¿Necesitas habilitar un nuevo usuario?{' '}
              <a href="mailto:soporte@altiusignite.com" className="font-medium text-white hover:text-primary">
                Contacta al equipo de soporte
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
