import { api } from './client';

export const examenesApi = {
  lista: (pacienteId) => api.get(`/examenes-bioquimicos/?paciente=${pacienteId}`),
  crear: (data) => api.post('/examenes-bioquimicos/', data),
};
