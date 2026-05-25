import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { normalizeLeadRow, supabase, getLeads } from '@/lib/supabase'
import { isVisibleInMainPanels } from '@/lib/leadLifecycle'
import { useAppStore } from '@/store/useAppStore'
import type { Lead } from '@/types/lead'

function formatFetchError(e: unknown): string {
  if (e && typeof e === 'object') {
    const obj = e as { message?: unknown; hint?: unknown; details?: unknown }
    const parts = [
      obj.message != null ? String(obj.message) : null,
      obj.details != null ? String(obj.details) : null,
      obj.hint != null ? String(obj.hint) : null,
    ].filter(Boolean)
    if (parts.length) return parts.join(' · ')
  }
  if (e instanceof Error && e.message) return e.message
  return String(e ?? 'No se pudieron cargar los leads')
}

/** Carga inicial y errores visibles (toasts/banner). Una sola suscripción realtime en App. */
export async function refetchLeads(): Promise<void> {
  const { setLeads, setLeadsFetchError } = useAppStore.getState()
  try {
    const data = await getLeads()
    setLeads(data)
    setLeadsFetchError(null)
  } catch (e) {
    const msg = formatFetchError(e)
    console.error('No se pudieron cargar los leads:', e)
    setLeads([])
    setLeadsFetchError(msg)
    toast.error('No hay conexión con los datos de Supabase', {
      description: msg.slice(0, 320),
      duration: 14_000,
    })
  }
}

export function useLeadsSubscriptions(): void {
  const upsertLead = useAppStore((s) => s.upsertLead)
  const removeLead = useAppStore((s) => s.removeLead)

  useEffect(() => {
    void refetchLeads()

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            upsertLead(normalizeLeadRow(payload.new as Lead))
          }
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { id?: string }
            if (oldRow.id) removeLead(oldRow.id)
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [upsertLead, removeLead])
}

export function useLeads() {
  const leads = useAppStore((s) => s.leads)
  const filters = useAppStore((s) => s.filters)

  const refetch = useCallback(() => {
    void refetchLeads()
  }, [])

  const filteredLeads = leads.filter((lead) => {
    if (!isVisibleInMainPanels(lead)) return false
    if (
      filters.hasWebsite !== null &&
      lead.has_website !== filters.hasWebsite
    )
      return false
    if (filters.status && lead.status !== filters.status) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const match =
        lead.business_name.toLowerCase().includes(q) ||
        (lead.contact_name ?? '').toLowerCase().includes(q) ||
        (lead.whatsapp_phone ?? '').includes(q)
      if (!match) return false
    }
    return true
  })

  return { leads: filteredLeads, allLeads: leads, refetch }
}
