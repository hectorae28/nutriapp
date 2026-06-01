/**
 * RacionTagSelector — selector de etiqueta para una ración.
 * Muestra el tag actual y al hacer click despliega las opciones.
 */
import { useState, useRef, useEffect } from 'react';
import { RACION_TAGS, getTagMeta } from '../constants/racionTags';

export default function RacionTagSelector({ value = '', onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const meta = getTagMeta(value);

  // cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* botón con el tag actual */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        title="Cambiar etiqueta"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 8px',
          borderRadius: 20,
          border: `1px solid ${meta.border}`,
          background: meta.bg,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          color: meta.color,
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: meta.dot,
            flexShrink: 0,
          }}
        />
        {value ? meta.label : '+ Etiqueta'}
      </button>

      {/* dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 200,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-md)',
            minWidth: 180,
            overflow: 'hidden',
          }}
        >
          {RACION_TAGS.map((tag) => (
            <button
              key={tag.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(tag.value);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: value === tag.value ? tag.bg || 'var(--bg-surface-2)' : 'transparent',
                cursor: 'pointer',
                fontSize: 12,
                color: tag.value ? tag.color : 'var(--text-secondary)',
                fontWeight: value === tag.value ? 700 : 400,
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = tag.bg || 'var(--bg-surface-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = value === tag.value ? tag.bg || 'var(--bg-surface-2)' : 'transparent'; }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: tag.dot,
                  border: tag.value ? 'none' : '1px solid var(--border)',
                  flexShrink: 0,
                }}
              />
              {tag.label}
              {value === tag.value && (
                <span style={{ marginLeft: 'auto', fontSize: 13 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
