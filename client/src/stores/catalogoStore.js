import { create } from 'zustand'

const CACHE_TTL = 10 * 60 * 1000 // 10 minutos

export const useCatalogoStore = create((set, get) => ({
  grupos: [],
  alimentos: [],
  loading: false,
  lastFetch: null,

  isStale: () => {
    const { lastFetch } = get()
    return !lastFetch || Date.now() - lastFetch > CACHE_TTL
  },

  fetchCatalogo: async (force = false) => {
    if (!force && !get().isStale()) return
    set({ loading: true })
    try {
      const [gruposRes, alimentosRes] = await Promise.all([
        fetch('/api/grupos-alimento/', { credentials: 'include' }),
        fetch('/api/alimentos/', { credentials: 'include' }),
      ])
      const grupos = await gruposRes.json()
      const alimentos = await alimentosRes.json()
      set({ grupos, alimentos, lastFetch: Date.now(), loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  invalidate: () => set({ lastFetch: null }),
}))
