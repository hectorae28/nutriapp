/**
 * PlantillaEditorView — editor de plantillas alimenticias.
 * Usa la misma UI que PlanEditorView pero sin paciente ni fechas.
 * Guarda en /api/plantillas-alimenticias/
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  X,
  ClipboardList,
  Trash2,
  Zap,
  Check,
  Minus,
  Clock,
  Activity,
  Droplets,
  Flame,
  LayoutTemplate,
} from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { ProgressRing, Badge } from '../components/SharedComponents';
import { useToast } from '../contexts/ToastContext';
import { plantillasApi, planesApi } from '../api/planes';
import { getGrupoStyle } from '../constants/grupoStyles';
import AlimentoTagsSection from '../components/AlimentoTagsSection';
import { alimentoTagsPlantillaApi } from '../api/planes';

// ─── estilos ────────────────────────────────────────────────────────────────

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

const btnSecondary = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};

// ─── componente ─────────────────────────────────────────────────────────────

export default function PlantillaEditorView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const plantillaId = queryParams.get('id');
  const isNuevo = !plantillaId;

  const [loading, setLoading] = useState(!!plantillaId);
  const [guardando, setGuardando] = useState(false);

  // ── campos de la plantilla ──
  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState('📋');
  const [tipoDieta, setTipoDieta] = useState('normocalorico');
  const [kcalObjetivo, setKcalObjetivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activa, setActiva] = useState(true);
  const [objetivos, setObjetivos] = useState([]);
  const [objetivoInput, setObjetivoInput] = useState('');

  // macros
  const [pctProteinas, setPctProteinas] = useState('');
  const [pctGrasas, setPctGrasas] = useState('');
  const [pctCarbohidratos, setPctCarbohidratos] = useState('');
  const [hidrico, setHidrico] = useState('');
  const [fibra, setFibra] = useState('');
  const [sodio, setSodio] = useState('');
  const [potasio, setPotasio] = useState('');
  const [choSimples, setChoSimples] = useState('');

  // tiempos de comida con raciones (igual estructura que PlanEditorView)
  const [tiemposComida, setTiemposComida] = useState([]);

  // catálogo de grupos
  const [grupos, setGrupos] = useState([]);

  // tags de alimentos específicos
  const [alimentoTags, setAlimentoTags] = useState([]);

  // modals
  const [addGrupoModal, setAddGrupoModal] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingNombre, setEditingNombre] = useState('');

  // ── carga inicial ──────────────────────────────────────────────────────────

  useEffect(() => {
    planesApi
      .grupos()
      .then((d) => setGrupos(Array.isArray(d) ? d : d.results || []))
      .catch(() => setGrupos([]));
  }, []);

  useEffect(() => {
    if (!plantillaId) return;
    setLoading(true);
    plantillasApi
      .get(plantillaId)
      .then((p) => {
        setNombre(p.nombre || '');
        setEmoji(p.emoji || '📋');
        setTipoDieta(p.tipo_dieta || 'normocalorico');
        setKcalObjetivo(p.kcal_objetivo || '');
        setDescripcion(p.descripcion || '');
        setActiva(p.activa ?? true);
        setObjetivos(Array.isArray(p.objetivos) ? p.objetivos : []);
        setPctProteinas(p.pct_proteinas || '');
        setPctGrasas(p.pct_grasas || '');
        setPctCarbohidratos(p.pct_carbohidratos || '');
        setHidrico(p.requerimiento_hidrico_ml || '');
        setFibra(p.fibra_g || '');
        setSodio(p.sodio_mg || '');
        setPotasio(p.potasio_mg || '');
        setChoSimples(p.cho_simples_g || '');
        setAlimentoTags(
          (p.alimento_tags || []).map((t) => ({
            id: t.id,
            alimento_id: t.alimento,
            alimento_nombre: t.alimento_nombre,
            alimento_grupo: t.alimento_grupo,
            tag: t.tag,
            nota: t.nota || '',
          }))
        );

        const tiempos = [...(p.tiempos_comida || [])].sort(
          (a, b) => (a.orden || 0) - (b.orden || 0)
        );
        setTiemposComida(
          tiempos.map((t) => ({
            id: t.id,
            nombre: t.nombre || '',
            hora: t.hora || '',
            orden: t.orden || 0,
            raciones: (t.raciones || []).map((r) => ({
              id: r.id,
              grupo_id: r.grupo,
              grupo_nombre: r.grupo_nombre || '',
              kcal_racion: parseFloat(r.kcal_racion || 0),
              cantidad: parseFloat(r.cantidad || 1),
              tag: r.tag || '',
            })),
          }))
        );
      })
      .catch(() => {
        addToast({ message: 'Error al cargar la plantilla', type: 'error' });
        navigate('/plantillas');
      })
      .finally(() => setLoading(false));
  }, [plantillaId]);

  // ── tiempos de comida ──────────────────────────────────────────────────────

  const agregarTiempo = () => {
    const idx = tiemposComida.length;
    setTiemposComida((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, nombre: `Comida ${idx + 1}`, hora: '', orden: idx, raciones: [] },
    ]);
  };

  const eliminarTiempo = (idx) =>
    setTiemposComida((prev) => prev.filter((_, i) => i !== idx));

  const updateTiempo = (idx, field, value) =>
    setTiemposComida((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t))
    );

  const startEditNombre = (idx) => {
    setEditingIdx(idx);
    setEditingNombre(tiemposComida[idx].nombre);
  };
  const saveEditNombre = () => {
    if (editingIdx !== null && editingNombre.trim())
      updateTiempo(editingIdx, 'nombre', editingNombre.trim());
    setEditingIdx(null);
    setEditingNombre('');
  };
  const cancelEditNombre = () => { setEditingIdx(null); setEditingNombre(''); };

  // ── raciones ───────────────────────────────────────────────────────────────

  const agregarRacion = (tiempoIdx, grupoId) => {
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return;
    setTiemposComida((prev) =>
      prev.map((t, i) =>
        i !== tiempoIdx
          ? t
          : {
              ...t,
              raciones: [
                ...t.raciones,
                {
                  id: null,
                  grupo_id: grupo.id,
                  grupo_nombre: grupo.nombre,
                  kcal_racion: parseFloat(grupo.kcal_racion || 0),
                  cantidad: 1,
                  tag: '',
                },
              ],
            }
      )
    );
    setAddGrupoModal(null);
  };

  const eliminarRacion = (tiempoIdx, racionIdx) =>
    setTiemposComida((prev) =>
      prev.map((t, i) =>
        i !== tiempoIdx ? t : { ...t, raciones: t.raciones.filter((_, ri) => ri !== racionIdx) }
      )
    );

  const updateTag = (tiempoIdx, racionIdx, tag) =>
    setTiemposComida((prev) =>
      prev.map((t, i) =>
        i !== tiempoIdx
          ? t
          : { ...t, raciones: t.raciones.map((r, ri) => (ri === racionIdx ? { ...r, tag } : r)) }
      )
    );

  const updateCantidad = (tiempoIdx, racionIdx, delta) =>
    setTiemposComida((prev) =>
      prev.map((t, i) =>
        i !== tiempoIdx
          ? t
          : {
              ...t,
              raciones: t.raciones.map((r, ri) =>
                ri !== racionIdx
                  ? r
                  : { ...r, cantidad: Math.max(0.5, parseFloat(r.cantidad || 1) + delta) }
              ),
            }
      )
    );

  // ── objetivos ──────────────────────────────────────────────────────────────

  const agregarObjetivo = () => {
    const val = objetivoInput.trim();
    if (!val) return;
    setObjetivos((prev) => [...prev, val]);
    setObjetivoInput('');
  };

  // ── kcal ───────────────────────────────────────────────────────────────────

  const kcalTiempo = (t) =>
    t.raciones.reduce((s, r) => s + r.kcal_racion * parseFloat(r.cantidad || 0), 0);
  const kcalTotal = tiemposComida.reduce((s, t) => s + kcalTiempo(t), 0);

  const sumaMacros =
    (parseFloat(pctProteinas) || 0) +
    (parseFloat(pctGrasas) || 0) +
    (parseFloat(pctCarbohidratos) || 0);
  const macrosOk = sumaMacros === 0 || Math.abs(sumaMacros - 100) < 1;

  // ── guardar ────────────────────────────────────────────────────────────────

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      addToast({ message: 'El nombre de la plantilla es obligatorio', type: 'warning' });
      return;
    }
    setGuardando(true);
    try {
      // Construimos payload con tiempos + raciones anidadas
      const payload = {
        nombre: nombre.trim(),
        emoji,
        tipo_dieta: tipoDieta,
        kcal_objetivo: kcalObjetivo ? parseInt(kcalObjetivo) : null,
        descripcion,
        activa,
        objetivos,
        pct_proteinas: pctProteinas ? parseFloat(pctProteinas) : null,
        pct_grasas: pctGrasas ? parseFloat(pctGrasas) : null,
        pct_carbohidratos: pctCarbohidratos ? parseFloat(pctCarbohidratos) : null,
        requerimiento_hidrico_ml: hidrico ? parseInt(hidrico) : null,
        fibra_g: fibra ? parseFloat(fibra) : null,
        sodio_mg: sodio ? parseFloat(sodio) : null,
        potasio_mg: potasio ? parseFloat(potasio) : null,
        cho_simples_g: choSimples ? parseFloat(choSimples) : null,
        tiempos_comida: tiemposComida
          .filter((t) => t.nombre.trim())
          .map((t, i) => ({
            nombre: t.nombre.trim(),
            hora: t.hora || null,
            orden: i,
            // raciones se manejan por separado si estamos editando
          })),
      };

      let idFinal = plantillaId;

      if (isNuevo) {
        // Crear plantilla (sin raciones aún)
        const nueva = await plantillasApi.create(payload);
        idFinal = nueva.id;

        // Recargar para obtener los IDs de los tiempos creados
        const recargada = await plantillasApi.get(idFinal);
        const tiemposCreados = recargada.tiempos_comida || [];

        // Crear raciones para cada tiempo
        for (let i = 0; i < tiemposComida.length; i++) {
          const tc = tiemposCreados[i];
          if (!tc) continue;
          for (const r of tiemposComida[i].raciones) {
            await plantillasApi.raciones.create({
              tiempo_comida: tc.id,
              grupo: r.grupo_id,
              cantidad: parseFloat(r.cantidad || 1),
              tag: r.tag || '',
            });
          }
        }
      } else {
        // Actualizar plantilla (el serializer borra y recrea tiempos, sin raciones)
        await plantillasApi.update(plantillaId, payload);

        // Recargar para obtener IDs nuevos de tiempos
        const recargada = await plantillasApi.get(plantillaId);
        const tiemposCreados = recargada.tiempos_comida || [];

        for (let i = 0; i < tiemposComida.length; i++) {
          const tc = tiemposCreados[i];
          if (!tc) continue;
          for (const r of tiemposComida[i].raciones) {
            await plantillasApi.raciones.create({
              tiempo_comida: tc.id,
              grupo: r.grupo_id,
              cantidad: parseFloat(r.cantidad || 1),
              tag: r.tag || '',
            });
          }
        }
      }

      // guardar alimento_tags
      const tagsBD = plantillaId
        ? await alimentoTagsPlantillaApi.list('plantilla', idFinal)
        : [];
      const tagsBDArr = Array.isArray(tagsBD) ? tagsBD : tagsBD?.results || [];
      for (const tBD of tagsBDArr) {
        if (!alimentoTags.some((t) => t.id === tBD.id)) {
          await alimentoTagsPlantillaApi.delete(tBD.id);
        }
      }
      for (const t of alimentoTags) {
        const payload = { plantilla: idFinal, alimento: t.alimento_id, tag: t.tag, nota: t.nota || '' };
        if (t.id) {
          await alimentoTagsPlantillaApi.update(t.id, payload);
        } else {
          await alimentoTagsPlantillaApi.create(payload);
        }
      }

      addToast({
        message: isNuevo ? 'Plantilla creada exitosamente' : 'Plantilla actualizada',
        type: 'success',
      });
      navigate('/plantillas');
    } catch (err) {
      console.error(err);
      const msg =
        typeof err === 'object' ? Object.values(err).flat().join(' ') : 'Error al guardar';
      addToast({ message: msg, type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading)
    return (
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
    );

  return (
    <div className="na-planner">
      <TopHeader
        title={isNuevo ? 'Nueva Plantilla' : 'Editar Plantilla'}
        subtitle="Las plantillas se usan para precargar planes alimenticios"
      />

      <div className="na-planner-content">
        {/* ── botón volver ── */}
        <button
          onClick={() => navigate('/plantillas')}
          style={{ ...btnSecondary, marginBottom: 16 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-green)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'var(--accent-green)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface-2)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <ArrowLeft size={15} /> Volver a Plantillas
        </button>

        {/* ── card datos de la plantilla ── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: 16,
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
              marginBottom: 16,
            }}
          >
            <ClipboardList size={16} /> Datos de la Plantilla
          </h3>

          {/* fila 1: emoji + nombre + tipo + kcal */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr 200px 160px',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <label style={labelStyle}>Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 22 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Nombre de la plantilla *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Plan para adulto mayor con HTA"
                style={{
                  ...inputStyle,
                  borderColor: !nombre.trim() ? 'var(--accent-coral)' : undefined,
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Tipo de dieta</label>
              <select
                value={tipoDieta}
                onChange={(e) => setTipoDieta(e.target.value)}
                style={inputStyle}
              >
                <option value="hipocalorico">Hipocalórico</option>
                <option value="normocalorico">Normocalórico</option>
                <option value="hipercalorico">Hipercalórico</option>
                <option value="diabetico">Diabético</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                <Flame size={11} style={{ display: 'inline', marginRight: 3 }} />
                Kcal objetivo
              </label>
              <input
                type="number"
                value={kcalObjetivo}
                onChange={(e) => setKcalObjetivo(e.target.value)}
                placeholder="2000"
                style={inputStyle}
              />
            </div>
          </div>

          {/* descripción + activa */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16 }}
          >
            <div>
              <label style={labelStyle}>Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Descripción clínica de esta plantilla..."
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ paddingTop: 20 }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                  style={{ width: 15, height: 15 }}
                />
                Plantilla activa
              </label>
            </div>
          </div>

          {/* macronutrientes */}
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Activity size={13} /> Distribución de Macronutrientes
              {sumaMacros > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: macrosOk ? 'var(--accent-green)' : 'var(--accent-coral)',
                    fontWeight: 700,
                  }}
                >
                  {macrosOk ? `✓ ${sumaMacros}%` : `⚠ ${sumaMacros}% (debe sumar 100%)`}
                </span>
              )}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: '% Proteínas', val: pctProteinas, set: setPctProteinas, color: '#e17c5a' },
                { label: '% Grasas', val: pctGrasas, set: setPctGrasas, color: '#c89b00' },
                { label: '% Carbohidratos', val: pctCarbohidratos, set: setPctCarbohidratos, color: '#558b2f' },
              ].map(({ label, val, set, color }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    style={{ ...inputStyle, borderColor: val ? color : undefined }}
                  />
                </div>
              ))}
            </div>
            {sumaMacros > 0 && macrosOk && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                  {pctProteinas && <div style={{ width: `${pctProteinas}%`, background: '#e17c5a' }} />}
                  {pctGrasas && <div style={{ width: `${pctGrasas}%`, background: '#f0c040' }} />}
                  {pctCarbohidratos && <div style={{ width: `${pctCarbohidratos}%`, background: '#7db87a' }} />}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 10, color: 'var(--text-tertiary)' }}>
                  <span style={{ color: '#e17c5a' }}>■ P {pctProteinas}%</span>
                  <span style={{ color: '#c89b00' }}>■ G {pctGrasas}%</span>
                  <span style={{ color: '#558b2f' }}>■ C {pctCarbohidratos}%</span>
                </div>
              </div>
            )}
          </div>

          {/* hidratación, fibra, sodio, potasio, cho simples */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10,
              marginBottom: 14,
            }}
          >
            {[
              { label: '💧 Hídrico (ml/día)', val: hidrico, set: setHidrico, placeholder: '2000' },
              { label: '🌾 Fibra (g/día)', val: fibra, set: setFibra, placeholder: '25' },
              { label: '🧂 Sodio (mg/día)', val: sodio, set: setSodio, placeholder: '' },
              { label: '⚡ Potasio (mg/día)', val: potasio, set: setPotasio, placeholder: '' },
              { label: '🍬 CHO simples (g)', val: choSimples, set: setChoSimples, placeholder: '' },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          {/* objetivos */}
          <div>
            <label style={labelStyle}>Objetivos clínicos</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input
                type="text"
                value={objetivoInput}
                onChange={(e) => setObjetivoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarObjetivo()}
                placeholder="Ej: Control glucémico (Enter para agregar)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={agregarObjetivo}
                style={{
                  background: 'var(--accent-green)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {objetivos.map((obj, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border)',
                    padding: '3px 10px',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {obj}
                  <button
                    onClick={() => setObjetivos((prev) => prev.filter((_, j) => j !== i))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)', lineHeight: 1 }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              {objetivos.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Sin objetivos</span>
              )}
            </div>
          </div>

          {/* resumen kcal */}
          {kcalTotal > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 14px',
                background: 'var(--bg-surface-2)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
              }}
            >
              <Zap size={14} style={{ color: 'var(--accent-green)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Kcal distribuidas:</span>
              <strong style={{ color: 'var(--accent-green)' }}>{Math.round(kcalTotal)} kcal</strong>
              {kcalObjetivo && (
                <span style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>
                  / {kcalObjetivo} objetivo ({Math.round((kcalTotal / parseFloat(kcalObjetivo)) * 100)}
                  %)
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── indicaciones por alimento ── */}
        <AlimentoTagsSection
          tags={alimentoTags}
          onChange={setAlimentoTags}
          grupos={grupos}
        />

        {/* ── timeline de tiempos de comida (idéntico a PlanEditorView) ── */}
        <div className="na-meals-timeline">
          {tiemposComida.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-tertiary)',
                fontSize: 13,
              }}
            >
              No hay tiempos de comida. Agrega uno con el botón de abajo.
            </div>
          )}

          {tiemposComida.map((tiempo, idx) => {
            const kcalT = kcalTiempo(tiempo);
            const allComplete = tiempo.raciones.length > 0;
            const pct = allComplete ? 100 : 0;

            return (
              <div key={tiempo.id} className={`na-meal-card ${allComplete ? 'complete' : ''}`}>
                <div
                  className="na-timeline-dot"
                  style={{ background: allComplete ? 'var(--accent-green)' : 'var(--border)' }}
                >
                  {allComplete ? (
                    <Check size={12} style={{ color: '#fff' }} />
                  ) : (
                    <span className="na-dot-num">{idx + 1}</span>
                  )}
                </div>

                <div className="na-meal-header">
                  <div className="na-meal-title-row">
                    {editingIdx === idx ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }}>
                        <input
                          className="na-input-inline"
                          autoFocus
                          value={editingNombre}
                          onChange={(e) => setEditingNombre(e.target.value)}
                          onBlur={saveEditNombre}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditNombre();
                            if (e.key === 'Escape') cancelEditNombre();
                          }}
                        />
                        <button className="na-icon-btn-sm" onClick={saveEditNombre}>
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 className="na-meal-name">{tiempo.nombre}</h3>
                        <button className="na-icon-btn-sm" onClick={() => startEditNombre(idx)}>
                          ✏️
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        <Clock size={12} />
                        <input
                          type="time"
                          value={tiempo.hora}
                          onChange={(e) => updateTiempo(idx, 'hora', e.target.value)}
                          style={{ ...inputStyle, width: 100, padding: '4px 8px', fontSize: 12 }}
                        />
                      </div>
                      <button
                        className="na-icon-btn-sm na-danger"
                        onClick={() => eliminarTiempo(idx)}
                        title="Eliminar tiempo de comida"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="na-meal-progress-wrap">
                    <div className="na-meal-progress-bar">
                      <div
                        className="na-meal-progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: allComplete ? 'var(--accent-green)' : 'var(--accent-coral)',
                        }}
                      />
                    </div>
                    <span className="na-meal-progress-label">
                      {tiempo.raciones.length} grupo{tiempo.raciones.length !== 1 ? 's' : ''}{' '}
                      asignado{tiempo.raciones.length !== 1 ? 's' : ''}
                    </span>
                    {kcalT > 0 && (
                      <Badge color="var(--accent-green)">{Math.round(kcalT)} kcal</Badge>
                    )}
                  </div>
                </div>

                {/* slots de grupos de alimento */}
                <div className="na-meal-slots">
                  {tiempo.raciones.map((racion, ri) => {
                    const meta = getGrupoStyle(racion.grupo_nombre, ri);
                    const kcalRacion =
                      (racion.kcal_racion || 0) * parseFloat(racion.cantidad || 0);
                    const targetRaciones = Math.ceil(parseFloat(racion.cantidad || 1));
                    return (
                      <div
                        key={ri}
                        className="na-slot done"
                        style={{ '--slot-color': meta.color, '--slot-light': meta.light }}
                      >
                        <div className="na-slot-header">
                          <span className="na-slot-icon">{meta.icon}</span>
                          <span className="na-slot-name">{racion.grupo_nombre}</span>
                          <ProgressRing
                            value={Math.floor(parseFloat(racion.cantidad))}
                            max={targetRaciones}
                            size={34}
                            stroke={3}
                            color={meta.color}
                          />
                          <div className="na-slot-stepper">
                            <button
                              className="na-step-btn"
                              onClick={() => updateCantidad(idx, ri, -0.5)}
                            >
                              <Minus size={12} />
                            </button>
                            <button
                              className="na-step-btn"
                              onClick={() => updateCantidad(idx, ri, 0.5)}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            className="na-icon-btn-sm na-danger"
                            onClick={() => eliminarRacion(idx, ri)}
                            title="Quitar grupo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div
                          style={{
                            padding: '8px 12px',
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>
                            <strong>{parseFloat(racion.cantidad).toFixed(1)}</strong> raciones
                          </span>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                            {Math.round(kcalRacion)} kcal
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {grupos.length > 0 && tiempo.raciones.length < grupos.length && (
                    <button
                      className="na-add-slot-btn"
                      onClick={() => setAddGrupoModal({ tiempoIdx: idx })}
                    >
                      <Plus size={14} /> Agregar grupo
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button className="na-add-meal-btn" onClick={agregarTiempo}>
            <div className="na-add-meal-icon">
              <Plus size={20} />
            </div>
            <span>Agregar Tiempo de Comida</span>
          </button>
        </div>

        {/* ── footer ── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 32 }}>
          <button
            onClick={() => navigate('/plantillas')}
            style={{ ...btnSecondary, padding: '10px 20px', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || !nombre.trim()}
            style={{
              background: nombre.trim() ? 'var(--accent-green)' : 'var(--border)',
              color: nombre.trim() ? '#fff' : 'var(--text-tertiary)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: guardando || !nombre.trim() ? 'not-allowed' : 'pointer',
              opacity: guardando ? 0.6 : 1,
            }}
          >
            {guardando ? 'Guardando...' : isNuevo ? '💾 Crear Plantilla' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* ── modal agregar grupo ── */}
      {addGrupoModal && (
        <AddGrupoModal
          grupos={grupos}
          gruposUsados={
            new Set(tiemposComida[addGrupoModal.tiempoIdx].raciones.map((r) => r.grupo_id))
          }
          onClose={() => setAddGrupoModal(null)}
          onSelect={(grupoId) => agregarRacion(addGrupoModal.tiempoIdx, grupoId)}
        />
      )}
    </div>
  );
}

// ─── Modal Agregar Grupo ─────────────────────────────────────────────────────

function AddGrupoModal({ grupos, gruposUsados, onClose, onSelect }) {
  const disponibles = grupos.filter((g) => !gruposUsados.has(g.id));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
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
          maxWidth: 480,
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Outfit', margin: 0 }}>
            ➕ Agregar Grupo de Alimento
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {disponibles.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 40 }}>
            Todos los grupos ya están asignados
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
            }}
          >
            {disponibles.map((g, i) => {
              const meta = getGrupoStyle(g.nombre, i);
              return (
                <button
                  key={g.id}
                  onClick={() => onSelect(g.id)}
                  style={{
                    background: meta.light,
                    border: `2px solid ${meta.color}`,
                    borderRadius: 12,
                    padding: '16px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: 32 }}>{meta.icon}</span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: meta.color, textAlign: 'center' }}
                  >
                    {g.nombre}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {g.kcal_racion} kcal/rac
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
