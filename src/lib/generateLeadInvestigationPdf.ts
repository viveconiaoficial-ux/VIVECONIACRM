import { jsPDF } from 'jspdf'
import { STATUS_LABELS } from '@/constants'
import type { LeadCompetitor, LeadProposal } from '@/types/analytics'
import type { Lead } from '@/types/lead'

export interface LeadInvestigationPdfContext {
  competitors: LeadCompetitor[]
  proposals: LeadProposal[]
}

/** Fondo papel, tintas y acento (RGB 0-255): informe sobrio tipo editorial */
const C = {
  paper: [252, 250, 248] as [number, number, number],
  coverBandTop: [22, 18, 15] as [number, number, number],
  coverBandMid: [45, 36, 28] as [number, number, number],
  coverInk: [254, 252, 248] as [number, number, number],
  ink: [34, 32, 28] as [number, number, number],
  muted: [110, 102, 94] as [number, number, number],
  hairline: [228, 218, 208] as [number, number, number],
  accentBar: [186, 124, 48] as [number, number, number],
  valueBand: [248, 244, 238] as [number, number, number],
}

const MARGIN_MM = 20
const FOOTER_MM = 12
const BODY_LINE_PT = 4.85
const VALUE_SIZE = 10
const LABEL_SIZE = 7.25

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
  coverMeta: string[]
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
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date()),
  )
  const coverMeta = [gen, `ID: ${sanitizePdfText(lead.id)}`]

  return { coverMeta, sections }
}

export function downloadLeadInvestigationPdf(
  lead: Lead,
  ctx: LeadInvestigationPdfContext,
): void {
  const { coverMeta, sections } = addBlocksForLead(lead, ctx)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const innerW = pageW - MARGIN_MM * 2
  let y = MARGIN_MM

  function fillPaper(): void {
    doc.setFillColor(...C.paper)
    doc.rect(0, 0, pageW, pageH, 'F')
  }

  const ensureSpace = (hMm: number) => {
    if (y + hMm > pageH - FOOTER_MM) {
      doc.addPage()
      fillPaper()
      y = MARGIN_MM
    }
  }

  fillPaper()

  const drawCoverStable = () => {
    const bandH = 50
    doc.setFillColor(...C.coverBandTop)
    doc.rect(0, 0, pageW, bandH * 0.55, 'F')
    doc.setFillColor(...C.coverBandMid)
    doc.rect(0, bandH * 0.38, pageW, bandH * 0.62, 'F')

    doc.setDrawColor(...C.accentBar)
    doc.setLineWidth(0.4)
    doc.line(MARGIN_MM, bandH - 2.5, pageW - MARGIN_MM, bandH - 2.5)

    doc.setTextColor(...C.coverInk)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(sanitizePdfText('VIVE CRM | Informe de investigación'), MARGIN_MM, 13)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(19)
    const title = sanitizePdfText(lead.business_name)
    const nameLines = doc.splitTextToSize(title, innerW - 4) as string[]
    let hy = 26
    for (const line of nameLines) {
      doc.text(line, MARGIN_MM, hy)
      hy += 8
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.text(sanitizePdfText(coverMeta.join('   |   ')), MARGIN_MM, bandH + 1)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.75)
    doc.setTextColor(235, 228, 218)
    const sub = sanitizePdfText(
      'Documento generado desde la ficha (contenidos operativos y comerciales).',
    )
    const subLines = doc.splitTextToSize(sub, innerW - 6) as string[]
    let sy = bandH + 8
    for (const ln of subLines) {
      doc.text(ln, MARGIN_MM, sy)
      sy += 4
    }

    doc.setTextColor(...C.ink)
    doc.setFont('helvetica', 'normal')
    y = Math.max(bandH + subLines.length * 4.2 + 14, 56)
  }

  drawCoverStable()

  const sectionRule = () => {
    ensureSpace(4)
    doc.setDrawColor(...C.hairline)
    doc.setLineWidth(0.12)
    doc.line(MARGIN_MM, y, pageW - MARGIN_MM, y)
    y += 6
  }

  const sectionTitle = (raw: string) => {
    const t = sanitizePdfText(raw)
    ensureSpace(12)
    doc.setFillColor(...C.accentBar)
    doc.rect(MARGIN_MM, y - 0.5, 2.4, 6.2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...C.ink)
    doc.text(t, MARGIN_MM + 5, y + 4.3)
    y += 11
    doc.setFont('helvetica', 'normal')
  }

  const fieldBlock = (label: string, value: string) => {
    const safeLabel = sanitizePdfText(label)
    const safeValue = sanitizePdfText(value)
    const labelH = 4.2
    const valueLines = doc.splitTextToSize(safeValue, innerW - 14) as string[]
    const valueH = Math.max(valueLines.length * BODY_LINE_PT + 5, 8)
    const blockH = labelH + valueH + 4

    ensureSpace(blockH)

    doc.setFillColor(...C.valueBand)
    doc.roundedRect(MARGIN_MM, y - 0.5, innerW, blockH - 1, 1.2, 1.2, 'F')
    doc.setDrawColor(...C.hairline)
    doc.setLineWidth(0.08)
    doc.roundedRect(MARGIN_MM, y - 0.5, innerW, blockH - 1, 1.2, 1.2, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(LABEL_SIZE)
    doc.setTextColor(...C.muted)
    doc.text(safeLabel.toUpperCase(), MARGIN_MM + 4, y + 3.2)
    y += labelH + 2

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(VALUE_SIZE)
    doc.setTextColor(...C.ink)
    for (const line of valueLines) {
      ensureSpace(BODY_LINE_PT + 1)
      doc.text(line, MARGIN_MM + 5, y + 3.6)
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
    doc.line(MARGIN_MM, pageH - FOOTER_MM + 3, pageW - MARGIN_MM, pageH - FOOTER_MM + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.25)
    doc.setTextColor(...C.muted)
    doc.text(sanitizePdfText(`Vive CRM · ${p} / ${total}`), pageW / 2, pageH - 6, {
      align: 'center',
    })
  }

  const year = new Date().getFullYear()
  doc.save(sanitizePdfText(`Ficha_${fileSlugFromLead(lead)}_${year}.pdf`))
}
