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
  // Plantillas desde BD (via endpoint /planes/plantillas/ que ahora lee la BD)
  plantillas: () =>
    fetch(`${BASE}/planes/plantillas/`, { credentials: 'include' }).then((r) => r.json()),
  tiemposComida: (planId) => api.get(`/tiempos-comida/?plan=${planId}`),
  grupos: () => api.get('/grupos-alimento/'),
  raciones: (tiempoComidaId) => api.get(`/raciones/?tiempo_comida=${tiempoComidaId}`),
};

// ─── CRUD de Plantillas Alimenticias ─────────────────────────────────────────

export const plantillasApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${BASE}/plantillas-alimenticias/${q ? '?' + q : ''}`, {
      credentials: 'include',
    }).then((r) => r.json());
  },

  get: (id) =>
    fetch(`${BASE}/plantillas-alimenticias/${id}/`, { credentials: 'include' }).then((r) =>
      r.json()
    ),

  create: (data) =>
    fetch(`${BASE}/plantillas-alimenticias/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) return r.json().then((e) => Promise.reject(e));
      return r.json();
    }),

  update: (id, data) =>
    fetch(`${BASE}/plantillas-alimenticias/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) return r.json().then((e) => Promise.reject(e));
      return r.json();
    }),

  delete: (id) =>
    fetch(`${BASE}/plantillas-alimenticias/${id}/`, {
      method: 'DELETE',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
    }).then((r) => {
      if (!r.ok) return r.json().then((e) => Promise.reject(e));
      return null;
    }),

  duplicar: (id) =>
    fetch(`${BASE}/plantillas-alimenticias/${id}/duplicar/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'include',
    }).then((r) => r.json()),

  // Raciones de plantilla
  raciones: {
    list: (tiempoComidaId) =>
      fetch(`${BASE}/raciones-plantilla/?tiempo_comida=${tiempoComidaId}`, {
        credentials: 'include',
      }).then((r) => r.json()),

    create: (data) =>
      fetch(`${BASE}/raciones-plantilla/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then((r) => r.json()),

    update: (id, data) =>
      fetch(`${BASE}/raciones-plantilla/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then((r) => r.json()),

    delete: (id) =>
      fetch(`${BASE}/raciones-plantilla/${id}/`, {
        method: 'DELETE',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        credentials: 'include',
      }),
  },

  // Tiempos de comida de plantilla
  tiempos: {
    create: (data) =>
      fetch(`${BASE}/tiempos-comida-plantilla/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then((r) => r.json()),

    update: (id, data) =>
      fetch(`${BASE}/tiempos-comida-plantilla/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then((r) => r.json()),

    delete: (id) =>
      fetch(`${BASE}/tiempos-comida-plantilla/${id}/`, {
        method: 'DELETE',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        credentials: 'include',
      }),
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
export const alimentoTagsPlantillaApi = alimentoTagApi('alimento-tags-plantilla');

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
