import { Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SectorSelectWithOther } from '@/components/leads/SectorSelectWithOther'
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
import type { Lead } from '@/types/lead'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function trimOrNull(s: string): string | null {
  const t = s.trim()
  return t === '' ? null : t
}

function normalizeInstagram(raw: string): string | null {
  const t = trimOrNull(raw)
  return t != null ? t.replace(/^@/, '') : null
}

interface LeadContactEditorProps {
  lead: Lead
  onSaved?: (lead: Lead) => void
}

export function LeadContactEditor({ lead, onSaved }: LeadContactEditorProps) {
  const upsertLead = useAppStore((s) => s.upsertLead)

  const [businessName, setBusinessName] = useState(lead.business_name)
  const [contactName, setContactName] = useState(lead.contact_name ?? '')
  const [contactNames, setContactNames] = useState(lead.contact_names ?? '')
  const [email, setEmail] = useState(lead.email ?? '')
  const [whatsapp, setWhatsapp] = useState(lead.whatsapp_phone ?? '')
  const [sector, setSector] = useState<string | null>(lead.sector)
  const [hasWebsite, setHasWebsite] = useState(lead.has_website ? 'si' : 'no')
  const [locationLabel, setLocationLabel] = useState(lead.location_label ?? '')
  const [neighborhood, setNeighborhood] = useState(lead.neighborhood ?? '')
  const [city, setCity] = useState(lead.city ?? '')
  const [province, setProvince] = useState(lead.province ?? '')
  const [instagram, setInstagram] = useState(
    lead.instagram_handle?.replace(/^@/, '') ?? '',
  )
  const [mapsUrl, setMapsUrl] = useState(lead.google_maps_url ?? '')
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBusinessName(lead.business_name)
    setContactName(lead.contact_name ?? '')
    setContactNames(lead.contact_names ?? '')
    setEmail(lead.email ?? '')
    setWhatsapp(lead.whatsapp_phone ?? '')
    setSector(lead.sector)
    setHasWebsite(lead.has_website ? 'si' : 'no')
    setLocationLabel(lead.location_label ?? '')
    setNeighborhood(lead.neighborhood ?? '')
    setCity(lead.city ?? '')
    setProvince(lead.province ?? '')
    setInstagram(lead.instagram_handle?.replace(/^@/, '') ?? '')
    setMapsUrl(lead.google_maps_url ?? '')
    setNotes(lead.notes ?? '')
  }, [lead.id, lead.updated_at ?? lead.created_at])

  async function handleSave() {
    const name = businessName.trim()
    if (!name) {
      toast.error('El nombre del negocio es obligatorio')
      return
    }

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const ig = normalizeInstagram(instagram)
      const updated = await updateLead(lead.id, {
        business_name: name,
        contact_name: trimOrNull(contactName),
        contact_names: trimOrNull(contactNames),
        email: trimOrNull(email),
        whatsapp_phone: trimOrNull(whatsapp),
        sector: sector?.trim() || null,
        has_website: hasWebsite === 'si',
        location_label: trimOrNull(locationLabel),
        neighborhood: trimOrNull(neighborhood),
        city: trimOrNull(city),
        province: trimOrNull(province),
        instagram_handle: ig,
        has_instagram: ig ? true : lead.has_instagram,
        google_maps_url: trimOrNull(mapsUrl),
        notes: trimOrNull(notes),
        updated_at: now,
      })
      upsertLead(updated)
      try {
        await logLeadInteraction(lead.id, 'contact_updated', {
          fields: [
            'business_name',
            'contact_*',
            'email',
            'whatsapp_phone',
            'location_*',
            'instagram_handle',
            'google_maps_url',
            'notes',
          ],
        })
      } catch {
        /* historial opcional */
      }
      toast.success('Datos de contacto guardados')
      onSaved?.(updated)
    } catch (e) {
      console.error(e)
      toast.error('No se pudo guardar. Revisa conexión y permisos en Supabase.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600'

  return (
    <Card
      id="datos-contacto"
      className={cn(
        'scroll-mt-6 overflow-hidden border-amber-500/15 bg-card/55 shadow-2xl shadow-black/35',
        'backdrop-blur-md supports-[backdrop-filter]:bg-card/40',
      )}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0 border-b border-amber-500/10 pb-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg text-stone-50">Datos de contacto</CardTitle>
          <CardDescription className="text-stone-500">
            Edita teléfono, email, dirección y resto de datos. Se guardan en Supabase al pulsar
            Guardar.
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
          Guardar contacto
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <label className="text-xs font-medium text-amber-200/80">
            Nombre del negocio *
          </label>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">
              Persona de contacto
            </label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nombre"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">
              Varias personas (texto libre)
            </label>
            <Input
              value={contactNames}
              onChange={(e) => setContactNames(e.target.value)}
              placeholder="Ej. Andrés / Tolo"
              className={inputClass}
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
              placeholder="correo@negocio.com"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">WhatsApp / teléfono</label>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+34 600 000 000"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">Sector</label>
            <SectorSelectWithOther value={sector} onChange={setSector} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">¿Tiene web propia?</label>
            <Select value={hasWebsite} onValueChange={setHasWebsite}>
              <SelectTrigger className={inputClass}>
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
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">Barrio / zona</label>
            <Input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">Ciudad</label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">Provincia</label>
            <Input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">Instagram (sin @)</label>
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="usuario"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-amber-200/80">URL Google Maps</label>
            <Input
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className={inputClass}
            />
          </div>
        </div>

        {mapsUrl.trim() ? (
          <p className="text-xs">
            <a
              href={mapsUrl.trim()}
              target="_blank"
              rel="noreferrer"
              className="text-amber-300/90 underline-offset-2 hover:underline"
            >
              Abrir enlace de Maps en nueva pestaña
            </a>
          </p>
        ) : null}

        <div className="space-y-2">
          <label className="text-xs font-medium text-amber-200/80">Notas de contacto</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Horarios, preferencias, recordatorios…"
            className={cn(inputClass, 'min-h-[80px] resize-y')}
          />
        </div>
      </CardContent>
    </Card>
  )
}
