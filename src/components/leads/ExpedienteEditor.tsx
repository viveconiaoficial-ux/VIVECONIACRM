import { ImagePlus, Loader2, Save, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX_PROPOSAL_IMAGES_PER_LEAD,
  proposalImagePublicUrl,
  removeProposalBundleImage,
  uploadProposalBundleImage,
} from '@/lib/proposalImageStorage'
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
  const [followupNoResponse, setFollowupNoResponse] = useState(
    lead.expediente_followup_no_response ?? '',
  )
  const [proposalPaths, setProposalPaths] = useState<string[]>(
    () => lead.proposal_image_paths ?? [],
  )
  const [imageBusy, setImageBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setProposalPaths(lead.proposal_image_paths ?? [])
  }, [lead.id, lead.proposal_image_paths?.join('|')])

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
        expediente_followup_no_response: followupNoResponse.trim() || null,
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
      toast.error('No se pudo guardar. Revisa conexión y columnas en BD (003, 007, 008).')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddProposalImages(files: FileList | null) {
    if (!files?.length) return
    const maxBytes = 15 * 1024 * 1024
    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ])
    const list = Array.from(files).filter((f) => {
      if (!allowed.has(f.type) && f.type !== '') {
        toast.error(`${f.name}: usa JPG, PNG o WebP`)
        return false
      }
      if (f.size > maxBytes) {
        toast.error(`${f.name}: máximo 15 MB antes de comprimir`)
        return false
      }
      return true
    })
    if (!list.length) return
    let room = MAX_PROPOSAL_IMAGES_PER_LEAD - proposalPaths.length
    if (room <= 0) {
      toast.error(`Máximo ${MAX_PROPOSAL_IMAGES_PER_LEAD} imágenes`)
      return
    }
    setImageBusy(true)
    const nextPaths = [...proposalPaths]
    const uploaded: string[] = []
    try {
      const now = new Date().toISOString()
      for (const file of list) {
        if (room <= 0) break
        const path = await uploadProposalBundleImage(lead.id, file)
        uploaded.push(path)
        nextPaths.push(path)
        room -= 1
      }
      const updated = await updateLead(lead.id, {
        proposal_image_paths: nextPaths,
        updated_at: now,
        last_contact_date: lead.last_contact_date ?? now,
      })
      upsertLead(updated)
      setProposalPaths(updated.proposal_image_paths ?? [])
      await logLeadInteraction(lead.id, 'proposal_images_updated', {
        action: 'add',
        added: uploaded.length,
      }).catch(() => {})
      toast.success(
        uploaded.length === 1
          ? 'Imagen guardada (comprimida al subir)'
          : `${uploaded.length} imágenes guardadas`,
      )
      onSaved?.(updated)
    } catch (e) {
      console.error(e)
      for (const p of uploaded) {
        await removeProposalBundleImage(p).catch(() => {})
      }
      toast.error('No se pudo subir. ¿Migración 008 y bucket proposal-images en Supabase?')
    } finally {
      setImageBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveProposalImage(storagePath: string) {
    setImageBusy(true)
    try {
      const next = proposalPaths.filter((p) => p !== storagePath)
      const now = new Date().toISOString()
      const updated = await updateLead(lead.id, {
        proposal_image_paths: next,
        updated_at: now,
      })
      upsertLead(updated)
      setProposalPaths(updated.proposal_image_paths ?? [])
      try {
        await removeProposalBundleImage(storagePath)
      } catch {
        toast.warning('Quitada de la ficha; revisa borrado manual en Storage si hace falta')
      }
      await logLeadInteraction(lead.id, 'proposal_images_updated', {
        action: 'remove',
        path: storagePath,
      }).catch(() => {})
      toast.success('Imagen quitada')
      onSaved?.(updated)
    } catch (e) {
      console.error(e)
      toast.error('No se pudo actualizar la lista de imágenes')
    } finally {
      setImageBusy(false)
    }
  }

  const dirty =
    analysis !== (lead.expediente_analysis ?? '') ||
    visualAssets !== (lead.expediente_visual_assets ?? '') ||
    salesStrategy !== (lead.expediente_sales_strategy ?? '') ||
    outreachMessage !== (lead.expediente_outreach_message ?? '') ||
    followupNoResponse !== (lead.expediente_followup_no_response ?? '')

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
            Texto en seis bloques numerados; las{' '}
            <strong className="font-medium text-stone-400">imágenes de la propuesta</strong> van
            aparte (se guardan al subir). Si rellenas el mensaje largo (4), el primer botón de WA
            usa ese texto.
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            5. Segundo mensaje enviado al no tener respuesta
          </label>
          <Textarea
            value={followupNoResponse}
            onChange={(e) => setFollowupNoResponse(e.target.value)}
            placeholder="Tono amable, recuerda el contexto y ofrece un siguiente paso sin presionar..."
            rows={10}
            className="min-h-[160px] rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-amber-500/15 bg-stone-950/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium text-amber-200/90">
              Imágenes enviadas con la propuesta
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                className="sr-only"
                disabled={imageBusy || proposalPaths.length >= MAX_PROPOSAL_IMAGES_PER_LEAD}
                onChange={(e) => void handleAddProposalImages(e.target.files)}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  imageBusy ||
                  proposalPaths.length >= MAX_PROPOSAL_IMAGES_PER_LEAD
                }
                className="gap-2 border-amber-400/28 text-amber-100"
                onClick={() => fileInputRef.current?.click()}
              >
                {imageBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                Añadir
              </Button>
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Se optimizan al subir (≈1280 px, JPEG ~80 % calidad, máximo{' '}
            {MAX_PROPOSAL_IMAGES_PER_LEAD} archivos por ficha).
          </p>
          {proposalPaths.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {proposalPaths.map((storagePath) => {
                const href = proposalImagePublicUrl(storagePath)
                return (
                  <li
                    key={storagePath}
                    className="group relative overflow-hidden rounded-lg border border-amber-500/15 bg-stone-900/50"
                  >
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-[4/3] bg-stone-950"
                      title="Ver tamaño completo"
                    >
                      <img
                        src={href}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition group-hover:opacity-95"
                      />
                    </a>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="destructive"
                      disabled={imageBusy}
                      title="Quitar"
                      className="absolute right-1.5 top-1.5 size-8 rounded-full opacity-90 shadow-md"
                      onClick={() => void handleRemoveProposalImage(storagePath)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-stone-600">
              Aún no hay imágenes adjuntas a la propuesta.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
