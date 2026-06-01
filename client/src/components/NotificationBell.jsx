import { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotificaciones } from '../hooks/useNotificaciones';

const TIPO_ICONS = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  reminder: '⏰',
  default: '🔔',
};

function formatTimeAgo(fecha) {
  if (!fecha) return '';
  const date = new Date(fecha);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // segundos

  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const { notificaciones, totalNoLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notif) => {
    if (!notif.leida) {
      marcarLeida(notif.id);
    }
    // Aquí podrías agregar navegación según el tipo de notificación
  };

  const notificacionesRecientes = notificaciones.slice(0, 10);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="na-icon-btn"
        style={{ position: 'relative' }}
        title="Notificaciones"
      >
        <Bell size={18} />
        {totalNoLeidas > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              borderRadius: '50%',
              background: '#E05555',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--bg-surface)',
            }}
          >
            {totalNoLeidas > 9 ? '9+' : totalNoLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxWidth: '90vw',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            maxHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Outfit' }}>Notificaciones</h3>
            {totalNoLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                style={{
                  fontSize: 11,
                  color: 'var(--accent-green)',
                  fontWeight: 600,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notificacionesRecientes.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 13,
                }}
              >
                <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notificacionesRecientes.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    background: notif.leida ? 'transparent' : 'var(--accent-green-light)',
                    transition: 'background 0.15s',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'start',
                  }}
                  onMouseEnter={(e) => {
                    if (notif.leida) e.currentTarget.style.background = 'var(--bg-surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    if (notif.leida) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                    {TIPO_ICONS[notif.tipo] || TIPO_ICONS.default}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {notif.titulo && (
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: notif.leida ? 500 : 700,
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                        }}
                      >
                        {notif.titulo}
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {notif.mensaje}
                    </p>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        marginTop: 4,
                        display: 'block',
                      }}
                    >
                      {formatTimeAgo(notif.fecha_creacion || notif.created_at)}
                    </span>
                  </div>
                  {!notif.leida && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--accent-green)',
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer - solo si hay notificaciones */}
          {notificaciones.length > 10 && (
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border-light)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                Mostrando 10 de {notificaciones.length} notificaciones
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
