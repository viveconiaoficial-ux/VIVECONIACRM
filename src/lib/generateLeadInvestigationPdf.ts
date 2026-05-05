import { jsPDF } from 'jspdf'
import { STATUS_LABELS } from '@/constants'
import type { LeadCompetitor, LeadProposal } from '@/types/analytics'
import type { Lead } from '@/types/lead'

export interface LeadInvestigationPdfContext {
  competitors: LeadCompetitor[]
  proposals: LeadProposal[]
}

/** Colores (RGB 0–255): veta ámbar sobre neutros cálidos */
const C = {
  headerBg: [62, 42, 18] as [number, number, number],
  headerText: [255, 251, 245] as [number, number, number],
  accent: [168, 100, 28] as [number, number, number],
  sep: [230, 220, 205] as [number, number, number],
  text: [35, 32, 28] as [number, number, number],
  muted: [105, 98, 88] as [number, number, number],
}

function txt(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const t = String(raw).trim()
  return t === '' ? null : t
}

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function fileSlug(name: string): string {
  const base = name
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 72)
  return base || 'ficha'
}

function fileSlugFromLead(lead: Lead): string {
  const parts = [lead.business_name]
  const contact = lead.contact_name?.trim()
  if (contact) parts.push(contact)
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

  // 1 · Embudo
  const embudo: (Block | null)[] = [
    { label: 'Estado del embudo', value: STATUS_LABELS[lead.status] },
    b('Prioridad', lead.priority ?? undefined),
    lead.score != null ? { label: 'Score', value: `${lead.score}/100` } : null,
    bDate('Alta en CRM', lead.created_at),
    bDate('Última actualización', lead.updated_at),
    bDate('Último contacto', lead.last_contact_date),
    b('Lote diario', lead.daily_batch_date ?? undefined),
  ]
  pushSection('Embudo y priorización', embudo)

  // 2 · Contacto (sin dejar solo “sin web” si no hay más datos)
  const contactBits: (Block | null)[] = [
    b('Persona de contacto', lead.contact_name),
    b('Contactos (varios)', lead.contact_names),
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

  // 3 · Ubicación
  const mapsLine =
    lead.maps_rating != null && lead.review_count != null
      ? `${lead.maps_rating} ★ · ${lead.review_count} reseñas`
      : null
  pushSection('Ubicación y Maps', [
    b('Ubicación', lead.location_label),
    b('Barrio', lead.neighborhood),
    b('Ciudad', lead.city),
    b('Provincia', lead.province),
    mapsLine ? { label: 'Valoración Maps', value: mapsLine } : null,
    b('URL Google Maps', lead.google_maps_url),
  ])

  // 4 · Digital
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

  // 5 · Investigación
  pushSection('Investigación cualitativa', [
    b('Oportunidad', lead.investigation_opportunity),
    b('Dolor / necesidad', lead.investigation_pain),
    b('Mensaje sondeo directo', lead.message_sondeo_directo),
    b('Mensaje sondeo consultivo', lead.message_sondeo_consultivo),
    b('Estrategia y notas', lead.strategy_notes),
    b('Gancho vídeo / seguimiento', lead.video_hook_notes),
  ])

  // 6 · Expediente
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
          value: `${lead.proposal_image_paths.length} archivo(s) en Storage (ver ficha en CRM)`,
        }
      : null,
  ])

  // 7 · Deal
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

  // 8 · Actividad WA / vídeo
  pushSection('Vídeo y WhatsApp', [
    b('URL del vídeo', lead.video_url),
    bDate('Vídeo registrado', lead.video_created_at),
    bDate('WA mensaje 1 enviado', lead.wa_msg1_sent_at),
    b('Respuesta al mensaje 1', lead.wa_msg1_response ?? undefined),
    bDate('WA mensaje 2 enviado', lead.wa_msg2_sent_at),
  ])

  // 9 · Notas
  if (txt(lead.notes)) {
    pushSection('Notas del pipeline', [{ label: 'Notas', value: lead.notes!.trim() }])
  }

  // 10 · Competencia
  if (ctx.competitors.length) {
    const blocks: Block[] = []
    for (const c of ctx.competitors) {
      const lines: string[] = []
      const label = txt(c.name) ?? 'Competidor'
      const meta = [
        c.rating != null ? `${c.rating} ★` : null,
        c.review_count != null ? `${c.review_count} reseñas` : null,
        c.has_website != null ? (c.has_website ? 'Con web' : 'Sin web') : null,
        txt(c.website_quality),
        txt(c.phone),
        txt(c.opening_hours),
        txt(c.threat_level),
      ].filter(Boolean) as string[]
      if (meta.length) lines.push(meta.join(' · '))
      const note = txt(c.notes)
      if (note) lines.push(note)
      if (lines.length) blocks.push({ label, value: lines.join('\n') })
    }
    if (blocks.length) sections.push({ title: 'Competencia', blocks })
  }

  // 11 · Propuestas
  if (ctx.proposals.length) {
    const blocks: Block[] = []
    for (const p of ctx.proposals) {
      const head = `${txt(p.title) ?? p.kind} · ${fmtDate(p.created_at) ?? ''}`.trim()
      const parts: string[] = []
      const kind = txt(p.kind)
      const src = txt(p.source)
      if (kind) parts.push(`Tipo: ${kind}`)
      if (src) parts.push(`Origen: ${src}`)
      let json = ''
      try {
        json = JSON.stringify(p.sections, null, 2)
      } catch {
        json = String(p.sections)
      }
      if (json && json !== '{}') parts.push(json)
      if (parts.length) blocks.push({ label: head, value: parts.join('\n\n') })
    }
    if (blocks.length) sections.push({ title: 'Propuestas e informes', blocks })
  }

  // 12 · Payload
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

  const gen = fmtDate(new Date().toISOString()) ?? ''
  const coverMeta = [gen, `ID: ${lead.id}`]

  return { coverMeta, sections }
}

export function downloadLeadInvestigationPdf(
  lead: Lead,
  ctx: LeadInvestigationPdfContext,
): void {
  const { coverMeta, sections } = addBlocksForLead(lead, ctx)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 16
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - margin * 2
  let y = 0

  const ensure = (h: number) => {
    if (y + h > pageH - 18) {
      doc.addPage()
      y = margin
    }
  }

  const drawCover = () => {
    doc.setFillColor(...C.headerBg)
    doc.rect(0, 0, pageW, 32, 'F')
    doc.setTextColor(...C.headerText)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.text('Vive CRM — Informe de investigación', margin, 11)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    const nameLines = doc.splitTextToSize(lead.business_name, contentW) as string[]
    let hy = 20
    for (const line of nameLines) {
      doc.text(line, margin, hy)
      hy += 7
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(coverMeta.join(' · '), margin, hy + 3)
    doc.setTextColor(...C.text)
    y = 40
  }

  const sectionRule = () => {
    ensure(2)
    doc.setDrawColor(...C.sep)
    doc.setLineWidth(0.25)
    doc.line(margin, y, pageW - margin, y)
    y += 5
  }

  const sectionTitle = (t: string) => {
    ensure(12)
    doc.setFillColor(...C.accent)
    doc.rect(margin, y - 0.5, 1.3, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...C.text)
    doc.text(t, margin + 3.5, y + 4.2)
    y += 11
    doc.setFont('helvetica', 'normal')
  }

  const fieldBlock = (label: string, value: string) => {
    const labelH = 4.5
    const valueLines = doc.splitTextToSize(value, contentW - 2) as string[]
    const valueH = valueLines.length * 4.8 + 3
    ensure(labelH + valueH)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text(label.toUpperCase(), margin + 1, y + 3)
    y += labelH

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...C.text)
    for (const line of valueLines) {
      ensure(5)
      doc.text(line, margin + 2, y + 4)
      y += 4.8
    }
    y += 3
  }

  drawCover()

  if (sections.length === 0) {
    const msg =
      'Aún no hay campos rellenados en esta ficha. Completa datos en el CRM para generar contenido.'
    ensure(20)
    doc.setFontSize(10)
    doc.setTextColor(...C.muted)
    const lines = doc.splitTextToSize(msg, contentW) as string[]
    for (const line of lines) {
      ensure(5)
      doc.text(line, margin, y)
      y += 5
    }
  }

  for (let i = 0; i < sections.length; i++) {
    if (i > 0) sectionRule()
    sectionTitle(sections[i].title)
    for (const bl of sections[i].blocks) {
      fieldBlock(bl.label, bl.value)
    }
    y += 2
  }

  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.muted)
    doc.text(`Página ${p} de ${total}`, pageW / 2, pageH - 9, {
      align: 'center',
    })
  }

  const year = new Date().getFullYear()
  doc.save(`Ficha_${fileSlugFromLead(lead)}_${year}.pdf`)
}
