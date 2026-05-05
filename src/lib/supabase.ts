/**
 * Cliente Supabase del CRM "Vive con IA". Solo habla con el proyecto cuyas
 * credenciales pongas en `.env.local`. No altera ningún proyecto remoto por sí solo.
 */
import { createClient } from '@supabase/supabase-js'
import { LEAD_STATUSES } from '@/constants'
import { normalizeSupabaseUrl } from '@/lib/supabaseUrl'
import type {
  LeadCompetitor,
  LeadInteraction,
  LeadProposal,
  LeadProposalInsert,
} from '@/types/analytics'
import type { Lead, LeadInsert, LeadStatus, LeadUpdate } from '@/types/lead'

const supabaseUrlRaw = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

if (!supabaseUrlRaw || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY',
  )
}

const supabaseUrl = normalizeSupabaseUrl(supabaseUrlRaw)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const LEGACY_STATUS_MAP: Record<string, LeadStatus> = {
  seguimiento: 'contestada_seguimiento',
}

function normalizeLeadRow(row: Lead): Lead {
  const raw = row.status as string
  let status = LEGACY_STATUS_MAP[raw] ?? raw
  if (!LEAD_STATUSES.includes(status as LeadStatus)) {
    status = 'lead_frio'
  }
  return { ...row, status: status as LeadStatus }
}

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Lead[]).map(normalizeLeadRow)
}

export async function getLeadById(id: string): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return normalizeLeadRow(data as Lead)
}

export async function insertLead(lead: LeadInsert): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single()
  if (error) throw error
  return normalizeLeadRow(data as Lead)
}

export async function updateLead(
  id: string,
  updates: LeadUpdate,
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalizeLeadRow(data as Lead)
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}

/** Append-only: registrar acciones para analítica (embudo, cohortes, etc.). */
export async function logLeadInteraction(
  leadId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
  channel = 'crm',
): Promise<LeadInteraction> {
  const { data, error } = await supabase
    .from('lead_interactions')
    .insert({ lead_id: leadId, event_type: eventType, channel, metadata })
    .select()
    .single()
  if (error) throw error
  return data as LeadInteraction
}

export async function getLeadCompetitors(
  leadId: string,
): Promise<LeadCompetitor[]> {
  const { data, error } = await supabase
    .from('lead_competitors')
    .select('*')
    .eq('lead_id', leadId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data as LeadCompetitor[]
}

export async function getLeadProposals(
  leadId: string,
): Promise<LeadProposal[]> {
  const { data, error } = await supabase
    .from('lead_proposals')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as LeadProposal[]
}

export async function insertLeadProposal(
  row: LeadProposalInsert,
): Promise<LeadProposal> {
  const { data, error } = await supabase
    .from('lead_proposals')
    .insert(row)
    .select()
    .single()
  if (error) throw error
  return data as LeadProposal
}
