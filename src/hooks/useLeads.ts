import { useEffect, useCallback } from 'react'
import { supabase, getLeads } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import type { Lead } from '@/types/lead'

export function useLeads() {
  const { leads, setLeads, upsertLead, removeLead, filters } = useAppStore()

  const fetchLeads = useCallback(async () => {
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (e) {
      console.error('No se pudieron cargar los leads:', e)
      setLeads([])
    }
  }, [setLeads])

  useEffect(() => {
    void fetchLeads()

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            upsertLead(payload.new as Lead)
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
  }, [fetchLeads, upsertLead, removeLead])

  const filteredLeads = leads.filter((lead) => {
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

  return { leads: filteredLeads, allLeads: leads, refetch: fetchLeads }
}
