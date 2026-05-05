import { jsPDF } from 'jspdf'
import { STATUS_LABELS } from '@/constants'
import type { LeadCompetitor, LeadProposal } from '@/types/analytics'
import type { Lead } from '@/types/lead'

export interface LeadInvestigationPdfContext {
  competitors: LeadCompetitor[]
  proposals: LeadProposal[]
}

/** Paleta sobria tipo informe consultoría (RGB 0-255) */
const C = {
  paper: [255, 255, 253] as [number, number, number],
  ink: [28, 27, 25] as [number, number, number],
  muted: [95, 90, 85] as [number, number, number],
  hairline: [222, 215, 208] as [number, number, number],
  accentLine: [160, 110, 45] as [number, number, number],
}

const MARGIN_MM = 20
const FOOTER_MM = 12
const BODY_LINE_PT = 4.85
const VALUE_SIZE = 10

/** Helvetica en jsPDF (WinAnsi) no dibuja bien tipografía “rica”, símbolos ni emoji. */
function sanitizePdfText(input: string): string {
  let s = input
    .replace(/\uFEFF/g, '')
    .replace(/\u2028|\u2029/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F«»„]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2022|\u2023|\u2043|\u2219|\u25E6/g, '*')
    .replace(/[\u2605\u2606\u272F\u2734\u2B50]/g, '*')
    .replace(/\u00AD/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2212/g, '-')
    .replace(/\u03BC/g, 'u')
    .replace(/[\u200B-\u200D\u2060]/g, '')
    .replace(/\u202F|\u2007|\u2009|\u200A|\u205F/g, ' ')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')

  let out = ''
  for (const ch of s.normalize('NFKC')) {
    const c = ch.codePointAt(0)!
    if (c === 10) {
      out += '\n'
      continue
    }
    if (c === 9) {
      out += ' '
      continue
    }
    if (c >= 32 && c <= 126) {
      out += ch
      continue
    }
    if (c >= 160 && c <= 255) {
      out += ch
      continue
    }
  }
  return out.replace(/\n{3,}/g, '\n\n').trimEnd()
}

function txt(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const t = String(raw).trim()
  return t === '' ? null : t
}

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    const d = sanitizePdfText(
      new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date(iso)),
    )
    return d || iso
  } catch {
    return sanitizePdfText(iso)
  }
}

function fileSlug(name: string): string {
  const base = sanitizePdfText(name)
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 72)
  return base || 'ficha'
}

function fileSlugFromLead(lead: Lead): string {
  const parts = [sanitizePdfText(lead.business_name)]
  const contact = lead.contact_name?.trim()
  if (contact) parts.push(sanitizePdfText(contact))
  return fileSlug(parts.join(' '))
}

type Block = { label: string; value: string }

function addBlocksForLead(lead: Lead, ctx: LeadInvestigationPdfContext): {
  exportLabel: string
  sections: { title: string; blocks: Block[] }[]
} {
  const sections: { title: string; blocks: Block[] }[] = []

  const pushSection = (title: string, blocks: (Block | null)[]) => {
    const clean = blocks.filter((b): b is Block => b != null)
    if (clean.length) sections.push({ title, blocks: clean })
  }

  const b = (label: string, raw: string | null | undefined): Block | null => {
    const v = txt(raw)
    return v ? { label, value: v } : null
  }

  const bDate = (label: string, iso: string | null | undefined): Block | null => {
    const d = fmtDate(iso)
    return d ? { label, value: d } : null
  }

  const embudo: (Block | null)[] = [
    {
      label: 'Estado del embudo',
      value: sanitizePdfText(STATUS_LABELS[lead.status]),
    },
    b('Prioridad', lead.priority ?? undefined),
    lead.score != null ? { label: 'Score', value: `${lead.score}/100` } : null,
    bDate('Alta en CRM', lead.created_at),
    bDate('Última actualización', lead.updated_at),
    bDate('Último contacto', lead.last_contact_date),
    b('Lote diario', lead.daily_batch_date ?? undefined),
  ]
  pushSection('Embudo y priorización', embudo)

  const contactBits: (Block | null)[] = [
    b('Persona de contacto', lead.contact_name),
    b('Contactos', lead.contact_names),
    b('Email', lead.email),
    b('WhatsApp', lead.whatsapp_phone),
    b('Sector', lead.sector),
  ]
  const hasContactDetail = contactBits.some((x) => x != null)
  if (hasContactDetail || lead.has_website) {
    const finalContact: (Block | null)[] = [...contactBits]
    if (hasContactDetail || lead.has_website) {
      finalContact.push({
        label: 'Sitio web',
        value: lead.has_website ? 'Sí' : 'No',
      })
    }
    pushSection('Contacto', finalContact)
  }

  const mapsLine =
    lead.maps_rating != null && lead.review_count != null
      ? `${lead.maps_rating} estrellas (${lead.review_count} reseñas)`
      : null
  pushSection('Ubicación y Maps', [
    b('Ubicación', lead.location_label),
    b('Barrio', lead.neighborhood),
    b('Ciudad', lead.city),
    b('Provincia', lead.province),
    mapsLine ? { label: 'Valoración Maps', value: mapsLine } : null,
    b('URL Google Maps', lead.google_maps_url),
  ])

  const ig = lead.instagram_handle
    ? `@${lead.instagram_handle.replace(/^@/, '')}`
    : null
  const dig: (Block | null)[] = [
    ig ? { label: 'Instagram', value: ig } : null,
    lead.has_instagram != null
      ? {
          label: 'Instagram activo',
          value: lead.has_instagram ? 'Sí' : 'No',
        }
      : null,
    b('Calidad en redes', lead.social_quality ?? undefined),
    b('Resumen presencia web', lead.web_presence_summary),
    b('Estilo de marca', lead.brand_style_notes),
    lead.sector_tags?.length
      ? { label: 'Tags sector', value: lead.sector_tags.join(', ') }
      : null,
  ]
  if (lead.social_photos_urls?.length) {
    dig.push({
      label: 'URLs fotos en redes',
      value: lead.social_photos_urls.join('\n'),
    })
  }
  pushSection('Presencia digital y marca', dig)

  pushSection('Investigación cualitativa', [
    b('Oportunidad', lead.investigation_opportunity),
    b('Dolor / necesidad', lead.investigation_pain),
    b('Mensaje sondeo directo', lead.message_sondeo_directo),
    b('Mensaje sondeo consultivo', lead.message_sondeo_consultivo),
    b('Estrategia y notas', lead.strategy_notes),
    b('Gancho vídeo / seguimiento', lead.video_hook_notes),
  ])

  pushSection('Expediente comercial', [
    b('Análisis', lead.expediente_analysis),
    b('Activos visuales y referencias', lead.expediente_visual_assets),
    b('Estrategia de venta', lead.expediente_sales_strategy),
    b('Mensaje de outreach', lead.expediente_outreach_message),
    b(
      'Segundo mensaje (sin respuesta)',
      lead.expediente_followup_no_response,
    ),
    lead.proposal_image_paths?.length
      ? {
          label: 'Imágenes con la propuesta',
          value: `${lead.proposal_image_paths.length} archivo(s) enlazados en el CRM.`,
        }
      : null,
  ])

  const budget =
    lead.deal_budget_amount != null
      ? `${lead.deal_budget_amount} ${txt(lead.deal_budget_currency) ?? 'EUR'}`
      : null
  pushSection('Intercambio comercial', [
    b('URL propuesta', lead.proposal_url),
    b('Resumen u oferta', lead.deal_proposal_summary),
    budget ? { label: 'Importe', value: budget } : null,
    b('Alcance y entregables', lead.deal_scope_notes),
    b('Condiciones comerciales', lead.deal_commercial_terms),
    bDate('Próximo seguimiento', lead.deal_next_followup_at),
    bDate('Fecha de aceptación', lead.deal_accepted_at),
    bDate('Cierre / cobro', lead.deal_closed_at),
    b('Motivo de rechazo o descarte', lead.deal_rejection_reason),
  ])

  pushSection('Vídeo y WhatsApp', [
    b('URL del vídeo', lead.video_url),
    bDate('Vídeo registrado', lead.video_created_at),
    bDate('WA mensaje 1 enviado', lead.wa_msg1_sent_at),
    b('Respuesta al mensaje 1', lead.wa_msg1_response ?? undefined),
    bDate('WA mensaje 2 enviado', lead.wa_msg2_sent_at),
  ])

  if (txt(lead.notes)) {
    pushSection('Notas del pipeline', [{ label: 'Notas', value: lead.notes!.trim() }])
  }

  if (ctx.competitors.length) {
    const blocks: Block[] = []
    for (const c of ctx.competitors) {
      const lines: string[] = []
      const label = txt(c.name) ?? 'Competidor'
      const meta = [
        c.rating != null ? `Valoración ${c.rating}/5` : null,
        c.review_count != null ? `${c.review_count} reseñas` : null,
        c.has_website != null ? (c.has_website ? 'Con web' : 'Sin web') : null,
        txt(c.website_quality),
        txt(c.phone),
        txt(c.opening_hours),
        txt(c.threat_level),
      ].filter(Boolean) as string[]
      if (meta.length) lines.push(meta.join(' | '))
      const note = txt(c.notes)
      if (note) lines.push(note)
      if (lines.length) blocks.push({ label, value: lines.join('\n') })
    }
    if (blocks.length) sections.push({ title: 'Competencia', blocks })
  }

  if (ctx.proposals.length) {
    const blocks: Block[] = []
    for (const p of ctx.proposals) {
      const head = `${txt(p.title) ?? p.kind} (${fmtDate(p.created_at) ?? ''})`.trim()
      const parts: string[] = []
      const kind = txt(p.kind)
      const src = txt(p.source)
      if (kind) parts.push(`Tipo: ${kind}`)
      if (src) parts.push(`Origen: ${src}`)
      try {
        const json = JSON.stringify(p.sections, null, 2)
        if (json && json !== '{}') parts.push(json)
      } catch {
        parts.push(String(p.sections))
      }
      if (parts.length) blocks.push({ label: head, value: parts.join('\n\n') })
    }
    if (blocks.length) sections.push({ title: 'Propuestas e informes', blocks })
  }

  if (lead.research_payload && Object.keys(lead.research_payload).length > 0) {
    try {
      const json = JSON.stringify(lead.research_payload, null, 2)
      sections.push({
        title: 'Research payload (JSON)',
        blocks: [{ label: 'Datos volcados', value: json }],
      })
    } catch {
      /* omit */
    }
  }

  const gen = sanitizePdfText(
    new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date()),
  )

  return { exportLabel: gen, sections }
}

export function downloadLeadInvestigationPdf(
  lead: Lead,
  ctx: LeadInvestigationPdfContext,
): void {
  const { exportLabel, sections } = addBlocksForLead(lead, ctx)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const innerW = pageW - MARGIN_MM * 2
  let y = MARGIN_MM

  const bizShort = (): string => {
    const n = sanitizePdfText(lead.business_name)
    return n.length > 54 ? `${n.slice(0, 51)}...` : n
  }

  function fillPaper(): void {
    doc.setFillColor(...C.paper)
    doc.rect(0, 0, pageW, pageH, 'F')
  }

  const drawContinuationHead = (): void => {
    doc.setDrawColor(...C.hairline)
    doc.setLineWidth(0.12)
    doc.line(MARGIN_MM, MARGIN_MM, pageW - MARGIN_MM, MARGIN_MM)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.muted)
    doc.text(bizShort(), MARGIN_MM, MARGIN_MM + 5)
    y = MARGIN_MM + 11
  }

  /** Portada clara: sin bloque oscuro ni UUID ni letra pequeña de “meta documento”. */
  const drawFirstPageHeader = (): void => {
    doc.setDrawColor(...C.accentLine)
    doc.setLineWidth(0.5)
    doc.line(MARGIN_MM, 21, pageW - MARGIN_MM, 21)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text(sanitizePdfText('Informe de prospecto'), MARGIN_MM, 29)
    doc.setFontSize(7)
    doc.text(
      sanitizePdfText('Vive CRM'),
      pageW - MARGIN_MM,
      29,
      { align: 'right' },
    )

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.setTextColor(...C.ink)
    let hy = 38
    const title = sanitizePdfText(lead.business_name)
    const nameLines = doc.splitTextToSize(title, innerW) as string[]
    for (const line of nameLines) {
      doc.text(line, MARGIN_MM, hy)
      hy += 8
    }

    hy += 3
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text(sanitizePdfText(`Exportación · ${exportLabel}`), MARGIN_MM, hy)

    hy += 8
    doc.setDrawColor(...C.hairline)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_MM, hy, pageW - MARGIN_MM, hy)
    y = hy + 9
  }

  const ensureSpace = (hMm: number) => {
    if (y + hMm > pageH - FOOTER_MM) {
      doc.addPage()
      fillPaper()
      drawContinuationHead()
    }
  }

  fillPaper()
  drawFirstPageHeader()

  const sectionRule = () => {
    ensureSpace(9)
    y += 2
    doc.setDrawColor(...C.hairline)
    doc.setLineWidth(0.1)
    doc.line(MARGIN_MM + 12, y, pageW - MARGIN_MM - 12, y)
    y += 7
  }

  const sectionTitle = (raw: string) => {
    const t = sanitizePdfText(raw)
    ensureSpace(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...C.ink)
    doc.text(t, MARGIN_MM, y + 4)
    y += 7
    doc.setDrawColor(...C.accentLine)
    doc.setLineWidth(0.3)
    doc.line(MARGIN_MM, y, MARGIN_MM + 32, y)
    y += 9
    doc.setFont('helvetica', 'normal')
  }

  const fieldBlock = (label: string, value: string) => {
    const safeLabel = sanitizePdfText(label)
    const safeValue = sanitizePdfText(value)
    const labelH = 4
    const valueLines = doc.splitTextToSize(safeValue, innerW - 4) as string[]
    const blockH = labelH + valueLines.length * BODY_LINE_PT + 8
    ensureSpace(blockH)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.75)
    doc.setTextColor(...C.muted)
    doc.text(safeLabel, MARGIN_MM, y + 3.6)
    y += labelH + 1

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(VALUE_SIZE)
    doc.setTextColor(...C.ink)
    for (const line of valueLines) {
      ensureSpace(BODY_LINE_PT + 0.5)
      doc.text(line, MARGIN_MM + 1.5, y + 4)
      y += BODY_LINE_PT
    }
    y += 6
  }

  if (sections.length === 0) {
    ensureSpace(24)
    doc.setFontSize(10)
    doc.setTextColor(...C.muted)
    const msg = sanitizePdfText(
      'Aún no hay datos consolidados en esta ficha. Completa campos en el CRM y vuelve a exportar.',
    )
    const lines = doc.splitTextToSize(msg, innerW) as string[]
    for (const line of lines) {
      ensureSpace(5.5)
      doc.text(line, MARGIN_MM, y)
      y += 5.5
    }
  }

  for (let i = 0; i < sections.length; i++) {
    if (i > 0) sectionRule()
    sectionTitle(sections[i].title)
    for (const bl of sections[i].blocks) {
      fieldBlock(bl.label, bl.value)
    }
    y += 1
  }

  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setDrawColor(...C.hairline)
    doc.setLineWidth(0.1)
    doc.line(MARGIN_MM, pageH - FOOTER_MM + 2, pageW - MARGIN_MM, pageH - FOOTER_MM + 2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text(
      sanitizePdfText(`Página ${p} de ${total}`),
      pageW - MARGIN_MM,
      pageH - 5,
      { align: 'right' },
    )
    doc.setFontSize(6.8)
    doc.text(sanitizePdfText('Vive CRM'), MARGIN_MM, pageH - 5)
  }

  const year = new Date().getFullYear()
  doc.save(sanitizePdfText(`Ficha_${fileSlugFromLead(lead)}_${year}.pdf`))
}
