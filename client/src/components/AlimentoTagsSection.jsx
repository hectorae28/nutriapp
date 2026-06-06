/**
 * AlimentoTagsSection — sección reutilizable para etiquetar alimentos específicos.
 * Se usa en PlanEditorView para marcar indicaciones especiales por alimento.
 *
 * Props:
 *   tags        — array de tags actuales [{ id?, alimento_id, alimento_nombre, alimento_grupo, tag, nota }]
 *   onChange    — fn(newTags) llamada al agregar/editar/eliminar
 *   grupos      — catálogo de grupos con sus alimentos (para el buscador)
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, ChevronDown, Search, Tag } from 'lucide-react';
import { RACION_TAGS, getTagMeta } from '../constants/racionTags';

const TAG_OPTIONS = RACION_TAGS.filter((t) => t.value !== '');

// ─── estilos ─────────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  background: 'var(--bg-input, var(--bg-surface))',
  color: 'var(--text-primary)',
  outline: 'none',
};

// ─── componente principal ─────────────────────────────────────────────────────

export default function AlimentoTagsSection({ tags = [], onChange, grupos = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null); // índice del tag editando la nota

  const handleAdd = (newTag) => {
    // evitar duplicados por alimento
    if (tags.some((t) => t.alimento_id === newTag.alimento_id)) return;
    onChange([...tags, newTag]);
    setShowModal(false);
  };

  const handleRemove = (idx) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const handleChangeTag = (idx, tag) => {
    onChange(tags.map((t, i) => (i === idx ? { ...t, tag } : t)));
  };

  const handleChangeNota = (idx, nota) => {
    onChange(tags.map((t, i) => (i === idx ? { ...t, nota } : t)));
  };

  // agrupar por tag para mostrar ordenado
  const porTag = useMemo(() => {
    const grupos = { evitar: [], ocasional: [], incrementar: [] };
    tags.forEach((t, i) => {
      if (grupos[t.tag]) grupos[t.tag].push({ ...t, _idx: i });
    });
    return grupos;
  }, [tags]);

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: 16,
      }}
    >
      {/* cabecera */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: tags.length > 0 ? 14 : 0,
        }}
      >
        <h3
          style={{
            fontFamily: 'Outfit',
            fontSize: 15,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: 0,
          }}
        >
          <Tag size={16} /> Indicaciones por alimento
          {tags.length > 0 && (
            <span
              style={{
                fontSize: 11,
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '1px 7px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
              }}
            >
              {tags.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'var(--accent-green)',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={13} /> Agregar indicación
        </button>
      </div>

      {/* lista vacía */}
      {tags.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
          Sin indicaciones específicas por alimento. Usa el botón para agregar.
        </p>
      )}

      {/* listas por tipo de tag */}
      {TAG_OPTIONS.map(({ value, label, bg, border, color, dot }) => {
        const grupo = porTag[value] || [];
        if (grupo.length === 0) return null;
        return (
          <div key={value} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
                fontSize: 11,
                fontWeight: 700,
                color,
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, display: 'inline-block' }} />
              {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {grupo.map(({ _idx, alimento_nombre, alimento_grupo, nota }) => (
                <div
                  key={_idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                  }}
                >
                  {/* info del alimento */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {alimento_nombre}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6 }}>
                      {alimento_grupo}
                    </span>
                    {/* nota editable inline */}
                    {editingIdx === _idx ? (
                      <input
                        autoFocus
                        type="text"
                        value={nota || ''}
                        onChange={(e) => handleChangeNota(_idx, e.target.value)}
                        onBlur={() => setEditingIdx(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingIdx(null)}
                        placeholder="Nota (ej: intolerante a lactosa)..."
                        style={{
                          ...inputStyle,
                          marginTop: 4,
                          padding: '4px 8px',
                          fontSize: 11,
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => setEditingIdx(_idx)}
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color: nota ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                          cursor: 'text',
                          fontStyle: nota ? 'normal' : 'italic',
                        }}
                      >
                        {nota || '+ agregar nota...'}
                      </div>
                    )}
                  </div>

                  {/* cambiar tag */}
                  <TagPill
                    value={value}
                    onChange={(newTag) => handleChangeTag(_idx, newTag)}
                  />

                  {/* eliminar */}
                  <button
                    onClick={() => handleRemove(_idx)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      padding: 2,
                      flexShrink: 0,
                    }}
                    title="Quitar indicación"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Modal de búsqueda y selección */}
      {showModal && (
        <AlimentoBuscadorModal
          grupos={grupos}
          usados={new Set(tags.map((t) => t.alimento_id))}
          onClose={() => setShowModal(false)}
          onSelect={handleAdd}
        />
      )}
    </div>
  );
}

// ─── Pill de tag con dropdown para cambiar ────────────────────────────────────

function TagPill({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const meta = getTagMeta(value);

  useEffect(() => {
    const fn = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          borderRadius: 20,
          border: `1px solid ${meta.border}`,
          background: meta.bg,
          color: meta.color,
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot }} />
        {meta.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 300,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-md)',
            minWidth: 170,
            overflow: 'hidden',
          }}
        >
          {TAG_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={(e) => { e.stopPropagation(); onChange(t.value); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: value === t.value ? t.bg : 'transparent',
                color: t.color,
                fontSize: 12,
                fontWeight: value === t.value ? 700 : 400,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.bg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = value === t.value ? t.bg : 'transparent'; }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.dot, flexShrink: 0 }} />
              {t.label}
              {value === t.value && <span style={{ marginLeft: 'auto' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal buscador de alimentos ──────────────────────────────────────────────

function AlimentoBuscadorModal({ grupos, usados, onClose, onSelect }) {
  const [busqueda, setBusqueda] = useState('');
  const [tagSeleccionado, setTagSeleccionado] = useState('evitar');
  const [nota, setNota] = useState('');

  // Aplanar todos los alimentos de todos los grupos
  const todosAlimentos = useMemo(
    () =>
      grupos.flatMap((g) =>
        (g.alimentos || []).map((a) => ({
          ...a,
          grupo_nombre: g.nombre,
        }))
      ),
    [grupos]
  );

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return todosAlimentos
      .filter((a) => !usados.has(a.id))
      .filter((a) => !q || a.nombre.toLowerCase().includes(q) || a.grupo_nombre.toLowerCase().includes(q))
      .slice(0, 50);
  }, [busqueda, todosAlimentos, usados]);

  const handleSeleccionar = (alimento) => {
    onSelect({
      alimento_id: alimento.id,
      alimento_nombre: alimento.nombre,
      alimento_grupo: alimento.grupo_nombre,
      tag: tagSeleccionado,
      nota,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 520,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={16} style={{ color: 'var(--accent-green)' }} />
            Agregar indicación de alimento
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* selector de tag */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
            Tipo de indicación
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {TAG_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTagSeleccionado(t.value)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: `2px solid ${tagSeleccionado === t.value ? t.border : 'var(--border)'}`,
                  background: tagSeleccionado === t.value ? t.bg : 'var(--bg-surface-2)',
                  color: tagSeleccionado === t.value ? t.color : 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: tagSeleccionado === t.value ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.dot, flexShrink: 0 }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* nota */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
            Nota (opcional)
          </p>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: intolerante a la lactosa, alergia al gluten..."
            style={{ ...inputStyle }}
          />
        </div>

        {/* buscador */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar alimento (ej: leche, pollo, arroz...)"
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>

        {/* lista de alimentos */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 8 }}>
          {filtrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px 16px', fontSize: 13 }}>
              {todosAlimentos.length === 0
                ? 'No hay alimentos en el catálogo'
                : 'Sin resultados para esa búsqueda'}
            </p>
          ) : (
            filtrados.map((alimento) => {
              const tagMeta = getTagMeta(tagSeleccionado);
              return (
                <button
                  key={alimento.id}
                  onClick={() => handleSeleccionar(alimento)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    borderBottom: '1px solid var(--border-light)',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = tagMeta.bg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                      {alimento.nombre}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {alimento.grupo_nombre} · {alimento.porcion_g}g por porción
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: tagMeta.bg,
                      color: tagMeta.color,
                      border: `1px solid ${tagMeta.border}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tagMeta.label}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
          Selecciona un alimento para agregar la indicación
        </p>
      </div>
    </div>
  );
}
