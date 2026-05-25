import { MapPin, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import { NewLeadDialog } from '@/components/leads/NewLeadDialog'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { LEAD_PIPELINE_STATUSES, STATUS_LABELS } from '@/constants'
import { useLeads } from '@/hooks/useLeads'
import { isVisibleInMainPanels } from '@/lib/leadLifecycle'
import { useAppStore } from '@/store/useAppStore'
import type { Lead, LeadStatus } from '@/types/lead'
import { cn } from '@/lib/utils'

function groupByStatus(leads: Lead[]): Record<LeadStatus, Lead[]> {
  const initial = {} as Record<LeadStatus, Lead[]>
  for (const s of LEAD_PIPELINE_STATUSES) initial[s] = []
  for (const lead of leads) {
    const bucket = initial[lead.status]
    if (bucket) bucket.push(lead)
    else initial.sin_contactar.push(lead)
  }
  for (const s of LEAD_PIPELINE_STATUSES) {
    initial[s].sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at).getTime() -
        new Date(a.updated_at ?? a.created_at).getTime(),
    )
  }
  return initial
}

export function FichasPipeline() {
  const { allLeads, refetch } = useLeads()
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)
  const [newLeadOpen, setNewLeadOpen] = useState(false)

  const visibleOnly = useMemo(
    () => allLeads.filter(isVisibleInMainPanels),
    [allLeads],
  )
  const byStatus = useMemo(() => groupByStatus(visibleOnly), [visibleOnly])

  return (
    <div className="flex min-w-0 flex-1 flex-col text-stone-100">
      <TopBar
        visibleCount={visibleOnly.length}
        onNewLead={() => setNewLeadOpen(true)}
      />
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <main className="flex flex-1 flex-col gap-6 overflow-hidden p-4 sm:p-6 lg:p-8">
        <header className="shrink-0 space-y-1 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/75">
            Pipeline
          </p>
          <h1 className="text-xl font-semibold text-stone-50 sm:text-2xl">
            Fichas por estado
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-amber-200/55">
            Cada tarjeta es un prospecto. Pulsa para abrir la ficha con expediente,
            investigación, competencia e historial. Desde ahí puedes rellenar más,
            modificar y profundizar.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 rounded-xl border-amber-400/25 bg-transparent text-amber-100/90 hover:bg-amber-500/10"
            onClick={() => void refetch()}
          >
            <RefreshCw className="size-3.5" />
            Sincronizar con Supabase
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <div className="flex flex-col gap-4 pb-2">
            {LEAD_PIPELINE_STATUSES.map((status) => (
              <section
                key={status}
                className={cn(
                  'flex w-full flex-col rounded-2xl border border-amber-500/12',
                  'bg-card/45 shadow-xl shadow-black/20 backdrop-blur-md supports-[backdrop-filter]:bg-card/35',
                )}
              >
                <div className="shrink-0 border-b border-amber-500/10 px-4 py-3">
                  <p className="text-xs font-medium text-stone-200">
                    {STATUS_LABELS[status]}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {byStatus[status].length} ficha
                    {byStatus[status].length === 1 ? '' : 's'}
                  </p>
                </div>
                <ul className="flex flex-col gap-2 p-3">
                  {byStatus[status].length === 0 ? (
                    <li className="rounded-xl border border-dashed border-amber-500/10 bg-stone-950/20 px-3 py-8 text-center text-xs text-stone-500">
                      Vacío
                    </li>
                  ) : (
                    byStatus[status].map((lead) => (
                      <li key={lead.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={cn(
                            'w-full rounded-xl border border-amber-500/12 bg-stone-950/40 p-3 text-left',
                            'shadow-sm transition-all hover:border-amber-400/35 hover:bg-stone-900/55 hover:shadow-md',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/50',
                          )}
                        >
                          <p className="font-medium text-stone-100">
                            {lead.business_name}
                          </p>
                          {lead.contact_name ? (
                            <p className="mt-1 text-xs text-stone-500">
                              {lead.contact_name}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <LeadStatusBadge status={lead.status} />
                            {lead.score != null ? (
                              <span className="text-[11px] tabular-nums text-amber-200/80">
                                {lead.score}/100
                              </span>
                            ) : null}
                          </div>
                          {lead.location_label ||
                          lead.city ||
                          lead.neighborhood ? (
                            <p className="mt-2 flex items-start gap-1 text-[11px] text-stone-500">
                              <MapPin className="mt-0.5 size-3 shrink-0 text-amber-400/40" />
                              <span>
                                {lead.location_label ??
                                  [lead.neighborhood, lead.city]
                                    .filter(Boolean)
                                    .join(', ')}
                              </span>
                            </p>
                          ) : null}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
