/**
 * Convención de eventos para `lead_interactions.event_type` (analítica / embudo).
 * Ajusta en un solo sitio si añades más.
 */
export type LeadInteractionEventType =
  | 'wa_draft_created'
  | 'wa_message_sent'
  | 'wa_video_sent'
  | 'web_analysis_opened'
  | 'proposal_generated'
  | 'proposal_viewed'
  | 'status_changed'
  | 'note_added'
  | 'research_refreshed'
  | 'email_sent'
  | 'call_logged'

export interface LeadInteraction {
  id: string
  lead_id: string
  event_type: string
  channel: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type LeadInteractionInsert = Omit<LeadInteraction, 'id' | 'created_at'>

export interface LeadCompetitor {
  id: string
  lead_id: string
  sort_order: number
  name: string
  rating: number | null
  review_count: number | null
  has_website: boolean | null
  website_quality: string | null
  opening_hours: string | null
  phone: string | null
  notes: string | null
  threat_level: string | null
  created_at: string
}

export type LeadCompetitorInsert = Omit<
  LeadCompetitor,
  'id' | 'created_at'
>

/**
 * Bloques sugeridos dentro de `sections` (lead_proposals):
 * local_seo_keywords, impact_estimates, tech_stack_options,
 * site_architecture_pages, services_tags, conclusion, owner_profile, market_context, …
 */
export interface LeadProposal {
  id: string
  lead_id: string
  kind: string
  title: string | null
  sections: Record<string, unknown>
  source: string | null
  created_at: string
}

export type LeadProposalInsert = Omit<LeadProposal, 'id' | 'created_at'>
