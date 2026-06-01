import { api } from './client';

export const expedienteApi = {
  obtener: async (pacienteId) => {
    const response = await api.get(`/expedientes/?paciente=${pacienteId}`);
    // El backend puede devolver array simple o paginado { results: [] }
    const lista = Array.isArray(response)
      ? response
      : (response?.results ?? []);
    return lista.length > 0 ? lista[0] : null;
  },
  crear: (data) => api.post('/expedientes/', data),
  actualizar: (id, data) => api.patch(`/expedientes/${id}/`, data),

  createOrUpdate: async (pacienteId, data) => {
    // Add paciente_id to the data if it's not already there for creation
    const payload = { ...data, paciente: pacienteId };

    try {
      const existingExpediente = await expedienteApi.obtener(pacienteId);
      if (existingExpediente) {
        // If an expediente exists, update it
        return await expedienteApi.actualizar(existingExpediente.id, payload);
      } else {
        // Otherwise, create a new one
        return await expedienteApi.crear(payload);
      }
    } catch (error) {
      console.error('Error creating or updating expediente:', error);
      throw error; // Re-throw to be handled by the caller
    }
  },
};
