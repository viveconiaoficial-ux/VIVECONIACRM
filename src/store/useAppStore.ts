import { create } from 'zustand'
import type { Lead, LeadStatus } from '@/types/lead'

interface Filters {
  hasWebsite: boolean | null
  status: LeadStatus | null
  search: string
}

export type MainView =
  | 'clientes_potenciales'
  | 'clientes'
  | 'prospectos'
  | 'fichas'
  | 'analiticas'

interface AppStore {
  leads: Lead[]
  setLeads: (leads: Lead[]) => void
  upsertLead: (lead: Lead) => void
  removeLead: (id: string) => void

  /** Error al leer desde Supabase (silenciar en consola imposibilita diagnóstico en prod). */
  leadsFetchError: string | null
  setLeadsFetchError: (msg: string | null) => void

  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  resetFilters: () => void

  mainView: MainView
  setMainView: (view: MainView) => void

  selectedLeadId: string | null
  setSelectedLeadId: (id: string | null) => void
}

const defaultFilters: Filters = {
  /** null = “Todos”; antes false ocultaba leads con web en el dashboard. */
  hasWebsite: null,
  status: null,
  search: '',
}

export const useAppStore = create<AppStore>((set) => ({
  leads: [],
  setLeads: (leads) => set({ leads }),

  leadsFetchError: null,
  setLeadsFetchError: (msg) => set({ leadsFetchError: msg }),
  upsertLead: (lead) =>
    set((state) => ({
      leads: state.leads.some((l) => l.id === lead.id)
        ? state.leads.map((l) => (l.id === lead.id ? lead : l))
        : [lead, ...state.leads],
    })),
  removeLead: (id) =>
    set((state) => ({ leads: state.leads.filter((l) => l.id !== id) })),

  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),

  mainView: 'prospectos',
  setMainView: (view) => set({ mainView: view }),

  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
}))
