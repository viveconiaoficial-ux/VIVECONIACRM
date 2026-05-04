import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PotencialesFundamentalesTable } from '@/components/leads/PotencialesFundamentalesTable'
import { NewLeadDialog } from '@/components/leads/NewLeadDialog'
import { TopBar } from '@/components/layout/TopBar'
import { Input } from '@/components/ui/input'
import { useLeads } from '@/hooks/useLeads'
import { isClientePotencial } from '@/lib/leadLifecycle'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export function ClientesPotenciales() {
  const { allLeads, refetch } = useLeads()
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [search, setSearch] = useState('')

  const potenciales = useMemo(() => {
    const list = allLeads.filter(isClientePotencial)
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (l) =>
        l.business_name.toLowerCase().includes(q) ||
        (l.contact_name ?? '').toLowerCase().includes(q) ||
        (l.email ?? '').toLowerCase().includes(q) ||
        (l.whatsapp_phone ?? '').includes(q),
    )
  }, [allLeads, search])

  return (
    <div className="flex min-w-0 flex-1 flex-col text-stone-100">
      <TopBar
        visibleCount={potenciales.length}
        onNewLead={() => setNewLeadOpen(true)}
        titleHighlight="potenciales"
        countLine={(n) =>
          n === 0
            ? 'Aún no hay nadie en esta lista. Los que acepten pasarán a Clientes.'
            : `Tienes ${n} ${n === 1 ? 'potencial' : 'potenciales'} sin aceptación registrada.`
        }
      />
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <main className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
        <header className="space-y-2 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/75">
            Captación
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
            Clientes potenciales
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-amber-200/55">
            Prospectos <strong className="text-amber-100/90">sin aceptación</strong>
            : datos de contacto y ubicación listos para priorizar. Cuando marques
            la propuesta como aceptada o el cierre ganado, pasan a{' '}
            <strong className="text-amber-100/90">Clientes</strong>.
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-200/35" />
            <Input
              placeholder="Buscar por negocio, contacto, email o teléfono…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl border-amber-500/15 bg-stone-950/40 pl-10 text-stone-100 placeholder:text-stone-600"
            />
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className={cn(
              'rounded-xl border border-amber-400/25 bg-transparent px-4 py-2 text-sm font-medium text-amber-100/90 hover:bg-amber-500/10',
            )}
          >
            Sincronizar
          </button>
        </div>

        <PotencialesFundamentalesTable
          leads={potenciales}
          onOpenLead={setSelectedLeadId}
          onAfterLeadAction={() => void refetch()}
        />
      </main>
    </div>
  )
}
