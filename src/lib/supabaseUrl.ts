/**
 * Ajusta la URL del proyecto antes de pasarla a `@supabase/supabase-js`.
 * Si pegas desde el dashboard “API URL …/rest/v1”, PostgREST acaba duplicando
 * el path y responde: "Invalid path specified in request URL".
 */
export function normalizeSupabaseUrl(raw: string): string {
  let u = raw.trim()
  if (!u) return u

  u = u.replace(/\/rest\/v1\/?$/i, '')
  u = u.replace(/\/storage\/v1\/?$/i, '')
  u = u.replace(/\/auth\/v1\/?$/i, '')
  u = u.replace(/\/+$/, '')

  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`
  }

  return u.replace(/\/+$/, '')
}
