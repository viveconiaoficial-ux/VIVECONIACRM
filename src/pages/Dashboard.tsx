import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { NewLeadDialog } from '@/components/leads/NewLeadDialog'
import { LEAD_STATUSES, STATUS_LABELS } from '@/constants'
import { useLeads } from '@/hooks/useLeads'
import { useAppStore } from '@/store/useAppStore'
import type { LeadStatus } from '@/types/lead'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { leads, refetch } = useLeads()
  const filters = useAppStore((s) => s.filters)
  const setFilter = useAppStore((s) => s.setFilter)
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)
  const [newLeadOpen, setNewLeadOpen] = useState(false)

  function pillClass(active: boolean) {
    return cn(
      'rounded-full px-4 py-2 text-xs font-medium transition-all duration-200',
      active
        ? 'bg-amber-500/18 text-amber-50 shadow-sm ring-1 ring-amber-400/35'
        : 'bg-stone-900/40 text-stone-400 ring-1 ring-transparent hover:bg-stone-800/60 hover:text-stone-200 hover:ring-amber-500/10',
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col text-stone-100">
      <TopBar
        visibleCount={leads.length}
        onNewLead={() => setNewLeadOpen(true)}
      />
      <NewLeadDialog
        open={newLeadOpen}
        onOpenChange={setNewLeadOpen}
      />
      <main className="flex flex-1 flex-col gap-8 p-6 sm:p-8">
          <section
            className={cn(
              'rounded-2xl border border-amber-500/15 bg-card/60 p-5 shadow-xl shadow-black/20',
              'backdrop-blur-md supports-[backdrop-filter]:bg-card/45',
            )}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-200/90">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-400/20">
                  <SlidersHorizontal className="size-4" aria-hidden />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-stone-100">
                    Filtros rápidos
                  </h2>
                  <p className="text-xs text-stone-500">
                    Ajusta el foco sin estrés
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={pillClass(filters.hasWebsite === false)}
                  onClick={() => setFilter('hasWebsite', false)}
                >
                  Sin web
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={pillClass(filters.hasWebsite === true)}
                  onClick={() => setFilter('hasWebsite', true)}
                >
                  Con web
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={pillClass(filters.hasWebsite === null)}
                  onClick={() => setFilter('hasWebsite', null)}
                >
                  Todos
                </Button>
              </div>

              <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center">
                <Select
                  value={filters.status ?? '__all__'}
                  onValueChange={(v) =>
                    setFilter(
                      'status',
                      v === '__all__' ? null : (v as LeadStatus),
                    )
                  }
                >
                  <SelectTrigger className="h-10 w-full min-w-[200px] rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 shadow-inner shadow-black/20 sm:w-[230px]">
                    <Filter className="mr-2 size-3.5 shrink-0 text-amber-400/70" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="border-amber-500/15 bg-popover text-popover-foreground">
                    <SelectItem value="__all__">Todos los estados</SelectItem>
                    {LEAD_STATUSES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-full min-w-0 sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-200/35" />
                  <Input
                    placeholder="Nombre o teléfono…"
                    value={filters.search}
                    onChange={(e) => setFilter('search', e.target.value)}
                    className="h-10 rounded-xl border-amber-500/15 bg-stone-950/40 pl-10 text-stone-100 placeholder:text-stone-600 shadow-inner shadow-black/20"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="h-10 rounded-xl border-amber-400/25 bg-transparent text-amber-100/90 hover:bg-amber-500/10 hover:text-amber-50"
                  onClick={() => void refetch()}
                >
                  Actualizar
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-4 px-0.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/75">
                  Tabla
                </p>
                <h3 className="text-base font-semibold text-stone-100">
                  Fichas de contacto
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-amber-200/55">
                  <span className="text-amber-100/90">Haz clic en una fila</span> para
                  abrir la ficha. Arriba verás el bloque{' '}
                  <strong className="text-amber-50">Expediente comercial · Rellenar manual</strong>{' '}
                  (análisis, activos, estrategia, mensaje) y el botón{' '}
                  <strong className="text-amber-50">Guardar en Supabase</strong>.
                </p>
              </div>
            </div>
            <LeadsTable leads={leads} onOpenLead={setSelectedLeadId} />
          </section>
        </main>
    </div>
  )
}
