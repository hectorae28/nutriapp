import { api } from './client';
import { getCsrfToken } from '../utils/csrf';

export const pacientesApi = {
  list: (search = '') =>
    api.get(`/pacientes/${search ? '?search=' + encodeURIComponent(search) : ''}`),
  get: (id) => api.get(`/pacientes/${id}/`),
  create: (data) => api.post('/auth/register-paciente/', data),
  update: (id, data) => api.patch(`/pacientes/${id}/`, data),
  toggleActivo: (id) => api.post(`/pacientes/${id}/toggle-activo/`),
  importarExcel: async (formData) => {
    const csrfToken = getCsrfToken();
    const response = await fetch('/api/pacientes/importar-excel/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Error ${response.status}`);
    }
    return response.json();
  },
  exportarExcel: async (id) => {
    const csrfToken = getCsrfToken();
    const response = await fetch(`/api/pacientes/${id}/exportar-excel/`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'X-CSRFToken': csrfToken },
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historia_paciente_${id}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// Re-export from shared constants
export { getConsumoCaloricoDefecto, GRUPOS_NOMBRES } from '../constants/consumoGrupos';

