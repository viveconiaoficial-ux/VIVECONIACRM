import {
  ArrowLeft,
  Building2,
  Copy,
  FileDown,
  FileText,
  FlaskConical,
  Lightbulb,
  Loader2,
  MapPin,
  Sparkles,
  Target,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ExpedienteEditor } from '@/components/leads/ExpedienteEditor'
import { LeadEstadoIntercambioPanel } from '@/components/leads/LeadEstadoIntercambioPanel'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import { LeadActions } from '@/components/leads/LeadActions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { downloadLeadInvestigationPdf } from '@/lib/generateLeadInvestigationPdf'
import { proposalImagePublicUrl } from '@/lib/proposalImageStorage'
import {
  getLeadById,
  getLeadCompetitors,
  getLeadProposals,
  logLeadInteraction,
} from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { LeadCompetitor, LeadProposal } from '@/types/analytics'
import type { Lead, LeadPriority } from '@/types/lead'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LeadDetailProps {
  leadId: string
}

function scrollToSection(id: string) {
  window.requestAnimationFrame(() => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function priorityBadge(p: LeadPriority | null) {
  if (!p) return null
  const map: Record<LeadPriority, string> = {
    alta: 'border-rose-400/35 bg-rose-500/15 text-rose-100',
    media: 'border-amber-400/35 bg-amber-500/12 text-amber-100',
    baja: 'border-stone-500/30 bg-stone-500/10 text-stone-300',
  }
  return (
    <Badge variant="outline" className={cn('rounded-full capitalize', map[p])}>
      Prioridad {p}
    </Badge>
  )
}

export function LeadDetail({ leadId }: LeadDetailProps) {
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)
  const upsertLead = useAppStore((s) => s.upsertLead)
  const cached = useAppStore((s) => s.leads.find((l) => l.id === leadId))
  const [lead, setLead] = useState<Lead | null>(cached ?? null)
  const [competitors, setCompetitors] = useState<LeadCompetitor[]>([])
  const [proposals, setProposals] = useState<LeadProposal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)

  const reloadSatellite = useCallback(async () => {
    const [comps, props] = await Promise.all([
      getLeadCompetitors(leadId).catch(() => [] as LeadCompetitor[]),
      getLeadProposals(leadId).catch(() => [] as LeadProposal[]),
    ])
    setCompetitors(comps)
    setProposals(props)
  }, [leadId])

  useEffect(() => {
    let cancelled = false
    void getLeadById(leadId)
      .then(async (data) => {
        if (cancelled) return
        setLead(data)
        await reloadSatellite()
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'No se pudo cargar el lead')
      })
    return () => {
      cancelled = true
    }
  }, [leadId, reloadSatellite])

  async function copyText(label: string, text: string | null | undefined) {
    if (!text?.trim()) {
      toast.error('No hay texto para copiar')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      void logLeadInteraction(leadId, 'wa_draft_created', {
        action: 'copy',
        label,
        length: text.length,
      }).catch(() => {})
      await reloadSatellite()
      toast.success('Copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  async function handleDownloadPdf() {
    setPdfBusy(true)
    try {
      const [row, comps, props] = await Promise.all([
        getLeadById(leadId),
        getLeadCompetitors(leadId).catch(() => [] as LeadCompetitor[]),
        getLeadProposals(leadId).catch(() => [] as LeadProposal[]),
      ])
      downloadLeadInvestigationPdf(row, {
        competitors: comps,
        proposals: props,
      })
      setLead(row)
      upsertLead(row)
      setCompetitors(comps)
      setProposals(props)
      toast.success('PDF descargado con toda la investigación')
    } catch (e) {
      console.error(e)
      toast.error('No se pudo generar el PDF')
    } finally {
      setPdfBusy(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-8 text-stone-100 sm:px-8">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="mb-6 size-10 rounded-full border-amber-400/30 bg-stone-950/30 text-amber-100 hover:bg-amber-500/10"
          onClick={() => setSelectedLeadId(null)}
          aria-label="Volver"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="size-10 animate-pulse rounded-full bg-amber-400/20 ring-2 ring-amber-400/30" />
        <p className="text-sm text-stone-500">Un momento, abriendo la ficha…</p>
      </div>
    )
  }

  const hasInvestigation =
    lead.investigation_opportunity ||
    lead.investigation_pain ||
    lead.message_sondeo_directo ||
    lead.message_sondeo_consultivo ||
    lead.video_hook_notes ||
    lead.strategy_notes

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="mb-8 size-10 rounded-full border-amber-400/30 bg-stone-950/25 text-amber-100 shadow-lg shadow-black/20 hover:bg-amber-500/10"
        onClick={() => setSelectedLeadId(null)}
        aria-label="Volver al listado"
      >
        <ArrowLeft className="size-4" />
      </Button>

      <div className="mx-auto max-w-4xl space-y-8">
        <ProposalImagesStrip paths={lead.proposal_image_paths} />

        <header className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/85">
            Ficha de prospecto
          </p>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <h1
                className={cn(
                  'text-3xl font-semibold tracking-tight sm:text-4xl',
                  'bg-gradient-to-br from-stone-50 via-amber-100/95 to-amber-300/80 bg-clip-text text-transparent',
                )}
              >
                {lead.business_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {priorityBadge(lead.priority)}
                {lead.score != null ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-amber-400/30 bg-amber-500/10 text-amber-100"
                  >
                    Score {lead.score}/100
                  </Badge>
                ) : null}
                <LeadStatusBadge status={lead.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
                {lead.location_label || lead.city ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-amber-400/60" />
                    {lead.location_label ??
                      [lead.neighborhood, lead.city, lead.province]
                        .filter(Boolean)
                        .join(', ')}
                  </span>
                ) : null}
                {lead.maps_rating != null && lead.review_count != null ? (
                  <span>
                    ★ {lead.maps_rating} · {lead.review_count} reseñas
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-stone-500">
                Alta{' '}
                {new Intl.DateTimeFormat('es-ES', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(lead.created_at))}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pdfBusy}
                className="gap-2 border-amber-400/28 text-amber-100/95 hover:bg-amber-500/10"
                onClick={() => void handleDownloadPdf()}
              >
                {pdfBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileDown className="size-4" />
                )}
                PDF investigación
              </Button>
              <LeadActions lead={lead} onAfterLogged={reloadSatellite} />
            </div>
          </div>
          <p className="text-xs text-amber-200/70">
            Usa la primera pestaña para <strong className="text-amber-100">estado</strong> y
            lo comercial; la segunda para expediente, contacto e investigación.
          </p>
        </header>

        <Tabs defaultValue="estado" className="w-full">
          <TabsList className="mb-2 h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-stone-900/50 p-1.5 sm:w-auto">
            <TabsTrigger
              value="estado"
              className="rounded-lg px-4 py-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-50"
            >
              Estado e intercambio
            </TabsTrigger>
            <TabsTrigger
              value="detalle"
              className="rounded-lg px-4 py-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-50"
            >
              Expediente e investigación
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estado" className="mt-6 outline-none">
            <LeadEstadoIntercambioPanel
              key={`${lead.id}:${lead.updated_at ?? lead.created_at}`}
              lead={lead}
              onSaved={async (updated) => {
                setLead(updated)
                await reloadSatellite()
              }}
            />
          </TabsContent>

          <TabsContent value="detalle" className="mt-6 space-y-8 outline-none">
        <Card
          className={cn(
            'border-amber-500/18 bg-card/50 shadow-lg shadow-black/20 backdrop-blur-sm',
          )}
        >
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base text-stone-50">
              Análisis detallado
            </CardTitle>
            <CardDescription>
              Salta a cada bloque para modificar, rellenar más o ampliar investigación.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-amber-400/28 text-amber-100/95"
              onClick={() => scrollToSection('expediente-manual')}
            >
              <FileText className="size-3.5" />
              Modificar expediente
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-amber-400/28 text-amber-100/95"
              onClick={() => scrollToSection('datos-contacto')}
            >
              <UserCircle className="size-3.5" />
              Datos de contacto
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-amber-400/28 text-amber-100/95"
              onClick={() => scrollToSection('bloque-investigacion')}
            >
              <FlaskConical className="size-3.5" />
              Investigar más
            </Button>
          </CardContent>
        </Card>

        <div id="expediente-manual" className="scroll-mt-6">
          <ExpedienteEditor
            key={`${lead.id}:${lead.updated_at ?? lead.created_at}`}
            lead={lead}
            onSaved={async (updated) => {
              setLead(updated)
              await reloadSatellite()
            }}
          />
        </div>

        {/* KPI / presencia */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Instagram"
            value={lead.instagram_handle ? `@${lead.instagram_handle.replace(/^@/, '')}` : '—'}
          />
          <Kpi label="Contactos" value={lead.contact_names ?? '—'} />
          <Kpi
            label="Presencia web"
            value={lead.web_presence_summary ?? (lead.has_website ? 'Con web' : 'Sin web')}
          />
          <Kpi
            label="Sector / tags"
            value={
              lead.sector_tags?.length
                ? lead.sector_tags.join(', ')
                : (lead.sector ?? '—')
            }
          />
        </div>

        <Card
          id="datos-contacto"
          className={cn(
            'scroll-mt-6 overflow-hidden border-amber-500/15 bg-card/55 shadow-2xl shadow-black/35',
            'backdrop-blur-md supports-[backdrop-filter]:bg-card/40',
          )}
        >
          <CardHeader className="flex flex-row items-start gap-4 space-y-0 border-b border-amber-500/10 pb-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/12 ring-1 ring-amber-400/22">
              <Building2 className="size-5 text-amber-200/90" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-lg text-stone-50">
                Datos de contacto
              </CardTitle>
              <CardDescription className="text-stone-500">
                Lo esencial para retomar la conversación.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-xl border border-amber-500/15 bg-stone-950/35 p-5 shadow-inner shadow-black/25">
              <div className="grid gap-6 text-sm sm:grid-cols-2">
                <DetailRow label="Persona de contacto" value={lead.contact_name} />
                <DetailRow label="Email" value={lead.email} />
                <DetailRow label="WhatsApp" value={lead.whatsapp_phone} />
                <DetailRow label="Sector" value={lead.sector} />
                <DetailRow label="¿Tiene web?" value={lead.has_website ? 'Sí' : 'No'} />
                {lead.google_maps_url ? (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/45">
                      Google Maps
                    </p>
                    <a
                      href={lead.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-amber-300/90 underline-offset-2 hover:underline"
                    >
                      Abrir ficha
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div id="bloque-investigacion" className="scroll-mt-6 space-y-8">
          {hasInvestigation ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {lead.investigation_opportunity ? (
                <InsightCard
                  icon={Lightbulb}
                  title="Oportunidad"
                  body={lead.investigation_opportunity}
                />
              ) : null}
              {lead.investigation_pain ? (
                <InsightCard
                  icon={Target}
                  title="Dolor"
                  body={lead.investigation_pain}
                />
              ) : null}
              {lead.message_sondeo_directo ? (
                <MessageCard
                  title="Sondeo directo (recomendado)"
                  text={lead.message_sondeo_directo}
                  onCopy={() =>
                    void copyText('sondeo_directo', lead.message_sondeo_directo)
                  }
                />
              ) : null}
              {lead.message_sondeo_consultivo ? (
                <MessageCard
                  title="Enfoque consultivo"
                  text={lead.message_sondeo_consultivo}
                  onCopy={() =>
                    void copyText(
                      'sondeo_consultivo',
                      lead.message_sondeo_consultivo,
                    )
                  }
                />
              ) : null}
              {lead.video_hook_notes ? (
                <InsightCard
                  icon={Sparkles}
                  title="Gancho para vídeo / seguimiento"
                  body={lead.video_hook_notes}
                  className="lg:col-span-2"
                />
              ) : null}
              {lead.strategy_notes ? (
                <InsightCard
                  icon={Users}
                  title="Estrategia / notas"
                  body={lead.strategy_notes}
                  className="lg:col-span-2"
                />
              ) : null}
            </div>
          ) : null}

          {lead.research_payload &&
          Object.keys(lead.research_payload).length > 0 ? (
            <Card className="border-amber-500/15 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-stone-50">
                  Investigación (JSON)
                </CardTitle>
                <CardDescription>
                  Volcado flexible desde IA / n8n. Úsalo para analítica avanzada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-auto rounded-xl border border-amber-500/10 bg-stone-950/50 p-4 text-xs text-stone-400">
                  {JSON.stringify(lead.research_payload, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}

          {competitors.length > 0 ? (
            <Card className="border-amber-500/15 bg-card/55 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg text-stone-50">
                  Competencia
                </CardTitle>
                <CardDescription>
                  {competitors.length} registro{competitors.length === 1 ? '' : 's'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {competitors.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-amber-500/10 bg-stone-950/30 p-4 text-sm"
                  >
                    <p className="font-medium text-stone-100">{c.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                      {c.rating != null ? <span>★ {c.rating}</span> : null}
                      {c.review_count != null ? (
                        <span>{c.review_count} reseñas</span>
                      ) : null}
                      {c.has_website != null ? (
                        <span>{c.has_website ? 'Con web' : 'Sin web'}</span>
                      ) : null}
                      {c.threat_level ? (
                        <span className="text-amber-200/70">{c.threat_level}</span>
                      ) : null}
                    </div>
                    {c.notes ? (
                      <p className="mt-2 text-stone-400">{c.notes}</p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {proposals.length > 0 ? (
            <Card className="border-amber-500/15 bg-card/55 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg text-stone-50">
                  Propuestas / informes
                </CardTitle>
                <CardDescription>Versiones guardadas en Supabase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-amber-500/10 bg-stone-950/35 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-stone-100">
                        {p.title ?? p.kind}
                      </span>
                      <time className="text-xs text-stone-500" dateTime={p.created_at}>
                        {new Intl.DateTimeFormat('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(p.created_at))}
                      </time>
                    </div>
                    <pre className="mt-3 max-h-40 overflow-auto text-[11px] text-stone-500">
                      {JSON.stringify(p.sections, null, 2)}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {!hasInvestigation &&
          !(lead.research_payload && Object.keys(lead.research_payload).length > 0) &&
          competitors.length === 0 &&
          proposals.length === 0 ? (
            <Card className="border-dashed border-amber-500/20 bg-stone-950/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base text-stone-200">
                  Amplía la investigación
                </CardTitle>
                <CardDescription className="text-stone-500">
                  Aún no hay oportunidad/dolor, JSON de investigación, competidores ni
                  propuestas enlazados. Rellena el expediente arriba o conecta tus flujos
                  (n8n / IA) para volcar datos aquí.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </div>

        {lead.notes ? (
          <Card className="border-amber-500/15 bg-card/55 shadow-xl shadow-black/25 backdrop-blur-md supports-[backdrop-filter]:bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg text-stone-50">Notas</CardTitle>
              <CardDescription className="text-stone-500">
                Notas manuales del pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-amber-500/12 bg-stone-950/35 p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">
                  {lead.notes}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ProposalImagesStrip({ paths }: { paths: string[] }) {
  if (!paths.length) return null
  return (
    <section
      aria-label="Imágenes enviadas con la propuesta"
      className="overflow-hidden rounded-2xl border border-amber-500/20 bg-stone-950/35 p-4 shadow-lg shadow-black/25 ring-1 ring-amber-500/10 backdrop-blur-md supports-[backdrop-filter]:bg-card/35"
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
        Imágenes enviadas con la propuesta
      </p>
      <div className="flex max-h-[min(52vh,420px)] gap-4 overflow-x-auto overflow-y-hidden pb-1">
        {paths.map((storagePath) => {
          const src = proposalImagePublicUrl(storagePath)
          return (
            <a
              key={storagePath}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 overflow-hidden rounded-xl border border-amber-500/15 bg-black/40 ring-1 ring-amber-400/15"
              title="Abrir imagen completa"
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="max-h-[min(52vh,380px)] w-auto max-w-[min(92vw,480px)] object-contain object-top"
              />
            </a>
          )
        })}
      </div>
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-amber-500/12 bg-stone-950/35 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/45">
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-stone-200" title={value}>
        {value}
      </p>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/45">
        {label}
      </p>
      <p className="text-base text-stone-100">{value ?? '—'}</p>
    </div>
  )
}

function InsightCard({
  icon: Icon,
  title,
  body,
  className,
}: {
  icon: LucideIcon
  title: string
  body: string
  className?: string
}) {
  return (
    <Card
      className={cn(
        'border-amber-500/15 bg-card/50 shadow-lg shadow-black/20',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/12 ring-1 ring-amber-400/20">
          <Icon className="size-4 text-amber-200/90" aria-hidden />
        </div>
        <CardTitle className="text-base text-stone-50">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-stone-300">{body}</p>
      </CardContent>
    </Card>
  )
}

function MessageCard({
  title,
  text,
  onCopy,
}: {
  title: string
  text: string
  onCopy: () => void
}) {
  return (
    <Card className="border-amber-500/15 bg-card/50 shadow-lg shadow-black/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base text-stone-50">{title}</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5 border-amber-400/25 text-amber-100"
          onClick={onCopy}
        >
          <Copy className="size-3.5" />
          Copiar
        </Button>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">
          {text}
        </p>
      </CardContent>
    </Card>
  )
}
