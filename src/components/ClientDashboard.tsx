'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Scale,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency, formatDate, getInitials, stringToColor } from '@/lib/utils';
import { NotesPanel } from '@/components/NotesPanel';
import { DocumentsPanel } from '@/components/DocumentsPanel';
import { TimelinePanel } from '@/components/TimelinePanel';
import { InfoRequestsPanel } from '@/components/InfoRequestsPanel';
import { CaseMessagesPanel } from '@/components/CaseMessagesPanel';
import type { Profile, Case } from '@/lib/supabase/types';
import type { CaseMessageDTO } from '@/lib/actions/messages';
import LogoutButton from '@/components/LogoutButton';

interface ClientDashboardProps {
  profile: Profile & { email?: string | null };
  cases: Case[];
}

type TabId = 'overview' | 'timeline' | 'documents' | 'notes' | 'messages' | 'requests';

const PRIMARY_PANEL = 'glass-panel panel-muted';
const SECONDARY_PANEL = 'glass-panel panel-minimal panel-no-accent panel-compact';
const INLINE_PANEL = 'glass-panel panel-minimal panel-no-accent';
const META_TAG =
  'inline-flex items-center border-l-[3px] border-white/30 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70';

const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string | undefined }> }> = [
  { id: 'overview', label: 'Resumen', icon: Scale },
  { id: 'timeline', label: 'Progreso', icon: Clock },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'notes', label: 'Notas', icon: MessageCircle },
  { id: 'messages', label: 'Mensajes', icon: MessageCircle },
  { id: 'requests', label: 'Solicitudes', icon: MessageCircle },
];

export function ClientDashboard({ profile, cases }: ClientDashboardProps) {
  const sortedCases = useMemo(
    () =>
      [...cases].sort((a, b) => {
        const dateA = a.updated_at ?? a.created_at ?? '';
        const dateB = b.updated_at ?? b.created_at ?? '';
        return dateB.localeCompare(dateA);
      }),
    [cases],
  );

  const [selectedCase, setSelectedCase] = useState<Case | null>(sortedCases[0] ?? null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [, startTransition] = useTransition();

  const lawyerData =
    selectedCase &&
    typeof (selectedCase as any).abogado_responsable === 'object' &&
    (selectedCase as any).abogado_responsable !== null
      ? ((selectedCase as any).abogado_responsable as {
          nombre?: string | null;
          telefono?: string | null;
          email?: string | null;
        })
      : null;

  const handleTabChange = (tab: TabId) => {
    startTransition(() => setActiveTab(tab));
  };

  return (
    <div className='relative min-h-screen overflow-hidden text-white/90'>
      <section className='relative z-10 mx-auto w-full max-w-[1360px] px-4 pb-16 pt-12 sm:px-6 lg:px-10'>
        <header
          className={cn(
            PRIMARY_PANEL,
            'grid gap-8 px-8 py-9 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1fr)_320px]',
          )}
        >
          <div className='space-y-8'>
            <div className='flex flex-wrap items-center gap-3'>
              <span className={cn(META_TAG, 'border-l-[3px] border-primary/60 text-white/80')}>Lex Altius</span>
              <span className={META_TAG}>Suite Legal</span>
              <span className={cn(META_TAG, 'border-emerald-300/75 bg-emerald-300/12 text-emerald-200')}>
                Operación en línea
              </span>
              <span className={cn(META_TAG, 'ml-auto hidden border-white/25 text-white/60 lg:inline-flex')}>
                www.altiusignite.com
              </span>
              <span className={cn(META_TAG, 'hidden border-white/25 text-white/60 lg:inline-flex')}>
                soporte@altiusignite.com
              </span>
            </div>

            <div className='grid gap-6 md:grid-cols-[auto,minmax(0,1fr)] md:items-start'>
              <span className='flex h-16 w-16 items-center justify-center rounded-sm border border-cyan-300/45 bg-cyan-300/10 text-white shadow-[0_28px_88px_-44px_rgba(72,140,255,0.65)]'>
                <Scale className='h-8 w-8 text-cyan-100' />
              </span>
              <div className='space-y-4'>
                <div className='flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/60'>
                  <span className={META_TAG}>Portal Cliente</span>
                  <span className={cn(META_TAG, 'border-white/32')}>Experiencia Altius</span>
                </div>
                <div className='space-y-2'>
                  <h1 className='text-[32px] font-semibold leading-tight text-white sm:text-[34px]'>
                    Hola, {profile.nombre}
                  </h1>
                  <p className='max-w-2xl text-sm leading-relaxed text-white/70'>
                    Consulta tus casos activos, revisa los documentos compartidos y sigue cada hito del expediente sin perder el detalle ejecutivo.
                  </p>
                </div>
                <Link
                  href='https://www.altiusignite.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 transition hover:text-white'
                >
                  Desarrollado por Altius Ignite
                  <ArrowRight className='h-3.5 w-3.5' />
                </Link>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-5'>
            <div className={cn(INLINE_PANEL, 'space-y-4 px-6 py-6')}>
              <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60'>Contacto principal</p>
              <p className='text-lg font-semibold text-white'>{profile.nombre}</p>
              <p className='text-sm text-white/70'>{profile.email ?? 'Sin correo registrado'}</p>
            </div>
            <div className='flex items-center gap-4 border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/70'>
              <div
                className='flex h-12 w-12 items-center justify-center rounded-sm text-sm font-semibold text-white shadow-[0_18px_52px_-34px_rgba(42,96,210,0.68)]'
                style={{ backgroundColor: stringToColor(profile.nombre) }}
              >
                {getInitials(profile.nombre)}
              </div>
              <div className='flex flex-1 flex-col'>
                <span className='text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55'>Sesión activa</span>
                <span className='text-xs text-white/65'>Identificador {profile.email ?? profile.id}</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className='mt-10 grid gap-8 lg:grid-cols-[340px_1fr] xl:gap-10'>
          <aside className={cn(PRIMARY_PANEL, 'flex h-full flex-col gap-6 px-7 py-7')}>
            <div className='flex items-start justify-between gap-4'>
              <div className='space-y-1'>
                <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55'>Cartera</p>
                <h2 className='text-lg font-semibold text-white'>Mis casos</h2>
                <p className='text-xs text-white/60'>Selecciona un expediente para revisar su progreso.</p>
              </div>
              <Badge className='border-white/25 bg-white/10 text-white/75'>{sortedCases.length}</Badge>
            </div>

            <div className='space-y-3 overflow-y-auto pr-1'>
              {sortedCases.map((caseItem) => {
                const isActive = selectedCase?.id === caseItem.id;
                return (
                  <button
                    key={caseItem.id}
                    type='button'
                    onClick={() => setSelectedCase(caseItem)}
                    className={cn(
                      'glass-panel panel-minimal panel-compact w-full px-5 py-4 text-left transition-all duration-200',
                      isActive
                        ? 'border-cyan-300/55 bg-cyan-300/12 text-white shadow-[0_32px_100px_-52px_rgba(72,150,255,0.65)]'
                        : 'panel-no-accent border-white/15 bg-white/6 text-white/75 hover:border-white/25 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <h3 className='flex-1 text-sm font-semibold leading-snug text-white line-clamp-2'>
                        {caseItem.caratulado}
                      </h3>
                      <PriorityBadge priority={caseItem.prioridad ?? 'media'} />
                    </div>
                    <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-white/65'>
                      <StatusBadge status={caseItem.estado ?? 'activo'} />
                      {caseItem.etapa_actual && (
                        <span className='inline-flex items-center border border-white/18 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70'>
                          {caseItem.etapa_actual}
                        </span>
                      )}
                    </div>
                    {caseItem.updated_at && (
                      <p className='mt-3 text-[11px] text-white/45'>
                        Actualizado {formatDate(caseItem.updated_at)}
                      </p>
                    )}
                  </button>
                );
              })}

              {sortedCases.length === 0 && (
                <div className='border border-dashed border-white/20 bg-white/6 px-6 py-10 text-center text-white/70'>
                  <Scale className='mx-auto h-10 w-10 text-white/35' />
                  <h3 className='mt-4 text-sm font-semibold text-white'>Sin casos asignados</h3>
                  <p className='mt-2 text-xs text-white/60'>
                    Te avisaremos en cuanto recibas un expediente compartido por tu firma.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <main className='space-y-8'>
            {selectedCase ? (
              <>
                <section className={cn(PRIMARY_PANEL, 'px-7 py-7')}>
                  <header className='flex flex-col gap-4 border-b border-white/12 pb-6 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='space-y-2'>
                      <h2 className='text-2xl font-semibold text-white'>{selectedCase.caratulado}</h2>
                      <div className='flex flex-wrap items-center gap-3 text-sm text-white/65'>
                        {selectedCase.numero_causa && <span>Causa {selectedCase.numero_causa}</span>}
                        {selectedCase.materia && <span>Materia {selectedCase.materia}</span>}
                        {selectedCase.tribunal && <span>Tribunal {selectedCase.tribunal}</span>}
                      </div>
                    </div>
                    <div className='flex flex-wrap items-center gap-3 text-sm'>
                      <StatusBadge status={selectedCase.estado ?? 'activo'} />
                      {selectedCase.etapa_actual && (
                        <span className='inline-flex items-center border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70'>
                          {selectedCase.etapa_actual}
                        </span>
                      )}
                    </div>
                  </header>

                  {lawyerData && (
                    <div className='mt-6 grid gap-4 border border-white/14 bg-white/6 px-5 py-5 text-sm text-white/75 md:grid-cols-[minmax(0,1fr)_auto_auto]'>
                      <div>
                        <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55'>Abogado responsable</p>
                        <p className='mt-1 text-base font-semibold text-white'>{lawyerData.nombre ?? 'Por confirmar'}</p>
                      </div>
                      {lawyerData.telefono && (
                        <p className='flex items-center gap-2 text-white/70'>
                          <Phone className='h-4 w-4 text-cyan-200' />
                          {lawyerData.telefono}
                        </p>
                      )}
                      {lawyerData.email && (
                        <p className='flex items-center gap-2 text-white/70'>
                          <Mail className='h-4 w-4 text-cyan-200' />
                          {lawyerData.email}
                        </p>
                      )}
                    </div>
                  )}

                  <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                    {selectedCase.fecha_inicio && (
                      <InfoTile
                        title='Fecha de inicio'
                        icon={<Calendar className='h-5 w-5 text-cyan-200' />}
                        value={formatDate(selectedCase.fecha_inicio)}
                      />
                    )}
                    {selectedCase.valor_estimado && (
                      <InfoTile
                        title='Valor estimado'
                        icon={<span className='text-lg'>💰</span>}
                        value={formatCurrency(selectedCase.valor_estimado)}
                      />
                    )}
                    {selectedCase.contraparte && (
                      <InfoTile
                        title='Contraparte'
                        icon={<User className='h-5 w-5 text-rose-300' />}
                        value={selectedCase.contraparte}
                      />
                    )}
                  </div>
                </section>

                <section className={cn(PRIMARY_PANEL, 'px-7 py-6')}>
                  <nav className='flex flex-wrap items-center gap-3'>
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type='button'
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          'inline-flex items-center gap-2 border border-white/18 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/65 transition-colors',
                          activeTab === tab.id
                            ? 'border-primary/55 bg-primary/15 text-white shadow-[0_28px_80px_-50px_rgba(72,140,255,0.6)]'
                            : 'hover:border-white/28 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <tab.icon className='h-4 w-4' />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </section>

                <section className='space-y-6'>
                  {activeTab === 'overview' && (
                    <div className='space-y-6'>
                      {selectedCase.observaciones && (
                        <div className={cn(SECONDARY_PANEL, 'px-6 py-6')}>
                          <h3 className='text-base font-semibold text-white'>Observaciones del caso</h3>
                          <p className='mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/70'>
                            {selectedCase.observaciones}
                          </p>
                        </div>
                      )}

                      <div className='grid gap-6 lg:grid-cols-2'>
                        <div className={cn(SECONDARY_PANEL, 'px-6 pb-6 pt-5')}>
                          <PanelHeader title='Progreso reciente' icon={<Clock className='h-4 w-4 text-cyan-200' />} />
                          <TimelinePanel
                            caseId={selectedCase.id}
                            caseMateria={selectedCase.materia ?? 'General'}
                            canManageStages={false}
                            showPrivateStages={false}
                          />
                        </div>

                        <div className={cn(SECONDARY_PANEL, 'px-6 pb-6 pt-5')}>
                          <PanelHeader title='Documentos compartidos' icon={<FileText className='h-4 w-4 text-cyan-200' />} />
                          <DocumentsPanel
                            caseId={selectedCase.id}
                            canUpload={false}
                            canEdit={false}
                            canDelete={false}
                            showPrivateDocuments={false}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'timeline' && (
                    <div className={cn(SECONDARY_PANEL, 'px-6 py-6')}>
                      <TimelinePanel
                        caseId={selectedCase.id}
                        caseMateria={selectedCase.materia ?? 'General'}
                        canManageStages={false}
                        showPrivateStages={false}
                      />
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className={cn(SECONDARY_PANEL, 'px-6 py-6')}>
                      <DocumentsPanel
                        caseId={selectedCase.id}
                        canUpload={false}
                        canEdit={false}
                        canDelete={false}
                        showPrivateDocuments={false}
                      />
                    </div>
                  )}

                  {activeTab === 'notes' && (
                    <div className={cn(SECONDARY_PANEL, 'px-6 py-6')}>
                      <NotesPanel caseId={selectedCase.id} canCreateNotes={false} canEditNotes={false} showPrivateNotes={false} />
                    </div>
                  )}

                  {activeTab === 'messages' && (
                    <div className={cn(SECONDARY_PANEL, 'px-6 py-6')}>
                      <CaseMessagesPanel
                        caseId={selectedCase.id}
                        initialMessages={[] as CaseMessageDTO[]}
                        currentProfileId={profile.id}
                        allowSend
                      />
                    </div>
                  )}

                  {activeTab === 'requests' && (
                    <div className={cn(SECONDARY_PANEL, 'px-6 py-6')}>
                      <InfoRequestsPanel
                        caseId={selectedCase.id}
                        canCreateRequests
                        canRespondRequests={false}
                        showPrivateRequests={false}
                      />
                    </div>
                  )}
                </section>
              </>
            ) : (
              <section className={cn(PRIMARY_PANEL, 'flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center text-white/70')}>
                <Scale className='h-16 w-16 text-white/35' />
                <h3 className='mt-6 text-xl font-semibold text-white'>Bienvenido al Portal Cliente</h3>
                <p className='mt-2 max-w-sm text-sm text-white/65'>
                  Selecciona un caso de la lista para revisar cada hito, documentos compartidos y la comunicación con tu equipo legal.
                </p>
              </section>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}

// --- Helper components -----------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase?.() ?? 'activo';
  const styles: Record<string, string> = {
    activo: 'border-emerald-400/55 bg-emerald-400/12 text-emerald-200',
    suspendido: 'border-amber-300/48 bg-amber-300/12 text-amber-200',
    archivado: 'border-white/22 bg-white/8 text-white/70',
    terminado: 'border-cyan-300/48 bg-cyan-300/12 text-cyan-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border-l-[3px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        styles[normalized] ?? styles.activo,
      )}
    >
      {normalized}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const normalized = priority?.toLowerCase?.() ?? 'media';
  const variant: Record<
    string,
    {
      tone: string;
      icon: ReactNode;
      label: string;
    }
  > = {
    urgente: {
      tone: 'border-rose-400/55 bg-rose-400/12 text-rose-200',
      icon: <AlertCircle className='h-4 w-4' />,
      label: 'Urgente',
    },
    alta: {
      tone: 'border-amber-300/55 bg-amber-300/12 text-amber-200',
      icon: <AlertCircle className='h-4 w-4' />,
      label: 'Alta',
    },
    media: {
      tone: 'border-cyan-300/55 bg-cyan-300/12 text-cyan-200',
      icon: <Clock className='h-4 w-4' />,
      label: 'Media',
    },
    baja: {
      tone: 'border-white/22 bg-white/10 text-white/70',
      icon: <CheckCircle className='h-4 w-4' />,
      label: 'Baja',
    },
  };

  const selected = variant[normalized] ?? variant.media;
  if (!selected) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        selected.tone,
      )}
    >
      {selected.icon}
      {selected.label}
    </span>
  );
}

function InfoTile({ title, icon, value }: { title: string; icon: ReactNode; value: string }) {
  return (
    <div className={cn(SECONDARY_PANEL, 'px-5 py-5')}>
      <div className='flex items-center gap-3 text-white/80'>
        <span className='flex h-9 w-9 items-center justify-center border border-white/18 bg-white/10'>
          {icon}
        </span>
        <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60'>{title}</p>
      </div>
      <p className='mt-4 text-lg font-semibold tracking-tight text-white'>{value}</p>
    </div>
  );
}

function PanelHeader({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div className='mb-5 flex items-center justify-between border-b border-white/12 pb-3'>
      <h3 className='text-base font-semibold text-white'>{title}</h3>
      <span className='flex h-9 w-9 items-center justify-center border border-white/15 bg-white/10 text-white/70'>
        {icon}
      </span>
    </div>
  );
}
