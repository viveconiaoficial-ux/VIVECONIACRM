import { Copy, Loader2, Save, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { fetchLeadDeepResearch } from '@/lib/leadDeepResearch'
import {
  getLeadPrimaryWhatsAppMessage,
  isExpedienteOutreachMessage,
} from '@/lib/leadWhatsAppMessage'
import { logLeadInteraction, updateLead } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Lead } from '@/types/lead'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function trimOrNull(s: string): string | null {
  const t = s.trim()
  return t === '' ? null : t
}

interface LeadInvestigationEditorProps {
  lead: Lead
  onSaved?: (lead: Lead) => void
}

export function LeadInvestigationEditor({
  lead,
  onSaved,
}: LeadInvestigationEditorProps) {
  const upsertLead = useAppStore((s) => s.upsertLead)

  const currentWaMessage = useMemo(
    () => getLeadPrimaryWhatsAppMessage(lead),
    [lead],
  )

  const defaultResearchInput = useMemo(() => {
    const parts: string[] = []
    if (lead.google_maps_url?.trim()) parts.push(lead.google_maps_url.trim())
    if (lead.location_label?.trim()) parts.push(lead.location_label.trim())
    if (lead.instagram_handle?.trim()) {
      parts.push(`Instagram: @${lead.instagram_handle.replace(/^@/, '')}`)
    }
    return parts.join('\n')
  }, [lead.google_maps_url, lead.location_label, lead.instagram_handle])

  const [researchInput, setResearchInput] = useState(defaultResearchInput)
  const [opportunity, setOpportunity] = useState(lead.investigation_opportunity ?? '')
  const [pain, setPain] = useState(lead.investigation_pain ?? '')
  const [webPresence, setWebPresence] = useState(lead.web_presence_summary ?? '')
  const [strategyNotes, setStrategyNotes] = useState(lead.strategy_notes ?? '')
  const [videoHook, setVideoHook] = useState(lead.video_hook_notes ?? '')
  const [proposedWa, setProposedWa] = useState(lead.message_sondeo_directo ?? '')
  const [alternativeWa, setAlternativeWa] = useState(
    lead.message_sondeo_consultivo ?? '',
  )
  const [score, setScore] = useState(lead.score != null ? String(lead.score) : '')
  const [investigating, setInvestigating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasAiResult, setHasAiResult] = useState(
    !!(lead.message_sondeo_directo?.trim() || lead.investigation_opportunity?.trim()),
  )

  useEffect(() => {
    setResearchInput(defaultResearchInput)
    setOpportunity(lead.investigation_opportunity ?? '')
    setPain(lead.investigation_pain ?? '')
    setWebPresence(lead.web_presence_summary ?? '')
    setStrategyNotes(lead.strategy_notes ?? '')
    setVideoHook(lead.video_hook_notes ?? '')
    setProposedWa(lead.message_sondeo_directo ?? '')
    setAlternativeWa(lead.message_sondeo_consultivo ?? '')
    setScore(lead.score != null ? String(lead.score) : '')
  }, [lead.id, lead.updated_at ?? lead.created_at, defaultResearchInput])

  async function copyText(label: string, text: string) {
    if (!text.trim()) {
      toast.error('No hay texto para copiar')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copiado`)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  async function onInvestigate() {
    setInvestigating(true)
    try {
      const result = await fetchLeadDeepResearch(
        lead,
        researchInput,
        currentWaMessage,
      )
      if (result.investigation_opportunity) setOpportunity(result.investigation_opportunity)
      if (result.investigation_pain) setPain(result.investigation_pain)
      if (result.web_presence_summary) setWebPresence(result.web_presence_summary)
      if (result.strategy_notes) setStrategyNotes(result.strategy_notes)
      if (result.video_hook_notes) setVideoHook(result.video_hook_notes)
      if (result.proposed_whatsapp_message) {
        setProposedWa(result.proposed_whatsapp_message)
      }
      if (result.alternative_whatsapp_message) {
        setAlternativeWa(result.alternative_whatsapp_message)
      }
      if (result.suggested_score != null) {
        setScore(String(result.suggested_score))
      }
      setHasAiResult(true)
      toast.success('Investigación lista. Revisa y guarda en la ficha.')
    } catch (e) {
      console.error(e)
      toast.error(
        e instanceof Error ? e.message.slice(0, 220) : 'No se pudo investigar',
      )
    } finally {
      setInvestigating(false)
    }
  }

  async function onApplyAsPrimaryWa() {
    if (!proposedWa.trim()) {
      toast.error('Primero genera o escribe el mensaje propuesto')
      return
    }
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const updated = await updateLead(lead.id, {
        expediente_outreach_message: proposedWa.trim(),
        updated_at: now,
      })
      upsertLead(updated)
      toast.success('Mensaje propuesto aplicado como Msg 1 de WhatsApp')
      onSaved?.(updated)
    } catch (e) {
      console.error(e)
      toast.error('No se pudo actualizar el mensaje principal')
    } finally {
      setSaving(false)
    }
  }

  async function onSave() {
    const scoreRaw = score.trim()
    let scoreNum: number | null = null
    if (scoreRaw) {
      const n = Number(scoreRaw)
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        toast.error('El score debe ser entre 0 y 100')
        return
      }
      scoreNum = Math.round(n)
    }

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const payload: Record<string, unknown> = {
        ...(lead.research_payload ?? {}),
        last_deep_research_at: now,
        last_research_input: researchInput.trim().slice(0, 2000),
      }

      const updated = await updateLead(lead.id, {
        investigation_opportunity: trimOrNull(opportunity),
        investigation_pain: trimOrNull(pain),
        web_presence_summary: trimOrNull(webPresence),
        strategy_notes: trimOrNull(strategyNotes),
        video_hook_notes: trimOrNull(videoHook),
        message_sondeo_directo: trimOrNull(proposedWa),
        message_sondeo_consultivo: trimOrNull(alternativeWa),
        score: scoreNum,
        research_payload: payload,
        updated_at: now,
      })
      upsertLead(updated)
      try {
        await logLeadInteraction(lead.id, 'research_refreshed', {
          source: 'lead_deep_research',
        })
      } catch {
        /* opcional */
      }
      toast.success('Investigación guardada en Supabase')
      onSaved?.(updated)
    } catch (e) {
      console.error(e)
      toast.error('No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600'

  return (
    <Card
      id="bloque-investigacion"
      className={cn(
        'scroll-mt-6 border-amber-500/15 bg-card/55 shadow-2xl shadow-black/35',
        'backdrop-blur-md supports-[backdrop-filter]:bg-card/40',
      )}
    >
      <CardHeader className="space-y-3 border-b border-amber-500/10 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg text-stone-50">Investigar más</CardTitle>
            <CardDescription className="text-stone-500">
              Pega la URL (web, Maps, Instagram…) o datos del negocio. El agente investiga y
              propone un WhatsApp más personalizado sin perder vuestra esencia.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={investigating || researchInput.trim().length < 8}
            className="shrink-0 gap-1.5 bg-amber-500/25 text-amber-50 hover:bg-amber-500/35"
            onClick={() => void onInvestigate()}
          >
            {investigating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Investigar con IA
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <label className="text-xs font-medium text-amber-200/80">
            URL o información del negocio
          </label>
          <Textarea
            value={researchInput}
            onChange={(e) => setResearchInput(e.target.value)}
            rows={4}
            placeholder="https://maps.google.com/... o descripción: qué hacen, reseñas, pain points que ya sabes…"
            className={cn(inputClass, 'min-h-[100px] resize-y')}
          />
        </div>

        <div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-950/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-200/80">
              Tu mensaje actual de WhatsApp (Msg 1)
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-[11px] text-stone-500 hover:text-amber-100"
              onClick={() => void copyText('Mensaje actual', currentWaMessage)}
            >
              <Copy className="size-3" />
              Copiar
            </Button>
          </div>
          <p className="text-[11px] text-stone-500">
            {isExpedienteOutreachMessage(lead)
              ? 'Sale del expediente (mensaje personalizado que creaste).'
              : 'Plantilla por defecto del CRM hasta que guardes uno en expediente.'}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-200">
            {currentWaMessage}
          </p>
        </div>

        {hasAiResult || proposedWa.trim() ? (
          <div className="space-y-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">
              Propuesta del agente (más centrada en el negocio)
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-amber-200/80">
                  Mensaje WhatsApp propuesto
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={() => void copyText('Propuesta WA', proposedWa)}
                >
                  <Copy className="size-3" />
                  Copiar
                </Button>
              </div>
              <Textarea
                value={proposedWa}
                onChange={(e) => setProposedWa(e.target.value)}
                rows={5}
                className={cn(inputClass, 'resize-y')}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving || !proposedWa.trim()}
                className="border-amber-400/30 text-amber-100"
                onClick={() => void onApplyAsPrimaryWa()}
              >
                Usar como mensaje principal (Msg 1)
              </Button>
            </div>

            {alternativeWa.trim() || hasAiResult ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">
                  Alternativa consultiva (opcional)
                </label>
                <Textarea
                  value={alternativeWa}
                  onChange={(e) => setAlternativeWa(e.target.value)}
                  rows={3}
                  className={cn(inputClass, 'resize-y')}
                />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">Oportunidad</label>
                <Textarea
                  value={opportunity}
                  onChange={(e) => setOpportunity(e.target.value)}
                  rows={4}
                  className={cn(inputClass, 'resize-y')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">Dolor / necesidad</label>
                <Textarea
                  value={pain}
                  onChange={(e) => setPain(e.target.value)}
                  rows={4}
                  className={cn(inputClass, 'resize-y')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-200/80">
                Presencia digital (resumen)
              </label>
              <Textarea
                value={webPresence}
                onChange={(e) => setWebPresence(e.target.value)}
                rows={2}
                className={cn(inputClass, 'resize-y')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-200/80">Estrategia</label>
              <Textarea
                value={strategyNotes}
                onChange={(e) => setStrategyNotes(e.target.value)}
                rows={3}
                className={cn(inputClass, 'resize-y')}
              />
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-stone-500">
            Tras investigar verás aquí el mensaje propuesto y el análisis. Pulsa{' '}
            <span className="text-amber-200/80">Investigar con IA</span>.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-amber-500/10 pt-4">
          <Button
            type="button"
            size="sm"
            disabled={saving}
            className="gap-1.5 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30"
            onClick={() => void onSave()}
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Guardar investigación
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
