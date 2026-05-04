import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ClientesAceptadosTable } from '@/components/leads/ClientesAceptadosTable'
import { NewLeadDialog } from '@/components/leads/NewLeadDialog'
import { TopBar } from '@/components/layout/TopBar'
import { Input } from '@/components/ui/input'
import { useLeads } from '@/hooks/useLeads'
import { isClienteAceptado } from '@/lib/leadLifecycle'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export function ClientesAceptados() {
  const { allLeads, refetch } = useLeads()
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [search, setSearch] = useState('')

  const clientes = useMemo(() => {
    const list = allLeads.filter(isClienteAceptado)
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
        visibleCount={clientes.length}
        onNewLead={() => setNewLeadOpen(true)}
        titleHighlight="clientes"
        countLine={(n) =>
          n === 0
            ? 'Marca fecha de aceptación en la ficha o estado “Propuesta aceptada” / “Cerrada / ganada”.'
            : `Tienes ${n} ${n === 1 ? 'cliente activo' : 'clientes activos'} en esta vista.`
        }
      />
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <main className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
        <header className="space-y-2 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
            Relación activa
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
            Clientes
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-amber-200/55">
            Quienes ya <strong className="text-emerald-200/90">aceptaron</strong>{' '}
            (fecha de aceptación rellena o estado “Propuesta aceptada” / “Cerrada /
            ganada”). Mantén aquí presupuesto y seguimientos operativos.
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-200/35" />
            <Input
              placeholder="Buscar cliente…"
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

        <ClientesAceptadosTable
          leads={clientes}
          onOpenLead={setSelectedLeadId}
          onAfterLeadAction={() => void refetch()}
        />
      </main>
    </div>
  )
}
