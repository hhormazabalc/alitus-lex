'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, canAccessCase } from '@/lib/auth/roles';
import type { CaseCounterparty } from '@/lib/supabase/types';
import { validateIdentityDocument } from '@/lib/validators/case';

const createCounterpartySchema = z.object({
  caseId: z.string().uuid('ID de caso inválido'),
  nombre: z
    .string()
    .min(2, 'El nombre es requerido')
    .max(1000, 'El nombre no puede exceder 1000 caracteres')
    .transform((value) => value.trim()),
  rut: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined)
    .refine((value) => (value ? validateIdentityDocument(value) : true), { message: 'Documento de identidad inválido' }),
  tipo: z.enum(['demandado', 'demandante', 'tercero']).default('demandado'),
});

const deleteCounterpartySchema = z.object({
  id: z.string().uuid('ID de contraparte inválido'),
});

type CreateCounterpartyResult =
  | { success: true; counterparty: CaseCounterparty }
  | { success: false; error: string };

type DeleteCounterpartyResult = { success: true } | { success: false; error: string };

export async function createCaseCounterparty(
  input: z.infer<typeof createCounterpartySchema>,
): Promise<CreateCounterpartyResult> {
  const profile = await requireAuth(['admin_firma', 'analista', 'abogado']);
  if (!profile.org_id) throw new Error('Selecciona una organización activa.');
  const payload = createCounterpartySchema.parse(input);

  const supabase = await createServerClient();

  const hasAccess = await canAccessCase(payload.caseId);
  if (!hasAccess) {
    return {
      success: false as const,
      error: 'Sin permisos para gestionar contrapartes en este caso.',
    };
  }

  const { data, error } = await supabase
    .from('case_counterparties')
    .insert({
      case_id: payload.caseId,
      nombre: payload.nombre,
      rut: payload.rut ?? null,
      tipo: payload.tipo,
      org_id: profile.org_id,
    })
    .select()
    .single<CaseCounterparty>();

  if (error || !data) {
    console.error('[createCaseCounterparty] error inserting counterparty', error);
    return {
      success: false as const,
      error:
        error?.message ?? 'No se pudo agregar la contraparte. Revisa los datos e inténtalo nuevamente.',
    };
  }

  revalidatePath(`/cases/${payload.caseId}`);
  revalidatePath('/cases');

  return {
    success: true as const,
    counterparty: data,
  };
}

export async function deleteCaseCounterparty(
  input: z.infer<typeof deleteCounterpartySchema>,
): Promise<DeleteCounterpartyResult> {
  const profile = await requireAuth(['admin_firma', 'analista', 'abogado']);
  if (!profile.org_id) throw new Error('Selecciona una organización activa.');
  const payload = deleteCounterpartySchema.parse(input);

  const supabase = await createServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from('case_counterparties')
    .select('id, case_id, org_id')
    .eq('id', payload.id)
    .eq('org_id', profile.org_id)
    .maybeSingle<Pick<CaseCounterparty, 'id' | 'case_id' | 'org_id'>>();

  if (fetchError) {
    console.error('[deleteCaseCounterparty] error fetching counterparty', fetchError);
    return { success: false as const, error: 'No encontramos la contraparte seleccionada.' };
  }

  if (!existing) {
    return { success: false as const, error: 'La contraparte ya fue eliminada.' };
  }

  const hasAccess = await canAccessCase(existing.case_id);
  if (!hasAccess) {
    return {
      success: false as const,
      error: 'Sin permisos para eliminar esta contraparte.',
    };
  }

  const { error } = await supabase
    .from('case_counterparties')
    .delete()
    .eq('id', payload.id)
    .eq('org_id', profile.org_id);

  if (error) {
    console.error('[deleteCaseCounterparty] error deleting counterparty', error);
    return {
      success: false as const,
      error: error.message ?? 'No se pudo eliminar la contraparte.',
    };
  }

  revalidatePath(`/cases/${existing.case_id}`);
  revalidatePath('/cases');

  return { success: true as const };
}
