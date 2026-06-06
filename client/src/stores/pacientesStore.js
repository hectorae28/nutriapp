import { create } from 'zustand'

const CACHE_TTL = 60 * 1000 // 1 minuto

export const usePacientesStore = create((set, get) => ({
  pacientes: [],
  loading: false,
  lastFetch: null,

  isStale: () => {
    const { lastFetch } = get()
    return !lastFetch || Date.now() - lastFetch > CACHE_TTL
  },

  fetchPacientes: async (search = '', force = false) => {
    if (!force && !get().isStale() && !search) return get().pacientes
    set({ loading: true })
    try {
      const url = search
        ? `/api/pacientes/?search=${encodeURIComponent(search)}`
        : '/api/pacientes/'
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error('Error al cargar pacientes')
      const data = await res.json()
      if (!search) set({ pacientes: data, lastFetch: Date.now() })
      set({ loading: false })
      return data
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  updatePaciente: (id, changes) => set(state => ({
    pacientes: state.pacientes.map(p => p.id === id ? { ...p, ...changes } : p)
  })),

  addPaciente: (paciente) => set(state => ({
    pacientes: [paciente, ...state.pacientes]
  })),

  removePaciente: (id) => set(state => ({
    pacientes: state.pacientes.filter(p => p.id !== id)
  })),

  invalidate: () => set({ lastFetch: null }),
}))
