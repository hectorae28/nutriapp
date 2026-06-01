import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  LayoutTemplate,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Activity,
  Shield,
  X,
  Check,
} from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { useToast } from '../contexts/ToastContext';
import { plantillasApi } from '../api/planes';

// ─── constantes de estilo ────────────────────────────────────────────────────

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

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: 4,
};

const TIPO_COLORES = {
  hipocalorico: { bg: '#fff3e0', border: '#ff9800', text: '#e65100', label: 'Hipocalórico' },
  normocalorico: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32', label: 'Normocalórico' },
  hipercalorico: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0', label: 'Hipercalórico' },
  diabetico: { bg: '#fce4ec', border: '#e91e63', text: '#880e4f', label: 'Diabético' },
  otro: { bg: '#f3e5f5', border: '#9c27b0', text: '#4a148c', label: 'Otro' },
};

const PLANTILLA_VACIA = {
  nombre: '',
  emoji: '📋',
  tipo_dieta: 'normocalorico',
  kcal_objetivo: '',
  pct_proteinas: '',
  pct_grasas: '',
  pct_carbohidratos: '',
  requerimiento_hidrico_ml: '',
  fibra_g: '',
  sodio_mg: '',
  potasio_mg: '',
  cho_simples_g: '',
  descripcion: '',
  objetivos: [],
  activa: true,
  tiempos_comida: [
    { nombre: 'Desayuno', hora: '07:00', orden: 0 },
    { nombre: 'Almuerzo', hora: '13:00', orden: 1 },
    { nombre: 'Cena', hora: '19:00', orden: 2 },
  ],
};

// ─── componente principal ────────────────────────────────────────────────────

export default function PlantillasView() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandida, setExpandida] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const cargar = useCallback(() => {
    setLoading(true);
    plantillasApi
      .list()
      .then((data) => setPlantillas(Array.isArray(data) ? data : data.results || []))
      .catch(() => addToast({ message: 'Error al cargar plantillas', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleDuplicar = async (id) => {
    try {
      const copia = await plantillasApi.duplicar(id);
      addToast({ message: 'Plantilla duplicada. Puedes editarla ahora.', type: 'success' });
      navigate(`/plantillas/editor?id=${copia.id}`);
    } catch {
      addToast({ message: 'Error al duplicar', type: 'error' });
    }
  };

  const handleEliminar = async (id) => {
    try {
      await plantillasApi.delete(id);
      addToast({ message: 'Plantilla eliminada', type: 'success' });
      setConfirmDelete(null);
      cargar();
    } catch (e) {
      addToast({ message: e?.error || 'No se puede eliminar una plantilla del sistema', type: 'error' });
      setConfirmDelete(null);
    }
  };

  // grupos: default y custom
  const defaults = plantillas.filter((p) => p.es_default);
  const custom = plantillas.filter((p) => !p.es_default);

  return (
    <div className="na-planner">
      <TopHeader
        title="Plantillas de Planes"
        subtitle="Crea y gestiona plantillas reutilizables para planes alimenticios"
      />

      <div className="na-planner-content">
        {/* ── header con botón crear ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {plantillas.length} plantilla{plantillas.length !== 1 ? 's' : ''} disponible
              {plantillas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/plantillas/editor')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent-green)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Nueva Plantilla
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid var(--accent-green)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : (
          <>
            {/* ── plantillas del sistema ── */}
            {defaults.length > 0 && (
              <Section
                title="Plantillas del sistema"
                icon={<Shield size={14} />}
                subtitle="Plantillas predefinidas. Puedes duplicarlas para editarlas."
              >
                {defaults.map((p) => (
                  <PlantillaCard
                    key={p.id}
                    plantilla={p}
                    expandida={expandida === p.id}
                    onToggle={() => setExpandida(expandida === p.id ? null : p.id)}
                    onDuplicar={() => handleDuplicar(p.id)}
                    onEditar={null}
                    onEliminar={null}
                  />
                ))}
              </Section>
            )}

            {/* ── plantillas personalizadas ── */}
            <Section
              title="Mis plantillas"
              icon={<LayoutTemplate size={14} />}
              subtitle={
                custom.length === 0
                  ? 'Aún no has creado plantillas personalizadas'
                  : `${custom.length} plantilla${custom.length !== 1 ? 's' : ''} personalizada${custom.length !== 1 ? 's' : ''}`
              }
            >
              {custom.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px 20px',
                    border: '2px dashed var(--border)',
                    borderRadius: 12,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <LayoutTemplate
                    size={32}
                    style={{ marginBottom: 8, opacity: 0.4, display: 'block', margin: '0 auto 8px' }}
                  />
                  <p style={{ fontSize: 13, margin: 0 }}>
                    Crea tu primera plantilla personalizada con el botón "Nueva Plantilla"
                  </p>
                  <p style={{ fontSize: 11, margin: '4px 0 0', opacity: 0.7 }}>
                    O duplica una plantilla del sistema y modifícala
                  </p>
                </div>
              ) : (
                custom.map((p) => (
                  <PlantillaCard
                    key={p.id}
                    plantilla={p}
                    expandida={expandida === p.id}
                    onToggle={() => setExpandida(expandida === p.id ? null : p.id)}
                    onDuplicar={() => handleDuplicar(p.id)}
                    onEditar={() => navigate(`/plantillas/editor?id=${p.id}`)}
                    onEliminar={() => setConfirmDelete(p.id)}
                  />
                ))
              )}
            </Section>
          </>
        )}
      </div>

      {/* ── Confirmar eliminar ── */}
      {confirmDelete && (
        <ConfirmModal
          mensaje="¿Eliminar esta plantilla? Esta acción no se puede deshacer."
          onConfirm={() => handleEliminar(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Sección con título ───────────────────────────────────────────────────────

function Section({ title, icon, subtitle, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ color: 'var(--accent-green)' }}>{icon}</span>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{title}</h3>
      </div>
      {subtitle && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 12px 0' }}>
          {subtitle}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

// ─── Card de plantilla ────────────────────────────────────────────────────────

function PlantillaCard({ plantilla: p, expandida, onToggle, onDuplicar, onEditar, onEliminar }) {
  const colores = TIPO_COLORES[p.tipo_dieta] || TIPO_COLORES.otro;
  const suma =
    (parseFloat(p.pct_proteinas) || 0) +
    (parseFloat(p.pct_grasas) || 0) +
    (parseFloat(p.pct_carbohidratos) || 0);

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${expandida ? colores.border : 'var(--border-light)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* cabecera */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 16px',
          cursor: 'pointer',
          gap: 12,
        }}
        onClick={onToggle}
      >
        <span style={{ fontSize: 26 }}>{p.emoji || '📋'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 14 }}>{p.nombre}</strong>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: colores.bg,
                color: colores.text,
                border: `1px solid ${colores.border}`,
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {colores.label}
            </span>
            {p.es_default && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: '#e8f5e9',
                  color: '#388e3c',
                  border: '1px solid #a5d6a7',
                  padding: '1px 6px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Shield size={9} /> Sistema
              </span>
            )}
            {!p.activa && (
              <span
                style={{
                  fontSize: 10,
                  background: '#f5f5f5',
                  color: '#9e9e9e',
                  border: '1px solid #e0e0e0',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                Inactiva
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-tertiary)',
              marginTop: 2,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {p.kcal_objetivo && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Flame size={11} /> {p.kcal_objetivo} kcal
              </span>
            )}
            {p.tiempos_comida?.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={11} /> {p.tiempos_comida.length} tiempos
              </span>
            )}
            {suma > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Activity size={11} /> P:{p.pct_proteinas}% G:{p.pct_grasas}% C:
                {p.pct_carbohidratos}%
              </span>
            )}
          </div>
        </div>

        {/* acciones */}
        <div
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <ActionBtn title="Duplicar" onClick={onDuplicar} icon={<Copy size={14} />} />
          {onEditar && (
            <ActionBtn title="Editar" onClick={onEditar} icon={<Pencil size={14} />} color="var(--accent-green)" />
          )}
          {onEliminar && (
            <ActionBtn title="Eliminar" onClick={onEliminar} icon={<Trash2 size={14} />} color="var(--accent-coral, #e57373)" danger />
          )}
        </div>

        <span style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>
          {expandida ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {/* detalle expandido */}
      {expandida && (
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            padding: '14px 16px',
            background: 'var(--bg-surface-2)',
          }}
        >
          {p.descripcion && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {p.descripcion}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {/* macros */}
            {suma > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                  Macronutrientes
                </p>
                <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
                  {p.pct_proteinas && (
                    <div style={{ width: `${p.pct_proteinas}%`, background: '#e17c5a' }} title={`Proteínas ${p.pct_proteinas}%`} />
                  )}
                  {p.pct_grasas && (
                    <div style={{ width: `${p.pct_grasas}%`, background: '#f0c040' }} title={`Grasas ${p.pct_grasas}%`} />
                  )}
                  {p.pct_carbohidratos && (
                    <div style={{ width: `${p.pct_carbohidratos}%`, background: '#7db87a' }} title={`CHO ${p.pct_carbohidratos}%`} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                  <span style={{ color: '#e17c5a' }}>■ P: {p.pct_proteinas}%</span>
                  <span style={{ color: '#c89b00' }}>■ G: {p.pct_grasas}%</span>
                  <span style={{ color: '#558b2f' }}>■ C: {p.pct_carbohidratos}%</span>
                </div>
              </div>
            )}

            {/* otros parámetros */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                Parámetros
              </p>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {p.requerimiento_hidrico_ml && (
                  <span>💧 Hidratación: {p.requerimiento_hidrico_ml} ml/día</span>
                )}
                {p.fibra_g && <span>🌾 Fibra: {p.fibra_g} g/día</span>}
                {p.sodio_mg && <span>🧂 Sodio: {p.sodio_mg} mg/día</span>}
                {p.potasio_mg && <span>⚡ Potasio: {p.potasio_mg} mg/día</span>}
                {p.cho_simples_g && <span>🍬 CHO simples: {p.cho_simples_g} g/día</span>}
              </div>
            </div>

            {/* tiempos de comida */}
            {p.tiempos_comida?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                  Tiempos de comida
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {p.tiempos_comida.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <Clock size={11} style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{t.hora}</span>
                      <span>{t.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* objetivos */}
            {p.objetivos?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                  Objetivos
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {p.objetivos.map((obj, i) => (
                    <span key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Check size={11} style={{ color: 'var(--accent-green)' }} />
                      {obj}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ onClick, icon, title, color, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        border: `1px solid ${hover ? (danger ? '#e57373' : color || 'var(--accent-green)') : 'var(--border)'}`,
        borderRadius: 6,
        background: hover ? (danger ? '#ffebee' : 'var(--accent-green)') : 'var(--bg-surface-2)',
        color: hover ? (danger ? '#c62828' : '#fff') : color || 'var(--text-secondary)',
        cursor: 'pointer',
        padding: '5px 8px',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {icon}
    </button>
  );
}

// ─── Modal Editor de Plantilla ────────────────────────────────────────────────

function PlantillaEditorModal({ mode, initialData, onClose, onGuardar, guardando }) {
  const [form, setForm] = useState(() => ({
    ...PLANTILLA_VACIA,
    ...initialData,
    tiempos_comida: initialData.tiempos_comida
      ? initialData.tiempos_comida.map((t) => ({ ...t }))
      : [...PLANTILLA_VACIA.tiempos_comida],
    objetivos: Array.isArray(initialData.objetivos)
      ? [...initialData.objetivos]
      : [],
  }));
  const [objetivoInput, setObjetivoInput] = useState('');

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // tiempos de comida
  const addTiempo = () =>
    setForm((f) => ({
      ...f,
      tiempos_comida: [
        ...f.tiempos_comida,
        { nombre: '', hora: '', orden: f.tiempos_comida.length },
      ],
    }));

  const removeTiempo = (i) =>
    setForm((f) => ({
      ...f,
      tiempos_comida: f.tiempos_comida.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, orden: idx })),
    }));

  const updateTiempo = (i, field, value) =>
    setForm((f) => ({
      ...f,
      tiempos_comida: f.tiempos_comida.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)),
    }));

  // objetivos
  const addObjetivo = () => {
    const val = objetivoInput.trim();
    if (!val) return;
    setForm((f) => ({ ...f, objetivos: [...f.objetivos, val] }));
    setObjetivoInput('');
  };
  const removeObjetivo = (i) =>
    setForm((f) => ({ ...f, objetivos: f.objetivos.filter((_, idx) => idx !== i) }));

  // suma macros
  const sumaMacros =
    (parseFloat(form.pct_proteinas) || 0) +
    (parseFloat(form.pct_grasas) || 0) +
    (parseFloat(form.pct_carbohidratos) || 0);
  const macrosOk = sumaMacros === 0 || Math.abs(sumaMacros - 100) < 1;

  const handleSubmit = () => {
    if (!form.nombre.trim()) return;
    // limpiar campos vacíos numéricos
    const payload = {
      nombre: form.nombre.trim(),
      emoji: form.emoji || '📋',
      tipo_dieta: form.tipo_dieta,
      kcal_objetivo: form.kcal_objetivo ? parseInt(form.kcal_objetivo) : null,
      descripcion: form.descripcion,
      pct_proteinas: form.pct_proteinas ? parseFloat(form.pct_proteinas) : null,
      pct_grasas: form.pct_grasas ? parseFloat(form.pct_grasas) : null,
      pct_carbohidratos: form.pct_carbohidratos ? parseFloat(form.pct_carbohidratos) : null,
      requerimiento_hidrico_ml: form.requerimiento_hidrico_ml ? parseInt(form.requerimiento_hidrico_ml) : null,
      fibra_g: form.fibra_g ? parseFloat(form.fibra_g) : null,
      sodio_mg: form.sodio_mg ? parseFloat(form.sodio_mg) : null,
      potasio_mg: form.potasio_mg ? parseFloat(form.potasio_mg) : null,
      cho_simples_g: form.cho_simples_g ? parseFloat(form.cho_simples_g) : null,
      objetivos: form.objetivos,
      activa: form.activa,
      tiempos_comida: form.tiempos_comida
        .filter((t) => t.nombre.trim())
        .map((t, i) => ({ nombre: t.nombre.trim(), hora: t.hora || null, orden: i })),
    };
    onGuardar(payload);
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
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 22,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Outfit', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LayoutTemplate size={20} style={{ color: 'var(--accent-green)' }} />
            {mode === 'crear' ? 'Nueva Plantilla' : 'Editar Plantilla'}
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* ── Información básica ── */}
        <SectionHeader>Información básica</SectionHeader>

        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Emoji</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => set('emoji', e.target.value)}
              maxLength={2}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 22 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej: Plan bajo en sodio para adulto mayor"
              style={{ ...inputStyle, borderColor: !form.nombre.trim() ? 'var(--accent-coral)' : undefined }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Tipo de dieta</label>
            <select value={form.tipo_dieta} onChange={(e) => set('tipo_dieta', e.target.value)} style={inputStyle}>
              <option value="hipocalorico">Hipocalórico</option>
              <option value="normocalorico">Normocalórico</option>
              <option value="hipercalorico">Hipercalórico</option>
              <option value="diabetico">Diabético</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}><Flame size={11} style={{ display: 'inline', marginRight: 3 }} />Kcal objetivo</label>
            <input type="number" value={form.kcal_objetivo} onChange={(e) => set('kcal_objetivo', e.target.value)} placeholder="2000" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            rows={2}
            placeholder="Descripción clínica de la plantilla..."
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.activa} onChange={(e) => set('activa', e.target.checked)} style={{ width: 14, height: 14 }} />
            Plantilla activa (visible al crear planes)
          </label>
        </div>

        {/* ── Macronutrientes ── */}
        <SectionHeader icon={<Activity size={13} />}>
          Macronutrientes
          {sumaMacros > 0 && (
            <span style={{ marginLeft: 8, fontSize: 11, color: macrosOk ? 'var(--accent-green)' : 'var(--accent-coral)', fontWeight: 700 }}>
              {macrosOk ? `✓ ${sumaMacros}%` : `⚠ ${sumaMacros}% (debe sumar 100%)`}
            </span>
          )}
        </SectionHeader>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>% Proteínas</label>
            <input type="number" value={form.pct_proteinas} onChange={(e) => set('pct_proteinas', e.target.value)} placeholder="20" min="0" max="100" style={{ ...inputStyle, borderColor: form.pct_proteinas ? '#e17c5a' : undefined }} />
          </div>
          <div>
            <label style={labelStyle}>% Grasas</label>
            <input type="number" value={form.pct_grasas} onChange={(e) => set('pct_grasas', e.target.value)} placeholder="30" min="0" max="100" style={{ ...inputStyle, borderColor: form.pct_grasas ? '#c89b00' : undefined }} />
          </div>
          <div>
            <label style={labelStyle}>% Carbohidratos</label>
            <input type="number" value={form.pct_carbohidratos} onChange={(e) => set('pct_carbohidratos', e.target.value)} placeholder="50" min="0" max="100" style={{ ...inputStyle, borderColor: form.pct_carbohidratos ? '#558b2f' : undefined }} />
          </div>
        </div>

        {/* barra visual */}
        {sumaMacros > 0 && macrosOk && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              {form.pct_proteinas && <div style={{ width: `${form.pct_proteinas}%`, background: '#e17c5a' }} />}
              {form.pct_grasas && <div style={{ width: `${form.pct_grasas}%`, background: '#f0c040' }} />}
              {form.pct_carbohidratos && <div style={{ width: `${form.pct_carbohidratos}%`, background: '#7db87a' }} />}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 10, color: 'var(--text-tertiary)' }}>
              <span style={{ color: '#e17c5a' }}>■ P {form.pct_proteinas}%</span>
              <span style={{ color: '#c89b00' }}>■ G {form.pct_grasas}%</span>
              <span style={{ color: '#558b2f' }}>■ C {form.pct_carbohidratos}%</span>
            </div>
          </div>
        )}

        {/* ── Otros parámetros ── */}
        <SectionHeader icon={<Droplets size={13} />}>Otros parámetros nutricionales</SectionHeader>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>💧 Hídrico (ml/día)</label>
            <input type="number" value={form.requerimiento_hidrico_ml} onChange={(e) => set('requerimiento_hidrico_ml', e.target.value)} placeholder="2000" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>🌾 Fibra (g/día)</label>
            <input type="number" value={form.fibra_g} onChange={(e) => set('fibra_g', e.target.value)} placeholder="25" step="0.5" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>🧂 Sodio (mg/día)</label>
            <input type="number" value={form.sodio_mg} onChange={(e) => set('sodio_mg', e.target.value)} placeholder="" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>⚡ Potasio (mg/día)</label>
            <input type="number" value={form.potasio_mg} onChange={(e) => set('potasio_mg', e.target.value)} placeholder="" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>🍬 CHO simples (g)</label>
            <input type="number" value={form.cho_simples_g} onChange={(e) => set('cho_simples_g', e.target.value)} placeholder="" style={inputStyle} />
          </div>
        </div>

        {/* ── Tiempos de comida ── */}
        <SectionHeader icon={<Clock size={13} />}>Tiempos de comida</SectionHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {form.tiempos_comida.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <GripVertical size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 18, textAlign: 'center' }}>{i + 1}</span>
              <input
                type="text"
                value={t.nombre}
                onChange={(e) => updateTiempo(i, 'nombre', e.target.value)}
                placeholder="Nombre (ej: Desayuno)"
                style={{ ...inputStyle, flex: 2 }}
              />
              <input
                type="time"
                value={t.hora || ''}
                onChange={(e) => updateTiempo(i, 'hora', e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 100 }}
              />
              <button
                onClick={() => removeTiempo(i)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--accent-coral, #e57373)', padding: 4 }}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addTiempo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px dashed var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            background: 'none',
            cursor: 'pointer',
            marginBottom: 20,
          }}
        >
          <Plus size={13} /> Agregar tiempo de comida
        </button>

        {/* ── Objetivos ── */}
        <SectionHeader>Objetivos clínicos</SectionHeader>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={objetivoInput}
            onChange={(e) => setObjetivoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addObjetivo()}
            placeholder="Ej: Control glucémico (Enter para agregar)"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={addObjetivo}
            style={{
              background: 'var(--accent-green)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {form.objetivos.map((obj, i) => (
            <span
              key={i}
              style={{
                fontSize: 12,
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                padding: '4px 10px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {obj}
              <button
                onClick={() => removeObjetivo(i)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)', lineHeight: 1 }}
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {form.objetivos.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Sin objetivos aún
            </span>
          )}
        </div>

        {/* ── Acciones ── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              background: 'var(--bg-surface-2)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={guardando || !form.nombre.trim()}
            style={{
              background: form.nombre.trim() ? 'var(--accent-green)' : 'var(--border)',
              color: form.nombre.trim() ? '#fff' : 'var(--text-tertiary)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: form.nombre.trim() && !guardando ? 'pointer' : 'not-allowed',
              opacity: guardando ? 0.7 : 1,
            }}
          >
            {guardando ? 'Guardando...' : mode === 'crear' ? '✓ Crear Plantilla' : '✓ Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children, icon }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        margin: '0 0 10px 0',
        paddingBottom: 6,
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      {icon && <span style={{ color: 'var(--accent-green)' }}>{icon}</span>}
      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
        {children}
      </h4>
    </div>
  );
}

function ConfirmModal({ mensaje, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 14,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          boxShadow: 'var(--shadow-xl)',
          textAlign: 'center',
        }}
      >
        <Trash2 size={32} style={{ color: '#e57373', marginBottom: 12 }} />
        <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 20 }}>{mensaje}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 13,
              background: 'var(--bg-surface-2)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: '#e57373',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
