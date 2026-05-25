export type LeadStatus =
  | 'sin_contactar'
  | 'propuesta_enviada'
  | 'contestada_negociacion'
  | 'propuesta_aceptada'
  /** Rechazo explícito (visible solo en Histórico) */
  | 'contestada_rechazada'
  /** Sin respuesta / descarte tipo “fantasma” (visible solo en Histórico) */
  | 'ignorada_rechazada'

export type SocialQuality = 'buena' | 'regular' | 'inexistente'

export type WaResponse = 'si' | 'no' | 'sin_respuesta'

/** Prioridad tipo tarjeta (#1 prioridad alta, etc.) */
export type LeadPriority = 'alta' | 'media' | 'baja'

export interface Lead {
  id: string
  created_at: string
  updated_at: string | null

  business_name: string
  contact_name: string | null
  email: string | null
  whatsapp_phone: string | null

  has_website: boolean
  sector: string | null
  status: LeadStatus

  social_photos_urls: string[] | null
  brand_style_notes: string | null
  social_quality: SocialQuality | null
  has_instagram: boolean | null

  video_url: string | null
  video_created_at: string | null

  wa_msg1_sent_at: string | null
  wa_msg1_response: WaResponse | null
  wa_msg2_sent_at: string | null

  last_contact_date: string | null
  notes: string | null
  proposal_url: string | null
  daily_batch_date: string | null

  /** Intercambio comercial: propuesta, presupuesto y cierre (migración 004) */
  deal_proposal_summary: string | null
  deal_budget_amount: number | null
  deal_budget_currency: string | null
  deal_scope_notes: string | null
  deal_commercial_terms: string | null
  deal_next_followup_at: string | null
  deal_accepted_at: string | null
  deal_closed_at: string | null
  deal_rejection_reason: string | null
  /** Reflexión sobre el fracaso (IA / n8n / borrador en Analíticas). Migración 20260125120006. */
  failure_ai_reflection: string | null

  // —— Investigación / tarjeta enriquecida (migración 002)
  priority: LeadPriority | null
  score: number | null
  neighborhood: string | null
  city: string | null
  province: string | null
  location_label: string | null
  maps_rating: number | null
  review_count: number | null
  google_maps_url: string | null
  instagram_handle: string | null
  web_presence_summary: string | null
  contact_names: string | null
  sector_tags: string[] | null
  investigation_opportunity: string | null
  investigation_pain: string | null
  message_sondeo_directo: string | null
  message_sondeo_consultivo: string | null
  strategy_notes: string | null
  video_hook_notes: string | null
  research_payload: Record<string, unknown> | null

  /** Expediente comercial manual (migración 003) */
  expediente_analysis: string | null
  expediente_visual_assets: string | null
  expediente_sales_strategy: string | null
  expediente_outreach_message: string | null
  /** Segundo mensaje si no hubo respuesta al primero (migración 007) */
  expediente_followup_no_response: string | null
  /**
   * Rutas en Storage (`proposal-images/{lead_id}/...`), enviadas con la propuesta.
   * Migración 008.
   */
  proposal_image_paths: string[]
}

export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at'>
export type LeadUpdate = Partial<LeadInsert> & {
  updated_at?: string | null
}
