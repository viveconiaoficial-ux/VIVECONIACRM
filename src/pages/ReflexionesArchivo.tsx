import { BookOpen, ExternalLink, Loader2, Search, Sparkles, Trash2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { useLeads } from '@/hooks/useLeads'
import {
  clearCachedFailureInsights,
  fetchFailureReflectionInsights,
  loadCachedFailureInsights,
  saveCachedFailureInsights,
} from '@/lib/failureReflectionInsights'
import {
  getLeadsWithSavedReflections,
  MIN_REFLECTIONS_FOR_PATTERN_AI,
  reflectionExcerpt,
} from '@/lib/savedFailureReflections'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function ReflexionesArchivo() {
  const { allLeads } = useLeads()
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [insightsText, setInsightsText] = useState(
    () => loadCachedFailureInsights()?.insights ?? '',
  )
  const [insightsLoading, setInsightsLoading] = useState(false)

  const guardadas = useMemo(
    () => getLeadsWithSavedReflections(allLeads),
    [allLeads],
  )

  const filtradas = useMemo(() => {
    if (!search.trim()) return guardadas
    const q = search.toLowerCase()
    return guardadas.filter(
      (l) =>
        l.business_name.toLowerCase().includes(q) ||
        (l.sector ?? '').toLowerCase().includes(q) ||
        (l.failure_ai_reflection ?? '').toLowerCase().includes(q),
    )
  }, [guardadas, search])

  const puedeAnalizar = guardadas.length >= MIN_REFLECTIONS_FOR_PATTERN_AI

  async function onAnalizarPatrones() {
    if (!puedeAnalizar) {
      toast.message(
        `Necesitas al menos ${MIN_REFLECTIONS_FOR_PATTERN_AI} reflexiones guardadas (tienes ${guardadas.length}).`,
      )
      return
    }
    setInsightsLoading(true)
    try {
      const insights = await fetchFailureReflectionInsights(guardadas)
      setInsightsText(insights)
      saveCachedFailureInsights({
        generatedAt: new Date().toISOString(),
        count: guardadas.length,
        insights,
      })
      toast.success('Análisis global listo.')
    } catch (e) {
      console.error(e)
      toast.error(
        e instanceof Error ? e.message.slice(0, 200) : 'No se pudo analizar patrones',
      )
    } finally {
      setInsightsLoading(false)
    }
  }

  function onBorrarCacheInsights() {
    clearCachedFailureInsights()
    setInsightsText('')
    toast.message('Análisis global borrado de este navegador.')
  }

  const cacheMeta = useMemo(() => loadCachedFailureInsights(), [])

  return (
    <div className="flex min-w-0 flex-1 flex-col text-stone-100">
      <TopBar
        visibleCount={guardadas.length}
        onNewLead={() => setNewLeadOpen(true)}
        titleHighlight="reflexiones guardadas"
        countLine={(n) =>
          n === 0
            ? 'Aún no hay textos guardados. Genera y guarda reflexiones en Analíticas o en fichas rechazadas.'
            : `${n} ${n === 1 ? 'reflexión archivada' : 'reflexiones archivadas'} en Supabase.`
        }
      />
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <main className="flex flex-1 flex-col gap-8 p-6 sm:p-8">
        <header className="space-y-2 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Aprendizaje
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
            Archivo de reflexiones
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-amber-200/55">
            Consulta todo lo que ya guardaste en cada ficha. Cuando tengas varias, pide un
            análisis global: la IA cruza patrones y te dice qué está fallando en conjunto.
          </p>
        </header>

        <Card className="border-amber-500/20 bg-stone-950/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-stone-100">
              <Sparkles className="size-5 text-amber-300/90" aria-hidden />
              ¿Qué cojones pasa? (análisis global)
            </CardTitle>
            <CardDescription className="text-stone-400">
              {puedeAnalizar
                ? `Con ${guardadas.length} reflexiones guardadas puedes pedir un diagnóstico transversal vía OpenRouter (misma clave que en Edge).`
                : `Guarda al menos ${MIN_REFLECTIONS_FOR_PATTERN_AI} reflexiones (tienes ${guardadas.length}) para activar el análisis.`}
              {cacheMeta
                ? ` Último análisis en este navegador: ${new Date(cacheMeta.generatedAt).toLocaleString('es-ES')} (${cacheMeta.count} fichas).`
                : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!puedeAnalizar || insightsLoading}
                className="gap-1.5 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30"
                onClick={() => void onAnalizarPatrones()}
              >
                {insightsLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Analizar patrones con IA
              </Button>
              {insightsText ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-zinc-500/30 text-stone-300"
                  onClick={onBorrarCacheInsights}
                >
                  <Trash2 className="size-3.5" />
                  Borrar análisis local
                </Button>
              ) : null}
            </div>
            {insightsText ? (
              <div
                className={cn(
                  'max-h-[420px] overflow-y-auto rounded-xl border border-amber-500/15',
                  'bg-stone-950/50 p-4 text-sm leading-relaxed text-stone-200',
                  'whitespace-pre-wrap',
                )}
              >
                {insightsText}
              </div>
            ) : (
              <p className="text-sm text-stone-500">
                El resultado aparece aquí. No se guarda en Supabase (solo en este navegador hasta
                que pulses de nuevo o borres).
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-200/35" />
            <Input
              placeholder="Buscar negocio, sector o texto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl border-amber-500/15 bg-stone-950/40 pl-10 text-stone-100 placeholder:text-stone-600"
            />
          </div>
          <p className="text-xs text-stone-500">
            {filtradas.length} de {guardadas.length} reflexiones
          </p>
        </div>

        {filtradas.length === 0 ? (
          <Card className="border-dashed border-amber-500/20 bg-stone-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-200">
                <BookOpen className="size-5 text-amber-300/80" />
                Sin reflexiones guardadas
              </CardTitle>
              <CardDescription className="text-stone-500">
                Ve a Analíticas → «Reflexión por cada rechazo», genera texto y pulsa Guardar en
                cada ficha rechazada.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="space-y-4">
            {filtradas.map((lead) => (
              <li key={lead.id}>
                <Card className="border-zinc-500/20 bg-stone-950/25 backdrop-blur-sm">
                  <CardHeader className="space-y-2 pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="text-base text-stone-100">
                          {lead.business_name}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <LeadStatusBadge status={lead.status} />
                          {lead.sector ? (
                            <span className="text-[11px] text-stone-500">{lead.sector}</span>
                          ) : null}
                          <span className="text-[11px] text-stone-600">
                            {new Date(lead.updated_at ?? lead.created_at).toLocaleDateString(
                              'es-ES',
                            )}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5 border-amber-400/25 text-amber-100"
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        <ExternalLink className="size-3.5" />
                        Abrir ficha
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-stone-300 whitespace-pre-wrap">
                      {reflectionExcerpt(lead.failure_ai_reflection!, 1200)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
