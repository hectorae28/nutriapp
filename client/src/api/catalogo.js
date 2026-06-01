import { api } from './client';

export const catalogoApi = {
  grupos: () => api.get('/grupos-alimento/'),
  alimentos: (grupoId) => api.get(`/alimentos/${grupoId ? '?grupo=' + grupoId : ''}`),
  alimentosPorGrupo: (grupoId) => api.get(`/alimentos/?grupo=${grupoId}`),
};
