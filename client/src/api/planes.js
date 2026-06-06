import { api } from './client';

function getCookie(name) {
  let v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : null;
}

const BASE = '/api';

export const planesApi = {
  miPlanActivo: () => api.get('/planes/?activo=true'),
  list: (pacienteId) => api.get(`/planes/${pacienteId ? '?paciente=' + pacienteId : ''}`),
  get: (id) => api.get(`/planes/${id}/`),
  create: (data) => api.post('/planes/', data),
  update: (id, data) => api.patch(`/planes/${id}/`, data),
  duplicar: (id) =>
    fetch(`${BASE}/planes/${id}/duplicar/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
    }).then((r) => r.json()),
  tiemposComida: (planId) => api.get(`/tiempos-comida/?plan=${planId}`),
  grupos: () => api.get('/grupos-alimento/'),
  raciones: (tiempoComidaId) => api.get(`/raciones/?tiempo_comida=${tiempoComidaId}`),
  enviarPlanPorEmail: (planId) => api.post(`/planes/${planId}/enviar-email/`),
  descargarPdfPlan: async (planId) => {
    const res = await fetch(`${BASE}/planes/${planId}/pdf/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al descargar PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan_alimenticio_${planId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const tiemposApi = {
  list: (planId) =>
    fetch(`${BASE}/tiempos-comida/?plan=${planId}`, {
      credentials: 'include',
    }).then((r) => r.json()),
  create: (data) =>
    fetch(`${BASE}/tiempos-comida/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  update: (id, data) =>
    fetch(`${BASE}/tiempos-comida/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  delete: (id) =>
    fetch(`${BASE}/tiempos-comida/${id}/`, {
      method: 'DELETE',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
    }),
  reordenar: (items) =>
    fetch(`${BASE}/tiempos-comida/reordenar/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'include',
      body: JSON.stringify(items),
    }),
};

export const racionesApi = {
  list: (tiempoId) =>
    fetch(`${BASE}/raciones-plan/?tiempo_comida=${tiempoId}`, {
      credentials: 'include',
    }).then((r) => r.json()),
  create: (data) =>
    fetch(`${BASE}/raciones-plan/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  update: (id, data) =>
    fetch(`${BASE}/raciones-plan/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  delete: (id) =>
    fetch(`${BASE}/raciones-plan/${id}/`, {
      method: 'DELETE',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
    }),
};

// ─── Tags de alimentos específicos ───────────────────────────────────────────

const alimentoTagApi = (endpoint) => ({
  list: (filtro, valor) =>
    fetch(`${BASE}/${endpoint}/?${filtro}=${valor}`, { credentials: 'include' }).then((r) =>
      r.json()
    ),
  create: (data) =>
    fetch(`${BASE}/${endpoint}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) return r.json().then((e) => Promise.reject(e));
      return r.json();
    }),
  update: (id, data) =>
    fetch(`${BASE}/${endpoint}/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  delete: (id) =>
    fetch(`${BASE}/${endpoint}/${id}/`, {
      method: 'DELETE',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
    }),
});

export const alimentoTagsPlanApi = alimentoTagApi('alimento-tags-plan');

export const calcularRequerimientos = (data) =>
  fetch(`${BASE}/calcular-requerimientos/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken'),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  }).then((r) => r.json());
