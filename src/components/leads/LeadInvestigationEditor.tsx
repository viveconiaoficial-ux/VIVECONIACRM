import { Copy, Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { logLeadInteraction, updateLead } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Lead, LeadPriority } from '@/types/lead'
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

  const [opportunity, setOpportunity] = useState(lead.investigation_opportunity ?? '')
  const [pain, setPain] = useState(lead.investigation_pain ?? '')
  const [sondeoDirecto, setSondeoDirecto] = useState(lead.message_sondeo_directo ?? '')
  const [sondeoConsultivo, setSondeoConsultivo] = useState(
    lead.message_sondeo_consultivo ?? '',
  )
  const [videoHook, setVideoHook] = useState(lead.video_hook_notes ?? '')
  const [strategyNotes, setStrategyNotes] = useState(lead.strategy_notes ?? '')
  const [webPresence, setWebPresence] = useState(lead.web_presence_summary ?? '')
  const [priority, setPriority] = useState<string>(lead.priority ?? 'none')
  const [score, setScore] = useState(
    lead.score != null ? String(lead.score) : '',
  )
  const [researchJson, setResearchJson] = useState(
    lead.research_payload && Object.keys(lead.research_payload).length > 0
      ? JSON.stringify(lead.research_payload, null, 2)
      : '',
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setOpportunity(lead.investigation_opportunity ?? '')
    setPain(lead.investigation_pain ?? '')
    setSondeoDirecto(lead.message_sondeo_directo ?? '')
    setSondeoConsultivo(lead.message_sondeo_consultivo ?? '')
    setVideoHook(lead.video_hook_notes ?? '')
    setStrategyNotes(lead.strategy_notes ?? '')
    setWebPresence(lead.web_presence_summary ?? '')
    setPriority(lead.priority ?? 'none')
    setScore(lead.score != null ? String(lead.score) : '')
    setResearchJson(
      lead.research_payload && Object.keys(lead.research_payload).length > 0
        ? JSON.stringify(lead.research_payload, null, 2)
        : '',
    )
  }, [lead.id, lead.updated_at ?? lead.created_at])

  async function copyField(label: string, text: string) {
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

  async function handleSave() {
    let research_payload: Record<string, unknown> | null = lead.research_payload
    const jsonRaw = researchJson.trim()
    if (!jsonRaw) {
      research_payload = null
    } else {
      try {
        const parsed = JSON.parse(jsonRaw) as unknown
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          toast.error('El JSON de investigación debe ser un objeto { ... }')
          return
        }
        research_payload = parsed as Record<string, unknown>
      } catch {
        toast.error('JSON de investigación inválido')
        return
      }
    }

    const scoreRaw = score.trim()
    let scoreNum: number | null = null
    if (scoreRaw) {
      const n = Number(scoreRaw)
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        toast.error('El score debe ser un número entre 0 y 100')
        return
      }
      scoreNum = Math.round(n)
    }

    const priorityVal: LeadPriority | null =
      priority === 'alta' || priority === 'media' || priority === 'baja'
        ? priority
        : null

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const updated = await updateLead(lead.id, {
        investigation_opportunity: trimOrNull(opportunity),
        investigation_pain: trimOrNull(pain),
        message_sondeo_directo: trimOrNull(sondeoDirecto),
        message_sondeo_consultivo: trimOrNull(sondeoConsultivo),
        video_hook_notes: trimOrNull(videoHook),
        strategy_notes: trimOrNull(strategyNotes),
        web_presence_summary: trimOrNull(webPresence),
        priority: priorityVal,
        score: scoreNum,
        research_payload,
        updated_at: now,
      })
      upsertLead(updated)
      try {
        await logLeadInteraction(lead.id, 'research_refreshed', {
          source: 'investigation_manual',
        })
      } catch {
        /* opcional */
      }
      toast.success('Investigación guardada')
      onSaved?.(updated)
    } catch (e) {
      console.error(e)
      toast.error('No se pudo guardar. Revisa conexión y columnas en Supabase (002).')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600'

  function FieldWithCopy({
    label,
    value,
    onChange,
    rows = 4,
    placeholder,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    rows?: number
    placeholder?: string
  }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-medium text-amber-200/80">{label}</label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-[11px] text-stone-500 hover:text-amber-100"
            onClick={() => void copyField(label, value)}
          >
            <Copy className="size-3" />
            Copiar
          </Button>
        </div>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={cn(inputClass, 'min-h-[72px] resize-y')}
        />
      </div>
    )
  }

  return (
    <Card
      id="bloque-investigacion"
      className={cn(
        'scroll-mt-6 border-amber-500/15 bg-card/55 shadow-2xl shadow-black/35',
        'backdrop-blur-md supports-[backdrop-filter]:bg-card/40',
      )}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0 border-b border-amber-500/10 pb-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg text-stone-50">Investigar más</CardTitle>
          <CardDescription className="text-stone-500">
            Oportunidad, dolor, mensajes de sondeo y notas de estrategia. Edita aquí y guarda
            en Supabase (también puedes volcar JSON desde n8n abajo).
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          className="shrink-0 gap-1.5 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30"
          onClick={() => void handleSave()}
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          Guardar investigación
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">Prioridad</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Sin prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin prioridad</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">Score (0–100)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Ej. 72"
              className={inputClass}
            />
          </div>
        </div>

        <FieldWithCopy
          label="Oportunidad"
          value={opportunity}
          onChange={setOpportunity}
          rows={5}
          placeholder="Qué encaje o valor ves para este negocio…"
        />
        <FieldWithCopy
          label="Dolor / necesidad"
          value={pain}
          onChange={setPain}
          rows={5}
          placeholder="Problema que podríais resolver…"
        />
        <FieldWithCopy
          label="Sondeo directo (recomendado para WA)"
          value={sondeoDirecto}
          onChange={setSondeoDirecto}
          rows={4}
        />
        <FieldWithCopy
          label="Enfoque consultivo"
          value={sondeoConsultivo}
          onChange={setSondeoConsultivo}
          rows={4}
        />
        <FieldWithCopy
          label="Gancho para vídeo / seguimiento"
          value={videoHook}
          onChange={setVideoHook}
          rows={3}
        />
        <FieldWithCopy
          label="Estrategia / notas"
          value={strategyNotes}
          onChange={setStrategyNotes}
          rows={4}
        />
        <div className="space-y-2">
          <label className="text-xs font-medium text-amber-200/80">
            Presencia web (resumen)
          </label>
          <Input
            value={webPresence}
            onChange={(e) => setWebPresence(e.target.value)}
            placeholder="Ej. Sin web, solo Instagram activo"
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-amber-200/80">
            Investigación extra (JSON, opcional)
          </label>
          <p className="text-[11px] text-stone-500">
            Para volcados de n8n/IA. Debe ser un objeto JSON válido o déjalo vacío.
          </p>
          <Textarea
            value={researchJson}
            onChange={(e) => setResearchJson(e.target.value)}
            rows={6}
            placeholder='{"radiografia": "..."}'
            className={cn(inputClass, 'font-mono text-xs resize-y min-h-[120px]')}
          />
        </div>
      </CardContent>
    </Card>
  )
}
