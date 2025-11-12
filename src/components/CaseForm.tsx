'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createCase, updateCase } from '@/lib/actions/cases';
import { uploadDocument } from '@/lib/actions/documents';
import { createClientProfile } from '@/lib/actions/clients';
import {
  createCaseSchema,
  type CreateCaseInput,
  CASE_STATUSES,
  CASE_PRIORITIES,
  CASE_WORKFLOW_STATES,
  CASE_MATERIAS,
  DEPARTAMENTOS_BOLIVIA,
} from '@/lib/validators/case';
import { STAGE_AUDIENCE_TYPES } from '@/lib/validators/stages';
import { createClientSchema, type CreateClientInput } from '@/lib/validators/clients';
import { cn, formatIdentityDocument, formatCurrency } from '@/lib/utils';
import { Loader2, Save, X, Trash2, Paperclip, UploadCloud, CheckCircle2, Circle, Info } from 'lucide-react';
import type { Case, Profile } from '@/lib/supabase/types';

type LightweightProfile = Pick<Profile, 'id' | 'nombre' | 'role' | 'rut' | 'telefono' | 'email'>;

interface CaseFormProps {
  case?: Omit<Case, 'abogado_responsable'> & {
    abogado_responsable?: { id: string } | string | null;
    abogado_responsable_id?: string | null;
  };
  onCancel?: () => void;
  lawyers: LightweightProfile[];
  clients: LightweightProfile[];
  currentProfile: Pick<Profile, 'id' | 'role' | 'nombre'>;
}

const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
};

const selectClassName =
  'h-12 w-full rounded-2xl border border-white/18 bg-white/8 px-4 text-sm text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors placeholder:text-white/45 focus:border-primary/60 focus:bg-white/12 focus:outline-none focus:ring-2 focus:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60';
const errorTextClass = 'text-sm text-destructive';
const hintTextClass = 'text-xs text-white/70';

export function CaseForm({
  case: existingCase,
  onCancel,
  lawyers,
  clients,
  currentProfile,
}: CaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [clientOptions, setClientOptions] = useState<LightweightProfile[]>(clients);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const isAbogado = currentProfile.role === 'abogado';
  const defaultLawyerId = isAbogado ? currentProfile.id : undefined;

  const existingLawyerId = existingCase
    ? (existingCase as any).abogado_responsable_id ||
      (typeof existingCase.abogado_responsable === 'string'
        ? existingCase.abogado_responsable
        : existingCase.abogado_responsable?.id)
    : undefined;

  const defaultValues: Partial<CreateCaseInput> = existingCase
    ? {
        numero_causa: existingCase.numero_causa || '',
        caratulado: existingCase.caratulado,
        materia: existingCase.materia || '',
        tribunal: existingCase.tribunal || '',
        region: existingCase.region || '',
        comuna: existingCase.comuna || '',
        rut_cliente: existingCase.rut_cliente || '',
        nombre_cliente: existingCase.nombre_cliente,
        contraparte: existingCase.contraparte || '',
        etapa_actual: existingCase.etapa_actual || 'Ingreso Demanda',
        estado: (existingCase.estado || 'activo') as CreateCaseInput['estado'],
        fecha_inicio: existingCase.fecha_inicio || new Date().toISOString().split('T')[0],
        abogado_responsable: existingLawyerId || defaultLawyerId,
        cliente_principal_id: existingCase.cliente_principal_id ?? '',
        prioridad: (existingCase.prioridad || 'media') as CreateCaseInput['prioridad'],
        valor_estimado: existingCase.valor_estimado || undefined,
        honorario_total_uf: (existingCase as any).honorario_total_uf ?? undefined,
        honorario_pagado_uf: (existingCase as any).honorario_pagado_uf ?? undefined,
        honorario_variable_porcentaje: (existingCase as any).honorario_variable_porcentaje ?? undefined,
        honorario_variable_base: (existingCase as any).honorario_variable_base ?? '',
        honorario_moneda: (existingCase as any).honorario_moneda ?? 'BOB',
        modalidad_cobro: (existingCase as any).modalidad_cobro ?? 'prepago',
        honorario_notas: (existingCase as any).honorario_notas ?? '',
        tarifa_referencia: (existingCase as any).tarifa_referencia ?? '',
        observaciones: existingCase.observaciones || '',
        descripcion_inicial: existingCase.descripcion_inicial || '',
        documentacion_recibida: existingCase.documentacion_recibida || '',
        workflow_state: (existingCase.workflow_state || 'preparacion') as CreateCaseInput['workflow_state'],
        validado_at: existingCase.validado_at || undefined,
        marcar_validado: Boolean(existingCase.validado_at),
        audiencia_inicial_tipo: undefined,
        audiencia_inicial_requiere_testigos: false,
      }
    : {
        numero_causa: '',
        caratulado: '',
        materia: '',
        tribunal: '',
        region: '',
        comuna: '',
        rut_cliente: '',
        nombre_cliente: '',
        contraparte: '',
        etapa_actual: 'Ingreso Demanda',
        estado: 'activo',
        fecha_inicio: new Date().toISOString().split('T')[0],
        abogado_responsable: defaultLawyerId,
        cliente_principal_id: '',
        prioridad: 'media',
        valor_estimado: undefined,
        honorario_total_uf: undefined,
        honorario_pagado_uf: 0,
        honorario_variable_porcentaje: undefined,
        honorario_variable_base: '',
        honorario_moneda: 'BOB',
        modalidad_cobro: 'prepago',
        honorario_notas: '',
        tarifa_referencia: '',
        observaciones: '',
        descripcion_inicial: '',
        documentacion_recibida: '',
        workflow_state: 'preparacion',
        marcar_validado: false,
        audiencia_inicial_tipo: undefined,
        audiencia_inicial_requiere_testigos: false,
      };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    defaultValues,
  });

  const {
    register: registerNewClient,
    handleSubmit: handleSubmitNewClient,
    reset: resetNewClientForm,
    formState: { errors: newClientErrors },
    setValue: setNewClientValue,
    watch: watchNewClient,
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      nombre: '',
      email: '',
      rut: '',
      telefono: '',
    },
  });

  const documentoCliente = watch('rut_cliente');
  const clientePrincipalId = watch('cliente_principal_id');
  const marcarValidado = watch('marcar_validado');
  const workflowState = watch('workflow_state');
  const modalidadCobro = watch('modalidad_cobro');
  const honorarioMoneda = watch('honorario_moneda');
  const honorarioTotal = watch('honorario_total_uf');
  const audienciaInicialTipo = watch('audiencia_inicial_tipo');
  const audienciaInicialRequiereTestigos = watch('audiencia_inicial_requiere_testigos');
  const abogadoResponsableSeleccionado = watch('abogado_responsable');
  const materiaSeleccionada = watch('materia');
  const caratuladoValor = watch('caratulado');
  const descripcionInicial = watch('descripcion_inicial');
  const honorarioPagado = watch('honorario_pagado_uf');
  const honorarioPendiente =
    typeof honorarioTotal === 'number' && !Number.isNaN(honorarioTotal)
      ? Math.max((honorarioTotal ?? 0) - (honorarioPagado ?? 0), 0)
      : undefined;
  const newClientDocumento = watchNewClient('rut');
  const { ref: newClientDocumentoRef, ...newClientDocumentoField } = registerNewClient('rut');

  type WizardField = FieldPath<CreateCaseInput>;
  type WizardStep = {
    key: string;
    title: string;
    description: string;
    fields: WizardField[];
    isComplete: boolean;
  };

  const wizardSteps: [WizardStep, ...WizardStep[]] = [
    {
      key: 'basics',
      title: 'Datos del caso',
      description: 'Materia, carátulado y estado inicial del expediente.',
      fields: [
        'materia',
        'caratulado',
        'numero_causa',
        'tribunal',
        'region',
        'comuna',
        'fecha_inicio',
        'valor_estimado',
        'estado',
        'prioridad',
        'etapa_actual',
        'observaciones',
      ],
      isComplete: Boolean(materiaSeleccionada && caratuladoValor),
    },
    {
      key: 'client',
      title: 'Cliente y partes',
      description: 'Selecciona al titular, registra documento y contrapartes.',
      fields: ['nombre_cliente', 'rut_cliente', 'cliente_principal_id', 'contraparte'],
      isComplete: Boolean(clientePrincipalId),
    },
    {
      key: 'detail',
      title: 'Detalle procesal',
      description: 'Tribunal, jurisdicción, audiencia inicial y resumen del expediente.',
      fields: [
        'descripcion_inicial',
        'documentacion_recibida',
        'audiencia_inicial_tipo',
      ],
      isComplete: Boolean(descripcionInicial && descripcionInicial.trim().length > 0),
    },
    {
      key: 'workflow',
      title: 'Asignación y honorarios',
      description: 'Define responsables, workflow interno y esquema de honorarios.',
      fields: [
        'abogado_responsable',
        'workflow_state',
        'modalidad_cobro',
        'honorario_moneda',
        'tarifa_referencia',
        'honorario_total_uf',
        'honorario_pagado_uf',
        'honorario_variable_porcentaje',
        'honorario_variable_base',
        'honorario_notas',
        'marcar_validado',
      ],
      isComplete: Boolean(abogadoResponsableSeleccionado),
    },
  ];
  const totalSteps = wizardSteps.length;
  const currentStepMeta = wizardSteps[currentStep] ?? wizardSteps[0];
  if (!currentStepMeta) {
    throw new Error('Configuración inválida de pasos en el formulario de casos');
  }
  const isLastStep = currentStep === totalSteps - 1;

  const handleStepClick = async (index: number) => {
    if (index === currentStep || index < 0 || index >= totalSteps) {
      return;
    }

    if (index < currentStep) {
      setCurrentStep(index);
      return;
    }

    if (index === currentStep + 1) {
      const nextStep = wizardSteps[currentStep];
      if (!nextStep) {
        return;
      }

      const isValid = await trigger(nextStep.fields, {
        shouldFocus: true,
      });
      if (isValid) {
        setCurrentStep(index);
      }
    }
  };

  const handleNextStep = async () => {
    const step = wizardSteps[currentStep];
    if (!step) {
      return;
    }

    const isValid = await trigger(step.fields, {
      shouldFocus: true,
    });
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    if (!existingCase) {
      setValue('workflow_state', marcarValidado ? 'en_revision' : 'preparacion');
    }
  }, [marcarValidado, existingCase, setValue]);

  useEffect(() => {
    setClientOptions(clients);
    if (clients.length === 0) {
      setIsAddingClient(true);
    }
  }, [clients]);

  const resetFileSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const oversized = files.filter(file => file.size > MAX_ATTACHMENT_SIZE_BYTES);
    if (oversized.length > 0) {
      toast({
        title: 'Archivo demasiado grande',
        description: `Los siguientes archivos superan el límite de 20 MB: ${oversized
          .map(file => file.name)
          .join(', ')}`,
        variant: 'destructive',
      });
    }

    const validFiles = files.filter(file => file.size <= MAX_ATTACHMENT_SIZE_BYTES);
    if (validFiles.length > 0) {
      setSelectedFiles((prev) => {
        const existingKeys = new Set(prev.map(file => `${file.name}-${file.size}-${file.lastModified}`));
        const deduped = validFiles.filter(file => {
          const key = `${file.name}-${file.size}-${file.lastModified}`;
          if (existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        });
        if (deduped.length === 0) {
          return prev;
        }
        return [...prev, ...deduped];
      });
    }

    event.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CreateCaseInput) => {
    setIsLoading(true);

    try {
      const shouldValidate = Boolean(data.marcar_validado);
      const nowIso = new Date().toISOString();

      const payload: CreateCaseInput = {
        ...data,
        validado_at: shouldValidate
          ? data.validado_at ?? existingCase?.validado_at ?? nowIso
          : null,
        workflow_state: existingCase
          ? data.workflow_state
          : shouldValidate
            ? 'en_revision'
            : 'preparacion',
      };

      let result;
      
      if (existingCase) {
        result = await updateCase(existingCase.id, payload);
      } else {
        result = await createCase(payload);
      }

      if (result.success) {
        toast({
          title: existingCase ? 'Caso actualizado' : 'Caso creado',
          description: existingCase
            ? 'El caso ha sido actualizado exitosamente'
            : 'El nuevo caso ha sido creado exitosamente',
        });

        const createdCaseId = (result as { case?: { id: string } }).case?.id;

        if (!existingCase && selectedFiles.length > 0) {
          if (createdCaseId) {
            let successfulUploads = 0;
            const failedUploads: Array<{ fileName: string; message?: string }> = [];

            for (const file of selectedFiles) {
              const formData = new FormData();
              formData.append('case_id', createdCaseId);
              formData.append('file', file);
              formData.append('nombre', file.name);
              formData.append('visibilidad', 'privado');

              const uploadResult = await uploadDocument(formData);
              if (uploadResult.success) {
                successfulUploads += 1;
              } else {
                failedUploads.push({
                  fileName: file.name,
                  ...(uploadResult.error ? { message: uploadResult.error } : {}),
                });
              }
            }

            if (failedUploads.length > 0) {
              toast({
                title: 'Algunos documentos no se cargaron',
                description: failedUploads
                  .map(failure => `${failure.fileName}: ${failure.message ?? 'Error desconocido'}`)
                  .join(', '),
                variant: 'destructive',
              });
            } else if (successfulUploads > 0) {
              toast({
                title: 'Documentos cargados',
                description: `Se cargaron ${successfulUploads} documento${successfulUploads > 1 ? 's' : ''} correctamente.`,
              });
            }
          } else {
            toast({
              title: 'Documentos no cargados',
              description: 'No se pudo obtener el ID del caso recién creado para adjuntar los documentos.',
              variant: 'destructive',
            });
          }

          resetFileSelection();
        }

        router.push(createdCaseId ? `/cases/${createdCaseId}` : '/cases');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Ocurrió un error inesperado',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentityDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedDoc = formatIdentityDocument(e.target.value);
    setValue('rut_cliente', formattedDoc);
  };

  const handleNewClientIdentityDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedDoc = formatIdentityDocument(e.target.value);
    setNewClientValue('rut', formattedDoc, { shouldDirty: true, shouldValidate: true });
  };

  const onCreateClient = handleSubmitNewClient(async (clientData) => {
    setIsCreatingClient(true);
    try {
      const result = await createClientProfile(clientData);
      if (result.success) {
        const newClient = {
          id: result.client.id,
          nombre: result.client.nombre,
          role: 'cliente' as const,
          rut: result.client.rut,
          telefono: result.client.telefono,
          email: result.client.email,
        };

        setClientOptions((prev) => {
          const exists = prev.some((client) => client.id === newClient.id);
          if (exists) {
            return prev.map((client) => (client.id === newClient.id ? newClient : client));
          }
          return [...prev, newClient].sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'));
        });

        setValue('cliente_principal_id', newClient.id);
        setValue('nombre_cliente', newClient.nombre);
        if (newClient.rut) {
          setValue('rut_cliente', newClient.rut);
        }

        toast({
          title: 'Cliente creado',
          description: `${newClient.nombre} fue añadido al directorio y seleccionado en el caso.`,
        });

        resetNewClientForm();
        setIsAddingClient(false);
      } else {
        toast({
          title: 'No se pudo crear el cliente',
          description: result.error || 'Revisa los datos e inténtalo nuevamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating client from CaseForm:', error);
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error al crear el cliente.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingClient(false);
    }
  });

  const cancelNewClientCreation = () => {
    resetNewClientForm();
    setIsAddingClient(false);
  };

  useEffect(() => {
    if (!audienciaInicialTipo) {
      setValue('audiencia_inicial_requiere_testigos', false);
    }
  }, [audienciaInicialTipo, setValue]);

  const stepBaseClass =
    'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] transition-all';
  const stepActiveClass =
    'border-primary/45 bg-primary/18 text-primary shadow-[0_22px_60px_rgba(66,170,255,0.4)]';
  const stepCompletedClass = 'border-white/18 bg-white/10 text-white/80';
  const stepInactiveClass = 'border-white/10 bg-white/4 text-white/45';
  const audienceOptionBase =
    'flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-colors';
  const audienceOptionActive =
    'border-primary/45 bg-primary/15 text-primary shadow-[0_18px_50px_rgba(66,170,255,0.38)]';
  const audienceOptionNeutral =
    'border-white/14 bg-white/6 text-white/75 hover:border-white/22 hover:bg-white/12';
  const audienceOptionDisabled =
    'cursor-not-allowed border-dashed border-white/12 bg-transparent text-white/40 opacity-60';
  const isDefaultAudienceType = !audienciaInicialTipo;
  const checklist = wizardSteps.map((step, index) => ({
    key: step.key,
    label: `Paso ${index + 1} · ${step.title}`,
    complete: index < currentStep || step.isComplete,
  }));
  const isNewCase = !existingCase;

  return (
    <Card className='mx-auto w-full max-w-[1320px] border-white/14 bg-white/10 shadow-[0_45px_120px_rgba(6,15,40,0.62)]'>
      <CardHeader>
        <div className='space-y-5'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle className='text-2xl text-foreground'>
              {existingCase ? 'Editar caso' : 'Nuevo caso'}
            </CardTitle>
          </div>
          <div className='flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/60'>
            {wizardSteps.map((step, index) => {
              const isCurrent = index === currentStep;
              const isCompleted = index < currentStep;
              const stepClassName = cn(
                stepBaseClass,
                isCurrent ? stepActiveClass : isCompleted ? stepCompletedClass : stepInactiveClass,
                'transition-transform hover:scale-[1.02]'
              );

              return (
                <button
                  key={step.key}
                  type='button'
                  onClick={() => handleStepClick(index)}
                  className={stepClassName}
                  disabled={index > currentStep + 1}
                >
                  Paso {index + 1} · {step.title}
                </button>
              );
            })}
          </div>
          <p className='text-sm text-foreground/70'>
            {currentStepMeta.description}
          </p>
        </div>
      </CardHeader>
      <CardContent className='px-0 pb-10 pt-0'>
        <div className='flex flex-col gap-12 lg:flex-row lg:items-start lg:px-8'>
          <form onSubmit={handleSubmit(onSubmit)} className='order-2 flex-1 space-y-10 lg:order-1 lg:max-w-[980px]'>
            {currentStep === 0 && (
              <div className='space-y-10'>
                <section className='space-y-4'>
                  <div>
                    <h2 className='section-title'>Datos del caso</h2>
                    <p className='subtle-description'>Completa la información general del expediente.</p>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='numero_causa'>NUREJ / Número de proceso</Label>
                      <Input
                        id='numero_causa'
                        data-testid='numero-causa-input'
                        placeholder='2024012345'
                        {...register('numero_causa')}
                        disabled={isLoading}
                      />
                      {errors.numero_causa && (
                        <p className={errorTextClass}>{errors.numero_causa.message}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='materia'>Materia *</Label>
                      <select
                        id='materia'
                        data-testid='materia-select'
                        className={selectClassName}
                        {...register('materia')}
                        disabled={isLoading}
                        required
                      >
                        <option value=''>Seleccionar materia</option>
                        {CASE_MATERIAS.map(materia => (
                          <option key={materia} value={materia}>
                            {materia}
                          </option>
                        ))}
                      </select>
                      {errors.materia && (
                        <p className={errorTextClass}>{errors.materia.message}</p>
                      )}
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='caratulado'>Caratulado *</Label>
                    <Input
                      id='caratulado'
                      placeholder='Pérez con Empresa ABC'
                      {...register('caratulado')}
                      disabled={isLoading}
                    />
                    {errors.caratulado && (
                      <p className={errorTextClass}>{errors.caratulado.message}</p>
                    )}
                  </div>
                </section>

                <section className='space-y-4'>
                  <div>
                    <h2 className='section-title'>Detalle procesal</h2>
                    <p className='subtle-description'>Ingresa la información requerida por Supabase para seguimiento.</p>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='tribunal'>Tribunal</Label>
                      <Input
                        id='tribunal'
                        data-testid='tribunal-input'
                        placeholder='Juzgado Público Civil 1° de La Paz'
                        {...register('tribunal')}
                        disabled={isLoading}
                      />
                      {errors.tribunal && (
                        <p className={errorTextClass} data-testid='tribunal-error'>{errors.tribunal.message}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='region'>Departamento</Label>
                      <select
                        id='region'
                        className={selectClassName}
                        {...register('region')}
                        disabled={isLoading}
                      >
                        <option value=''>Seleccionar departamento</option>
                        {DEPARTAMENTOS_BOLIVIA.map(region => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                      {errors.region && (
                        <p className={errorTextClass}>{errors.region.message}</p>
                      )}
                    </div>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='comuna'>Municipio / Localidad</Label>
                      <Input
                        id='comuna'
                        placeholder='La Paz'
                        {...register('comuna')}
                        disabled={isLoading}
                      />
                      {errors.comuna && (
                        <p className={errorTextClass}>{errors.comuna.message}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='fecha_inicio'>Fecha de Inicio</Label>
                      <Input
                        id='fecha_inicio'
                        type='date'
                        {...register('fecha_inicio')}
                        disabled={isLoading}
                      />
                      {errors.fecha_inicio && (
                        <p className={errorTextClass}>{errors.fecha_inicio.message}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='valor_estimado'>Valor estimado (Bs)</Label>
                      <Input
                        id='valor_estimado'
                        type='number'
                        placeholder='5000000'
                        {...register('valor_estimado', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                      {errors.valor_estimado && (
                        <p className={errorTextClass}>{errors.valor_estimado.message}</p>
                      )}
                    </div>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='estado'>Estado actual</Label>
                      <select
                        id='estado'
                        className={selectClassName}
                        {...register('estado')}
                        disabled={isLoading}
                      >
                        {CASE_STATUSES.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      {errors.estado && (
                        <p className={errorTextClass}>{errors.estado.message}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='prioridad'>Prioridad</Label>
                      <select
                        id='prioridad'
                        className={selectClassName}
                        {...register('prioridad')}
                        disabled={isLoading}
                      >
                        {CASE_PRIORITIES.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                      {errors.prioridad && (
                        <p className={errorTextClass}>{errors.prioridad.message}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='etapa_actual'>Etapa actual</Label>
                      <Input
                        id='etapa_actual'
                        placeholder='Ingreso Demanda'
                        {...register('etapa_actual')}
                        disabled={isLoading}
                      />
                      {errors.etapa_actual && (
                        <p className={errorTextClass}>{errors.etapa_actual.message}</p>
                      )}
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='observaciones'>Observaciones</Label>
                    <Textarea
                      id='observaciones'
                      rows={4}
                      placeholder='Observaciones adicionales, riesgos o comentarios internos.'
                      {...register('observaciones')}
                      disabled={isLoading}
                    />
                    {errors.observaciones && (
                      <p className={errorTextClass}>{errors.observaciones.message}</p>
                    )}
                  </div>
                </section>
              </div>
            )}

            {currentStep === 1 && (
              <section className='space-y-4'>
                <div>
                  <h2 className='section-title'>Cliente y contraparte</h2>
                  <p className='subtle-description'>Identifica a las partes involucradas.</p>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='nombre_cliente'>Nombre del Cliente *</Label>
                    <Input
                      id='nombre_cliente'
                      data-testid='nombre-cliente-input'
                      placeholder='Juan Pérez'
                      {...register('nombre_cliente')}
                      disabled={isLoading}
                      required
                    />
                    {errors.nombre_cliente && (
                      <p className={errorTextClass} data-testid='nombre-cliente-error'>{errors.nombre_cliente.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='rut_cliente'>Documento de identidad (CI/NIT)</Label>
                    <Input
                      id='rut_cliente'
                      data-testid='rut-cliente-input'
                      placeholder='1234567 LP'
                      value={documentoCliente || ''}
                      onChange={handleIdentityDocumentChange}
                      disabled={isLoading}
                      required
                    />
                    {errors.rut_cliente && (
                      <p className={errorTextClass} data-testid='rut-cliente-error'>{errors.rut_cliente.message}</p>
                    )}
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between gap-2'>
                      <Label htmlFor='cliente_principal_id'>Cliente principal *</Label>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => setIsAddingClient((prev) => !prev)}
                        disabled={isLoading}
                      >
                        {isAddingClient ? 'Cerrar' : 'Crear cliente'}
                      </Button>
                    </div>
                    <Controller
                      control={control}
                      name='cliente_principal_id'
                      rules={{ required: 'Selecciona un cliente registrado para continuar.' }}
                      render={({ field }) => (
                        <select
                          id='cliente_principal_id'
                          className={selectClassName}
                          value={field.value || ''}
                          onChange={(event) => field.onChange(event.target.value || undefined)}
                          disabled={isLoading || clientOptions.length === 0}
                        >
                          <option value=''>Selecciona un cliente</option>
                          {clientOptions.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.nombre}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {clientOptions.length === 0 && (
                      <p className='text-xs font-medium text-destructive'>
                        No hay clientes registrados. Crea primero el cliente para habilitar la creación del caso.
                      </p>
                    )}
                    {errors.cliente_principal_id && (
                      <p className={errorTextClass}>{errors.cliente_principal_id.message}</p>
                    )}
                    {isAddingClient && (
                      <div className='mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/6 p-4 shadow-[0_25px_80px_-35px_rgba(6,15,40,0.55)]'>
                        <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                          <div className='space-y-2'>
                            <Label htmlFor='new_client_nombre'>Nombre del cliente</Label>
                            <Input
                              id='new_client_nombre'
                              placeholder='Juana Pérez'
                              {...registerNewClient('nombre')}
                              disabled={isCreatingClient}
                            />
                            {newClientErrors.nombre && (
                              <p className='text-xs text-destructive'>{newClientErrors.nombre.message}</p>
                            )}
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='new_client_email'>Correo</Label>
                            <Input
                              id='new_client_email'
                              type='email'
                              placeholder='cliente@correo.com'
                              {...registerNewClient('email')}
                              disabled={isCreatingClient}
                            />
                            {newClientErrors.email && (
                              <p className='text-xs text-destructive'>{newClientErrors.email.message}</p>
                            )}
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='new_client_rut'>Documento de identidad (CI/NIT)</Label>
                            <Input
                              id='new_client_rut'
                              placeholder='1234567 LP'
                              name={newClientDocumentoField.name}
                              ref={newClientDocumentoRef}
                              onBlur={newClientDocumentoField.onBlur}
                              value={newClientDocumento || ''}
                              onChange={handleNewClientIdentityDocumentChange}
                              disabled={isCreatingClient}
                            />
                            {newClientErrors.rut && (
                              <p className='text-xs text-destructive'>{newClientErrors.rut.message}</p>
                            )}
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='new_client_telefono'>Teléfono</Label>
                            <Input
                              id='new_client_telefono'
                              placeholder='+591 70000000'
                              {...registerNewClient('telefono')}
                              disabled={isCreatingClient}
                            />
                            {newClientErrors.telefono && (
                              <p className='text-xs text-destructive'>{newClientErrors.telefono.message}</p>
                            )}
                          </div>
                        </div>
                        <div className='flex justify-end gap-2'>
                          <Button
                            type='button'
                            variant='ghost'
                            onClick={cancelNewClientCreation}
                            disabled={isCreatingClient}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type='button'
                            onClick={onCreateClient}
                            disabled={isCreatingClient}
                          >
                            {isCreatingClient ? (
                              <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Guardando...
                              </>
                            ) : (
                              'Guardar cliente'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='contraparte'>Contraparte</Label>
                    <Input
                      id='contraparte'
                      placeholder='Empresa ABC S.A.'
                      {...register('contraparte')}
                      disabled={isLoading}
                    />
                    {errors.contraparte && (
                      <p className={errorTextClass}>{errors.contraparte.message}</p>
                    )}
                  </div>
                </div>
              </section>
            )}


            {currentStep === 2 && (
              <div className='space-y-10'>
                <section className='space-y-4'>
                  <div>
                    <h2 className='section-title'>Audiencias iniciales</h2>
                    <p className='subtle-description'>
                      Define el tipo de audiencia que esperas como primer hito y si requerirá coordinación de testigos.
                    </p>
                  </div>

                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-3'>
                      <Label>Tipo de audiencia inicial</Label>
                      <div className='grid gap-2'>
                        <label
                          className={cn(
                            audienceOptionBase,
                            isDefaultAudienceType ? audienceOptionActive : audienceOptionNeutral
                          )}
                        >
                          <input
                            type='radio'
                            value=''
                            className='h-4 w-4 accent-primary focus:ring-primary/40 focus:ring-offset-0'
                            {...register('audiencia_inicial_tipo')}
                          />
                          Sin audiencia definida por ahora
                        </label>
                        {STAGE_AUDIENCE_TYPES.map((option) => (
                          <label
                            key={option.value}
                            className={cn(
                              audienceOptionBase,
                              audienciaInicialTipo === option.value ? audienceOptionActive : audienceOptionNeutral
                            )}
                          >
                            <input
                              type='radio'
                              value={option.value}
                              className='h-4 w-4 accent-primary focus:ring-primary/40 focus:ring-offset-0'
                              {...register('audiencia_inicial_tipo')}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <Label>Participación de testigos</Label>
                      <Controller
                        control={control}
                        name='audiencia_inicial_requiere_testigos'
                        render={({ field }) => (
                          <label
                            className={cn(
                              audienceOptionBase,
                              audienciaInicialTipo
                                ? field.value
                                  ? audienceOptionActive
                                  : audienceOptionNeutral
                                : audienceOptionDisabled
                            )}
                          >
                            <input
                              type='checkbox'
                              className='h-4 w-4 rounded accent-primary focus:ring-primary/45 focus:ring-offset-0 disabled:cursor-not-allowed'
                              checked={Boolean(field.value)}
                              onChange={(event) => field.onChange(event.target.checked)}
                              onBlur={field.onBlur}
                              ref={field.ref}
                              name={field.name}
                              disabled={!audienciaInicialTipo}
                            />
                            Se coordinarán testigos para esta audiencia
                          </label>
                        )}
                      />
                      <p className={hintTextClass}>
                        Esta marca solo aplica si defines una audiencia inicial y se reflejará en la primera etapa del timeline.
                      </p>
                    </div>
                  </div>
                </section>

                <section className='space-y-4'>
                  <div>
                    <h2 className='section-title'>Información inicial</h2>
                    <p className='subtle-description'>Describe el contexto y los objetivos del cliente para una correcta asignación.</p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='descripcion_inicial'>Descripción inicial *</Label>
                    <Textarea
                      id='descripcion_inicial'
                      rows={5}
                      placeholder='Resumen del caso, antecedentes relevantes y hechos principales.'
                      {...register('descripcion_inicial')}
                      disabled={isLoading}
                    />
                    {errors.descripcion_inicial && (
                      <p className={errorTextClass}>{errors.descripcion_inicial.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='documentacion_recibida'>Documentación recibida</Label>
                    <Textarea
                      id='documentacion_recibida'
                      rows={4}
                      placeholder='Detalle la documentación entregada por el cliente (contratos, boletas, respaldos, etc.).'
                      {...register('documentacion_recibida')}
                      disabled={isLoading}
                    />
                    {errors.documentacion_recibida && (
                      <p className={errorTextClass}>{errors.documentacion_recibida.message}</p>
                    )}
                  </div>
                </section>

                {!existingCase && (
                  <section className='space-y-4'>
                    <div>
                      <h2 className='section-title'>Documentos de respaldo</h2>
                      <p className='subtle-description'>
                        Adjunta antecedentes relevantes para el equipo. Tamaño máximo de 20 MB por archivo.
                      </p>
                    </div>

                    <div className='space-y-3'>
                      <div className='space-y-2'>
                        <Label htmlFor='case_documents'>Archivos</Label>
                        <div className='space-y-3 rounded-2xl border border-dashed border-white/18 bg-white/6 p-4 shadow-[0_25px_80px_-40px_rgba(6,18,48,0.6)]'>
                          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex items-center gap-2 text-sm text-foreground/70'>
                              <UploadCloud className='h-4 w-4 text-white/70' />
                              <span>Selecciona uno o más archivos de hasta 20 MB cada uno.</span>
                            </div>
                            {selectedFiles.length > 0 && (
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={resetFileSelection}
                                disabled={isLoading}
                              >
                                <X className='mr-2 h-4 w-4' />
                                Limpiar selección
                              </Button>
                            )}
                          </div>
                          <Input
                            id='case_documents'
                            type='file'
                            multiple
                            onChange={handleFilesSelected}
                            disabled={isLoading}
                            ref={fileInputRef}
                          />
                          <p className={hintTextClass}>
                            Se aceptan archivos PDF, Word, imágenes y texto. Máximo 20 MB por archivo.
                          </p>
                        </div>
                      </div>

                      {selectedFiles.length > 0 && (
                        <ul className='space-y-2'>
                          {selectedFiles.map((file, index) => (
                            <li
                              key={`${file.name}-${file.lastModified}-${index}`}
                              className='flex items-center justify-between rounded-2xl border border-white/15 bg-white/8 px-3 py-2 text-sm backdrop-blur-xl'
                            >
                              <div className='flex items-center gap-2'>
                                <Paperclip className='h-4 w-4 text-white/70' />
                                <div>
                                  <p className='font-medium text-foreground'>{file.name}</p>
                                  <p className={hintTextClass}>{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                onClick={() => removeSelectedFile(index)}
                                disabled={isLoading}
                                aria-label={`Quitar ${file.name}`}
                              >
                                <Trash2 className='h-4 w-4 text-white/65' />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className='space-y-10'>
                <section className='space-y-4'>
                  <div>
                    <h2 className='section-title'>Asignación y workflow</h2>
                    <p className='subtle-description'>Define quién liderará el caso y el estado interno del expediente.</p>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='abogado_responsable'>Abogado responsable</Label>
                      <Controller
                        control={control}
                        name='abogado_responsable'
                        render={({ field }) => (
                          <select
                            id='abogado_responsable'
                            className={selectClassName}
                            value={field.value || ''}
                            onChange={(event) => field.onChange(event.target.value || undefined)}
                            disabled={isLoading || lawyers.length === 0}
                          >
                            <option value=''>Selecciona un abogado</option>
                            {lawyers.map(lawyer => (
                              <option key={lawyer.id} value={lawyer.id}>
                                {lawyer.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {lawyers.length === 0 && (
                        <p className={hintTextClass}>No hay abogados disponibles. Un administrador debe registrarlos.</p>
                      )}
                      {errors.abogado_responsable && (
                        <p className={errorTextClass}>{errors.abogado_responsable.message}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='workflow_state'>Estado interno</Label>
                      <select
                        id='workflow_state'
                        className={selectClassName}
                        {...register('workflow_state')}
                        disabled={isLoading}
                      >
                        {CASE_WORKFLOW_STATES.map(state => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </select>
                      {errors.workflow_state && (
                        <p className={errorTextClass}>{errors.workflow_state.message}</p>
                      )}
                    </div>
                  </div>

                  <div className='rounded-2xl border border-white/15 bg-white/6 p-4 shadow-[0_25px_80px_-40px_rgba(6,18,48,0.55)]'>
                    <label className='flex items-start gap-3'>
                      <input
                        type='checkbox'
                        className='mt-1 h-4 w-4 rounded border-white/25 bg-white/10 text-primary focus:ring-primary/40 focus:ring-offset-0'
                        {...register('marcar_validado')}
                        disabled={isLoading}
                      />
                      <span>
                        <span className='font-medium text-foreground'>Marcar caso como validado y listo para asignación</span>
                        <p className='mt-1 text-sm text-foreground/70'>Al validar el caso se notificará al abogado responsable y al cliente principal, y se activará el timeline automático.</p>
                      </span>
                    </label>
                    {errors.marcar_validado && (
                      <p className={`${errorTextClass} mt-2`}>{errors.marcar_validado.message}</p>
                    )}

                    {marcarValidado && (
                      <div className='mt-3 rounded-2xl border border-primary/30 bg-primary/12 p-3 text-sm text-primary/90'>
                        Revisa que la información esté completa. El workflow pasará a <strong>"{CASE_WORKFLOW_STATES.find(state => state.value === workflowState)?.label ?? 'Revisión interna'}"</strong> y el equipo recibirá un resumen del caso junto al timeline sugerido.
                      </div>
                    )}
                  </div>
                </section>

                <section className='space-y-4'>
                  <div>
                    <h2 className='section-title'>Honorarios y activación de pagos</h2>
                    <p className='subtle-description'>Completa este bloque cuando el expediente ya esté validado. Los enlaces de pago se habilitan al finalizar el registro.</p>
                  </div>

                  <div className='rounded-2xl border border-white/12 bg-white/6 p-4 text-sm text-white/75 shadow-[0_24px_75px_-45px_rgba(5,15,40,0.6)]'>
                    <p className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/55'>
                      <span className='inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 text-primary'>
                        {clientePrincipalId && abogadoResponsableSeleccionado ? <CheckCircle2 className='h-3.5 w-3.5' /> : <Circle className='h-3.5 w-3.5' />}
                      </span>
                      Estado del expediente
                    </p>
                    <p className='mt-2 text-white/70'>
                      {clientePrincipalId && abogadoResponsableSeleccionado
                        ? 'Excelente. El caso tiene asignación y cliente titular. Registra los honorarios para liberar la activación de pagos.'
                        : 'Todavía faltan datos críticos del caso. Completa cliente y asignación antes de habilitar los cobros.'}
                    </p>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='modalidad_cobro'>Modalidad de cobro</Label>
                      <select
                        id='modalidad_cobro'
                        className={selectClassName}
                        {...register('modalidad_cobro')}
                        disabled={isLoading}
                      >
                        <option value='prepago'>Prepago por etapas</option>
                        <option value='postpago'>Postpago</option>
                        <option value='mixto'>Mixto</option>
                      </select>
                      {errors.modalidad_cobro && <p className={errorTextClass}>{errors.modalidad_cobro.message}</p>}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='honorario_moneda'>Moneda base</Label>
                      <select
                        id='honorario_moneda'
                        className={selectClassName}
                        {...register('honorario_moneda')}
                        disabled={isLoading}
                      >
                        <option value='BOB'>Bolivianos (BOB)</option>
                        <option value='UFV'>UFV</option>
                        <option value='USD'>USD</option>
                      </select>
                      {errors.honorario_moneda && <p className={errorTextClass}>{errors.honorario_moneda.message}</p>}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='tarifa_referencia'>Tarifa de referencia</Label>
                      <Input
                        id='tarifa_referencia'
                        placeholder='Ej: civil_proceso_ordinario_bolivia'
                        {...register('tarifa_referencia')}
                        disabled={isLoading}
                      />
                      <p className={hintTextClass}>Usa el identificador definido en la tabla de honorarios de LEX Altius para asociar el timeline automáticamente.</p>
                      {errors.tarifa_referencia && <p className={errorTextClass}>{errors.tarifa_referencia.message}</p>}
                    </div>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='honorario_total_uf'>Honorario total (Bs)</Label>
                      <Input
                        id='honorario_total_uf'
                        type='number'
                        min='0'
                        step='0.01'
                        placeholder='5000'
                        {...register('honorario_total_uf', { valueAsNumber: true })}
                        disabled={isLoading || honorarioMoneda !== 'BOB'}
                      />
                      {honorarioMoneda !== 'BOB' && <p className={hintTextClass}>Detalla el equivalente en notas si operas en otra moneda.</p>}
                      {errors.honorario_total_uf && <p className={errorTextClass}>{errors.honorario_total_uf.message}</p>}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='honorario_pagado_uf'>Monto pagado (Bs)</Label>
                      <Input
                        id='honorario_pagado_uf'
                        type='number'
                        min='0'
                        step='0.01'
                        placeholder='0'
                        {...register('honorario_pagado_uf', { valueAsNumber: true })}
                        disabled={isLoading || honorarioMoneda !== 'BOB'}
                      />
                      {errors.honorario_pagado_uf && <p className={errorTextClass}>{errors.honorario_pagado_uf.message}</p>}
                    </div>

                    <div className='space-y-2'>
                      <Label>Saldo pendiente (Bs)</Label>
                      <div className='flex h-10 items-center rounded-full border border-dashed border-white/20 bg-white/8 px-3 text-sm font-medium text-white/80'>
                        {honorarioPendiente !== undefined ? formatCurrency(honorarioPendiente) : '—'}
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='honorario_variable_porcentaje'>Componente variable (%)</Label>
                      <Input
                        id='honorario_variable_porcentaje'
                        type='number'
                        min='0'
                        max='100'
                        step='0.1'
                        placeholder='10'
                        {...register('honorario_variable_porcentaje', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                      {errors.honorario_variable_porcentaje && <p className={errorTextClass}>{errors.honorario_variable_porcentaje.message}</p>}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='honorario_variable_base'>Base del variable</Label>
                      <Textarea
                        id='honorario_variable_base'
                        rows={2}
                        placeholder='Ej: 10% de lo obtenido o de lo ahorrado por la defensa.'
                        {...register('honorario_variable_base')}
                        disabled={isLoading}
                      />
                      {errors.honorario_variable_base && <p className={errorTextClass}>{errors.honorario_variable_base.message}</p>}
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='honorario_notas'>Notas de honorarios</Label>
                    <Textarea
                      id='honorario_notas'
                      rows={3}
                      placeholder='Detalle acuerdos específicos, descuentos, o condiciones especiales.'
                      {...register('honorario_notas')}
                      disabled={isLoading}
                    />
                    {errors.honorario_notas && <p className={errorTextClass}>{errors.honorario_notas.message}</p>}
                  </div>

                  <div className='rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-primary/95 shadow-[0_32px_95px_rgba(6,20,55,0.45)]'>
                    <p className='font-medium uppercase tracking-[0.12em] text-primary'>Activación programada</p>
                    <p className='mt-2 text-foreground/85'>
                      Una vez que guardes el caso, podrás generar enlaces o registrar abonos desde el detalle del expediente. El equipo recibirá un aviso cuando el prepago esté listo.
                    </p>
                  </div>
                </section>
              </div>
            )}

          <div className='flex flex-col gap-4 border-t border-white/10 pt-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex flex-wrap gap-3'>
                {onCancel && (
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    <X className='mr-2 h-4 w-4' />
                    Cancelar
                  </Button>
                )}
                {currentStep > 0 && (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handlePreviousStep}
                    disabled={isLoading}
                  >
                    Volver
                  </Button>
                )}
              </div>
              <div className='flex flex-wrap gap-3'>
                {!isLastStep && (
                  <Button
                    type='button'
                    onClick={handleNextStep}
                    disabled={isLoading}
                  >
                    Continuar
                    {wizardSteps[currentStep + 1] ? ` · ${wizardSteps[currentStep + 1]?.title}` : ''}
                  </Button>
                )}
                {isLastStep && (
                  <Button
                    type='submit'
                    data-testid='create-case-button'
                    disabled={isLoading || !clientePrincipalId}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        {existingCase ? 'Actualizando...' : 'Creando...'}
                      </>
                    ) : (
                      <>
                        <Save className='mr-2 h-4 w-4' />
                        {existingCase ? 'Actualizar Caso' : 'Crear Caso'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          </form>

          <aside className='order-1 w-full space-y-6 rounded-3xl border border-white/12 bg-white/6 p-6 text-sm text-white/75 shadow-[0_28px_95px_-50px_rgba(5,12,35,0.65)] lg:sticky lg:top-32 lg:order-2 lg:w-[320px]'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55'>Checklist</p>
              <ul className='mt-4 space-y-3'>
                {checklist.map(item => (
                  <li key={item.key} className='flex items-center gap-3'>
                    {item.complete ? (
                      <CheckCircle2 className='h-5 w-5 flex-shrink-0 text-primary' />
                    ) : (
                      <Circle className='h-5 w-5 flex-shrink-0 text-white/35' />
                    )}
                    <span className={cn('leading-snug', item.complete ? 'text-white/85' : 'text-white/60')}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='rounded-2xl border border-white/12 bg-white/8 p-5 text-[13px] leading-relaxed text-white/70 shadow-[0_22px_70px_-45px_rgba(6,15,40,0.6)]'>
              <div className='flex items-start gap-3'>
                <Info className='mt-0.5 h-4 w-4 flex-shrink-0 text-primary/80' />
                <div className='space-y-3'>
                  <p className='font-semibold text-white'>Consejos de registro</p>
                  <ul className='space-y-2'>
                    <li className='flex gap-2'>
                      <span className='mt-1 h-1.5 w-1.5 rounded-full bg-primary/70' />
                      <span className='text-white/65'>Inicia con los datos críticos (cliente, materia, caratulado). El resto del formulario se adapta según ellos.</span>
                    </li>
                    <li className='flex gap-2'>
                      <span className='mt-1 h-1.5 w-1.5 rounded-full bg-primary/70' />
                      <span className='text-white/65'>Puedes pausar el llenado: guarda como borrador y vuelve desde el listado de casos.</span>
                    </li>
                    <li className='flex gap-2'>
                      <span className='mt-1 h-1.5 w-1.5 rounded-full bg-primary/70' />
                      <span className='text-white/65'>Adjunta solo los documentos iniciales clave. El equipo legal agregará piezas adicionales después.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {isNewCase && (
              <div className='rounded-2xl border border-white/12 bg-primary/10 p-5 text-sm text-white/75'>
                <p className='text-xs uppercase tracking-[0.28em] text-white/55'>Preparación</p>
                <p className='mt-3 text-white/85'>
                  {selectedFiles.length > 0 ? (
                    <>Tienes {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''} listo{selectedFiles.length > 1 ? 's' : ''} para subir cuando se cree el expediente.</>
                  ) : (
                    <>Puedes añadir antecedentes preliminares en cualquier momento. Esto ayudará al equipo a validar la información más rápido.</>
                  )}
                </p>
                {!clientePrincipalId && (
                  <p className='mt-3 text-xs text-primary/80'>
                    ¿Aún sin cliente? Usa “Crear cliente” o mantenlo abierto en otra pestaña para copiar sus datos.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}
