import type { Lead } from '@/types/lead'

/**
 * Un registro pasa a “cliente” cuando hay aceptación registrada (fecha o estado ganado).
 * Criterio alineado con las vistas SQL `leads_clientes` / `leads_potenciales`.
 */
export function isClienteAceptado(lead: Lead): boolean {
  return (
    lead.deal_accepted_at != null ||
    lead.status === 'propuesta_aceptada' ||
    lead.status === 'venta_cerrada'
  )
}

export function isClientePotencial(lead: Lead): boolean {
  return !isClienteAceptado(lead)
}
