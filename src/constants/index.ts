import type { LeadStatus } from '@/types/lead'

/** Embudo Kanban / panel principal (sin rechazos; van a Histórico) */
export const LEAD_PIPELINE_STATUSES: LeadStatus[] = [
  'sin_contactar',
  'propuesta_enviada',
  'contestada_negociacion',
  'propuesta_aceptada',
]

/** Rechazos: solo vista Histórico */
export const LEAD_HISTORICO_REJECTION_STATUSES: LeadStatus[] = [
  'contestada_rechazada',
  'ignorada_rechazada',
]

/** Todos los estados válidos para selects y modelo */
export const LEAD_STATUSES: LeadStatus[] = [
  ...LEAD_PIPELINE_STATUSES,
  ...LEAD_HISTORICO_REJECTION_STATUSES,
]

export const STATUS_LABELS: Record<LeadStatus, string> = {
  sin_contactar: 'Sin contactar',
  propuesta_enviada: 'Propuesta enviada',
  contestada_negociacion: 'Contestada · en negociación',
  propuesta_aceptada: 'Propuesta aceptada',
  contestada_rechazada: 'Contestada · rechazada',
  ignorada_rechazada: 'Ignorada · rechazada',
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  sin_contactar:
    'border-stone-500/25 bg-stone-500/12 text-stone-200 shadow-sm',
  propuesta_enviada:
    'border-sky-400/25 bg-sky-500/12 text-sky-100 shadow-sm',
  contestada_negociacion:
    'border-orange-400/28 bg-orange-500/12 text-orange-100 shadow-sm',
  propuesta_aceptada:
    'border-lime-400/28 bg-lime-500/14 text-lime-100 shadow-sm',
  contestada_rechazada:
    'border-red-400/28 bg-red-500/12 text-red-100 shadow-sm',
  ignorada_rechazada:
    'border-zinc-500/35 bg-zinc-800/40 text-zinc-300 shadow-sm',
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
