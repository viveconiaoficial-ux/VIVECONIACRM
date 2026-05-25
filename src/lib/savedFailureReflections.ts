import { STATUS_LABELS } from '@/constants'
import type { Lead } from '@/types/lead'

/** Mínimo de reflexiones guardadas para pedir análisis global con IA. */
export const MIN_REFLECTIONS_FOR_PATTERN_AI = 3

export function hasSavedFailureReflection(lead: Lead): boolean {
  return (lead.failure_ai_reflection?.trim() ?? '').length > 0
}

export function getLeadsWithSavedReflections(leads: Lead[]): Lead[] {
  return leads
    .filter(hasSavedFailureReflection)
    .sort((a, b) => {
      const ta = new Date(a.updated_at ?? a.created_at).getTime()
      const tb = new Date(b.updated_at ?? b.created_at).getTime()
      return tb - ta
    })
}

export function reflectionExcerpt(text: string, max = 220): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

/** Resumen para análisis global (Edge / OpenRouter). */
export function buildReflectionsBatchPayload(leads: Lead[]): Record<string, unknown>[] {
  return leads.filter(hasSavedFailureReflection).map((l) => ({
    id: l.id,
    business_name: l.business_name,
    sector: l.sector,
    status: l.status,
    status_label: STATUS_LABELS[l.status] ?? l.status,
    deal_rejection_reason: l.deal_rejection_reason?.slice(0, 500) ?? null,
    reflection: l.failure_ai_reflection!.trim().slice(0, 2500),
    updated_at: l.updated_at ?? l.created_at,
  }))
}
