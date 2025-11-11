'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Pencil,
  Trash2,
  Users,
  UserCheck,
  ShieldCheck,
  Shield,
  Target,
  Search,
  XCircle,
  Plus,
} from 'lucide-react';
import {
  createManagedUser,
  updateManagedUser,
  deleteManagedUser,
  deactivateManagedUser,
  type ManagedUser,
} from '@/lib/actions/admin-users';
import { managedUserRoles } from '@/lib/validators/admin-users';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn, formatRelativeTime, formatDateShort, formatIdentityDocument } from '@/lib/utils';

interface AdminUserManagerProps {
  initialUsers: ManagedUser[];
}

type RoleFilter = 'todos' | (typeof managedUserRoles)[number];

type PendingState = {
  type: 'create' | 'update' | 'delete' | 'deactivate' | null;
  userId?: string;
};


function HighlightStat({ title, value, subtitle, icon }: { title: string; value: number; subtitle: string; icon: ReactNode }) {
  return (
    <div className='rounded-2xl border border-white/15 bg-white/8 p-4 shadow-[0_24px_70px_-32px_rgba(5,15,40,0.6)] backdrop-blur-xl'>
      <div className='flex items-center justify-between'>
        <p className='text-[11px] uppercase tracking-[0.24em] text-white/60'>{title}</p>
        <span className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs text-white/70'>
          {icon}
        </span>
      </div>
      <p className='mt-2 text-2xl font-semibold text-foreground'>{value}</p>
      <p className='text-xs text-foreground/65'>{subtitle}</p>
    </div>
  );
}
export function AdminUserManager({ initialUsers }: AdminUserManagerProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState<RoleFilter>('todos');
  const [search, setSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingState, setPendingState] = useState<PendingState>({ type: null });

  const isPending = pendingState.type !== null && pending;

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = filter === 'todos' || user.role === filter;
      const matchesSearch =
        !term ||
        user.nombre.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.telefono ?? '').toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [users, filter, search]);

  const stats = useMemo(() => {
    const total = users.length;
    const byRole = managedUserRoles.reduce<Record<string, number>>((acc, role) => {
      acc[role] = users.filter((user) => user.role === role).length;
      return acc;
    }, {});

    const inactive = users.filter((user) => !user.activo).length;

    return { total, byRole, inactive };
  }, [users]);

  const resetState = () => {
    setPendingState({ type: null });
  };

  const handleCreate: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setPendingState({ type: 'create' });
    startTransition(async () => {
      const result = await createManagedUser(formData);
      if (result.success && result.users) {
        setUsers(result.users);
        form.reset();
        toast({
          title: 'Usuario creado',
          description: 'La cuenta quedó disponible para iniciar sesión.',
        });
      } else {
        if (result.users) {
          setUsers(result.users);
        }
        toast({
          title: 'No se pudo crear el usuario',
          description: result.error,
          variant: 'destructive',
        });
      }
      resetState();
    });
  };

  const handleEdit = (userId: string) => {
    setEditingUserId((current) => (current === userId ? null : userId));
  };

  const handleUpdate: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!editingUserId) return;

    const formData = new FormData(event.currentTarget);
    setPendingState({ type: 'update', userId: editingUserId });

    startTransition(async () => {
      const result = await updateManagedUser(editingUserId, formData);
      if (result.success && result.users) {
        setUsers(result.users);
        setEditingUserId(null);
        toast({ title: 'Usuario actualizado', description: 'Los cambios fueron guardados.' });
      } else {
        if (result.users) {
          setUsers(result.users);
        }
        toast({
          title: 'No se pudo actualizar',
          description: result.error,
          variant: 'destructive',
        });
      }
      resetState();
    });
  };

  const handleDeactivate = (userId: string) => {
    if (!users.find((user) => user.userId === userId)) return;

    if (!confirm('¿Seguro quieres desactivar a este usuario?')) {
      return;
    }

    setPendingState({ type: 'deactivate', userId });
    startTransition(async () => {
      const result = await deactivateManagedUser(userId);
      if (result.success && result.users) {
        setUsers(result.users);
        toast({ title: 'Cuenta desactivada', description: 'El usuario ya no podrá acceder.' });
      } else {
        if (result.users) {
          setUsers(result.users);
        }
        toast({
          title: 'No se pudo desactivar',
          description: result.error,
          variant: 'destructive',
        });
      }
      resetState();
    });
  };

  const handleDelete = (userId: string) => {
    const target = users.find((user) => user.userId === userId);
    if (!target) return;

    const confirmation = confirm(
      `¿Eliminar definitivamente a ${target.nombre}? Esta acción es irreversible.`,
    );
    if (!confirmation) {
      return;
    }

    setPendingState({ type: 'delete', userId });
    startTransition(async () => {
      const result = await deleteManagedUser(userId);
      if (result.success && result.users) {
        setUsers(result.users);
        toast({ title: 'Usuario eliminado', description: 'La cuenta fue removida del sistema.' });
      } else {
        if (result.users) {
          setUsers(result.users);
        }
        toast({
          title: 'No se pudo eliminar la cuenta',
          description: result.error,
          variant: 'destructive',
        });
      }
      resetState();
    });
  };

  const handleToggleActive = (user: ManagedUser) => {
    const formData = new FormData();
    formData.append('email', user.email);
    formData.append('nombre', user.nombre);
    formData.append('role', user.role);
    if (user.rut) formData.append('rut', user.rut);
    if (user.telefono) formData.append('telefono', user.telefono);
    if (user.activo) {
      formData.append('activo', '');
    } else {
      formData.append('activo', 'on');
    }

    setPendingState({ type: 'update', userId: user.userId });
    startTransition(async () => {
      const result = await updateManagedUser(user.userId, formData);
      if (result.success && result.users) {
        setUsers(result.users);
        toast({
          title: user.activo ? 'Usuario desactivado' : 'Usuario activado',
          description: user.activo
            ? 'Puedes reactivarlo cuando lo necesites.'
            : 'La cuenta vuelve a tener acceso.',
        });
      } else {
        if (result.users) {
          setUsers(result.users);
        }
        toast({
          title: 'No se pudo actualizar el estado',
          description: result.error,
          variant: 'destructive',
        });
      }
      resetState();
    });
  };

  const activeClass = (role: RoleFilter) =>
    cn(
      'inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-medium transition-all backdrop-blur-md',
      filter === role
        ? 'border-primary/35 bg-primary/20 text-primary shadow-[0_20px_45px_-25px_rgba(40,140,255,0.65)]'
        : 'border-white/15 bg-white/8 text-white/70 hover:bg-white/12',
    );

  return (
    <div className='space-y-10'>
      <section className='glass-panel border-white/12 bg-white/8 p-6 sm:p-8'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-3'>
            <div className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70'>
              <Users className='h-4 w-4 text-primary' /> Gestión de usuarios
            </div>
            <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
              Controla los accesos del estudio con visibilidad total
            </h1>
            <p className='max-w-xl text-sm text-foreground/70'>
              Crea, edita y administra roles en segundos; mantén la seguridad y el orden organizacional.
            </p>
          </div>
          <Button
            asChild
            variant='outline'
            size='sm'
            className='rounded-full border-white/20 bg-white/12 px-5 text-white/80 shadow-[0_22px_50px_-25px_rgba(40,120,255,0.55)] hover:bg-white/16'
          >
            <Link href='/dashboard/admin'>Volver al dashboard</Link>
          </Button>
        </div>

        <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>
          <HighlightStat
            title='Usuarios activos'
            value={stats.total - stats.inactive}
            subtitle={`${stats.inactive} desactivados`}
            icon={<UserCheck className='h-4 w-4 text-emerald-400' />}
          />
          <HighlightStat
            title='Administradores'
            value={stats.byRole['admin_firma'] ?? 0}
            subtitle='Rol admin_firma'
            icon={<ShieldCheck className='h-4 w-4 text-sky-400' />}
          />
          <HighlightStat
            title='Abogados'
            value={stats.byRole['abogado'] ?? 0}
            subtitle='Equipo litigios'
            icon={<Shield className='h-4 w-4 text-indigo-400' />}
          />
          <HighlightStat
            title='Analistas'
            value={stats.byRole['analista'] ?? 0}
            subtitle='Soporte interno'
            icon={<Target className='h-4 w-4 text-purple-400' />}
          />
          <HighlightStat
            title='Clientes activos'
            value={stats.byRole['cliente'] ?? 0}
            subtitle='Portal cliente'
            icon={<Users className='h-4 w-4 text-blue-400' />}
          />
        </div>
      </section>

      <section className='glass-panel border-white/12 bg-white/8'>
        <header className='flex flex-col gap-2 border-b border-white/12 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8'>
          <div>
            <h2 className='text-lg font-semibold text-foreground'>Crear nuevo usuario</h2>
            <p className='text-sm text-foreground/70'>Completa la información para habilitar acceso inmediato.</p>
          </div>
          <div className='rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70'>
            Tiempo estimado: 2 minutos
          </div>
        </header>
        <form onSubmit={handleCreate} className='grid gap-4 px-6 py-6 sm:px-8 md:grid-cols-2 xl:grid-cols-3'>
          <div className='space-y-2'>
            <Label htmlFor='create-nombre'>Nombre completo</Label>
            <Input id='create-nombre' name='nombre' placeholder='Nombre y apellidos' required disabled={isPending} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='create-email'>Email</Label>
            <Input id='create-email' name='email' type='email' placeholder='usuario@empresa.com' required disabled={isPending} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='create-password'>Contraseña temporal</Label>
            <Input id='create-password' name='password' type='password' placeholder='Mínimo 8 caracteres' required disabled={isPending} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='create-role'>Rol</Label>
            <select
              id='create-role'
              name='role'
              className='h-11 w-full rounded-2xl border border-white/15 bg-white/8 px-4 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30'
              defaultValue='abogado'
              disabled={isPending}
            >
              {managedUserRoles.map((role) => (
                <option key={role} value={role} className='capitalize'>
                  {role.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='create-rut'>Documento de identidad (CI/NIT) opcional</Label>
            <Input id='create-rut' name='rut' placeholder='1234567 LP' disabled={isPending} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='create-telefono'>Teléfono (opcional)</Label>
            <Input id='create-telefono' name='telefono' placeholder='+591 70000000' disabled={isPending} />
          </div>
          <div className='col-span-full flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm text-foreground/75'>
            <input
              id='create-activo'
              name='activo'
              type='checkbox'
              defaultChecked
              disabled={isPending}
              className='h-4 w-4 rounded border-white/30 bg-white text-primary focus:ring-primary/40'
            />
            <Label htmlFor='create-activo'>Habilitar acceso inmediato</Label>
          </div>
          <div className='col-span-full flex justify-end'>
            <Button type='submit' disabled={isPending} className='rounded-full px-6 shadow-[0_24px_60px_-28px_rgba(40,120,255,0.6)]'>
              {pendingState.type === 'create' && pending ? 'Creando…' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </section>

      <section className='space-y-6 rounded-3xl border border-white/12 bg-white/8 px-6 py-6 shadow-[0_35px_120px_-38px_rgba(6,15,40,0.65)] backdrop-blur-2xl sm:px-8'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-wrap gap-2'>
            <button type='button' onClick={() => setFilter('todos')} className={activeClass('todos')}>
              Todos ({users.length})
            </button>
            {managedUserRoles.map((role) => (
              <button
                key={role}
                type='button'
                onClick={() => setFilter(role)}
                className={activeClass(role)}
              >
                {role.replace('_', ' ')} ({stats.byRole[role] ?? 0})
              </button>
            ))}
            <button
              type='button'
              onClick={() => {
                setFilter('todos');
                setSearch('');
              }}
              className='rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-white/70 transition hover:bg-white/12'
            >
              Limpiar filtros
            </button>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-white/70'>
              <Search className='h-4 w-4 text-white/60' />
              <input
                placeholder='Buscar por nombre, email o teléfono'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className='bg-transparent text-foreground outline-none placeholder:text-white/55'
              />
            </div>
          </div>
        </div>

        <Card className='border-white/12 bg-white/8 shadow-[0_35px_120px_-38px_rgba(6,15,40,0.65)]'>
          <CardHeader>
            <CardTitle className='text-base text-foreground'>Usuarios registrados</CardTitle>
            <p className='text-sm text-foreground/70'>Gestiona la información de cada cuenta y controla su estado.</p>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-white/15 bg-white/6 p-6 text-center text-sm text-foreground/70'>
                No se encontraron usuarios con los filtros seleccionados.
              </div>
            ) : (
              <div className='space-y-4'>
                {filteredUsers.map((user) => (
                  <div
                    key={user.userId}
                    className='rounded-2xl border border-white/12 bg-white/8 p-5 shadow-[0_28px_80px_-38px_rgba(6,15,40,0.6)]'
                  >
                    <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                      <div className='space-y-2 text-sm text-foreground/75'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-base font-semibold text-foreground'>{user.nombre}</span>
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                              user.activo
                                ? 'border-emerald-300/45 bg-emerald-500/15 text-emerald-100'
                                : 'border-red-400/45 bg-red-500/14 text-red-100',
                            )}
                          >
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className='rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-xs uppercase tracking-wide text-foreground/70'>
                            {user.role.replace('_', ' ')}
                          </span>
                        </div>
                        <div className='grid gap-1 text-xs text-foreground/70 md:grid-cols-2'>
                          <span>
                            <span className='font-semibold text-foreground/85'>Email:</span> {user.email}
                          </span>
                          {user.telefono && (
                            <span>
                              <span className='font-semibold text-foreground/85'>Teléfono:</span> {user.telefono}
                            </span>
                          )}
                          {user.rut && (
                            <span>
                              <span className='font-semibold text-foreground/85'>Documento:</span> {formatIdentityDocument(user.rut)}
                            </span>
                          )}
                          <span>
                            <span className='font-semibold text-foreground/85'>Último acceso:</span>{' '}
                            {user.lastSignInAt ? formatRelativeTime(user.lastSignInAt) : 'Sin registros'}
                          </span>
                          {user.createdAt && (
                            <span>
                              <span className='font-semibold text-foreground/85'>Creado:</span> {formatDateShort(user.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleToggleActive(user)}
                          disabled={isPending}
                          className='flex items-center gap-2 rounded-full border-white/20 bg-white/10 text-white/85 hover:bg-white/14'
                        >
                          {user.activo ? <XCircle className='h-4 w-4' /> : <Plus className='h-4 w-4' />}
                          {user.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEdit(user.userId)}
                          disabled={isPending}
                          className='flex items-center gap-2 rounded-full border-white/20 bg-white/10 text-white/85 hover:bg-white/14'
                        >
                          <Pencil className='h-4 w-4' /> Editar
                        </Button>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => handleDelete(user.userId)}
                          disabled={isPending}
                          className='flex items-center gap-2 rounded-full'
                        >
                          <Trash2 className='h-4 w-4' /> Eliminar
                        </Button>
                      </div>
                    </div>

                    {editingUserId === user.userId && (
                      <div className='mt-4 rounded-2xl border border-white/12 bg-white/6 p-4'>
                        <form onSubmit={handleUpdate} className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
                          <div className='space-y-1'>
                            <Label htmlFor={`edit-nombre-${user.userId}`}>Nombre</Label>
                            <Input
                              id={`edit-nombre-${user.userId}`}
                              name='nombre'
                              defaultValue={user.nombre}
                              required
                              disabled={isPending}
                            />
                          </div>
                          <div className='space-y-1'>
                            <Label htmlFor={`edit-email-${user.userId}`}>Email</Label>
                            <Input
                              id={`edit-email-${user.userId}`}
                              name='email'
                              type='email'
                              defaultValue={user.email}
                              required
                              disabled={isPending}
                            />
                          </div>
                          <div className='space-y-1'>
                            <Label htmlFor={`edit-password-${user.userId}`}>Nueva contraseña (opcional)</Label>
                            <Input
                              id={`edit-password-${user.userId}`}
                              name='password'
                              type='password'
                              placeholder='Deja vacío para mantener la actual'
                              disabled={isPending}
                            />
                          </div>
                          <div className='space-y-1'>
                            <Label htmlFor={`edit-role-${user.userId}`}>Rol</Label>
                            <select
                              id={`edit-role-${user.userId}`}
                              name='role'
                              defaultValue={user.role}
                              className='h-11 w-full rounded-2xl border border-white/15 bg-white/8 px-4 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30'
                              disabled={isPending}
                            >
                              {managedUserRoles.map((role) => (
                                <option key={role} value={role}>
                                  {role.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className='space-y-1'>
                            <Label htmlFor={`edit-rut-${user.userId}`}>Documento de identidad (CI/NIT)</Label>
                            <Input
                              id={`edit-rut-${user.userId}`}
                              name='rut'
                              defaultValue={user.rut ?? ''}
                              placeholder='1234567 LP'
                              disabled={isPending}
                            />
                          </div>
                          <div className='space-y-1'>
                            <Label htmlFor={`edit-telefono-${user.userId}`}>Teléfono</Label>
                            <Input
                              id={`edit-telefono-${user.userId}`}
                              name='telefono'
                              defaultValue={user.telefono ?? ''}
                              placeholder='+591 70000000'
                              disabled={isPending}
                            />
                          </div>
                          <div className='flex items-center gap-2 pt-2'>
                            <input
                              id={`edit-activo-${user.userId}`}
                              name='activo'
                              type='checkbox'
                              defaultChecked={user.activo}
                              disabled={isPending}
                              className='h-4 w-4 rounded border-white/25 bg-white text-primary focus:ring-primary/35'
                            />
                            <Label htmlFor={`edit-activo-${user.userId}`} className='text-xs text-foreground/65'>
                              Cuenta habilitada
                            </Label>
                          </div>
                          <div className='md:col-span-2 lg:col-span-3 flex items-center gap-2 pt-2'>
                            <Button type='submit' disabled={isPending} className='rounded-full px-5'>
                              {pendingState.type === 'update' && pendingState.userId === user.userId && pending
                                ? 'Guardando cambios...'
                                : 'Guardar cambios'}
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              disabled={isPending}
                              onClick={() => setEditingUserId(null)}
                              className='rounded-full text-white/75 hover:bg-white/10'
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator className='bg-white/12' />
      <p className='text-xs text-foreground/65'>
        Consejo: comparte la contraseña temporal de forma segura y solicita al usuario cambiarla en su primer
        acceso.
      </p>
    </div>
  );
}
