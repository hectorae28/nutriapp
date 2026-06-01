import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const TOAST_COLORS = {
  success: { bg: '#D8F3DC', border: '#2D6A4F', text: '#1B5230' },
  error: { bg: '#FFE5E5', border: '#D32F2F', text: '#C62828' },
  warning: { bg: '#FFF4E6', border: '#EF6C00', text: '#E65100' },
  info: { bg: '#E3F2FD', border: '#1976D2', text: '#0D47A1' },
};

function Toast({ toast, onRemove }) {
  const colors = TOAST_COLORS[toast.type] || TOAST_COLORS.info;
  const icon = TOAST_ICONS[toast.type] || TOAST_ICONS.info;

  return (
    <div
      className="na-toast"
      style={{
        width: 320,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'start',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <p
        style={{
          flex: 1,
          fontSize: 13,
          lineHeight: 1.5,
          color: colors.text,
          fontWeight: 500,
          margin: 0,
        }}
      >
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          border: 'none',
          background: 'transparent',
          color: colors.text,
          cursor: 'pointer',
          padding: 0,
          fontSize: 16,
          lineHeight: 1,
          opacity: 0.6,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
      >
        ✕
      </button>
      {/* Progress bar */}
      <div
        className="na-toast-progress"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 3,
          background: colors.border,
          animationDuration: `${toast.duration}ms`,
        }}
      />
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    addToast({ message, type, duration });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
