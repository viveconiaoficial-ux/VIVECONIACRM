/**
 * Análisis transversal de reflexiones guardadas (patrones, sectores, causas).
 * OpenRouter vía OPENROUTER_API_KEY.
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
          error: 'Falta OPENROUTER_API_KEY en secrets de Supabase.',
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

    const reflections =
      typeof bodyJson === 'object' &&
      bodyJson !== null &&
      'reflections' in bodyJson &&
      Array.isArray((bodyJson as { reflections: unknown }).reflections)
        ? (bodyJson as { reflections: Record<string, unknown>[] }).reflections
        : null

    if (!reflections || reflections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Falta el array reflections en el cuerpo' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const model =
      Deno.env.get('OPENROUTER_MODEL')?.trim() || 'openai/gpt-4o-mini'

    const system = [
      'Eres un director comercial B2B de una agencia de IA (Vive con IA) que vende a pymes.',
      'Recibes reflexiones ya escritas sobre prospectos que no cerraron.',
      'Tu trabajo es sintetizar patrones transversales en español, sin inventar datos que no estén en el JSON.',
      'Sé directo y accionable.',
    ].join(' ')

    const userContent = [
      `Hay ${reflections.length} reflexiones guardadas en el CRM sobre rechazos / sin respuesta.`,
      'Analiza el conjunto y responde en Markdown con estas secciones:',
      '## Qué está pasando (visión global)',
      '2-4 frases: el patrón dominante que ves en los fracasos.',
      '## Patrones repetidos',
      'Lista: sectores, canales, motivos, tipo de rechazo (silencio vs rechazo explícito), oferta desalineada, etc.',
      '## Qué cojones pasa (diagnóstico crudo)',
      'Un párrafo honesto: la causa raíz más probable del equipo/oferta/proceso, no culpar solo al cliente.',
      '## Tres palancas para la próxima semana',
      'Acciones concretas y medibles.',
      '## Nicho / ICP',
      'A quién dejar de perseguir y a quién duplicar esfuerzo.',
      '',
      'JSON de reflexiones:',
      JSON.stringify(reflections, null, 2),
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
        temperature: 0.6,
        max_tokens: 2200,
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

    const insights = data?.choices?.[0]?.message?.content
    if (typeof insights !== 'string' || !insights.trim()) {
      return new Response(
        JSON.stringify({ error: 'Sin texto en la respuesta', code: 'EMPTY_COMPLETION' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({ insights: insights.trim(), model, count: reflections.length }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg, code: 'INTERNAL_ERROR' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
