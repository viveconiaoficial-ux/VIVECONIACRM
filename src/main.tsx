import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

document.documentElement.classList.add('dark')

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el elemento #root')

const reactRoot = createRoot(container)

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?.trim()

function EnvMissing() {
  return (
    <div className="min-h-screen bg-stone-950 p-8 text-stone-100">
      <h1 className="text-xl font-semibold tracking-tight text-amber-200">
        Falta configurar Supabase
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-400">
        Copia <code className="rounded-md bg-stone-900 px-1.5 py-0.5 text-amber-200/90">.env.example</code>{' '}
        a <code className="rounded-md bg-stone-900 px-1.5 py-0.5 text-amber-200/90">.env.local</code> y rellena{' '}
        <code className="rounded-md bg-stone-900 px-1.5 py-0.5 text-amber-100/90">VITE_SUPABASE_URL</code> y{' '}
        <code className="rounded-md bg-stone-900 px-1.5 py-0.5 text-amber-100/90">VITE_SUPABASE_ANON_KEY</code>.
        Reinicia el servidor (<code className="text-stone-500">npm run dev</code>).
      </p>
    </div>
  )
}

if (!supabaseUrl || !supabaseAnonKey) {
  reactRoot.render(<EnvMissing />)
} else {
  void import('./App.tsx')
    .then(({ default: App }) => {
      reactRoot.render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
    })
    .catch(() => {
      reactRoot.render(
        <div className="min-h-screen bg-stone-950 p-8 text-stone-100">
          <p className="text-sm text-amber-200">No se pudo cargar la aplicación.</p>
          <p className="mt-2 text-xs text-stone-500">
            Abre la consola del navegador (F12) para ver el error exacto.
          </p>
        </div>,
      )
    })
}
