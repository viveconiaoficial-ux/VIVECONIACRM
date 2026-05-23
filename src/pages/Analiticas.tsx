import {
  BarChart3,
  Building2,
  Film,
  Globe,
  MessageCircle,
  RefreshCw,
  Video,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { NewLeadDialog } from '@/components/leads/NewLeadDialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LEAD_STATUSES, STATUS_LABELS } from '@/constants'
import { useLeads } from '@/hooks/useLeads'
import type { LeadStatus } from '@/types/lead'
import { cn } from '@/lib/utils'

export function Analiticas() {
  const { allLeads, refetch } = useLeads()
  const [newLeadOpen, setNewLeadOpen] = useState(false)

  const stats = useMemo(() => {
    const leads = allLeads
    const n = leads.length
    const conWeb = leads.filter((l) => l.has_website).length
    const scores = leads.map((l) => l.score).filter((s): s is number => s != null)
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null

    const byStatus = {} as Record<LeadStatus, number>
    for (const s of LEAD_STATUSES) byStatus[s] = 0
    for (const l of leads) {
      byStatus[l.status] = (byStatus[l.status] ?? 0) + 1
    }
    const maxBar = Math.max(1, ...Object.values(byStatus))

    const wa1 = leads.filter((l) => l.wa_msg1_sent_at).length
    const wa2 = leads.filter((l) => l.wa_msg2_sent_at).length
    const conVideo = leads.filter((l) => l.video_url).length

    const enPipeline = leads.filter((l) =>
      ['negociacion', 'propuesta_aceptada', 'propuesta_enviada'].includes(
        l.status,
      ),
    ).length

    return {
      n,
      conWeb,
      sinWeb: n - conWeb,
      avgScore,
      byStatus,
      maxBar,
      wa1,
      wa2,
      conVideo,
      enPipeline,
    }
  }, [allLeads])

  return (
    <div className="flex min-w-0 flex-1 flex-col text-stone-100">
      <TopBar
        visibleCount={allLeads.length}
        onNewLead={() => setNewLeadOpen(true)}
      />
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <main className="flex flex-1 flex-col gap-8 p-6 sm:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4 px-0.5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/75">
              Métricas
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
              Analíticas
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-amber-200/55">
              Vista agregada del inventario de prospectos y del embudo. Para
              acciones concretas, usa{' '}
              <span className="text-amber-100/90">Fichas y estado</span>.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-amber-400/25 bg-transparent text-amber-100/90 hover:bg-amber-500/10"
            onClick={() => void refetch()}
          >
            <RefreshCw className="size-3.5" />
            Actualizar
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Total fichas"
            value={String(stats.n)}
            icon={Building2}
          />
          <StatTile
            label="Media score"
            value={stats.avgScore != null ? `${stats.avgScore}/100` : '—'}
            icon={BarChart3}
          />
          <StatTile
            label="Sin web / Con web"
            value={`${stats.sinWeb} · ${stats.conWeb}`}
            icon={Globe}
          />
          <StatTile
            label="En propuesta / negocio"
            value={String(stats.enPipeline)}
            icon={BarChart3}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-amber-500/15 bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-stone-50">
                <BarChart3 className="size-5 text-amber-300/80" />
                Distribución por estado
              </CardTitle>
              <CardDescription>
                Recuento según la columna de pipeline actual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {LEAD_STATUSES.map((st) => {
                const c = stats.byStatus[st] ?? 0
                const pct = (c / stats.maxBar) * 100
                return (
                  <div key={st} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span className="truncate pr-2">{STATUS_LABELS[st]}</span>
                      <span className="shrink-0 tabular-nums text-stone-300">
                        {c}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-900/80 ring-1 ring-amber-500/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-400/40 transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-amber-500/15 bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg text-stone-50">
                Actividad registrada
              </CardTitle>
              <CardDescription>
                Basado en campos guardados en cada ficha (WhatsApp y vídeo).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <MiniStat
                icon={MessageCircle}
                label="WA mensaje 1"
                value={stats.wa1}
                total={stats.n}
              />
              <MiniStat
                icon={Video}
                label="WA mensaje 2"
                value={stats.wa2}
                total={stats.n}
              />
              <MiniStat
                icon={Film}
                label="Con vídeo URL"
                value={stats.conVideo}
                total={stats.n}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Building2
}) {
  return (
    <div className="rounded-2xl border border-amber-500/12 bg-stone-950/35 px-4 py-4 shadow-inner shadow-black/20">
      <div className="flex items-center gap-2 text-amber-200/55">
        <Icon className="size-4 shrink-0" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-50">
        {value}
      </p>
    </div>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
  total,
}: {
  icon: typeof MessageCircle
  label: string
  value: number
  total: number
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div
      className={cn(
        'rounded-xl border border-amber-500/10 bg-stone-950/30 p-4',
      )}
    >
      <Icon className="size-5 text-amber-300/70" />
      <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-100">
        {value}
      </p>
      <p className="text-[11px] text-stone-500">{label}</p>
      <p className="mt-1 text-[10px] text-stone-600">{pct}% del total</p>
    </div>
  )
}
