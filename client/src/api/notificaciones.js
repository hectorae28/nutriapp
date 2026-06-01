import { api } from './client';

export const notificacionesApi = {
  listar: (soloNoLeidas = false) =>
    api.get(`/notificaciones/${soloNoLeidas ? '?no_leidas=true' : ''}`),

  marcarLeida: (id) => api.patch(`/notificaciones/${id}/leer/`, {}),

  marcarTodasLeidas: () => api.post('/notificaciones/marcar-todas-leidas/', {}),
};
