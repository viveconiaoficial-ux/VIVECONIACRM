/**
 * Investigación profunda de prospecto + mensaje WA personalizado (OpenRouter).
 * Body: { lead, research_input, current_whatsapp_message }
 */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
}

interface DeepResearchResult {
  investigation_opportunity: string | null
  investigation_pain: string | null
  web_presence_summary: string | null
  strategy_notes: string | null
  video_hook_notes: string | null
  proposed_whatsapp_message: string | null
  alternative_whatsapp_message: string | null
  suggested_score: number | null
}

function looksLikeUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}

async function fetchUrlAsText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ViveCRM-Research/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text.slice(0, 14000) || null
  } catch {
    return null
  }
}

function parseModelJson(raw: string): DeepResearchResult | null {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed) as DeepResearchResult
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      return JSON.parse(m[0]) as DeepResearchResult
    } catch {
      return null
    }
  }
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function normResult(r: DeepResearchResult): DeepResearchResult {
  const scoreRaw = r.suggested_score
  let suggested_score: number | null = null
  if (typeof scoreRaw === 'number' && Number.isFinite(scoreRaw)) {
    suggested_score = Math.min(100, Math.max(0, Math.round(scoreRaw)))
  }
  return {
    investigation_opportunity: str(r.investigation_opportunity),
    investigation_pain: str(r.investigation_pain),
    web_presence_summary: str(r.web_presence_summary),
    strategy_notes: str(r.strategy_notes),
    video_hook_notes: str(r.video_hook_notes),
    proposed_whatsapp_message: str(r.proposed_whatsapp_message),
    alternative_whatsapp_message: str(r.alternative_whatsapp_message),
    suggested_score,
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Solo POST' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY')?.trim()
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Falta OPENROUTER_API_KEY en secrets de Supabase.',
          code: 'MISSING_OPENROUTER_KEY',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let bodyJson: unknown
    try {
      bodyJson = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = bodyJson as Record<string, unknown>
    const lead =
      typeof body.lead === 'object' && body.lead !== null
        ? (body.lead as Record<string, unknown>)
        : null
    const researchInput =
      typeof body.research_input === 'string' ? body.research_input.trim() : ''
    const currentWa =
      typeof body.current_whatsapp_message === 'string'
        ? body.current_whatsapp_message.trim()
        : ''

    if (!lead) {
      return new Response(JSON.stringify({ error: 'Falta lead en el cuerpo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (researchInput.length < 8) {
      return new Response(
        JSON.stringify({ error: 'research_input demasiado corto (mín. 8 caracteres)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let urlSnippet: string | null = null
    const urlCandidate = looksLikeUrl(researchInput)
      ? researchInput
      : researchInput.match(/https?:\/\/[^\s]+/i)?.[0] ?? null
    if (urlCandidate) {
      urlSnippet = await fetchUrlAsText(urlCandidate)
    }

    const model =
      Deno.env.get('OPENROUTER_RESEARCH_MODEL')?.trim() ||
      Deno.env.get('OPENROUTER_MODEL')?.trim() ||
      'openai/gpt-4o-mini'

    const system = [
      'Eres el agente de investigación comercial de Vive con IA, agencia de IA y automatización para pymes en España.',
      'Investigas negocios locales y redactas mensajes de WhatsApp en español (tú, cercano, profesional, sin spam).',
      'Mantén la esencia del mensaje base del equipo: personalizado, breve, una pregunta clara, sin prometer lo que no sabes.',
      'No inventes datos concretos (precios, nombres de empleados) que no aparezcan en las fuentes.',
      'Responde ÚNICAMENTE con un JSON válido, sin markdown ni texto extra.',
    ].join(' ')

    const userContent = [
      '## Ficha CRM (JSON)',
      JSON.stringify(lead, null, 2),
      '',
      '## Entrada del usuario (URL o información del negocio)',
      researchInput,
      urlSnippet
        ? `\n## Texto extraído de la web (recorte automático)\n${urlSnippet}`
        : '\n## Texto web\n(no se pudo extraer HTML; usa la entrada del usuario y la ficha)',
      '',
      '## Mensaje WhatsApp actual del equipo (referencia de tono — NO copies literal salvo que encaje)',
      currentWa || '(sin mensaje previo)',
      '',
      '## Tarea',
      '1) Investiga el negocio: oportunidad para Vive con IA, dolor/necesidad, presencia digital.',
      '2) Redacta un mensaje WA NUEVO más centrado en ELLos y su necesidad, manteniendo espíritu del mensaje actual (cercanía, propuesta de valor clara, 2-4 frases máx, emojis con moderación).',
      '3) Un mensaje alternativo más consultivo (opcional, más corto).',
      '',
      'Devuelve este JSON exacto (claves en inglés, valores en español):',
      JSON.stringify({
        investigation_opportunity: 'string',
        investigation_pain: 'string',
        web_presence_summary: 'string',
        strategy_notes: 'string',
        video_hook_notes: 'string',
        proposed_whatsapp_message: 'string',
        alternative_whatsapp_message: 'string',
        suggested_score: 'number 0-100 o null',
      }),
    ].join('\n')

    const referer = Deno.env.get('OPENROUTER_HTTP_REFERER')?.trim()
    const title = Deno.env.get('OPENROUTER_APP_TITLE')?.trim() ?? 'Vive CRM'

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    if (referer) headers['HTTP-Referer'] = referer
    headers['X-Title'] = title

    const llmRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
        temperature: 0.55,
        max_tokens: 2400,
        response_format: { type: 'json_object' },
      }),
    })

    const rawTxt = await llmRes.text()
    if (!llmRes.ok) {
      return new Response(
        JSON.stringify({
          error: `OpenRouter respondió ${llmRes.status}`,
          detail: rawTxt.slice(0, 800),
          code: 'OPENROUTER_HTTP_ERROR',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let data: ChatCompletionResponse
    try {
      data = JSON.parse(rawTxt) as ChatCompletionResponse
    } catch {
      return new Response(
        JSON.stringify({ error: 'JSON inválido de OpenRouter', code: 'OPENROUTER_PARSE_ERROR' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'Respuesta vacía del modelo', code: 'EMPTY_COMPLETION' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const parsed = parseModelJson(content)
    if (!parsed) {
      return new Response(
        JSON.stringify({
          error: 'No se pudo parsear el JSON del modelo',
          detail: content.slice(0, 500),
          code: 'INVALID_MODEL_JSON',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const result = normResult(parsed)
    if (!result.proposed_whatsapp_message) {
      return new Response(
        JSON.stringify({
          error: 'El modelo no devolvió proposed_whatsapp_message',
          code: 'MISSING_PROPOSAL',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ result, model, url_fetched: urlSnippet != null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg, code: 'INTERNAL_ERROR' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
