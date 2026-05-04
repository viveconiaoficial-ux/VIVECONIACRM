import {
  AlarmClock,
  ArrowRight,
  CalendarClock,
  Flame,
  MessageSquareWarning,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
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
import { useLeads } from '@/hooks/useLeads'
import { useAppStore } from '@/store/useAppStore'
import type { Lead } from '@/types/lead'
import { cn } from '@/lib/utils'

const MS_DAY = 86400000

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.floor((Date.now() - t) / MS_DAY)
}

function followupTimestamp(lead: Lead): number | null {
  if (!lead.deal_next_followup_at) return null
  const t = new Date(lead.deal_next_followup_at).getTime()
  return Number.isNaN(t) ? null : t
}

export function PlanInteracciones() {
  const { allLeads, refetch } = useLeads()
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)
  const [newLeadOpen, setNewLeadOpen] = useState(false)

  const buckets = useMemo(() => {
    const leads = allLeads
    const now = Date.now()
    const sod = startOfToday()

    const seguimientosVencidos = leads.filter((l) => {
      const t = followupTimestamp(l)
      return t != null && t < sod
    })

    const seguimientosHoy = leads.filter((l) => {
      const t = followupTimestamp(l)
      if (t == null) return false
      return t >= sod && t < sod + MS_DAY
    })

    const proximas48h = leads.filter((l) => {
      const t = followupTimestamp(l)
      if (t == null) return false
      return t >= now && t <= now + 48 * 3600000
    })

    const prioridadSinAvance = leads.filter(
      (l) =>
        l.priority === 'alta' &&
        (l.status === 'lead_frio' || l.status === 'primer_acercamiento'),
    )

    const negociacionSinCifra = leads.filter(
      (l) =>
        l.status === 'negociacion' &&
        (l.deal_budget_amount == null || l.deal_budget_amount <= 0),
    )

    const propuestaEstancada = leads.filter((l) => {
      if (
        l.status !== 'propuesta_enviada' &&
        l.status !== 'esperando_respuesta'
      )
        return false
      const d = daysSince(l.updated_at ?? l.created_at)
      return d >= 5
    })

    const cerrables = leads.filter(
      (l) =>
        l.status === 'propuesta_aceptada' &&
        !l.deal_closed_at &&
        daysSince(l.deal_accepted_at ?? l.updated_at ?? l.created_at) >= 3,
    )

    return {
      seguimientosVencidos,
      seguimientosHoy,
      proximas48h,
      prioridadSinAvance,
      negociacionSinCifra,
      propuestaEstancada,
      cerrables,
    }
  }, [allLeads])

  const playbook = [
    {
      title: 'Reactivar silencio',
      body:
        'Si llevan varios días sin contestar, un mensaje breve con una sola pregunta suele superar el “¿Recibiste mi PDF?”. Referencia algo concreto de su negocio.',
      icon: MessageSquareWarning,
    },
    {
      title: 'Cerrar el círculo en negociación',
      body:
        'Confirma alcance por escrito, propón dos opciones de inversión (ancla + estándar) y fecha de inicio. Si falta importe en la ficha, rellénalo antes del próximo contacto.',
      icon: Target,
    },
    {
      title: 'Después de “sí”',
      body:
        'Anota fecha de aceptación y el próximo hito (firma, pago, kick-off). Revisa la pestaña Estado e intercambio para no perder el hilo operativo.',
      icon: CalendarClock,
    },
    {
      title: 'Priorizar sin quemarte',
      body:
        'Hoy: seguimientos vencidos → alta prioridad fría → negociaciones sin cifra. El pipeline Kanban en Fichas ayuda a ver el embudo completo.',
      icon: Flame,
    },
  ]

  return (
    <div className="flex min-w-0 flex-1 flex-col text-stone-100">
      <TopBar
        visibleCount={allLeads.length}
        onNewLead={() => setNewLeadOpen(true)}
      />
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <main className="flex flex-1 flex-col gap-8 p-6 sm:p-8">
        <header className="space-y-2 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/75">
            Inteligencia operativa
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
            Plan de interacciones
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-amber-200/55">
            Cruce de todas tus fichas para decidir{' '}
            <span className="text-amber-100/90">qué tocar primero</span>, con
            listas accionables y criterios claros. Pulsa un negocio para abrir
            su ficha.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 rounded-xl border-amber-400/25 bg-transparent text-amber-100/90 hover:bg-amber-500/10"
            onClick={() => void refetch()}
          >
            <RefreshCw className="size-3.5" />
            Sincronizar datos
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <InsightListCard
            title="Seguimientos atrasados"
            description="Fecha de próximo paso anterior a hoy: reactivar ya."
            icon={AlarmClock}
            leads={buckets.seguimientosVencidos}
            empty="No hay fechas vencidas. Bien."
            accent="border-rose-500/20 bg-rose-500/[0.06]"
            onOpen={setSelectedLeadId}
          />
          <InsightListCard
            title="Toca hoy"
            description="Compromisos con seguimiento marcado para hoy."
            icon={CalendarClock}
            leads={buckets.seguimientosHoy}
            empty="Nada programado para hoy."
            accent="border-amber-500/20 bg-amber-500/[0.06]"
            onOpen={setSelectedLeadId}
          />
          <InsightListCard
            title="Ventana 48 h"
            description="Próximo contacto en las siguientes 48 horas."
            icon={Sparkles}
            leads={buckets.proximas48h}
            empty="Sin citas próximas en ese margen."
            accent="border-sky-500/20 bg-sky-500/[0.06]"
            onOpen={setSelectedLeadId}
          />
          <InsightListCard
            title="Alta prioridad · embudo inicial"
            description="Marcados alta prioridad pero aún sin propuesta ni avance fuerte."
            icon={Flame}
            leads={buckets.prioridadSinAvance}
            empty="Nadie en este cajón."
            accent="border-orange-500/20 bg-orange-500/[0.06]"
            onOpen={setSelectedLeadId}
          />
          <InsightListCard
            title="Negociación sin cifra"
            description="En negociación pero sin importe guardado: arriesga desalineación."
            icon={Target}
            leads={buckets.negociacionSinCifra}
            empty="Todas las negociaciones tienen presupuesto anotado."
            accent="border-violet-500/20 bg-violet-500/[0.06]"
            onOpen={setSelectedLeadId}
          />
          <InsightListCard
            title="Propuesta enviada · posible estancamiento"
            description="5+ días sin actualizar en propuesta enviada o esperando respuesta."
            icon={MessageSquareWarning}
            leads={buckets.propuestaEstancada}
            empty="Nada estancado por fecha."
            accent="border-stone-500/20 bg-stone-500/[0.06]"
            onOpen={setSelectedLeadId}
          />
          <InsightListCard
            title="Aceptada · revisar cierre"
            description="Aceptada hace 3+ días sin fecha de cierre registrada."
            icon={ArrowRight}
            leads={buckets.cerrables}
            empty="Sin alertas de cierre pendiente."
            accent="border-emerald-500/20 bg-emerald-500/[0.06]"
            onOpen={setSelectedLeadId}
            className="lg:col-span-2"
          />
        </div>

        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/75">
              Recomendaciones
            </p>
            <h2 className="mt-1 text-lg font-semibold text-stone-50">
              Guía rápida para la siguiente conversación
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              Ideas generales; combínalas con lo que ya guardaste en cada ficha.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {playbook.map((item) => (
              <Card
                key={item.title}
                className="border-amber-500/15 bg-card/50 backdrop-blur-sm"
              >
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 ring-1 ring-amber-400/20">
                    <item.icon className="size-4 text-amber-200/90" />
                  </div>
                  <CardTitle className="text-base text-stone-50">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-stone-400">
                    {item.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function InsightListCard({
  title,
  description,
  icon: Icon,
  leads,
  empty,
  accent,
  onOpen,
  className,
}: {
  title: string
  description: string
  icon: typeof AlarmClock
  leads: Lead[]
  empty: string
  accent: string
  onOpen: (id: string) => void
  className?: string
}) {
  return (
    <Card
      className={cn(
        'overflow-hidden border backdrop-blur-md',
        accent,
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-950/40 ring-1 ring-amber-500/10">
            <Icon className="size-5 text-amber-200/85" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base text-stone-50">{title}</CardTitle>
            <CardDescription className="text-stone-500">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="rounded-lg border border-dashed border-amber-500/12 bg-stone-950/25 py-8 text-center text-xs text-stone-500">
            {empty}
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {leads.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onOpen(l.id)}
                  className={cn(
                    'flex w-full flex-col gap-1.5 rounded-xl border border-amber-500/12 bg-stone-950/40 p-3 text-left',
                    'transition hover:border-amber-400/35 hover:bg-stone-900/55',
                  )}
                >
                  <span className="font-medium text-stone-100">
                    {l.business_name}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <LeadStatusBadge status={l.status} />
                    {l.deal_next_followup_at ? (
                      <span className="text-[10px] text-stone-500">
                        Seguimiento:{' '}
                        {new Intl.DateTimeFormat('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(l.deal_next_followup_at))}
                      </span>
                    ) : null}
                    {l.priority === 'alta' ? (
                      <span className="text-[10px] font-medium text-rose-200/80">
                        Alta
                      </span>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {leads.length > 0 ? (
          <p className="mt-3 text-[10px] text-stone-600">
            {leads.length} ficha{leads.length === 1 ? '' : 's'}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
