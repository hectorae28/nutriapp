import { api } from './client';

export const catalogoApi = {
  grupos: () => api.get('/grupos-alimento/'),
  alimentos: (grupoId) => api.get(`/alimentos/${grupoId ? '?grupo=' + grupoId : ''}`),
  alimentosPorGrupo: (grupoId) => api.get(`/alimentos/?grupo=${grupoId}`),
  
  // CRUD Alimentos
  crearAlimento: (data) => api.post('/alimentos/', data),
  actualizarAlimento: (id, data) => api.patch(`/alimentos/${id}/`, data),
  eliminarAlimento: (id) => api.delete(`/alimentos/${id}/`),
  
  // CRUD Grupos
  crearGrupo: (data) => api.post('/grupos-alimento/', data),
  actualizarGrupo: (id, data) => api.patch(`/grupos-alimento/${id}/`, data),
  eliminarGrupo: (id) => api.delete(`/grupos-alimento/${id}/`),
};
