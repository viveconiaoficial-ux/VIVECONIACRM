import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from '@/components/layout/Sidebar'
import { Analiticas } from '@/pages/Analiticas'
import { ClientesAceptados } from '@/pages/ClientesAceptados'
import { ClientesPotenciales } from '@/pages/ClientesPotenciales'
import { Dashboard } from '@/pages/Dashboard'
import { FichasPipeline } from '@/pages/FichasPipeline'
import { LeadDetail } from '@/pages/LeadDetail'
import { PlanInteracciones } from '@/pages/PlanInteracciones'
import { useAppStore } from '@/store/useAppStore'

export default function App() {
  const selectedLeadId = useAppStore((s) => s.selectedLeadId)
  const mainView = useAppStore((s) => s.mainView)
  const setMainView = useAppStore((s) => s.setMainView)
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)

  if (selectedLeadId) {
    return (
      <>
        <LeadDetail key={selectedLeadId} leadId={selectedLeadId} />
        <Toaster richColors position="top-right" />
      </>
    )
  }

  return (
    <>
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
      <Toaster richColors position="top-right" />
    </>
  )
}
