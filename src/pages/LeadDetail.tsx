import {
  ArrowLeft,
  FileDown,
  FileText,
  FlaskConical,
  Loader2,
  MapPin,
  UserCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ExpedienteEditor } from '@/components/leads/ExpedienteEditor'
import { LeadContactEditor } from '@/components/leads/LeadContactEditor'
import { LeadInvestigationEditor } from '@/components/leads/LeadInvestigationEditor'
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
import { ProposalHeroGallery } from '@/components/leads/ProposalHeroGallery'
import { downloadLeadInvestigationPdf } from '@/lib/generateLeadInvestigationPdf'
import {
  getLeadById,
  getLeadCompetitors,
  getLeadProposals,
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
            La primera pestaña es <strong className="text-amber-100">expediente e investigación</strong>; la segunda,
            estado e intercambio comercial.
          </p>
        </header>

        <Tabs defaultValue="detalle" className="w-full">
          <TabsList className="mb-2 h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-stone-900/50 p-1.5 sm:w-auto">
            <TabsTrigger
              value="detalle"
              className="rounded-lg px-4 py-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-50"
            >
              Expediente e investigación
            </TabsTrigger>
            <TabsTrigger
              value="estado"
              className="rounded-lg px-4 py-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-50"
            >
              Estado e intercambio
            </TabsTrigger>
          </TabsList>

          {lead.proposal_image_paths.length > 0 ? (
            <div className="mt-5 mb-1 max-w-none">
              <ProposalHeroGallery paths={lead.proposal_image_paths} />
            </div>
          ) : null}

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

        <LeadContactEditor
          key={`${lead.id}:${lead.updated_at ?? lead.created_at}`}
          lead={lead}
          onSaved={(updated) => {
            setLead(updated)
            upsertLead(updated)
          }}
        />

        <div className="scroll-mt-6 space-y-8">
          <LeadInvestigationEditor
            key={`inv-${lead.id}:${lead.updated_at ?? lead.created_at}`}
            lead={lead}
            onSaved={(updated) => {
              setLead(updated)
              upsertLead(updated)
            }}
          />

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

          {competitors.length === 0 && proposals.length === 0 ? (
            <p className="text-center text-xs text-stone-500">
              Competidores y propuestas versionadas aparecen aquí cuando los enlaces tus
              flujos (n8n) a Supabase.
            </p>
          ) : null}
        </div>
          </TabsContent>

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
        </Tabs>
      </div>
    </div>
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
