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
import { LEAD_STATUSES, STATUS_LABELS } from '@/constants'
import { logLeadInteraction, updateLead } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Lead, LeadStatus } from '@/types/lead'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'MXN'] as const

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToIso(local: string): string | null {
  const t = local.trim()
  if (!t) return null
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function parseBudget(raw: string): number | null {
  const t = raw.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

interface LeadEstadoIntercambioPanelProps {
  lead: Lead
  onSaved?: (lead: Lead) => void
}

export function LeadEstadoIntercambioPanel({
  lead,
  onSaved,
}: LeadEstadoIntercambioPanelProps) {
  const upsertLead = useAppStore((s) => s.upsertLead)
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [sector, setSector] = useState<string | null>(lead.sector)
  const [proposalUrl, setProposalUrl] = useState(lead.proposal_url ?? '')
  const [proposalSummary, setProposalSummary] = useState(
    lead.deal_proposal_summary ?? '',
  )
  const [budgetAmount, setBudgetAmount] = useState(
    lead.deal_budget_amount != null ? String(lead.deal_budget_amount) : '',
  )
  const [budgetCurrency, setBudgetCurrency] = useState(
    lead.deal_budget_currency ?? 'EUR',
  )
  const [scopeNotes, setScopeNotes] = useState(lead.deal_scope_notes ?? '')
  const [commercialTerms, setCommercialTerms] = useState(
    lead.deal_commercial_terms ?? '',
  )
  const [nextFollowup, setNextFollowup] = useState(
    isoToDatetimeLocal(lead.deal_next_followup_at),
  )
  const [acceptedAt, setAcceptedAt] = useState(
    isoToDatetimeLocal(lead.deal_accepted_at),
  )
  const [closedAt, setClosedAt] = useState(
    isoToDatetimeLocal(lead.deal_closed_at),
  )
  const [rejectionReason, setRejectionReason] = useState(
    lead.deal_rejection_reason ?? '',
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStatus(lead.status)
  }, [lead.id, lead.status])

  async function handleSave() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const amount = parseBudget(budgetAmount)
      const updated = await updateLead(lead.id, {
        status,
        sector: sector?.trim() || null,
        proposal_url: proposalUrl.trim() || null,
        deal_proposal_summary: proposalSummary.trim() || null,
        deal_budget_amount: amount,
        deal_budget_currency: budgetCurrency.trim() || 'EUR',
        deal_scope_notes: scopeNotes.trim() || null,
        deal_commercial_terms: commercialTerms.trim() || null,
        deal_next_followup_at: datetimeLocalToIso(nextFollowup),
        deal_accepted_at: datetimeLocalToIso(acceptedAt),
        deal_closed_at: datetimeLocalToIso(closedAt),
        deal_rejection_reason: rejectionReason.trim() || null,
        updated_at: now,
        last_contact_date: lead.last_contact_date ?? now,
      })
      upsertLead(updated)
      try {
        await logLeadInteraction(lead.id, 'deal_snapshot_saved', {
          status,
          has_budget: amount != null,
        })
      } catch {
        /* opcional */
      }
      toast.success('Estado e intercambio guardados')
      onSaved?.(updated)
    } catch (e) {
      console.error(e)
      toast.error(
        'No se pudo guardar. Ejecuta migraciones 004 en Supabase si faltan columnas, y el bloque embudo/reflexión (`20260125120001`…`20006`) si el estado o `failure_ai_reflection` fallan.',
      )
    } finally {
      setSaving(false)
    }
  }

  const norm = (s: string | null | undefined) => s?.trim() || null
  const dirty =
    status !== lead.status ||
    norm(sector) !== norm(lead.sector) ||
    proposalUrl !== (lead.proposal_url ?? '') ||
    proposalSummary !== (lead.deal_proposal_summary ?? '') ||
    parseBudget(budgetAmount) !== (lead.deal_budget_amount ?? null) ||
    budgetCurrency !== (lead.deal_budget_currency ?? 'EUR') ||
    scopeNotes !== (lead.deal_scope_notes ?? '') ||
    commercialTerms !== (lead.deal_commercial_terms ?? '') ||
    datetimeLocalToIso(nextFollowup) !== (lead.deal_next_followup_at ?? null) ||
    datetimeLocalToIso(acceptedAt) !== (lead.deal_accepted_at ?? null) ||
    datetimeLocalToIso(closedAt) !== (lead.deal_closed_at ?? null) ||
    rejectionReason !== (lead.deal_rejection_reason ?? '')

  return (
    <Card
      className={cn(
        'border-amber-500/20 bg-card/55 shadow-xl shadow-black/25 backdrop-blur-md',
        'ring-1 ring-amber-400/20',
      )}
    >
      <CardHeader className="flex flex-col gap-2 border-b border-amber-500/10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-stone-50">
            Estado del embudo e intercambio comercial
          </CardTitle>
          <CardDescription className="max-w-2xl text-stone-500">
            Fase actual, propuesta, presupuesto y fechas clave. Se guarda en la tabla{' '}
            <span className="text-stone-400">leads</span> (embudo y reflexión fracasos · migr. 004 y 20260125120001–20006).
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
          Guardar
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            Fase / estado
          </label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as LeadStatus)}
          >
            <SelectTrigger className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[min(24rem,70vh)] border-amber-500/15 bg-popover text-popover-foreground">
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            Sector
          </label>
          <p className="text-xs text-stone-500">
            Elige un sector de la lista; con «Otro» puedes escribir uno personalizado.
          </p>
          <SectorSelectWithOther value={sector} onChange={setSector} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            Enlace a la propuesta (PDF, Notion, Drive…)
          </label>
          <Input
            value={proposalUrl}
            onChange={(e) => setProposalUrl(e.target.value)}
            placeholder="https://…"
            className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            Propuesta u oferta final (resumen o texto)
          </label>
          <Textarea
            value={proposalSummary}
            onChange={(e) => setProposalSummary(e.target.value)}
            placeholder="Servicios, plazo de entrega resumido, precio orientativo en texto…"
            rows={6}
            className="min-h-[120px] rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-200/90">
              Importe presupuestado / cerrado
            </label>
            <Input
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-200/90">
              Moneda
            </label>
            <Select
              value={budgetCurrency}
              onValueChange={setBudgetCurrency}
            >
              <SelectTrigger className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-amber-500/15 bg-popover">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            Alcance y entregables
          </label>
          <Textarea
            value={scopeNotes}
            onChange={(e) => setScopeNotes(e.target.value)}
            placeholder="Qué incluye el proyecto, módulos, horas, exclusiones…"
            rows={4}
            className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            Condiciones comerciales
          </label>
          <Textarea
            value={commercialTerms}
            onChange={(e) => setCommercialTerms(e.target.value)}
            placeholder="Forma de pago, validez del presupuesto, penalizaciones, renovación…"
            rows={4}
            className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-200/90">
              Próximo seguimiento
            </label>
            <Input
              type="datetime-local"
              value={nextFollowup}
              onChange={(e) => setNextFollowup(e.target.value)}
              className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 [color-scheme:dark]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-200/90">
              Fecha aceptación
            </label>
            <Input
              type="datetime-local"
              value={acceptedAt}
              onChange={(e) => setAcceptedAt(e.target.value)}
              className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 [color-scheme:dark]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-200/90">
              Cierre / cobro
            </label>
            <Input
              type="datetime-local"
              value={closedAt}
              onChange={(e) => setClosedAt(e.target.value)}
              className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-200/90">
            Motivo rechazo o descarte (si aplica)
          </label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Precio, timing, otro proveedor, sin presupuesto…"
            rows={3}
            className="rounded-xl border-amber-500/15 bg-stone-950/40 text-stone-100 placeholder:text-stone-600"
          />
        </div>
      </CardContent>
    </Card>
  )
}
