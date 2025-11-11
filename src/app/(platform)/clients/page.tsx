'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { listClients, createClientProfile } from '@/lib/actions/clients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatIdentityDocument } from '@/lib/utils';
import { Loader2, PlusCircle, Users } from 'lucide-react';

interface ClientFormState {
  nombre: string;
  email: string;
  rut: string;
  telefono: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<
    Array<{ id: string; nombre: string; email: string; telefono: string | null; rut: string | null; created_at: string | null }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ClientFormState>({
    nombre: '',
    email: '',
    rut: '',
    telefono: '',
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
    });
  };

  const handleChange = (field: keyof ClientFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
        const createdClient = {
          id: result.client.id,
          nombre: result.client.nombre,
          email: result.client.email,
          telefono: result.client.telefono ?? null,
          rut: result.client.rut ?? null,
          created_at: new Date().toISOString(),
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

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
          <Card className="border-white/12 bg-white/8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Registrar nuevo cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateClient}>
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
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="cliente@correo.bo"
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
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={handleChange('telefono')}
                    placeholder="+591 70000000"
                  />
                </div>
              </div>

              <Button type="submit" className="flex items-center gap-2" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando…
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
              <CardTitle className="text-lg font-semibold text-foreground">
                Clientes registrados ({totalClientes})
              </CardTitle>
              <p className="text-sm text-foreground/70">
                Filtra por nombre, correo o CI/NIT para encontrar un cliente existente.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente…"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
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
              <ul className="space-y-3">
                {clients.map((client) => (
                  <li
                    key={client.id}
                    className="flex flex-col gap-2 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-foreground/80 shadow-[0_18px_55px_-35px_rgba(6,15,40,0.6)]"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <p className="text-base font-medium text-foreground">{client.nombre}</p>
                      {client.created_at && (
                        <span className="text-xs text-foreground/55">
                          Creado el {new Date(client.created_at).toLocaleDateString('es-CL')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground/65">
                      <span>{client.email}</span>
                      {client.telefono && <span>Tel: {client.telefono}</span>}
                      {client.rut && <span>Documento: {formatIdentityDocument(client.rut)}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
