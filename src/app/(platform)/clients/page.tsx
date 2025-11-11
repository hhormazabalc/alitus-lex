'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { listClients, createClientProfile } from '@/lib/actions/clients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatIdentityDocument } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Users, Building2, CreditCard, User } from 'lucide-react';

interface ClientFormState {
  nombre: string;
  email: string;
  rut: string;
  telefono: string;
  empresa: string;
  cargo: string;
  segmento: string;
  medioPago: string;
  notas: string;
}

type ClientDirectoryEntry = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rut: string | null;
  created_at: string | null;
  empresa?: string | null;
  cargo?: string | null;
  segmento?: string | null;
  medio_pago?: string | null;
  notas?: string | null;
};

const PAYMENT_METHODS = [
  { value: '', label: 'Selecciona medio preferido' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta corporativa' },
  { value: 'efectivo', label: 'Efectivo (oficina)' },
  { value: 'otros', label: 'Otro (especificar en notas)' },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientDirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ClientFormState>({
    nombre: '',
    email: '',
    rut: '',
    telefono: '',
    empresa: '',
    cargo: '',
    segmento: '',
    medioPago: '',
    notas: '',
  });
  const { toast } = useToast();

  const loadClients = useCallback(
    async (term?: string) => {
      setIsLoading(true);
      try {
        const params: { search?: string } = term ? { search: term } : {};
        const result = await listClients(params);
        if (result.success) {
          setClients(result.clients);
        } else {
          toast({
            title: 'No se pudieron cargar los clientes',
            description: result.error,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading clients directory', error);
        toast({
          title: 'Error inesperado',
          description: 'No fue posible obtener la lista de clientes.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadClients(search.trim() ? search : undefined);
    }, 350);
    return () => clearTimeout(handler);
  }, [search, loadClients]);

  const resetForm = () => {
    setForm({
      nombre: '',
      email: '',
      rut: '',
      telefono: '',
      empresa: '',
      cargo: '',
      segmento: '',
      medioPago: '',
      notas: '',
    });
  };

  const handleChange =
    (field: keyof ClientFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = field === 'rut' ? formatIdentityDocument(event.target.value) : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleCreateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        rut: form.rut.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
      };

      const result = await createClientProfile(payload);
      if (result.success) {
        toast({
          title: 'Cliente creado',
          description: `${result.client.nombre} fue añadido al directorio.`,
        });
        const createdClient: ClientDirectoryEntry = {
          id: result.client.id,
          nombre: result.client.nombre,
          email: result.client.email,
          telefono: result.client.telefono ?? null,
          rut: result.client.rut ?? null,
          created_at: new Date().toISOString(),
          empresa: form.empresa.trim() || null,
          cargo: form.cargo.trim() || null,
          segmento: form.segmento.trim() || null,
          medio_pago: form.medioPago || null,
          notas: form.notas.trim() || null,
        };
        setClients((prev) => {
          const next = [...prev, createdClient].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
          return next;
        });
        resetForm();
      } else {
        toast({
          title: 'No se pudo crear el cliente',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating client', error);
      toast({
        title: 'Error inesperado',
        description: 'No fue posible crear el cliente, intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const totalClientes = useMemo(() => clients.length, [clients]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6 lg:px-10">
      <div className="space-y-8">
        <section className="glass-panel border-white/12 bg-white/8 p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-primary shadow-inner shadow-black/20">
              <Users className="h-5 w-5" />
            </span>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55">Directorio</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clientes de la firma</h1>
              <p className="text-sm leading-relaxed text-foreground/70">
                Crea y gestiona clientes antes de asociarles casos o planes legales.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr]">
          <Card className="border-white/12 bg-white/8">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/12 text-primary shadow-[0_18px_45px_-28px_rgba(66,156,255,0.45)]">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Registrar nuevo cliente</CardTitle>
                  <CardDescription className="text-sm text-foreground/70">
                    Completa la ficha ejecutiva con los datos esenciales antes de invitar al cliente al portal.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleCreateClient}>
                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/6 p-4 shadow-[0_18px_45px_-30px_rgba(6,15,40,0.55)]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">Identidad ejecutiva</p>
                    <p className="mt-1 text-xs text-white/65">Nombre legal y documento para referencias en contratos y poderes.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo</Label>
                      <Input
                        id="nombre"
                        value={form.nombre}
                        onChange={handleChange('nombre')}
                        placeholder="Ej: Carla González"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="rut">Documento de identidad (CI/NIT)</Label>
                        <Input
                          id="rut"
                          value={form.rut}
                          onChange={handleChange('rut')}
                          placeholder="1234567 LP"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="empresa">Empresa / grupo</Label>
                        <Input
                          id="empresa"
                          value={form.empresa}
                          onChange={handleChange('empresa')}
                          placeholder="Holding, razón social o familia"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="segmento">Segmento o industria</Label>
                      <Input
                        id="segmento"
                        value={form.segmento}
                        onChange={handleChange('segmento')}
                        placeholder="Ej: Energía, Retail, Startups"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/6 p-4 shadow-[0_18px_45px_-30px_rgba(6,15,40,0.55)]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">Contacto principal</p>
                    <p className="mt-1 text-xs text-white/65">Datos para notificaciones, reuniones y autorizaciones firmadas.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo corporativo</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange('email')}
                        placeholder="cliente@correo.bo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono de contacto</Label>
                      <Input
                        id="telefono"
                        value={form.telefono}
                        onChange={handleChange('telefono')}
                        placeholder="+591 70000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo o rol frente a la firma</Label>
                    <Input
                      id="cargo"
                      value={form.cargo}
                      onChange={handleChange('cargo')}
                      placeholder="Ej: Socia, CFO, Director Legal"
                    />
                  </div>
                </section>

                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/6 p-4 shadow-[0_18px_45px_-30px_rgba(6,15,40,0.55)]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">Preferencias operativas</p>
                    <p className="mt-1 text-xs text-white/65">Indica cómo facturamos y qué consideraciones debemos recordar.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medioPago">Medio de pago preferido</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/45">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <select
                        id="medioPago"
                        value={form.medioPago}
                        onChange={handleChange('medioPago')}
                        className="flex h-12 w-full appearance-none rounded-2xl border-2 border-[#2b5dff] bg-white/5 pl-11 pr-12 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-[#47b6ff] focus:outline-none focus:ring-2 focus:ring-[#47b6ff]/30"
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method.value} value={method.value} className="bg-[#04132f] text-white">
                            {method.label}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/45">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas operativas / facturación</Label>
                    <Textarea
                      id="notas"
                      value={form.notas}
                      onChange={handleChange('notas')}
                      placeholder="Ej: Facturar al holding mensual, requiere reportes trimestrales para directorio…"
                      className="min-h-[120px]"
                    />
                  </div>
                </section>

                <Button type="submit" className="flex w-full items-center justify-center gap-2" size="lg" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando ficha…
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Guardar cliente
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-white/12 bg-white/8">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <User className="h-5 w-5 text-primary" />
                  Fichero de clientes ({totalClientes})
                </CardTitle>
                <CardDescription className="text-sm text-foreground/70">
                  Explora fichas ejecutivas por nombre, correo o CI/NIT. Ideal para asignar casos o generar invitaciones.
                </CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar cliente…"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-foreground/70">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Cargando clientes…
                </div>
              ) : clients.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/6 px-4 py-6 text-center text-sm text-foreground/70">
                  No hay clientes registrados todavía. Crea el primero para comenzar.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {clients.map((client) => {
                    const initials = client.nombre
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((word) => word[0]?.toUpperCase())
                      .join('');
                    return (
                      <div
                        key={client.id}
                        className="relative flex h-full flex-col justify-between rounded-3xl border border-white/12 bg-white/7 p-5 text-sm text-foreground/85 shadow-[0_20px_55px_-35px_rgba(6,15,40,0.6)] transition hover:border-primary/40 hover:bg-white/12"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/18 text-base font-semibold tracking-tight text-primary shadow-inner">
                            {initials || 'CL'}
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-semibold tracking-tight text-foreground">
                              {client.nombre}
                            </p>
                            <p className="text-xs text-foreground/65">
                              {client.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-foreground/70">
                          <div className="flex items-center gap-2">
                            <Badge variant="info" className="border-transparent bg-sky-500/15 text-sky-400">
                              Identificación
                            </Badge>
                            <span>{client.rut ? formatIdentityDocument(client.rut) : '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="border-white/20 bg-white/12 text-foreground/70">
                              Contacto
                            </Badge>
                            <span>{client.telefono || 'Sin teléfono registrado'}</span>
                          </div>
                          {client.empresa && (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="border-white/20 bg-white/12 text-foreground/70">
                                Empresa
                              </Badge>
                              <span>{client.empresa}</span>
                            </div>
                          )}
                          {client.segmento && (
                            <div className="flex items-center gap-2">
                              <Badge variant="warning" className="border-transparent bg-amber-400/15 text-amber-300">
                                Segmento
                              </Badge>
                              <span>{client.segmento}</span>
                            </div>
                          )}
                          {client.medio_pago && (
                            <div className="flex items-center gap-2">
                              <Badge variant="success" className="border-transparent bg-emerald-400/15 text-emerald-300">
                                Medio de pago
                              </Badge>
                              <span className="capitalize">{client.medio_pago}</span>
                            </div>
                          )}
                          {client.created_at && (
                            <p className="pt-2 text-[11px] uppercase tracking-[0.28em] text-white/45">
                              Alta · {new Date(client.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
