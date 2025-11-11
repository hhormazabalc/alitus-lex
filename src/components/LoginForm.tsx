'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast' // tienes este hook en tu árbol
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      })

      const data = await r.json().catch(() => ({} as any))

      if (!r.ok || !data?.ok) {
        const msg = data?.error || `HTTP ${r.status}`
        toast({ title: 'Error de autenticación', description: msg, variant: 'destructive' })
        return
      }

      toast({ title: 'Inicio de sesión exitoso', description: 'Bienvenido a LEX Altius' })
      router.push('/dashboard')
    } catch (err: any) {
      toast({
        title: 'Error interno',
        description: err?.message ?? 'Error inesperado',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="space-y-2">
        <label className="block text-sm font-medium uppercase tracking-[0.22em] text-white/70">
          Correo corporativo
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex w-9 items-center justify-center text-white/45">
            <Mail className="h-4 w-4" />
          </span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-11"
            placeholder="socio@tufirma.com"
            autoComplete="email"
            inputMode="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm font-medium uppercase tracking-[0.22em] text-white/70">
          <span>Contraseña segura</span>
          <span className="text-[0.7rem] font-normal capitalize text-white/50">
            Solo dispositivos confiables
          </span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex w-9 items-center justify-center text-white/45">
            <Lock className="h-4 w-4" />
          </span>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-11 pr-12"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 inline-flex items-center justify-center rounded-full bg-white/5 px-2 text-white/60 transition hover:bg-white/12 hover:text-white"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="flex items-center gap-2 text-xs text-white/60">
          <ShieldCheck className="h-4 w-4 text-[#7cf0ff]" />
          Cifrado extremo a extremo y monitoreo continuo de accesos.
        </p>
      </div>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full shadow-[0_30px_80px_-35px_rgba(26,95,255,0.85)]">
        {isLoading ? 'Verificando acceso...' : 'Entrar al panel ejecutivo'}
      </Button>
    </form>
  )
}
