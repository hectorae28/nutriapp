import { useState, useEffect, useCallback } from 'react';
import { notificacionesApi } from '../api/notificaciones';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [totalNoLeidas, setTotalNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificacionesApi.listar();
      setNotificaciones(data.notificaciones || data.results || []);
      setTotalNoLeidas(data.total_no_leidas || 0);
    } catch (err) {
      // silencioso - si falla, simplemente no mostramos notificaciones
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Llamada inicial
    void cargar();
    // polling cada 60 segundos
    const interval = setInterval(() => {
      void cargar();
    }, 60000);
    return () => clearInterval(interval);
  }, [cargar]);

  const marcarLeida = async (id) => {
    try {
      await notificacionesApi.marcarLeida(id);
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
      setTotalNoLeidas((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marcando notificación como leída:', err);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await notificacionesApi.marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setTotalNoLeidas(0);
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  };

  return { notificaciones, totalNoLeidas, loading, cargar, marcarLeida, marcarTodasLeidas };
}
