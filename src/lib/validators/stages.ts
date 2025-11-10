import { z } from 'zod';

// Schema para crear una etapa procesal
export const createStageSchema = z.object({
  case_id: z.string().uuid('ID de caso inválido'),
  etapa: z
    .string()
    .min(1, 'El nombre de la etapa es requerido')
    .max(1000, 'El nombre no puede exceder 1000 caracteres'),
  descripcion: z.string().optional(),
  fecha_programada: z.string().optional(),
  fecha_completada: z.string().optional(),
  estado: z.enum(['pendiente', 'en_proceso', 'completado']).default('pendiente'),
  es_publica: z.boolean().default(true),
  orden: z.number().int().positive('El orden debe ser un número positivo'),
  responsable_id: z.string().uuid('ID de responsable inválido').optional(),
  audiencia_tipo: z.enum(['preparatoria', 'juicio']).optional(),
  requiere_testigos: z.boolean().default(false),
  requiere_pago: z.boolean().default(false),
  costo_uf: z.number().min(0, 'El costo debe ser positivo').optional(),
  porcentaje_variable: z.number().min(0, 'El porcentaje debe ser positivo').max(100, 'El porcentaje no puede exceder 100').optional(),
  estado_pago: z
    .enum(['pendiente', 'en_proceso', 'parcial', 'pagado', 'vencido'])
    .default('pendiente'),
  enlace_pago: z.string().url('Debe ser una URL válida').optional(),
  notas_pago: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
  monto_variable_base: z.string().optional(),
  monto_pagado_uf: z.number().min(0, 'El monto pagado debe ser positivo').optional(),
});

// ✅ FIX 1: usar shape en omit, no un array
export const updateStageSchema = createStageSchema.partial().omit({ case_id: true });

// Schema para completar una etapa
export const completeStageSchema = z.object({
  fecha_completada: z.string().optional(),
  observaciones: z.string().optional(),
});

// Schema para filtros de etapas
export const stageFiltersSchema = z.object({
  case_id: z.string().uuid().optional(),
  estado: z.enum(['pendiente', 'en_proceso', 'completado']).optional(),
  responsable_id: z.string().uuid().optional(),
  es_publica: z.boolean().optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Tipos derivados
export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type CompleteStageInput = z.infer<typeof completeStageSchema>;
export type StageFiltersInput = z.infer<typeof stageFiltersSchema>;

// Constantes para etapas procesales chilenas
export interface StageTemplate {
  etapa: string;
  descripcion: string;
  diasEstimados: number;
  esPublica?: boolean;
  requierePago?: boolean;
  costoBs?: number;
  porcentajeVariable?: number;
  porcentajeHonorario?: number;
  notasPago?: string;
}

const STAGE_PRICING_DISTRIBUTION: Partial<Record<'Civil' | 'Comercial' | 'Laboral' | 'Familia', number[]>> = {
  Civil: [0.15, 0.1, 0.1, 0.1, 0.15, 0.2, 0.1, 0.05, 0.05],
  Comercial: [0.2, 0.15, 0.15, 0.2, 0.15, 0.1, 0.05],
  Laboral: [0.2, 0.2, 0.2, 0.2, 0.1, 0.1],
  Familia: [0.2, 0.15, 0.15, 0.15, 0.2, 0.15],
};

// ✅ Tipamos el Record con claves literales conocidas
const PROCEDURE_STAGE_TEMPLATES: Record<
  'Civil' | 'Comercial' | 'Laboral' | 'Familia',
  StageTemplate[]
> = {
  Civil: [
    { etapa: 'Presentación de demanda', descripcion: 'Ingreso de la demanda ante juzgado público civil y control de requisitos formales.', diasEstimados: 0 },
    { etapa: 'Admisión y radicatoria', descripcion: 'Radicatoria en juzgado, sorteo y requerimientos iniciales.', diasEstimados: 10 },
    { etapa: 'Notificación a demandados', descripcion: 'Notificación personal, por cédula o edictos a las partes demandadas.', diasEstimados: 25 },
    { etapa: 'Contestación y excepciones', descripcion: 'Recepción de contestación, excepciones previas y reconvenciones.', diasEstimados: 20 },
    { etapa: 'Audiencia preliminar', descripcion: 'Conciliación, fijación de puntos controvertidos y admisión de pruebas.', diasEstimados: 30 },
    { etapa: 'Periodo probatorio', descripcion: 'Producción de prueba testimonial, pericial y documental conforme al Código Procesal Civil.', diasEstimados: 45 },
    { etapa: 'Audiencia complementaria y alegatos', descripcion: 'Presentación de conclusiones y alegatos orales previos a la sentencia.', diasEstimados: 20 },
    { etapa: 'Sentencia de primera instancia', descripcion: 'Redacción, firma y notificación de la sentencia.', diasEstimados: 60 },
    { etapa: 'Recursos y ejecución', descripcion: 'Interposición de apelación, compulsa o ejecución de sentencia.', diasEstimados: 30 },
  ],
  Comercial: [
    { etapa: 'Presentación de demanda comercial', descripcion: 'Ingreso de la acción monitorea, ejecutiva o concursal ante juzgado público comercial.', diasEstimados: 0 },
    { etapa: 'Control de admisión y medidas cautelares', descripcion: 'Revisión formal y resolución de medidas precautorias solicitadas.', diasEstimados: 7 },
    { etapa: 'Notificación a la parte demandada', descripcion: 'Notificación con la demanda y requerimientos de pago o entrega.', diasEstimados: 20 },
    { etapa: 'Contestación y excepciones', descripcion: 'Recepción de la contestación, excepciones y reconvenciones.', diasEstimados: 20 },
    { etapa: 'Audiencia preliminar', descripcion: 'Depuración de la litis, conciliación y ordenamiento de la prueba.', diasEstimados: 25 },
    { etapa: 'Producción probatoria', descripcion: 'Práctica de prueba documental, pericial, contable y testifical.', diasEstimados: 35 },
    { etapa: 'Audiencia complementaria y sentencia', descripcion: 'Alegatos finales y deliberación para la sentencia.', diasEstimados: 45 },
    { etapa: 'Ejecución o recursos', descripcion: 'Demandas de cumplimiento, apelación o casación según corresponda.', diasEstimados: 30 },
  ],
  Laboral: [
    { etapa: 'Presentación de demanda laboral', descripcion: 'Ingreso de la demanda o denuncia ante el juez de trabajo y seguridad social.', diasEstimados: 0 },
    { etapa: 'Conciliación administrativa previa', descripcion: 'Verificación de conciliación en el Ministerio de Trabajo o presentación de constancia.', diasEstimados: 5 },
    { etapa: 'Notificación al empleador', descripcion: 'Notificación personal o por cédula al empleador y citación a audiencia.', diasEstimados: 10 },
    { etapa: 'Audiencia preliminar', descripcion: 'Intento de conciliación judicial, fijación de hechos y admisión de prueba.', diasEstimados: 15 },
    { etapa: 'Audiencia de juicio laboral', descripcion: 'Desahogo de prueba testifical, documental y pericial, con alegatos finales.', diasEstimados: 20 },
    { etapa: 'Sentencia y ejecución', descripcion: 'Emisión de sentencia, recursos y ejecución laboral preferente.', diasEstimados: 20 },
  ],
  Familia: [
    { etapa: 'Presentación de solicitud o demanda familiar', descripcion: 'Ingreso de medidas de protección, asistencia familiar o procesos de guarda ante juzgado público de familia.', diasEstimados: 0 },
    { etapa: 'Admisión y medidas urgentes', descripcion: 'Evaluación de competencia, medidas provisionales y señalamiento de audiencias.', diasEstimados: 7 },
    { etapa: 'Notificación y trabajo social', descripcion: 'Notificación a partes, informes psicosociales y citaciones.', diasEstimados: 12 },
    { etapa: 'Audiencia de conciliación y prueba anticipada', descripcion: 'Intento de conciliación, acuerdos y recepción de prueba imprescindible.', diasEstimados: 15 },
    { etapa: 'Audiencia de juicio familiar', descripcion: 'Declaraciones, prueba interdisciplinaria y alegatos finales.', diasEstimados: 20 },
    { etapa: 'Sentencia y seguimiento', descripcion: 'Notificación de sentencia, homologación de acuerdos y control de cumplimiento.', diasEstimados: 25 },
  ],
};

// ✅ FIX 2 y 3: siempre devolver StageTemplate[] (sin undefined)
export function getStageTemplatesByMateria(materia: string): StageTemplate[] {
  if (!materia) return PROCEDURE_STAGE_TEMPLATES.Civil;

  const lower = materia.toLowerCase();
  const keys = Object.keys(PROCEDURE_STAGE_TEMPLATES) as Array<
    keyof typeof PROCEDURE_STAGE_TEMPLATES
  >;

  const key = keys.find(k => k.toLowerCase() === lower);
  const templates = key ? PROCEDURE_STAGE_TEMPLATES[key] : PROCEDURE_STAGE_TEMPLATES.Civil;
  const distribution =
    key && STAGE_PRICING_DISTRIBUTION[key]
      ? STAGE_PRICING_DISTRIBUTION[key]!
      : STAGE_PRICING_DISTRIBUTION.Civil ?? [];

  return templates.map((template, index) => ({
    ...template,
    porcentajeHonorario: (distribution[index] ?? 0) as number,
  }));
}

export const STAGE_AUDIENCE_TYPES = [
  { value: 'preparatoria', label: 'Audiencia preparatoria' },
  { value: 'juicio', label: 'Audiencia de juicio' },
] as const;

export const STAGE_STATUSES = [
  { value: 'pendiente', label: 'Pendiente', color: 'gray' },
  { value: 'en_proceso', label: 'En Proceso', color: 'blue' },
  { value: 'completado', label: 'Completado', color: 'green' },
] as const;

export const STAGE_PAYMENT_STATUSES = [
  { value: 'pendiente', label: 'Pendiente', color: 'gray' },
  { value: 'solicitado', label: 'Solicitado por cliente', color: 'blue' },
  { value: 'en_proceso', label: 'En proceso', color: 'amber' },
  { value: 'parcial', label: 'Pago parcial', color: 'blue' },
  { value: 'pagado', label: 'Pagado', color: 'green' },
  { value: 'vencido', label: 'Vencido', color: 'red' },
] as const;
