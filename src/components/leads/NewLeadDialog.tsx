import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectorSelectWithOther } from '@/components/leads/SectorSelectWithOther'
import { Textarea } from '@/components/ui/textarea'
import { createLeadInsert } from '@/lib/createLeadInsert'
import { insertLead } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NewLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewLeadDialog({ open, onOpenChange }: NewLeadDialogProps) {
  const upsertLead = useAppStore((s) => s.upsertLead)
  const setSelectedLeadId = useAppStore((s) => s.setSelectedLeadId)

  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactNames, setContactNames] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [sector, setSector] = useState<string | null>(null)
  const [hasWebsite, setHasWebsite] = useState('no')
  const [locationLabel, setLocationLabel] = useState('')
  const [instagram, setInstagram] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')

  const [expAnalysis, setExpAnalysis] = useState('')
  const [expAssets, setExpAssets] = useState('')
  const [expStrategy, setExpStrategy] = useState('')
  const [expMessage, setExpMessage] = useState('')
  const [expFollowupNoResponse, setExpFollowupNoResponse] = useState('')

  const [saving, setSaving] = useState(false)

  function resetForm() {
    setBusinessName('')
    setContactName('')
    setContactNames('')
    setEmail('')
    setWhatsapp('')
    setSector(null)
    setHasWebsite('no')
    setLocationLabel('')
    setInstagram('')
    setMapsUrl('')
    setExpAnalysis('')
    setExpAssets('')
    setExpStrategy('')
    setExpMessage('')
    setExpFollowupNoResponse('')
  }

  async function handleSubmit() {
    if (!businessName.trim()) {
      toast.error('El nombre del negocio es obligatorio')
      return
    }
    setSaving(true)
    try {
      const row = createLeadInsert({
        business_name: businessName,
        contact_name: contactName || null,
        contact_names: contactNames || null,
        email: email || null,
        whatsapp_phone: whatsapp || null,
        has_website: hasWebsite === 'si',
        sector: sector?.trim() || null,
        location_label: locationLabel || null,
        instagram_handle: instagram || null,
        google_maps_url: mapsUrl || null,
        expediente_analysis: expAnalysis || null,
        expediente_visual_assets: expAssets || null,
        expediente_sales_strategy: expStrategy || null,
        expediente_outreach_message: expMessage || null,
        expediente_followup_no_response: expFollowupNoResponse || null,
      })
      const created = await insertLead(row)
      upsertLead(created)
      setSelectedLeadId(created.id)
      resetForm()
      onOpenChange(false)
      toast.success('Lead creado. Puedes seguir editando el expediente en la ficha.')
    } catch (e) {
      console.error(e)
      toast.error(
        'Error al crear. ¿Migraciones expediente (003, 007) y estados del embudo (009) en Supabase?',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !saving) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent
        showCloseButton={!saving}
        className={cn(
          'max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto p-0 sm:max-w-2xl',
          'border-amber-500/20 bg-popover text-popover-foreground',
        )}
      >
        <div className="p-5 pb-0">
          <DialogHeader>
            <DialogTitle className="text-lg text-stone-50">
              Nuevo lead — rellenar manualmente
            </DialogTitle>
            <DialogDescription>
              Datos básicos y, si quieres, el expediente completo. Al crear se abre la
              ficha para revisar o añadir más.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs defaultValue="contacto" className="px-5">
          <TabsList className="mb-4 w-full justify-start bg-stone-900/50">
            <TabsTrigger value="contacto" className="flex-1 sm:flex-none">
              Contacto
            </TabsTrigger>
            <TabsTrigger value="expediente" className="flex-1 sm:flex-none">
              Expediente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacto" className="space-y-4 pb-4 px-0">
            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-200/80">
                Nombre del negocio *
              </label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. David Izquierdo Estilismo Canino"
                className="rounded-xl border-amber-500/15 bg-stone-950/40"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">
                  Contacto principal
                </label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nombre"
                  className="rounded-xl border-amber-500/15 bg-stone-950/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">
                  Varias personas (ej. Andrés / Tolo)
                </label>
                <Input
                  value={contactNames}
                  onChange={(e) => setContactNames(e.target.value)}
                  placeholder="Opcional"
                  className="rounded-xl border-amber-500/15 bg-stone-950/40"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-amber-500/15 bg-stone-950/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">
                  WhatsApp
                </label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+34 ..."
                  className="rounded-xl border-amber-500/15 bg-stone-950/40"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">
                  Sector
                </label>
                <p className="text-[10px] leading-snug text-stone-500">
                  Si eliges «Otro», escribe el sector a mano debajo del desplegable.
                </p>
                <SectorSelectWithOther
                  value={sector}
                  onChange={setSector}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">
                  ¿Tiene web propia?
                </label>
                <Select value={hasWebsite} onValueChange={setHasWebsite}>
                  <SelectTrigger className="rounded-xl border-amber-500/15 bg-stone-950/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No / solo redes o Maps</SelectItem>
                    <SelectItem value="si">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-200/80">
                Ubicación (texto libre)
              </label>
              <Input
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="Ej. Leganés, Madrid"
                className="rounded-xl border-amber-500/15 bg-stone-950/40"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">
                  Instagram (sin @)
                </label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="usuario"
                  className="rounded-xl border-amber-500/15 bg-stone-950/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-amber-200/80">
                  URL Google Maps (opcional)
                </label>
                <Input
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="rounded-xl border-amber-500/15 bg-stone-950/40"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="expediente" className="space-y-4 pb-4 px-0">
            <p className="text-xs text-stone-500">
              Misma estructura que en la ficha: puedes dejar vacío y completarlo después.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-200/80">
                1. Análisis real
              </label>
              <Textarea
                value={expAnalysis}
                onChange={(e) => setExpAnalysis(e.target.value)}
                rows={6}
                className="rounded-xl border-amber-500/15 bg-stone-950/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-200/80">
                2. Activos / CapCut
              </label>
              <Textarea
                value={expAssets}
                onChange={(e) => setExpAssets(e.target.value)}
                rows={5}
                className="rounded-xl border-amber-500/15 bg-stone-950/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-200/80">
                3. Estrategia de venta
              </label>
              <Textarea
                value={expStrategy}
                onChange={(e) => setExpStrategy(e.target.value)}
                rows={4}
                className="rounded-xl border-amber-500/15 bg-stone-950/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-200/80">
                5. Segundo mensaje (sin respuesta)
              </label>
              <Textarea
                value={expFollowupNoResponse}
                onChange={(e) => setExpFollowupNoResponse(e.target.value)}
                rows={6}
                className="rounded-xl border-amber-500/15 bg-stone-950/40"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-amber-500/10 bg-stone-950/30 px-5 py-4 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            className="text-stone-400"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving || !businessName.trim()}
            className="gap-2 border-amber-400/35 bg-gradient-to-b from-amber-200/95 to-amber-400/85 text-stone-900"
            onClick={() => void handleSubmit()}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Crear y abrir ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
