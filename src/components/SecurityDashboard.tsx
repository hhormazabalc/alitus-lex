'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  getAuditLogs,
  getSecurityAlerts,
  getUserSessions,
  getLoginAttempts,
  getAuditStats,
  endUserSession,
  cleanupOldLogs,
} from '@/lib/actions/audit';
import { formatRelativeTime, formatDateTime, getInitials, stringToColor } from '@/lib/utils';
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Monitor,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Loader2,
  BarChart3,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { AuditLog, SecurityAlert, UserSession, LoginAttempt } from '@/lib/actions/audit';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

type Period = 'day' | 'week' | 'month';
type TabId = 'overview' | 'audit' | 'sessions' | 'alerts' | 'logins';

type AuditStats = {
  total_events: number;
  by_action: Record<string, number>;
  by_user: Array<{ user_email: string | null; count: number }>;
  timeline: Array<{ date: string; count: number }>;
};

interface SecurityDashboardProps {
  canManage?: boolean;
}

export function SecurityDashboard({ canManage = false }: SecurityDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [auditStats, setAuditStatsState] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [filters] = useState({
    table_name: '',
    action: '',
    severity: '',
    start_date: '',
    end_date: '',
  });
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [auditResult, alertsResult, sessionsResult, loginsResult, statsResult] = await Promise.all([
        getAuditLogs({ ...filters, limit: 50 }),
        getSecurityAlerts(),
        getUserSessions(),
        getLoginAttempts({ limit: 50 }),
        getAuditStats(selectedPeriod),
      ]);

      if (auditResult?.success) setAuditLogs(auditResult.logs ?? []);
      if (alertsResult?.success) setSecurityAlerts(alertsResult.alerts ?? []);
      if (sessionsResult?.success) setUserSessions(sessionsResult.sessions ?? []);
      if (loginsResult?.success) setLoginAttempts(loginsResult.attempts ?? []);
      if (statsResult?.success) setAuditStatsState(statsResult.stats as AuditStats);
    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar datos de seguridad',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      // no dependemos de filters porque no hay UI para cambiarlos aquí;
      // si después agregas inputs, agrégalos al deps array
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadData();
    }
  }, [canManage, selectedPeriod]);

  const handleEndSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres terminar esta sesión?')) return;

    try {
      const result = await endUserSession(sessionId);
      if (result.success) {
        toast({
          title: 'Sesión terminada',
          description: 'La sesión ha sido terminada exitosamente',
        });
        await loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al terminar sesión',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Error inesperado al terminar sesión',
        variant: 'destructive',
      });
    }
  };

  const handleCleanupLogs = async () => {
    if (!confirm('¿Estás seguro de que quieres limpiar los logs antiguos? Esta acción no se puede deshacer.')) return;

    try {
      const result = await cleanupOldLogs();
      if (result.success) {
        toast({
          title: 'Limpieza completada',
          description: 'Los logs antiguos han sido eliminados',
        });
        await loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al limpiar logs',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Error inesperado al limpiar logs',
        variant: 'destructive',
      });
    }
  };

  const getSeverityBadge = (severity: string | null | undefined) => {
    const key = (severity ?? 'info').toLowerCase();
    const variants: Record<string, string> = {
      low: 'border-white/15 bg-white/10 text-foreground/75',
      info: 'border-sky-400/35 bg-sky-500/20 text-sky-50',
      warning: 'border-amber-400/40 bg-amber-500/20 text-amber-50',
      high: 'border-orange-500/40 bg-orange-500/20 text-orange-50',
      critical: 'border-red-500/45 bg-red-600/25 text-red-50',
    };
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    const baseClasses =
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur';
    return (
      <span className={`${baseClasses} ${variants[key] || variants.info}`}>
        {label}
      </span>
    );
  };

  const getDeviceIcon = (deviceType: string | null | undefined) => {
    switch ((deviceType ?? 'desktop').toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4 text-white/70" />;
      case 'tablet':
        return <Tablet className="h-4 w-4 text-white/70" />;
      default:
        return <Laptop className="h-4 w-4 text-white/70" />;
    }
  };

  const getActionIcon = (action: string | null | undefined) => {
    switch ((action ?? '').toUpperCase()) {
      case 'INSERT':
        return <CheckCircle className="h-4 w-4 text-emerald-300" />;
      case 'UPDATE':
        return <Activity className="h-4 w-4 text-sky-300" />;
      case 'DELETE':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'SELECT':
        return <Eye className="h-4 w-4 text-white/60" />;
      default:
        return <Activity className="h-4 w-4 text-white/60" />;
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center text-foreground/65">
            <Shield className="mx-auto mb-4 h-12 w-12 text-white/30" />
            <p>Sin permisos para acceder al panel de seguridad</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Panel de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs: Array<{ id: TabId; label: string; icon: any }> = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'audit', label: 'Auditoría', icon: Activity },
    { id: 'sessions', label: 'Sesiones', icon: Monitor },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'logins', label: 'Accesos', icon: Users },
  ];

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Shield className="h-6 w-6" />
            Panel de Seguridad
          </h1>
          <p className="text-sm text-foreground/70">Monitoreo y auditoría del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-white/20 bg-white/12 text-foreground transition hover:bg-white/16"
            onClick={loadData}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-white/20 bg-white/12 text-foreground transition hover:bg-white/16"
            onClick={handleCleanupLogs}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Logs
          </Button>
        </div>
      </div>

      {/* Alertas críticas */}
      {securityAlerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length > 0 && (
        <Card className="border-red-500/40 bg-red-500/12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-100">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Seguridad Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityAlerts
                .filter((a) => a.severity === 'critical' || a.severity === 'high')
                .slice(0, 3)
                .map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl border border-red-400/35 bg-red-500/15 p-4 text-foreground"
                  >
                    <div>
                      <h4 className="font-medium text-foreground">{alert.description}</h4>
                      <p className="text-sm text-red-100/80">
                        {alert.user_email ? `Usuario: ${alert.user_email} • ` : ''}
                        Eventos: {alert.event_count} • Último: {formatRelativeTime(alert.last_seen)}
                      </p>
                    </div>
                    {getSeverityBadge(alert.severity)}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de navegación */}
      <div className="border-b border-white/10">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'border-primary/60 text-primary'
                    : 'border-transparent text-foreground/60 hover:border-white/20 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de las tabs */}
      <div>
        {activeTab === 'overview' && auditStats && (
          <div className="space-y-6">
            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60">
                        Eventos de Auditoría
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{auditStats.total_events}</p>
                      <p className="mt-2 text-sm text-foreground/65">
                        Últimos {selectedPeriod === 'day' ? '1 día' : selectedPeriod === 'week' ? '7 días' : '30 días'}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12 shadow-[0_22px_60px_-34px_rgba(40,120,255,0.8)]">
                      <Activity className="h-6 w-6 text-sky-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60">
                        Sesiones Activas
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{userSessions.length}</p>
                      <p className="mt-2 text-sm text-foreground/65">Usuarios conectados</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12 shadow-[0_22px_60px_-34px_rgba(40,200,160,0.75)]">
                      <Monitor className="h-6 w-6 text-emerald-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60">
                        Alertas de Seguridad
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{securityAlerts.length}</p>
                      <p className="mt-2 text-sm text-foreground/65">
                        {securityAlerts.filter((a) => a.severity === 'high' || a.severity === 'critical').length}{' '}
                        críticas
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12 shadow-[0_22px_60px_-34px_rgba(255,160,60,0.7)]">
                      <AlertTriangle className="h-6 w-6 text-amber-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60">
                        Intentos de Login
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{loginAttempts.length}</p>
                      <p className="mt-2 text-sm text-foreground/65">
                        {loginAttempts.filter((a) => !a.success).length} fallidos
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12 shadow-[0_22px_60px_-34px_rgba(135,110,255,0.75)]">
                      <Users className="h-6 w-6 text-violet-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Eventos por acción */}
              <Card>
                <CardHeader>
                  <CardTitle>Eventos por Acción</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(auditStats.by_action).map(([action, count]) => ({
                          action,
                          count,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ action, count }) => `${action} (${count})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {Object.entries(auditStats.by_action).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Timeline de actividad */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline de Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={auditStats.timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Usuarios más activos */}
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Más Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditStats.by_user.slice(0, 5).map((user, index) => {
                    const email = user.user_email ?? '';
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-foreground/85"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-sm font-medium text-white shadow-[inset_0_0_25px_rgba(255,255,255,0.18)]"
                            style={{ backgroundColor: stringToColor(email) }}
                          >
                            {getInitials(email || 'Usuario')}
                          </div>
                          <span className="text-sm font-medium text-foreground">{email || 'Usuario'}</span>
                        </div>
                        <Badge variant="outline" className="border-white/20 bg-white/10 text-foreground/80">
                          {user.count} eventos
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'audit' && (
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-sky-400/70">
                    <CardContent className="pt-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getActionIcon(log.action)}
                          <div>
                            <h4 className="font-medium text-foreground">
                              {(log.action ?? '').toUpperCase()} en {log.table_name ?? '—'}
                            </h4>
                            <p className="text-sm text-foreground/70">
                              {log.description || `Registro ${log.record_id ?? '—'}`}
                            </p>
                            {log.user_email && (
                              <p className="text-xs text-foreground/60">Por: {log.user_email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(log.severity)}
                          <Badge
                            variant="outline"
                            className="border-white/20 bg-white/10 text-[11px] uppercase tracking-wide text-foreground/75"
                          >
                            {(log.action ?? '').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-foreground/60">
                        <div className="flex items-center gap-4">
                          <span>{formatRelativeTime(log.created_at)}</span>
                          {log.ip_address && (
                            <span className="flex items-center">
                              <Globe className="mr-1 h-3 w-3" />
                              {log.ip_address}
                            </span>
                          )}
                        </div>
                        <span className="text-foreground/55">{log.category ?? '—'}</span>
                      </div>

                      {Array.isArray(log.changed_fields) && log.changed_fields.length > 0 && (
                        <div className="mt-3 rounded-2xl border border-white/12 bg-white/8 px-4 py-3">
                          <p className="mb-2 text-sm font-medium text-foreground/80">Campos modificados:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {log.changed_fields.map((field, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="border-white/15 bg-white/10 px-2 text-[11px] text-foreground/75"
                              >
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'sessions' && (
          <Card>
            <CardHeader>
              <CardTitle>Sesiones Activas ({userSessions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userSessions.map((session) => (
                  <Card key={session.id} className="border-l-4 border-l-emerald-400/70">
                    <CardContent className="pt-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getDeviceIcon(session.device_type)}
                          <div>
                            <h4 className="font-medium text-foreground">
                              {session.browser ?? 'Navegador desconocido'} en {session.os ?? 'SO desconocido'}
                            </h4>
                            <p className="text-sm text-foreground/70">
                              {(session.device_type ?? 'desktop')} • {(session.ip_address ?? '—')}
                            </p>
                            {session.location_city && session.location_country ? (
                              <p className="text-xs text-foreground/60">
                                {session.location_city}, {session.location_country}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="border border-emerald-400/50 bg-emerald-500/15 text-emerald-100">
                            Activa
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-white/20 bg-white/12 text-foreground/80 hover:bg-white/16"
                            onClick={() => handleEndSession(session.id)}
                          >
                            Terminar
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-foreground/60">
                        <div className="flex items-center gap-4">
                          <span>Iniciada: {formatRelativeTime(session.created_at)}</span>
                          <span>Última actividad: {formatRelativeTime(session.last_activity)}</span>
                        </div>
                        <span className="text-foreground/55">Expira: {formatDateTime(session.expires_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {userSessions.length === 0 && (
                  <div className="py-8 text-center text-foreground/60">
                    <Monitor className="mx-auto mb-4 h-12 w-12 text-white/30" />
                    <p>No hay sesiones activas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'alerts' && (
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Seguridad ({securityAlerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityAlerts.map((alert, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 ${
                      alert.severity === 'critical'
                        ? 'border-l-red-500/70'
                        : alert.severity === 'high'
                        ? 'border-l-orange-400/70'
                        : alert.severity === 'warning'
                        ? 'border-l-amber-400/70'
                        : 'border-l-sky-400/70'
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{alert.description}</h4>
                          <p className="text-sm text-foreground/70">
                            {alert.user_email ? `Usuario: ${alert.user_email}` : ''}
                            {alert.user_email && alert.ip_address ? ' • ' : ''}
                            {alert.ip_address ? `IP: ${alert.ip_address}` : ''}
                          </p>
                        </div>
                        {getSeverityBadge(alert.severity)}
                      </div>

                      <div className="flex items-center justify-between text-sm text-foreground/60">
                        <div className="flex items-center gap-4">
                          <span>Eventos: {alert.event_count}</span>
                          <span>Primer evento: {formatRelativeTime(alert.first_seen)}</span>
                        </div>
                        <span className="text-foreground/55">Último: {formatRelativeTime(alert.last_seen)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {securityAlerts.length === 0 && (
                  <div className="py-8 text-center text-foreground/60">
                    <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-200/60" />
                    <p>No hay alertas de seguridad</p>
                    <p className="mt-2 text-sm text-foreground/55">El sistema está funcionando normalmente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'logins' && (
          <Card>
            <CardHeader>
              <CardTitle>Intentos de Login Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loginAttempts.map((attempt) => (
                  <Card
                    key={attempt.id}
                    className={`border-l-4 ${
                      attempt.success ? 'border-l-emerald-400/70' : 'border-l-red-500/70'
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {attempt.success ? (
                            <CheckCircle className="h-5 w-5 text-emerald-300" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                          <div>
                            <h4 className="font-medium text-foreground">{attempt.email}</h4>
                            <p className="text-sm text-foreground/70">IP: {attempt.ip_address}</p>
                            {!attempt.success && attempt.failure_reason && (
                              <p className="text-sm text-red-200/80">Razón: {attempt.failure_reason}</p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={attempt.success ? 'default' : 'destructive'}
                          className={`${
                            attempt.success
                              ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-50'
                              : 'border border-red-500/45 bg-red-600/25 text-red-50'
                          }`}
                        >
                          {attempt.success ? 'Exitoso' : 'Fallido'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm text-foreground/60">
                        <span>{formatRelativeTime(attempt.created_at)}</span>
                        {attempt.user_agent && (
                          <span className="max-w-md truncate text-foreground/55">{attempt.user_agent}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {loginAttempts.length === 0 && (
                  <div className="py-8 text-center text-foreground/60">
                    <Users className="mx-auto mb-4 h-12 w-12 text-white/30" />
                    <p>No hay intentos de login recientes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
