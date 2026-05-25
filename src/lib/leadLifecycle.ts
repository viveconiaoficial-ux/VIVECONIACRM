import { LEAD_HISTORICO_REJECTION_STATUSES } from '@/constants'
import type { Lead, LeadStatus } from '@/types/lead'

/** Rechazo o descarte cerrado → solo aparece en la pestaña Histórico */
export function isLeadHistoricoRechazo(lead: Lead): boolean {
  return LEAD_HISTORICO_REJECTION_STATUSES.includes(lead.status)
}

/** Prospectos / clientes activos que sí deben mostrarse en el panel principal */
export function isVisibleInMainPanels(lead: Lead): boolean {
  return !isLeadHistoricoRechazo(lead)
}

/**
 * Cliente cuando hay aceptación registrada (fecha o estado ganado).
 * Alineado con la vista SQL `leads_clientes`.
 */
export function isClienteAceptado(lead: Lead): boolean {
  return (
    lead.deal_accepted_at != null || lead.status === 'propuesta_aceptada'
  )
}

export function isClientePotencial(lead: Lead): boolean {
  return (
    !isClienteAceptado(lead) && isVisibleInMainPanels(lead)
  )
}

export function isClienteAceptadoVisible(lead: Lead): boolean {
  return isClienteAceptado(lead) && isVisibleInMainPanels(lead)
}

/** Mapa sólo desarrollo/APIs antiguas; Supabase debe tener migración 009 aplicada. */
export const LEGACY_LEAD_STATUS_TO_CURRENT: Partial<
  Record<string, LeadStatus>
> = {
  seguimiento: 'contestada_negociacion',
  lead_frio: 'sin_contactar',
  primer_acercamiento: 'sin_contactar',
  esperando_respuesta: 'propuesta_enviada',
  ignorada: 'ignorada_rechazada',
  contestada_seguimiento: 'contestada_negociacion',
  negociacion: 'contestada_negociacion',
  rechazado: 'contestada_rechazada',
  descartada_interna: 'ignorada_rechazada',
  venta_cerrada: 'propuesta_aceptada',
}
