/**
 * Reflexión comercial sobre leads rechazados / sin respuesta (LLM vía OpenRouter).
 * Secreto: OPENROUTER_API_KEY (Project Settings → Edge Functions → Secrets).
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
          error:
            'Falta el secreto OPENROUTER_API_KEY en Supabase → Project Settings → Edge Functions → Secrets (o CLI: supabase secrets set OPENROUTER_API_KEY=...)',
          code: 'MISSING_OPENROUTER_KEY',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
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

    const lead =
      typeof bodyJson === 'object' &&
      bodyJson !== null &&
      'lead' in bodyJson &&
      typeof (bodyJson as { lead: unknown }).lead === 'object'
        ? (bodyJson as { lead: Record<string, unknown> }).lead
        : null

    if (!lead) {
      return new Response(JSON.stringify({ error: 'Falta el objeto lead en el cuerpo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Modelos OpenRouter usan slug con proveedor, p. ej. openai/gpt-4o-mini
    const model =
      Deno.env.get('OPENROUTER_MODEL')?.trim() || 'openai/gpt-4o-mini'

    const system = [
      'Eres un estratega comercial B2B para una agencia de IA y automatización (Vive con IA) que trabaja con pymes.',
      'Escribes siempre en español. Sé directo y práctico, sin relleno.',
      'No inventes datos que no aparezcan en el JSON.',
    ].join(' ')

    const userContent = [
      'Analiza este prospecto que no cerró o quedó como rechazo / sin respuesta.',
      'Responde con Markdown (**negritas**, listas donde ayude):',
      '1) **Hipótesis principal**: qué pudo causar el resultado (mensaje, propuesta, precio timing, canal, encaje de nicho, etc.).',
      '2) **Dos mejoras concretas** para la siguiente propuesta o primer contacto.',
      '3) **Nicho / ICP**: si conviene afinar tipo de cliente o vertical para parecidos.',
      '',
      'Datos del CRM (JSON):',
      JSON.stringify(lead, null, 2),
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
        temperature: 0.65,
        max_tokens: 1400,
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
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let data: ChatCompletionResponse
    try {
      data = JSON.parse(rawTxt) as ChatCompletionResponse
    } catch {
      return new Response(
        JSON.stringify({ error: 'JSON inválido de OpenRouter', code: 'OPENROUTER_PARSE_ERROR' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const reflection = data?.choices?.[0]?.message?.content
    if (typeof reflection !== 'string' || !reflection.trim()) {
      return new Response(
        JSON.stringify({
          error: 'OpenRouter sin texto en choices[0]',
          code: 'EMPTY_COMPLETION',
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify({ reflection: reflection.trim(), model }), {
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
