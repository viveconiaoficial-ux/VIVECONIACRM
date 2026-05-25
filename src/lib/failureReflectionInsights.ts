import { buildReflectionsBatchPayload } from '@/lib/savedFailureReflections'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types/lead'

const INSIGHTS_STORAGE_KEY = 'vive-crm-failure-insights-last'

export interface FailureInsightsCache {
  generatedAt: string
  count: number
  insights: string
}

export function loadCachedFailureInsights(): FailureInsightsCache | null {
  try {
    const raw = localStorage.getItem(INSIGHTS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FailureInsightsCache
    if (typeof parsed.insights === 'string' && parsed.insights.trim()) return parsed
  } catch {
    /* ignore */
  }
  return null
}

export function saveCachedFailureInsights(cache: FailureInsightsCache): void {
  try {
    localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* ignore */
  }
}

export function clearCachedFailureInsights(): void {
  try {
    localStorage.removeItem(INSIGHTS_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Análisis transversal: qué patrones salen de muchas reflexiones guardadas. */
export async function fetchFailureReflectionInsights(
  leads: Lead[],
): Promise<string> {
  const reflections = buildReflectionsBatchPayload(leads)
  if (reflections.length === 0) {
    throw new Error('No hay reflexiones guardadas para analizar.')
  }

  const { data, error } = await supabase.functions.invoke<{
    insights?: string
    error?: string
    code?: string
  }>('failure-reflection-insights', {
    body: { reflections },
  })

  if (error) {
    throw new Error(error.message || 'No se pudo invocar failure-reflection-insights')
  }

  if (data && typeof data === 'object' && typeof data.error === 'string') {
    throw new Error(data.error)
  }

  const insights =
    data && typeof data === 'object' && typeof data.insights === 'string'
      ? data.insights.trim()
      : ''

  if (!insights) {
    throw new Error('La función no devolvió texto de análisis.')
  }

  return insights
}
