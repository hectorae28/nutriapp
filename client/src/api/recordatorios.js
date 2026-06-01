import { api } from './client';

export const recordatoriosApi = {
  lista: (pacienteId) => api.get(`/recordatorios/?paciente=${pacienteId}`),
  crear: (data) => api.post('/recordatorios/', data),
  actualizar: (id, data) => api.patch(`/recordatorios/${id}/`, data),
  eliminar: (id) => api.delete(`/recordatorios/${id}/`),
};
