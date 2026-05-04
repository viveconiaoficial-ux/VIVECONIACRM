import { Loader2, Save } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { logLeadInteraction, updateLead } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Lead } from '@/types/lead'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ExpedienteEditorProps {
  lead: Lead
  onSaved?: (lead: Lead) => void
}

export function ExpedienteEditor({ lead, onSaved }: ExpedienteEditorProps) {
  const upsertLead = useAppStore((s) => s.upsertLead)
  const [analysis, setAnalysis] = useState(lead.expediente_analysis ?? '')
  const [visualAssets, setVisualAssets] = useState(
    lead.expediente_visual_assets ?? '',
  )
  const [salesStrategy, setSalesStrategy] = useState(
    lead.expediente_sales_strategy ?? '',
  )
  const [outreachMessage, setOutreachMessage] = useState(
    lead.expediente_outreach_message ?? '',
  )
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const updated = await updateLead(lead.id, {
        expediente_analysis: analysis.trim() || null,
        expediente_visual_assets: visualAssets.trim() || null,
        expediente_sales_strategy: salesStrategy.trim() || null,
        expediente_outreach_message: outreachMessage.trim() || null,
        updated_at: now,
        last_contact_date: lead.last_contact_date ?? now,
      })
      upsertLead(updated)
      try {
        await logLeadInteraction(lead.id, 'research_refreshed', {
          source: 'expediente_manual',
          fields: ['expediente_*'],
        })
      } catch {
        /* historial opcional */
      }
      toast.success('Expediente guardado en Supabase')
      onSaved?.(updated)
    } catch (e) {
      console.error(e)
      toast.error('No se pudo guardar. Revisa conexión y columnas en BD (003).')
    } finally {
      setSaving(false)
    }
  }

  const dirty =
    analysis !== (lead.expediente_analysis ?? '') ||
    visualAssets !== (lead.expediente_visual_assets ?? '') ||
    salesStrategy !== (lead.expediente_sales_strategy ?? '') ||
    outreachMessage !== (lead.expediente_outreach_message ?? '')

  return (
    <Card
      className={cn(
        'ring-2 ring-amber-400/30 shadow-xl shadow-amber-950/20',
        'border-amber-500/20 bg-card/55 shadow-xl shadow-black/25',
        'backdrop-blur-md supports-[backdrop-filter]:bg-card/40',
      )}
    >
      <CardHeader className="flex flex-col gap-2 border-b border-amber-500/10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-stone-50">
            Expediente comercial{' '}
            <span className="ml-2 rounded-md bg-amber-500/25 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-100 ring-1 ring-amber-400/30">
              Rellenar manual
            </span>
          </CardTitle>
          <CardDescription className="max-w-2xl text-stone-500">
            Cuatro bloques: análisis, activos para vídeo, estrategia y mensaje largo para
            WhatsApp. <strong className="font-medium text-stone-400">Guardar en Supabase</strong>{' '}
            persiste los cambios. Si rellenas el mensaje largo, el primer botón de WA usa
            ese texto.
          </CardDescription>
        </div>
        <Button
          type="button"
          disabled={saving || !dirty}
          onClick={() => void handleSave()}
          className="shrink-0 gap-2 border-amber-400/35 bg-gradient-to-b from-amber-200/95 to-amber-400/85 text-stone-900 hover:to-amber-300/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Guardar en Supabase
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            1. El análisis real (por qué la web / presencia “falla”)
          </label>
          <Textarea
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            placeholder="SSL, flujo de contacto, estética vs trabajo real, etc."
            rows={8}
            className="min-h-[140px] rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            2. Activos directos (CapCut / referencias)
          </label>
          <Textarea
            value={visualAssets}
            onChange={(e) => setVisualAssets(e.target.value)}
            placeholder="Instagram @..., qué reels usar; Google Maps qué fotos; web URL para contrastar..."
            rows={8}
            className="min-h-[140px] rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            3. Estrategia de venta (enfoque “evolución”)
          </label>
          <Textarea
            value={salesStrategy}
            onChange={(e) => setSalesStrategy(e.target.value)}
            placeholder="Cómo plantear la conversión sin atacar al cliente..."
            rows={6}
            className="min-h-[120px] rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            4. Mensaje personalizado (WhatsApp / primera toma)
          </label>
          <Textarea
            value={outreachMessage}
            onChange={(e) => setOutreachMessage(e.target.value)}
            placeholder="Texto largo firmado, listo para enviar o pulir..."
            rows={12}
            className="min-h-[200px] rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>
      </CardContent>
    </Card>
  )
}
