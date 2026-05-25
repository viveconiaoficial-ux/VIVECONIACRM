import { Loader2, Save, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { resolveFailureReflectionWithSource } from '@/lib/failureReflection'
import { updateLead } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Lead } from '@/types/lead'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function sortRejected(a: Lead, b: Lead): number {
  const ta = new Date(a.updated_at ?? a.created_at).getTime()
  const tb = new Date(b.updated_at ?? b.created_at).getTime()
  return tb - ta
}

function failureReflectionGenerateLabel(edgeDisabled: boolean, hasWebhook: boolean): string {
  if (!edgeDisabled) return 'Consultar IA (Edge)'
  if (hasWebhook) return 'Consultar IA (webhook)'
  return 'Generar borrador (local)'
}

function FailureReflectionCard({
  lead,
  edgeDisabled,
  hasWebhook,
}: {
  lead: Lead
  edgeDisabled: boolean
  hasWebhook: boolean
}) {
  const upsertLead = useAppStore((s) => s.upsertLead)
  const [text, setText] = useState(lead.failure_ai_reflection ?? '')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setText(lead.failure_ai_reflection ?? '')
  }, [lead.id, lead.failure_ai_reflection])

  async function onGenerate() {
    setGenerating(true)
    try {
      const { text: resolved, source } = await resolveFailureReflectionWithSource(lead)
      setText(resolved)
      const msg =
        source === 'edge'
          ? 'Texto desde la Edge Function (OpenRouter). Revísalo y guarda.'
          : source === 'webhook'
            ? 'Respuesta del webhook aplicada (revísala y guarda).'
            : 'Borrador local (reglas sobre la ficha, sin modelo). Revísalo y guarda.'
      toast.success(msg)
    } catch (e) {
      console.error(e)
      toast.error(
        e instanceof Error ? e.message.slice(0, 160) : 'No se pudo generar el texto',
      )
    } finally {
      setGenerating(false)
    }
  }

  async function onSave() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const updated = await updateLead(lead.id, {
        failure_ai_reflection: text.trim() || null,
        updated_at: now,
      })
      upsertLead(updated)
      toast.success('Reflexión guardada en la ficha')
    } catch (e) {
      console.error(e)
      toast.error(
        'No se pudo guardar. ¿Migración 20260125120006 (failure_ai_reflection) en Supabase?',
      )
    } finally {
      setSaving(false)
    }
  }

  const dirty =
    (text.trim() || '') !== (lead.failure_ai_reflection?.trim() || '')

  return (
    <Card className="border-zinc-500/20 bg-stone-950/25 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-2">
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
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={generating}
              className="gap-1.5 border-amber-400/30 text-amber-100"
              onClick={() => void onGenerate()}
            >
              {generating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {failureReflectionGenerateLabel(edgeDisabled, hasWebhook)}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || !dirty}
              className="gap-1.5 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30 disabled:opacity-40"
              onClick={() => void onSave()}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Guardar
            </Button>
          </div>
        </div>
        {lead.deal_rejection_reason?.trim() ? (
          <CardDescription className="text-stone-400">
            Motivo en ficha: {lead.deal_rejection_reason.trim()}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={
            !edgeDisabled
              ? 'Pulsa Consultar IA (Edge): OpenRouter desde Supabase (secreto OPENROUTER_API_KEY). Si falla, webhook y luego borrador local.'
              : hasWebhook
                ? 'Pulsa Consultar IA (webhook) o escribe a mano. Guarda cuando quede bien.'
                : 'Pulsa Generar borrador (local): reglas sobre la ficha, sin modelo. Luego edita y Guardar.'
          }
          className={cn(
            'resize-y rounded-xl border-zinc-500/20 bg-stone-950/50 text-sm text-stone-200',
            'placeholder:text-stone-600 min-h-[180px]',
          )}
        />
      </CardContent>
    </Card>
  )
}

export function FracasosReflexionSection({ leads }: { leads: Lead[] }) {
  const sorted = useMemo(() => [...leads].sort(sortRejected), [leads])

  const hasWebhook = !!(
    import.meta.env.VITE_FAILURE_REFLECTION_WEBHOOK_URL as string | undefined
  )?.trim()
  const edgeDisabled =
    (import.meta.env.VITE_DISABLE_FAILURE_EDGE as string | undefined)?.trim() === 'true'

  const resumenPatron = useMemo(() => {
    const n = sorted.length
    if (n === 0) return null
    const ign = sorted.filter((l) => l.status === 'ignorada_rechazada').length
    const rev = sorted.filter((l) => l.status === 'contestada_rechazada').length
    const porSector = new Map<string, number>()
    for (const l of sorted) {
      const s = (l.sector ?? 'Sin sector').trim() || 'Sin sector'
      porSector.set(s, (porSector.get(s) ?? 0) + 1)
    }
    const top = [...porSector.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
    const topTxt =
      top.length > 0 ? top.map(([s, c]) => `${s} (${c})`).join(' · ') : ''
    return { n, ign, rev, topTxt }
  }, [sorted])

  if (sorted.length === 0) {
    return (
      <Card className="border-dashed border-amber-500/20 bg-stone-950/20">
        <CardHeader>
          <CardTitle className="text-lg text-stone-200">
            Reflexión sobre fracasos
          </CardTitle>
          <CardDescription className="text-stone-500">
            Cuando marques fichas como rechazadas, aparecerán aquí para analizar patrones y
            textos guardados.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <div className="px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Aprendizaje
        </p>
        <h2 className="mt-1 text-xl font-semibold text-stone-50">
          Reflexión por cada rechazo
        </h2>
        <div className="mt-2 max-w-3xl space-y-2 text-sm leading-relaxed text-amber-200/55">
          <p>
            <span className="font-medium text-amber-100/85">Orden automático:</span> primero la Edge
            Function <code className="text-[11px]">failure-reflection</code> del mismo proyecto
            Supabase (OpenRouter con el secreto{' '}
            <code className="text-[11px]">OPENROUTER_API_KEY</code>); si no responde o no está
            configurada, el{' '}
            <span className="text-amber-100/80">webhook opcional</span>{' '}
            <code className="rounded bg-stone-950/80 px-1 text-[11px]">
              VITE_FAILURE_REFLECTION_WEBHOOK_URL
            </code>
            ; si tampoco, <span className="text-amber-100/80">borrador local</span> instantáneo (reglas
            sobre la ficha).
          </p>
          {edgeDisabled ? (
            <p className="text-xs text-amber-200/70">
              Ahora mismo <code className="text-[11px]">VITE_DISABLE_FAILURE_EDGE=true</code>: se
              salta Edge y solo se usa webhook (si existe) o borrador local.
            </p>
          ) : null}
          <p className="text-xs text-stone-500">
            El texto generado siempre es editable: ajústalo y pulsa Guardar para persistir en{' '}
            <code className="text-[11px]">failure_ai_reflection</code>.
          </p>
        </div>
        {resumenPatron ? (
          <Card className="mt-4 border-amber-500/15 bg-amber-500/[0.04]">
            <CardHeader className="py-4">
              <CardTitle className="text-sm text-stone-100">
                Patrón rápido ({resumenPatron.n} rechazos)
              </CardTitle>
              <CardDescription className="text-stone-400">
                {resumenPatron.ign} sin respuesta explícita ·{' '}
                {resumenPatron.rev} con rechazo claro.
                {resumenPatron.topTxt
                  ? ` Sectores más repetidos: ${resumenPatron.topTxt}.`
                  : ''}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </div>
      <div className="space-y-5">
        {sorted.map((l) => (
          <FailureReflectionCard
            key={l.id}
            lead={l}
            edgeDisabled={edgeDisabled}
            hasWebhook={hasWebhook}
          />
        ))}
      </div>
    </section>
  )
}
