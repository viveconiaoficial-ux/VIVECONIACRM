import type { LeadInsert } from '@/types/lead'

/**
 * Payload completo para insertar un lead vía PostgREST (todas las columnas conocidas).
 */
export function createLeadInsert(data: {
  business_name: string
  contact_name?: string | null
  contact_names?: string | null
  email?: string | null
  whatsapp_phone?: string | null
  has_website?: boolean
  sector?: string | null
  location_label?: string | null
  instagram_handle?: string | null
  google_maps_url?: string | null
  expediente_analysis?: string | null
  expediente_visual_assets?: string | null
  expediente_sales_strategy?: string | null
  expediente_outreach_message?: string | null
  expediente_followup_no_response?: string | null
}): LeadInsert {
  const t = (s: string | null | undefined) =>
    s != null && String(s).trim() !== '' ? String(s).trim() : null

  const igRaw = t(data.instagram_handle)
  const ig = igRaw != null ? igRaw.replace(/^@/, '') : null

  return {
    business_name: data.business_name.trim(),
    contact_name: t(data.contact_name),
    contact_names: t(data.contact_names),
    email: t(data.email),
    whatsapp_phone: t(data.whatsapp_phone),
    has_website: data.has_website ?? false,
    sector: t(data.sector),
    status: 'sin_contactar',
    location_label: t(data.location_label),
    instagram_handle: ig,
    google_maps_url: t(data.google_maps_url),
    expediente_analysis: t(data.expediente_analysis),
    expediente_visual_assets: t(data.expediente_visual_assets),
    expediente_sales_strategy: t(data.expediente_sales_strategy),
    expediente_outreach_message: t(data.expediente_outreach_message),
    expediente_followup_no_response: t(data.expediente_followup_no_response),
    social_photos_urls: null,
    brand_style_notes: null,
    social_quality: null,
    has_instagram: ig ? true : null,
    video_url: null,
    video_created_at: null,
    wa_msg1_sent_at: null,
    wa_msg1_response: null,
    wa_msg2_sent_at: null,
    last_contact_date: null,
    notes: null,
    proposal_url: null,
    daily_batch_date: null,
    deal_proposal_summary: null,
    deal_budget_amount: null,
    deal_budget_currency: 'EUR',
    deal_scope_notes: null,
    deal_commercial_terms: null,
    deal_next_followup_at: null,
    deal_accepted_at: null,
    deal_closed_at: null,
    deal_rejection_reason: null,
    failure_ai_reflection: null,
    priority: null,
    score: null,
    neighborhood: null,
    city: null,
    province: null,
    maps_rating: null,
    review_count: null,
    web_presence_summary: null,
    sector_tags: null,
    investigation_opportunity: null,
    investigation_pain: null,
    message_sondeo_directo: null,
    message_sondeo_consultivo: null,
    strategy_notes: null,
    video_hook_notes: null,
    research_payload: null,
    proposal_image_paths: [],
  }
}
