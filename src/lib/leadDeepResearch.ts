import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types/lead'

export interface LeadDeepResearchResult {
  investigation_opportunity: string | null
  investigation_pain: string | null
  web_presence_summary: string | null
  strategy_notes: string | null
  video_hook_notes: string | null
  proposed_whatsapp_message: string | null
  alternative_whatsapp_message: string | null
  suggested_score: number | null
  model?: string
}

export function sanitizeLeadForDeepResearch(lead: Lead): Record<string, unknown> {
  return {
    id: lead.id,
    business_name: lead.business_name,
    contact_name: lead.contact_name,
    sector: lead.sector,
    location_label: lead.location_label,
    neighborhood: lead.neighborhood,
    city: lead.city,
    province: lead.province,
    has_website: lead.has_website,
    google_maps_url: lead.google_maps_url,
    instagram_handle: lead.instagram_handle,
    maps_rating: lead.maps_rating,
    review_count: lead.review_count,
    expediente_analysis: lead.expediente_analysis?.slice(0, 2000) ?? null,
    expediente_sales_strategy: lead.expediente_sales_strategy?.slice(0, 2000) ?? null,
    investigation_opportunity: lead.investigation_opportunity?.slice(0, 1500) ?? null,
    investigation_pain: lead.investigation_pain?.slice(0, 1500) ?? null,
  }
}

export async function fetchLeadDeepResearch(
  lead: Lead,
  researchInput: string,
  currentWhatsappMessage: string,
): Promise<LeadDeepResearchResult> {
  const input = researchInput.trim()
  if (input.length < 8) {
    throw new Error('Escribe al menos una URL o unas líneas de información del negocio.')
  }

  const { data, error } = await supabase.functions.invoke<{
    result?: LeadDeepResearchResult
    error?: string
    code?: string
  }>('lead-deep-research', {
    body: {
      lead: sanitizeLeadForDeepResearch(lead),
      research_input: input,
      current_whatsapp_message: currentWhatsappMessage,
    },
  })

  if (error) {
    throw new Error(error.message || 'No se pudo invocar lead-deep-research')
  }

  if (data && typeof data === 'object' && typeof data.error === 'string') {
    throw new Error(data.error)
  }

  const result = data?.result
  if (!result || typeof result !== 'object') {
    throw new Error('La investigación no devolvió resultados válidos.')
  }

  return result
}
