import type { LeadStatus } from '@/types/lead'

export const STATUS_LABELS: Record<LeadStatus, string> = {
  lead_frio: 'Sin contactar / frío',
  primer_acercamiento: 'Primer acercamiento',
  propuesta_enviada: 'Propuesta enviada',
  esperando_respuesta: 'En espera de respuesta',
  ignorada: 'Ignorada / sin respuesta',
  contestada_seguimiento: 'Contestada · seguimiento',
  negociacion: 'Contestada · en negociación',
  propuesta_aceptada: 'Propuesta aceptada',
  venta_cerrada: 'Cerrada / ganada',
  rechazado: 'Contestada y rechazada',
  descartada_interna: 'Descartada (interno)',
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  lead_frio:
    'border-stone-500/25 bg-stone-500/12 text-stone-200 shadow-sm',
  primer_acercamiento:
    'border-violet-400/25 bg-violet-500/12 text-violet-100 shadow-sm',
  propuesta_enviada:
    'border-sky-400/25 bg-sky-500/12 text-sky-100 shadow-sm',
  esperando_respuesta:
    'border-cyan-400/25 bg-cyan-500/12 text-cyan-100 shadow-sm',
  ignorada:
    'border-stone-600/35 bg-stone-800/40 text-stone-400 shadow-sm',
  contestada_seguimiento:
    'border-amber-400/30 bg-amber-500/14 text-amber-100 shadow-sm',
  negociacion:
    'border-orange-400/28 bg-orange-500/12 text-orange-100 shadow-sm',
  propuesta_aceptada:
    'border-lime-400/28 bg-lime-500/14 text-lime-100 shadow-sm',
  venta_cerrada:
    'border-emerald-400/28 bg-emerald-500/12 text-emerald-100 shadow-sm',
  rechazado:
    'border-red-400/28 bg-red-500/12 text-red-100 shadow-sm',
  descartada_interna:
    'border-zinc-500/30 bg-zinc-800/35 text-zinc-400 shadow-sm',
}

export const SECTORS = [
  'Restauración',
  'Peluquería / Estética',
  'Clínica / Salud',
  'Inmobiliaria',
  'Retail / Moda',
  'Hostelería',
  'Formación',
  'Fontanería / Reformas',
  'Automoción',
  'Otro',
] as const

/** Opción del desplegable que abre el campo de sector manual. */
export const SECTOR_OTRO: (typeof SECTORS)[number] = 'Otro'

export const WA_MSG1_TEMPLATE =
  `Hola {{nombre}} 👋 He visto {{negocio}} y tengo algo preparado específicamente para vosotros. ¿Te lo mando?`

export const WA_MSG2_TEMPLATE =
  `Genial {{nombre}} 🎬 Aquí te dejo el vídeo que he preparado para {{negocio}}: {{video_url}}\n\nEn menos de 2 minutos verás exactamente lo que podríamos hacer juntos.`

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  return `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`
}

/** Orden del pipeline Kanban: embudo y columnas de cierre / pérdida */
export const LEAD_STATUSES: LeadStatus[] = [
  'lead_frio',
  'primer_acercamiento',
  'propuesta_enviada',
  'esperando_respuesta',
  'contestada_seguimiento',
  'negociacion',
  'propuesta_aceptada',
  'venta_cerrada',
  'ignorada',
  'rechazado',
  'descartada_interna',
]
