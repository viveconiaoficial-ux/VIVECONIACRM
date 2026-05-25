import type { Lead } from '@/types/lead'
import { STATUS_LABELS } from '@/constants'

/** Payload para un webhook tipo n8n / Edge Function que devuelve texto. */
export function sanitizeLeadForReflectionWebhook(lead: Lead): Record<string, unknown> {
  return {
    id: lead.id,
    business_name: lead.business_name,
    sector: lead.sector,
    location_label: lead.location_label,
    status: lead.status,
    deal_rejection_reason: lead.deal_rejection_reason,
    investigation_opportunity:
      lead.investigation_opportunity?.slice(0, 3500) ?? null,
    investigation_pain: lead.investigation_pain?.slice(0, 3500) ?? null,
    expediente_sales_strategy:
      lead.expediente_sales_strategy?.slice(0, 2000) ?? null,
    deal_proposal_summary: lead.deal_proposal_summary?.slice(0, 3500) ?? null,
    score: lead.score,
    has_website: lead.has_website,
    wa_msg1_sent: lead.wa_msg1_sent_at != null,
    wa_msg2_sent: lead.wa_msg2_sent_at != null,
    video_sent: lead.video_url != null,
    maps_rating: lead.maps_rating,
    review_count: lead.review_count,
  }
}

/**
 * Opcional: `VITE_FAILURE_REFLECTION_WEBHOOK_URL`
 * POST JSON `{ lead: sanitizeLeadForReflectionWebhook(lead) }`
 * Espera `{ reflection: string }`, `{ failure_ai_reflection }` o cuerpo plano texto.
 */
export async function fetchFailureReflectionFromWebhook(
  lead: Lead,
): Promise<string | null> {
  const raw = (
    import.meta.env.VITE_FAILURE_REFLECTION_WEBHOOK_URL as string | undefined
  )?.trim()
  if (!raw) return null

  const res = await fetch(raw, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead: sanitizeLeadForReflectionWebhook(lead),
    }),
  })
  const textRaw = await res.text()
  if (!res.ok) {
    throw new Error(
      `Webhook ${res.status}: ${textRaw.slice(0, 180) || '(sin cuerpo)'}`,
    )
  }
  try {
    const j = JSON.parse(textRaw) as unknown
    if (j && typeof j === 'object') {
      const o = j as Record<string, unknown>
      const r =
        typeof o.reflection === 'string'
          ? o.reflection
          : typeof o.failure_ai_reflection === 'string'
            ? o.failure_ai_reflection
            : typeof o.text === 'string'
              ? o.text
              : null
      if (r?.trim()) return r.trim()
    }
  } catch {
    /* no JSON */
  }
  return textRaw.trim() || null
}

/** Borrador estructural en español (sin LLM): hipótesis y mejoras accionables. */
export function buildFailureReflectionDraft(lead: Lead): string {
  const tipo =
    lead.status === 'ignorada_rechazada'
      ? 'Cierre típico de “silencio” (ignorado o sin contestación útil después de tus intentos).'
      : lead.status === 'contestada_rechazada'
        ? 'Rechazo después de algún nivel de respuesta propia (mensaje llamado rechazo explícito).'
        : 'Registro marcado como no ganado.'
  const estado = STATUS_LABELS[lead.status] ?? lead.status

  const bloques: string[] = []

  bloques.push(`**Tipo de resultado:** ${tipo} (${estado}).`)

  if (lead.sector?.trim()) {
    bloques.push(
      `**Sector / contexto:** ${lead.sector.trim()}. Vale la pena comparar tasas de cierre contra otros negocios del mismo nicho: precio, urgencia y madurez digital marcan mucho la conversión.`,
    )
  }

  if (lead.deal_rejection_reason?.trim()) {
    bloques.push(
      `**Motivo anotado en la ficha:** ${lead.deal_rejection_reason.trim()}\n\n**Lectura:** úsalo como “fuente de verdad” del prospecto. Si habla de precio, acota alcance o prueba un piloto; si de tiempo, acorta el compromiso inicial; si de confianza, refuerza prueba social y casos del mismo sector.`,
    )
  } else if (lead.status === 'contestada_rechazada') {
    bloques.push(
      '**Motivo en ficha:** vacío. Rellenar “motivo rechazo” en Estado e intercambio ayudará a que la próxima reflexión (humana o IA) sea más precisa.',
    )
  }

  const huboWa = lead.wa_msg1_sent_at != null || lead.wa_msg2_sent_at != null
  if (!huboWa && lead.status === 'ignorada_rechazada') {
    bloques.push(
      '**Canal:** no consta envío de WhatsApp. El “fracaso” puede ser que aún no hubo un contacto real en el canal donde ellos deciden (o el lead estaba frío).',
    )
  } else if (huboWa && lead.status === 'ignorada_rechazada') {
    bloques.push(
      '**Canal:** hubo envío por WA sin cierre positivo. Revisa longitud del mensaje, una sola pregunta clara y anclaje a un beneficio concreto de su negocio (no solo “te escribo por si te interesa”).',
    )
  }

  if (lead.score != null && lead.score < 55) {
    bloques.push(
      `**Score bajo (${lead.score}/100):** el CRM ya clasificaba baja prioridad. Puede haber mejor encaje enfocando esfuerzos en otros ICP donde el mismo paquete tenga ROI más evidente.`,
    )
  }

  if (lead.investigation_pain?.trim()) {
    const pain = lead.investigation_pain.trim()
    const excerpt = pain.slice(0, 500)
    bloques.push(
      `**Dolor explorado antes:** "${excerpt}${pain.length > 500 ? '…' : ''}"\n\nSi la propuesta no enlazaba explícitamente con ese dolor, el rechazo suele venir por desalineación oferta‑problema, no solo por precio.`,
    )
  }

  bloques.push(
    '**Qué probar en la próxima propuesta**\n• Oferta menos ambigua (entregables y plazo en una sola página).\n• Prueba social del mismo tipo de negocio o ciudad.\n• Primera siguiente acción muy pequeña (llamada 15 min / mini auditoría).\n• Ajustar nicho si varios fracasos comparten mismo sector pero mismo patrón (silencio).',
  )

  bloques.push(
    '**Para IA “de verdad”:** configura `VITE_FAILURE_REFLECTION_WEBHOOK_URL` con un webhook (p. ej. n8n → OpenAI); este CRM enviará un resumen de la ficha y guardará aquí lo que devuelva la IA.',
  )

  return bloques.join('\n\n')
}

/** Intenta webhook; si no hay o falla, devuelve el borrador local. */
export async function resolveFailureReflectionText(lead: Lead): Promise<string> {
  try {
    const remote = await fetchFailureReflectionFromWebhook(lead)
    if (remote) return remote
  } catch {
    /* cae al borrador */
  }
  return buildFailureReflectionDraft(lead)
}
