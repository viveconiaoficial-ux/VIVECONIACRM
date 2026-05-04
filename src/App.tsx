import { AlertTriangle } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from '@/components/layout/Sidebar'
import { Analiticas } from '@/pages/Analiticas'
import { ClientesAceptados } from '@/pages/ClientesAceptados'
import { ClientesPotenciales } from '@/pages/ClientesPotenciales'
import { Dashboard } from '@/pages/Dashboard'
import { FichasPipeline } from '@/pages/FichasPipeline'
import { LeadDetail } from '@/pages/LeadDetail'
import { PlanInteracciones } from '@/pages/PlanInteracciones'
import { useLeadsSubscriptions } from '@/hooks/useLeads'
import { normalizeSupabaseUrl } from '@/lib/supabaseUrl'
import { useAppStore } from '@/store/useAppStore'

function LeadsConnectionBanner() {
  const leadsFetchError = useAppStore((s) => s.leadsFetchError)
  if (!leadsFetchError) return null

  let supabaseHost = ''
  try {
    supabaseHost = new URL(
      normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL ?? ''),
    ).hostname
  } catch {
    supabaseHost = '(URL no válida en build)'
  }

  return (
    <div className="shrink-0 border-b border-rose-400/35 bg-rose-950/50 px-4 py-3 text-sm text-rose-100 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-400" aria-hidden />
        <div className="space-y-1 leading-relaxed">
          <p className="font-medium text-rose-50">
            No se han podido cargar los leads desde Supabase.
          </p>
          <p className="text-xs text-rose-200/80">
            Host configurado en el build:{' '}
            <span className="font-mono text-rose-100">{supabaseHost || 'vacío'}</span>
          </p>
          <p className="text-xs text-rose-300/95">{leadsFetchError}</p>
          <p className="text-xs text-rose-400/90">
            Revisa políticas RLS en la tabla <code className="rounded bg-black/25 px-1">leads</code>, que{' '}
            <code className="rounded bg-black/25 px-1">anon</code> tenga SELECT, y que en Vercel las variables{' '}
            <code className="rounded bg-black/25 px-1">VITE_SUPABASE_*</code> apunten al mismo proyecto donde ves los datos en el panel de Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  useLeadsSubscriptions()
  const selectedLeadId = useAppStore((s) => s.selectedLeadId)
  const mainView = useAppStore((s) => s.mainView)
  const setMainView = useAppStore((s) => s.setMainView)
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)

  return (
    <>
      <LeadsConnectionBanner />

      {selectedLeadId ? (
        <LeadDetail key={selectedLeadId} leadId={selectedLeadId} />
      ) : (
        <div className="flex min-h-screen text-stone-100">
          <Sidebar
            activeView={mainView}
            onSelectView={(view) => {
              setMainView(view)
              setSelectedLeadId(null)
            }}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            {mainView === 'clientes_potenciales' ? (
              <ClientesPotenciales />
            ) : mainView === 'clientes' ? (
              <ClientesAceptados />
            ) : mainView === 'fichas' ? (
              <FichasPipeline />
            ) : mainView === 'plan_interacciones' ? (
              <PlanInteracciones />
            ) : mainView === 'analiticas' ? (
              <Analiticas />
            ) : (
              <Dashboard />
            )}
          </div>
        </div>
      )}
      <Toaster richColors position="top-right" />
    </>
  )
}
