export interface LegalFeeScale {
  condicion: string;
  montoBs?: number;
  porcentaje?: number;
  porcentajeSobre?: string;
  minimoUf?: number;
  notas?: string;
}

export interface LegalFeeItem {
  id: string;
  nombre: string;
  descripcion?: string;
  montoBs?: number;
  porcentaje?: number;
  porcentajeSobre?: string;
  minimoUf?: number;
  notas?: string;
  escalas?: LegalFeeScale[];
}

export interface LegalFeeCategory {
  codigo: string;
  titulo: string;
  items: LegalFeeItem[];
}

export const LEGAL_FEE_CATEGORIES: LegalFeeCategory[] = [
  {
    codigo: 'consulta',
    titulo: 'Honorarios Profesionales - Consulta',
    items: [
      {
        id: 'consulta_atencion_personal',
        nombre: 'Consulta profesional (atención personal)',
        montoBs: 275,
        notas:
          'Se descuenta del honorario final si el cliente contrata el servicio asociado.',
      },
      {
        id: 'consulta_informe_escrito',
        nombre: 'Consulta con estudio documental e informe escrito',
        montoBs: 550,
        notas:
          'Incluye revisión de antecedentes y envío de informe. Se descuenta del honorario final si se contrata el servicio.',
      },
    ],
  },
  {
    codigo: 'constitucional',
    titulo: 'Materias Constitucionales',
    items: [
      {
        id: 'recurso_proteccion',
        nombre: 'Recurso de protección',
        montoBs: 8250,
        notas: 'Bs 11.000 si se tramita apelación.',
      },
      {
        id: 'recurso_proteccion_isapre',
        nombre: 'Recurso de protección por alza de plan de ISAPRE',
        descripcion: 'Cobro de costas de la causa.',
        notas: 'Se facturan las costas procesales obtenidas.',
      },
      {
        id: 'recurso_amparo',
        nombre: 'Recurso de amparo',
        montoBs: 4125,
        notas: 'Bs 5.500 si se tramita apelación.',
      },
    ],
  },
  {
    codigo: 'civil',
    titulo: 'Materias Civiles',
    items: [
      {
        id: 'medidas_prejudiciales',
        nombre: 'Medidas prejudiciales',
        escalas: [
          {
            condicion:
              'Si con la medida se resuelve el conflicto que motivaba el juicio posterior',
            montoBs: 4125,
          },
          {
            condicion: 'En caso contrario',
            montoBs: 1375,
          },
        ],
      },
      {
        id: 'juicio_ordinario_mayor_cuantia',
        nombre: 'Juicio ordinario de mayor cuantía',
        montoBs: 8250,
        porcentaje: 10,
        porcentajeSobre: 'lo obtenido con la demanda o lo ahorrado por la defensa',
        notas:
          'Si hay reconvención: Bs 13.750 + 10% de la demanda principal + 10% de lo obtenido o ahorrado por la reconvención.',
      },
      {
        id: 'juicio_ordinario_menor_cuantia',
        nombre: 'Juicio ordinario de menor cuantía',
        montoBs: 5500,
        porcentaje: 10,
        porcentajeSobre: 'lo obtenido con la demanda o lo ahorrado por la defensa',
        notas:
          'Con reconvención: Bs 8.250 + 10% de la demanda principal + 10% de la reconvención.',
      },
      {
        id: 'juicio_ordinario_minima_cuantia',
        nombre: 'Juicio ordinario de mínima cuantía',
        montoBs: 2750,
        porcentaje: 10,
        porcentajeSobre: 'lo obtenido con la demanda o lo ahorrado por la defensa',
      },
      {
        id: 'preparacion_via_ejecutiva',
        nombre: 'Preparación de la vía ejecutiva',
        montoBs: 2750,
      },
      {
        id: 'juicio_ejecutivo',
        nombre: 'Juicio ejecutivo (principal o incidental)',
        montoBs: 5500,
        porcentaje: 10,
        porcentajeSobre: 'lo obtenido con la demanda o lo ahorrado por la defensa',
      },
      {
        id: 'tercerias_ejecutivo',
        nombre: 'Tercerías en juicio ejecutivo',
        escalas: [
          { condicion: 'De dominio o de posesión', montoBs: 2750 },
          {
            condicion: 'De prelación o pago',
            porcentaje: 10,
            porcentajeSobre: 'lo obtenido',
            minimoUf: 10,
          },
        ],
      },
      {
        id: 'juicio_sumario',
        nombre: 'Juicio sumario',
        montoBs: 5500,
        porcentaje: 10,
        porcentajeSobre: 'lo obtenido o lo ahorrado',
      },
      {
        id: 'juicio_arrendamiento',
        nombre: 'Juicio especial de arrendamiento',
        escalas: [
          { condicion: 'Deuda hasta Bs 13.750', montoBs: 2750 },
          { condicion: 'Deuda entre Bs 14.025 y Bs 27.500', montoBs: 4125 },
          { condicion: 'Deuda superior a Bs 27.500', montoBs: 5500 },
        ],
      },
      {
        id: 'juicio_posesorio',
        nombre: 'Juicio posesorio',
        montoBs: 5500,
      },
      {
        id: 'juicio_interdiccion',
        nombre: 'Juicio de interdicción',
        montoBs: 5500,
      },
      {
        id: 'juicio_cuentas',
        nombre: 'Juicio sobre cuentas',
        escalas: [
          { condicion: 'Sin observaciones', montoBs: 2750 },
          { condicion: 'Con observaciones', montoBs: 6875 },
        ],
      },
      {
        id: 'transaccion_previa',
        nombre: 'Transacción antes del juicio',
        porcentaje: 25,
        porcentajeSobre: 'del honorario que correspondería al juicio que se evita',
      },
      {
        id: 'pago_consignacion',
        nombre: 'Pago por consignación',
        montoBs: 2750,
        notas: 'En la calificación de suficiencia se aplican los honorarios del juicio ordinario.',
      },
      {
        id: 'retencion_accion_especial',
        nombre: 'Declaración judicial del derecho de retención',
        montoBs: 2750,
      },
      {
        id: 'insinuacion_donaciones',
        nombre: 'Insinuación de donaciones',
        montoBs: 5500,
      },
      {
        id: 'cambio_nombre',
        nombre: 'Cambio de nombre',
        montoBs: 5500,
      },
      {
        id: 'rectificacion_partida_civil',
        nombre: 'Rectificación de partida de estado civil',
        montoBs: 5500,
      },
      {
        id: 'estudio_titulo_bienes_raices',
        nombre: 'Examen o formación de título de bienes raíces',
        porcentaje: 2,
        porcentajeSobre: 'valor del inmueble',
        minimoUf: 5,
        notas:
          'No incluye la redacción de contratos derivados, que se cobran adicionalmente.',
      },
      {
        id: 'redaccion_contratos',
        nombre: 'Redacción de contratos, convenios o estatutos',
        porcentaje: 2,
        porcentajeSobre: 'valor del negocio',
        minimoUf: 5,
        notas:
          'Sin cuantía: Bs 2.200. Modificaciones: 50% del honorario original con mínimo de Bs 1.100.',
      },
      {
        id: 'redaccion_testamento',
        nombre: 'Redacción de testamento',
        escalas: [
          { condicion: 'Bienes hasta Bs 275.000', montoBs: 5500 },
          {
            condicion: 'Bienes superiores a Bs 275.000',
            porcentaje: 5,
            porcentajeSobre: 'del valor de la masa',
          },
        ],
      },
      {
        id: 'muerte_presunta',
        nombre: 'Declaración de muerte presunta',
        montoBs: 5500,
      },
      {
        id: 'herencia_yacente',
        nombre: 'Declaración de herencia yacente',
        montoBs: 5500,
        notas: 'Incluye nombramiento de curador.',
      },
      {
        id: 'apertura_testamento',
        nombre: 'Apertura o publicación de testamento',
        montoBs: 5500,
      },
      {
        id: 'posesion_efectiva_judicial',
        nombre: 'Posesión efectiva judicial',
        montoBs: 5500,
      },
      {
        id: 'albaceazgo',
        nombre: 'Albaceazgo',
        escalas: [
          {
            condicion: 'Con tenencia de bienes',
            porcentaje: 10,
            porcentajeSobre: 'bienes de la herencia',
            minimoUf: 20,
          },
          {
            condicion: 'Sin tenencia de bienes',
            porcentaje: 5,
            porcentajeSobre: 'bienes de la herencia',
            minimoUf: 15,
          },
        ],
      },
      {
        id: 'gestiones_judiciales_varias',
        nombre: 'Otras gestiones judiciales',
        escalas: [
          { condicion: 'Nombramiento de guardadores y discernimiento', montoBs: 4125 },
          { condicion: 'Notificación de actos jurídicos a terceros', montoBs: 1375 },
          { condicion: 'Notificación de protestos', montoBs: 1375 },
          { condicion: 'Inscripción por negativa del conservador', montoBs: 2750 },
          { condicion: 'Inventario solemne', montoBs: 1375 },
        ],
      },
      {
        id: 'expropiacion_utilidad_publica',
        nombre: 'Expropiación de causa de utilidad pública',
        escalas: [
          { condicion: 'Hasta Bs 275.000', porcentaje: 10, porcentajeSobre: 'valor ordenado pagar' },
          { condicion: 'Sobre Bs 275.000', porcentaje: 5, porcentajeSobre: 'valor ordenado pagar' },
        ],
        minimoUf: 15,
        notas:
          'No incluye la suma ofrecida voluntariamente por el expropiante. El mínimo es Bs 4.125.',
      },
      {
        id: 'materias_aguas',
        nombre: 'Materias de aguas',
        escalas: [
          { condicion: 'Regularización art. 1° transitorio', montoBs: 8250 },
          { condicion: 'Regularización art. 2° transitorio', montoBs: 11000 },
          {
            condicion: 'Otras formas administrativas de regularización',
            montoBs: 8250,
          },
          {
            condicion: 'Constitución o reforma de organizaciones de usuarios',
            montoBs: 8250,
          },
          { condicion: 'Juicios sumarios', montoBs: 5500 },
          { condicion: 'Acciones de amparo de aguas', montoBs: 5500 },
        ],
      },
      {
        id: 'arbitrajes',
        nombre: 'Arbitrajes',
        escalas: [
          {
            condicion: 'Masa hasta Bs 1.375.000',
            porcentaje: 10,
            porcentajeSobre: 'valor de la masa',
            minimoUf: 30,
          },
          {
            condicion: 'Masa entre Bs 1.375.000 y Bs 4.125.000',
            porcentaje: 6,
            porcentajeSobre: 'valor de la masa',
          },
          {
            condicion: 'Masa entre Bs 4.125.000 y Bs 8.250.000',
            porcentaje: 4,
            porcentajeSobre: 'valor de la masa',
          },
          {
            condicion: 'Exceso sobre Bs 8.250.000',
            porcentaje: 2,
            porcentajeSobre: 'valor de la masa excedente',
          },
        ],
        notas:
          'Si el árbitro es administrador común, aumenta en 25%. Si incluye partición de sociedad conyugal y herencia, se incrementa en 15%. Escritura pública o liquidación por separación de bienes: 50% del honorario indicado.',
      },
    ],
  },
  {
    codigo: 'mineria',
    titulo: 'Materias de Minería',
    items: [
      {
        id: 'propiedad_minera_carbon',
        nombre: 'Constitución de propiedad minera en yacimientos carboníferos',
        montoBs: 13750,
      },
      {
        id: 'autorizacion_catar_cavar',
        nombre: 'Autorización judicial para catar y cavar',
        montoBs: 11000,
      },
      {
        id: 'constitucion_propiedad_minera',
        nombre: 'Constitución de propiedad minera',
        montoBs: 13750,
      },
      {
        id: 'permiso_exclusivo_explotar',
        nombre: 'Autorización judicial de permiso exclusivo para explotar',
        montoBs: 13750,
      },
      {
        id: 'oposicion_mensura',
        nombre: 'Juicio de oposición o nulidad de mensura',
        notas: 'Entre Bs 13.750 y Bs 41.250 según complejidad.',
      },
      {
        id: 'administracion_minera',
        nombre: 'Juicios sobre administración del minero o servidumbres mineras',
        notas: 'Entre Bs 13.750 y Bs 41.250 según complejidad.',
      },
      {
        id: 'internacion_pertenencias',
        nombre: 'Sobre internación de pertenencias',
        escalas: [
          {
            condicion: 'Si es susceptible de apreciación pecuniaria',
            montoBs: 8250,
            porcentaje: 1,
            porcentajeSobre: 'valor de la pertenencia',
          },
          { condicion: 'Casos sin apreciación pecuniaria', montoBs: 8250 },
        ],
      },
    ],
  },
  {
    codigo: 'comercial',
    titulo: 'Materias Comerciales',
    items: [
      {
        id: 'sociedad_personas',
        nombre: 'Constitución de sociedad de personas',
        porcentaje: 10,
        porcentajeSobre: 'capital suscrito',
        minimoUf: 15,
      },
      {
        id: 'sociedad_capital',
        nombre: 'Constitución de sociedad de capital',
        porcentaje: 10,
        porcentajeSobre: 'capital suscrito',
        minimoUf: 30,
      },
      {
        id: 'constitucion_eirl',
        nombre: 'Constitución de EIRL',
        porcentaje: 10,
        porcentajeSobre: 'capital suscrito',
        minimoUf: 15,
      },
      {
        id: 'modificacion_sociedad',
        nombre: 'Modificación de sociedades o EIRL',
        notas: '2/3 del honorario mínimo fijado para la constitución correspondiente.',
      },
      {
        id: 'quiebras',
        nombre: 'Quiebras',
        notas:
          'Defensa del fallido: 50% del honorario del juicio ordinario. Defensa de acreedores: 10% de lo que perciban. Impugnaciones: 10% de la cantidad discutida. Alzamiento o discusión de la quiebra: 75% del juicio ordinario. Rehabilitación del fallido: Bs 5.500. Convenio judicial preventivo o extrajudicial: 10% del pasivo con mínimo de Bs 5.500.',
      },
      {
        id: 'registro_marcas',
        nombre: 'Registro de marcas',
        montoBs: 4125,
        notas: 'Con oposición: Bs 8.250.',
      },
    ],
  },
  {
    codigo: 'laboral',
    titulo: 'Materias Laborales',
    items: [
      {
        id: 'juicio_laboral_ordinario',
        nombre: 'Juicio laboral ordinario (cobro prestaciones)',
        notas:
          'Trabajador: Bs 2.750 + 10% de lo obtenido. Empleador: Bs 5.500 + 20% de lo ahorrado.',
      },
      {
        id: 'juicio_laboral_monitorio',
        nombre: 'Juicio monitorio laboral',
        notas: 'Trabajador: Bs 4.125. Empleador: Bs 6.875.',
      },
      {
        id: 'juicio_laboral_ejecutivo',
        nombre: 'Juicio ejecutivo laboral',
        notas:
          'Trabajador: Bs 2.750 + 10% de lo obtenido. Empleador: Bs 5.500 + 20% de lo ahorrado.',
      },
      {
        id: 'desafuero',
        nombre: 'Juicios de desafuero',
        notas: 'Trabajador: Bs 4.125. Empleador: Bs 5.500.',
      },
      {
        id: 'amparo_laboral',
        nombre: 'Amparo laboral',
        notas: 'Trabajador: Bs 4.125. Empleador: Bs 6.875.',
      },
      {
        id: 'avenimiento_extrajudicial',
        nombre: 'Avenimiento extrajudicial',
        notas:
          'Trabajador: Bs 1.375 + 10% de lo obtenido. Empleador: Bs 2.750 + 20% de lo ahorrado.',
      },
      {
        id: 'indemnizacion_accidente',
        nombre: 'Indemnización por accidente del trabajo',
        notas:
          'Trabajador: Bs 2.750 + 10% de lo obtenido. Empleador: Bs 5.500 + 20% de lo ahorrado.',
      },
      {
        id: 'indemnizacion_enfermedad',
        nombre: 'Indemnización por enfermedad profesional',
        notas:
          'Trabajador: Bs 2.750 + 10% de lo obtenido. Empleador: Bs 5.500 + 20% de lo ahorrado.',
      },
      {
        id: 'constitucion_sindicato',
        nombre: 'Constitución de sindicatos',
        montoBs: 8250,
      },
      {
        id: 'constitucion_federaciones',
        nombre: 'Constitución de federaciones o confederaciones',
        montoBs: 13750,
      },
      {
        id: 'defensa_sindicato',
        nombre: 'Defensa de sindicato (disolución)',
        montoBs: 8250,
      },
      {
        id: 'defensa_dirigente',
        nombre: 'Defensa de dirigente sindical',
        montoBs: 4125,
      },
      {
        id: 'negociacion_colectiva',
        nombre: 'Negociación colectiva',
        notas:
          'Representando a trabajadores: Bs 4.125 + Bs 138 por trabajador. Representando al empleador: Bs 6.875 + Bs 275 por trabajador.',
      },
      {
        id: 'reclamos_empresa',
        nombre: 'Reclamos por prácticas de la empresa',
        montoBs: 4125,
      },
      {
        id: 'reclamos_sindicato',
        nombre: 'Reclamos contra sindicato',
        montoBs: 4125,
      },
      {
        id: 'reclamo_multas',
        nombre: 'Reclamo de multas',
        montoBs: 4125,
      },
      {
        id: 'reclamo_resoluciones',
        nombre: 'Reclamo de otras resoluciones administrativas',
        montoBs: 2750,
      },
      {
        id: 'cobranza_previsional',
        nombre: 'Cobranza previsional',
        montoBs: 4125,
      },
    ],
  },
  {
    codigo: 'familia',
    titulo: 'Materias de Familia',
    items: [
      {
        id: 'cuidado_personal',
        nombre: 'Causas de cuidado personal',
        montoBs: 5500,
      },
      {
        id: 'patria_potestad',
        nombre: 'Ejercicio, suspensión o pérdida de patria potestad',
        montoBs: 4125,
      },
      {
        id: 'alimentos',
        nombre: 'Causas de alimentos',
        montoBs: 4125,
        porcentaje: 50,
        porcentajeSobre: 'de la pensión demandada',
      },
      {
        id: 'disensos',
        nombre: 'Disensos para contraer matrimonio',
        montoBs: 5500,
      },
      {
        id: 'guardas',
        nombre: 'Guardas',
        montoBs: 4125,
      },
      {
        id: 'medidas_proteccion',
        nombre: 'Medidas de protección',
        montoBs: 4125,
      },
      {
        id: 'filiacion',
        nombre: 'Acciones de filiación',
        montoBs: 5500,
      },
      {
        id: 'salida_menor',
        nombre: 'Autorización de salida del país para menores',
        montoBs: 5500,
      },
      {
        id: 'procedimiento_prev_adopcion',
        nombre: 'Procedimientos previos a la adopción',
        montoBs: 4125,
      },
      {
        id: 'adopcion',
        nombre: 'Procedimiento de adopción',
        montoBs: 5500,
      },
      {
        id: 'regimen_matrimonial',
        nombre: 'Asuntos patrimoniales entre cónyuges',
        escalas: [
          { condicion: 'Bienes hasta Bs 275.000', porcentaje: 5, porcentajeSobre: 'valor de los bienes' },
          { condicion: 'Bienes sobre Bs 275.000', porcentaje: 2, porcentajeSobre: 'valor de los bienes' },
        ],
      },
      {
        id: 'bienes_familiares',
        nombre: 'Declaración o desafectación de bienes familiares',
        notas:
          '5% sobre bienes hasta Bs 275.000; 2% sobre el exceso. Se aplica también a usufructo, uso o habitación.',
      },
      {
        id: 'separacion_judicial',
        nombre: 'Separación judicial',
        montoBs: 4125,
      },
      {
        id: 'nulidad_matrimonio',
        nombre: 'Nulidad de matrimonio',
        montoBs: 5500,
      },
      {
        id: 'divorcio_culpa',
        nombre: 'Divorcio por culpa',
        montoBs: 8250,
      },
      {
        id: 'divorcio_cese_convivencia',
        nombre: 'Divorcio por cese efectivo de la convivencia',
        escalas: [
          { condicion: 'Demandado unilateralmente', montoBs: 5500 },
          { condicion: 'Solicitado de común acuerdo', montoBs: 2200, notas: 'Por cada cónyuge representado' },
        ],
      },
      {
        id: 'interdiccion',
        nombre: 'Declaración de interdicción',
        montoBs: 5500,
      },
      {
        id: 'violencia_intrafamiliar',
        nombre: 'Violencia intrafamiliar',
        montoBs: 4125,
      },
      {
        id: 'compensacion_economica',
        nombre: 'Compensación económica en divorcio',
        porcentaje: 10,
        porcentajeSobre: 'de lo obtenido o lo ahorrado',
        minimoUf: 15,
      },
      {
        id: 'policia_local',
        nombre: 'Materias de policía local (querellas infraccionales)',
        montoBs: 4125,
      },
      {
        id: 'policia_local_indemnizacion',
        nombre: 'Materias de policía local (indemnización de perjuicios)',
        montoBs: 2750,
        porcentaje: 10,
        porcentajeSobre: 'de lo obtenido o ahorrado',
      },
      {
        id: 'consumidor',
        nombre: 'Demandas ley del consumidor',
        notas: 'Clientes: Bs 2.750 + 10% de lo obtenido. Empresas: Bs 5.500.',
      },
    ],
  },
  {
    codigo: 'penal',
    titulo: 'Materias Penales',
    items: [
      {
        id: 'defensa_ordinario',
        nombre: 'Defensa en procedimiento ordinario',
        escalas: [
          { condicion: 'Termina con salida alternativa', montoBs: 4125 },
          { condicion: 'Termina en juicio abreviado', montoBs: 27500 },
          { condicion: 'Termina en juicio oral', montoBs: 41250 },
        ],
      },
      {
        id: 'defensa_simplificado',
        nombre: 'Defensa en procedimiento simplificado',
        escalas: [
          { condicion: 'Acepta responsabilidad o salida alternativa', montoBs: 4125 },
          { condicion: 'Juicio simplificado efectivo', montoBs: 8250 },
        ],
      },
      {
        id: 'querella_ordinario',
        nombre: 'Querella en procedimiento ordinario',
        montoBs: 8250,
      },
      {
        id: 'querella_simplificado',
        nombre: 'Querella en procedimiento simplificado',
        montoBs: 4125,
      },
      {
        id: 'demanda_civil_penal',
        nombre: 'Demanda civil en sede penal',
        porcentaje: 10,
        porcentajeSobre: 'de lo obtenido',
        minimoUf: 15,
      },
    ],
  },
  {
    codigo: 'recursos',
    titulo: 'Recursos',
    items: [
      {
        id: 'apelacion_casacion',
        nombre: 'Apelación o casación',
        porcentaje: 50,
        porcentajeSobre: 'del arancel de primera instancia',
      },
      {
        id: 'nulidad_penal',
        nombre: 'Recurso de nulidad penal',
        montoBs: 13750,
      },
      {
        id: 'nulidad_laboral',
        nombre: 'Recurso de nulidad laboral',
        notas: 'Trabajador: Bs 4.125. Empleador: Bs 6.875.',
      },
      {
        id: 'unificacion_jurisprudencia',
        nombre: 'Recurso de unificación de jurisprudencia (laboral)',
        montoBs: 5500,
      },
      {
        id: 'inaplicabilidad',
        nombre: 'Recurso de inaplicabilidad',
        montoBs: 8250,
      },
      {
        id: 'revision',
        nombre: 'Recurso de revisión',
        montoBs: 13750,
      },
    ],
  },
];

export function findLegalFeeItemById(id?: string | null): LegalFeeItem | undefined {
  if (!id) return undefined;
  const normalized = id.trim().toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  for (const category of LEGAL_FEE_CATEGORIES) {
    const match = category.items.find((item) => {
      if (item.id === normalized || item.id === slug) return true;
      const nameSlug = item.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      return nameSlug === slug;
    });
    if (match) return match;
  }
  return undefined;
}
