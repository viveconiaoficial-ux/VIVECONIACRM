import { WA_MSG1_TEMPLATE } from '@/constants'
import type { Lead } from '@/types/lead'

/** Mensaje que usa el botón de WhatsApp (Msg 1) en la ficha. */
export function getLeadPrimaryWhatsAppMessage(lead: Lead): string {
  const custom = lead.expediente_outreach_message?.trim()
  if (custom) return custom
  const nombre = lead.contact_name?.trim() || lead.business_name
  return WA_MSG1_TEMPLATE.replace('{{nombre}}', nombre).replace(
    '{{negocio}}',
    lead.business_name,
  )
}

export function isExpedienteOutreachMessage(lead: Lead): boolean {
  return (lead.expediente_outreach_message?.trim() ?? '').length > 0
}
