'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/roles';
import {
  CASE_MATERIAS,
  DEPARTAMENTOS_BOLIVIA,
  ETAPAS_PROCESALES,
} from '@/lib/validators/case';
import type { Json } from '@/lib/supabase/types';

export type CatalogKey = 'materias' | 'tribunales' | 'etapas' | 'departamentos';

type CatalogConfig = {
  settingKey: string;
  defaultValue: string[];
  description: string;
};

const DEFAULT_TRIBUNALES = [
  'Juzgado Público Civil y Comercial 1° de La Paz',
  'Juzgado Público de Trabajo y Seguridad Social de Santa Cruz',
  'Juzgado de Partido Mixto de Cochabamba',
  'Tribunal Departamental de Justicia de La Paz - Sala Civil',
];

const CATALOG_DEFINITIONS: Record<CatalogKey, CatalogConfig> = {
  materias: {
    settingKey: 'catalog_materias',
    defaultValue: [...CASE_MATERIAS],
    description: 'Listado de materias legales disponibles en la creación de casos.',
  },
  tribunales: {
    settingKey: 'catalog_tribunales',
    defaultValue: DEFAULT_TRIBUNALES,
    description: 'Tribunales, juzgados o salas frecuentes para autocompletar formularios.',
  },
  etapas: {
    settingKey: 'catalog_etapas_procesales',
    defaultValue: [...ETAPAS_PROCESALES],
    description: 'Etapas procesales para sugerir en el seguimiento del caso.',
  },
  departamentos: {
    settingKey: 'catalog_departamentos',
    defaultValue: [...DEPARTAMENTOS_BOLIVIA],
    description: 'Departamentos o regiones utilizados en la ficha del caso.',
  },
};

function parseSettingValue(value: Json | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as Json;
      return parseSettingValue(parsed);
    } catch {
      return value
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function sanitizeCatalog(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const normalized = value.replace(/\s+/g, ' ');
    if (!seen.has(normalized.toLowerCase())) {
      seen.add(normalized.toLowerCase());
      cleaned.push(normalized);
    }
  }

  return cleaned;
}

export async function getMasterCatalogs(): Promise<Record<CatalogKey, string[]>> {
  const supabase = createServiceClient();
  const settingKeys = Object.values(CATALOG_DEFINITIONS).map(def => def.settingKey);

  const { data, error } = await supabase
    .from('security_settings')
    .select('setting_key, setting_value, is_active')
    .in('setting_key', settingKeys);

  if (error) {
    console.error('[catalogs] Error reading security_settings:', error);
  }

  const result = {} as Record<CatalogKey, string[]>;
  const rows = data ?? [];

  (Object.entries(CATALOG_DEFINITIONS) as Array<[CatalogKey, CatalogConfig]>).forEach(
    ([catalogKey, { settingKey, defaultValue }]) => {
      const match = rows.find(row => row.setting_key === settingKey && row.is_active !== false);
      const parsed = match ? parseSettingValue(match.setting_value as Json) : [];
      result[catalogKey] = parsed.length > 0 ? sanitizeCatalog(parsed) : [...defaultValue];
    }
  );

  return result;
}

export async function updateMasterCatalog(key: CatalogKey, values: string[]) {
  const catalog = CATALOG_DEFINITIONS[key];
  if (!catalog) {
    throw new Error('Catálogo desconocido');
  }

  const profile = await requireAuth();
  if (profile.role !== 'admin_firma') {
    throw new Error('Sin permisos para actualizar catálogos.');
  }

  const sanitized = sanitizeCatalog(values);

  if (sanitized.length === 0) {
    throw new Error('Debes ingresar al menos un elemento.');
  }

  const supabase = createServiceClient();
  const payload = {
    setting_key: catalog.settingKey,
    setting_value: sanitized as Json,
    description: catalog.description,
    is_active: true,
    updated_by: profile.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('security_settings')
    .upsert(payload, { onConflict: 'setting_key' });

  if (error) {
    console.error('[catalogs] Error updating catalog', key, error);
    throw new Error('No se pudo guardar el catálogo. Intenta nuevamente.');
  }

  revalidatePath('/settings');
  revalidatePath('/cases/new');
  revalidatePath('/cases');

  return { success: true, items: sanitized };
}
