'use client';

import { useMemo, useState, useTransition } from 'react';
import { Building2, CheckCircle2, Loader2, PlusCircle, RefreshCcw, Users, Globe } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { OrganizationSummary } from '@/lib/actions/organizations';
import { createOrganization, switchOrganization } from '@/lib/actions/organizations';

type Props = {
  currentOrgId: string;
  organizations: OrganizationSummary[];
};

type FormState = {
  name: string;
  plan: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  sendInvite: boolean;
};

const PLAN_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

export function OrganizationManager({ currentOrgId, organizations }: Props) {
  const [form, setForm] = useState<FormState>({
    name: '',
    plan: 'standard',
    domain: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    sendInvite: true,
  });
  const [isSubmitting, startSubmit] = useTransition();
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const { toast } = useToast();

  const orderedOrganizations = useMemo(() => {
    return [...organizations].sort((a, b) => {
      const aDate = a.organization.created_at ?? '';
      const bDate = b.organization.created_at ?? '';
      return aDate.localeCompare(bDate);
    });
  }, [organizations]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleInvite = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, sendInvite: event.target.checked }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      plan: 'standard',
      domain: '',
      adminName: '',
      adminEmail: '',
      adminPhone: '',
      sendInvite: true,
    });
  };

  const handleCreateOrganization = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.adminEmail.trim()) {
      toast({
        title: 'Falta el administrador',
        description: 'Debes indicar el correo corporativo del administrador principal.',
        variant: 'destructive',
      });
      return;
    }
    startSubmit(async () => {
      const result = await createOrganization({
        name: form.name,
        plan: form.plan,
        domain: form.domain,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPhone: form.adminPhone,
        adminSendInvite: form.sendInvite,
      });

      if (result.success) {
        const adminMessage = result.initialAdmin
          ? result.initialAdmin.invited
            ? `Invitación enviada a ${result.initialAdmin.email}.`
            : result.initialAdmin.existingUser
              ? `Cuenta vinculada para ${result.initialAdmin.email}.`
              : `Se creó la cuenta de ${result.initialAdmin.email}. Asegúrate de compartirle el enlace de acceso.`
          : 'La nueva empresa quedó disponible en tu cuenta.';
        toast({
          title: 'Organización creada',
          description: adminMessage,
        });
        resetForm();
      } else {
        toast({
          title: 'No se pudo crear la organización',
          description: result.error,
          variant: 'destructive',
        });
      }
    });
  };

  const handleSwitchOrganization = async (orgId: string) => {
    setIsSwitching(orgId);
    try {
      const result = await switchOrganization(orgId);
      if (result.success) {
        toast({
          title: 'Workspace actualizado',
          description: 'Actualizamos tu organización activa.',
        });
      } else {
        toast({
          title: 'No se pudo cambiar de organización',
          description: result.error ?? 'Revisa tus permisos e inténtalo nuevamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[OrganizationManager] switch error', error);
      toast({
        title: 'Error al cambiar de organización',
        description: 'Inténtalo nuevamente en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setIsSwitching(null);
    }
  };

  return (
    <div className='space-y-8'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5 text-altius-primary' />
            Crear nueva empresa
          </CardTitle>
          <CardDescription>
            Registra un nuevo bufete u organización. Te asignaremos la membresía de propietario automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateOrganization} className='grid gap-6 md:grid-cols-2'>
            <div className='md:col-span-2 space-y-2'>
              <Label htmlFor='name'>Nombre comercial *</Label>
              <Input
                id='name'
                name='name'
                value={form.name}
                onChange={handleInputChange}
                placeholder='Ej: Altius Abogados & Asociados'
                required
                disabled={isSubmitting}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='plan'>Plan</Label>
              <select
                id='plan'
                name='plan'
                value={form.plan}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {PLAN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='domain'>Dominio personalizado (opcional)</Label>
              <Input
                id='domain'
                name='domain'
                value={form.domain}
                onChange={handleInputChange}
                placeholder='Ej: legal.miempresa.com'
                disabled={isSubmitting}
              />
            </div>

            <div className='md:col-span-2 space-y-4 border border-white/12 bg-white/6 px-5 py-5 text-sm text-white/80'>
              <div className='flex flex-col gap-1'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60'>Administrador principal</p>
                <p className='text-xs text-white/65'>
                  Invita al responsable de la nueva empresa para que configure el workspace y gestione al resto del equipo.
                </p>
              </div>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='adminName'>Nombre y apellido</Label>
                  <Input
                    id='adminName'
                    name='adminName'
                    value={form.adminName}
                    onChange={handleInputChange}
                    placeholder='Ej: Daniela Méndez'
                    disabled={isSubmitting}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='adminEmail'>Correo corporativo *</Label>
                  <Input
                    id='adminEmail'
                    name='adminEmail'
                    type='email'
                    value={form.adminEmail}
                    onChange={handleInputChange}
                    placeholder='daniela@cliente.com'
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='adminPhone'>Teléfono (opcional)</Label>
                  <Input
                    id='adminPhone'
                    name='adminPhone'
                    value={form.adminPhone}
                    onChange={handleInputChange}
                    placeholder='+56 9 1234 5678'
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <label className='flex items-center gap-3 text-xs font-medium text-white/70'>
                <input
                  type='checkbox'
                  name='sendInvite'
                  checked={form.sendInvite}
                  onChange={handleToggleInvite}
                  className='h-4 w-4 border border-white/30 bg-transparent text-primary focus:outline-none focus:ring-0'
                />
                Enviar invitación por correo automáticamente
              </label>
              <p className='text-[11px] text-white/50'>
                Si omites el correo podremos crear la empresa, pero deberás añadir manualmente al administrador desde su workspace antes de entregarle acceso.
              </p>
            </div>

            <div className='md:col-span-2 flex items-center justify-end gap-3'>
              <Button type='button' variant='outline' onClick={resetForm} disabled={isSubmitting}>
                <RefreshCcw className='mr-2 h-4 w-4' />
                Limpiar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creando…
                  </>
                ) : (
                  <>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Crear empresa
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5 text-altius-primary' />
            Tus organizaciones
          </CardTitle>
          <CardDescription>Selecciona el workspace donde quieres trabajar o revisar información.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {orderedOrganizations.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Aún no tienes empresas registradas. Crea la primera utilizando el formulario anterior.</p>
          ) : (
            <div className='space-y-5'>
              {orderedOrganizations.map((entry) => {
                const isCurrent = entry.organization.id === currentOrgId;
                return (
                  <div
                    key={entry.organization.id}
                    className='rounded-lg border border-border p-4 shadow-sm hover:bg-muted/50 transition'
                  >
                    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <h3 className='text-lg font-semibold text-altius-neutral-900'>
                            {entry.organization.name}
                          </h3>
                          {isCurrent ? (
                            <Badge variant='default' className='flex items-center gap-1'>
                              <CheckCircle2 className='h-3 w-3' />
                              Activa
                            </Badge>
                          ) : entry.membership.status === 'active' ? (
                            <Badge variant='secondary'>Disponible</Badge>
                          ) : (
                            <Badge variant='outline'>Pendiente</Badge>
                          )}
                        </div>
                        <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
                          <span className='uppercase tracking-wide'>Plan {entry.organization.plan}</span>
                          <Separator orientation='vertical' className='h-3' />
                          <span>Rol: {entry.membership.role}</span>
                          {entry.organization.created_at && (
                            <>
                              <Separator orientation='vertical' className='h-3' />
                              <span>Creada el {new Date(entry.organization.created_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        variant={isCurrent ? 'secondary' : 'default'}
                        onClick={() => handleSwitchOrganization(entry.organization.id)}
                        disabled={isCurrent || entry.membership.status !== 'active' || isSwitching === entry.organization.id}
                      >
                        {isSwitching === entry.organization.id ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Cambiando…
                          </>
                        ) : isCurrent ? (
                          'Workspace activo'
                        ) : (
                          'Trabajar aquí'
                        )}
                      </Button>
                    </div>

                    {entry.domains.length > 0 && (
                      <>
                        <Separator className='my-3' />
                        <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
                          <span className='flex items-center gap-2 font-medium'>
                            <Globe className='h-4 w-4' />
                            Dominios vinculados:
                          </span>
                          {entry.domains.map((domain) => (
                            <Badge key={`${entry.organization.id}-${domain.host}`} variant={domain.active ? 'default' : 'secondary'}>
                              {domain.host}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
