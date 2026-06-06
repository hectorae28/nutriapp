import { create } from 'zustand'

const CACHE_TTL = 2 * 60 * 1000 // 2 minutos

export const usePlanesStore = create((set, get) => ({
  planesByPaciente: {},

  isStale: (pacienteId) => {
    const entry = get().planesByPaciente[pacienteId]
    return !entry || Date.now() - entry.lastFetch > CACHE_TTL
  },

  fetchPlanes: async (pacienteId, force = false) => {
    if (!force && !get().isStale(pacienteId)) {
      return get().planesByPaciente[pacienteId].data
    }
    const res = await fetch(`/api/planes/?paciente=${pacienteId}`, { credentials: 'include' })
    if (!res.ok) throw new Error('Error al cargar planes')
    const data = await res.json()
    set(state => ({
      planesByPaciente: {
        ...state.planesByPaciente,
        [pacienteId]: { data, lastFetch: Date.now() }
      }
    }))
    return data
  },

  invalidate: (pacienteId) => set(state => {
    const updated = { ...state.planesByPaciente }
    if (pacienteId) delete updated[pacienteId]
    else return { planesByPaciente: {} }
    return { planesByPaciente: updated }
  }),
}))
