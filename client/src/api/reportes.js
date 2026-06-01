import { api } from './client';

export const reportesApi = {
  metricas: () => api.get('/metricas-nutricionista/'),
  reportePaciente: (id) => api.get(`/reporte-paciente/${id}/`),
  adherencia: (pacienteId, semanas = 8) =>
    api.get(`/adherencia/?paciente=${pacienteId}&semanas=${semanas}`),
  comparativa: () => api.get('/comparativa-pacientes/'),
};
