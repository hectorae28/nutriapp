import { api } from './client';

export const progresoApi = {
  registros: (pacienteId) =>
    api.get(`/registros-progreso/${pacienteId ? '?paciente=' + pacienteId : ''}`),
  crear: (data) => api.post('/registros-progreso/', data),
  examenes: (pacienteId) =>
    api.get(`/examenes-bioquimicos/${pacienteId ? '?paciente=' + pacienteId : ''}`),
};
