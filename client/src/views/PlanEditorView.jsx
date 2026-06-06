import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  X,
  Calculator,
  ClipboardList,
  Trash2,
  Zap,
  Check,
  Minus,
  Clock,
  Droplets,
  Flame,
  Activity,
} from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { ProgressRing, Badge } from '../components/SharedComponents';
import { usePaciente } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { useCatalogoStore, usePlanesStore } from '../stores';
import { planesApi, tiemposApi, racionesApi, calcularRequerimientos } from '../api/planes';
import { getGrupoStyle } from '../constants/grupoStyles';
import AlimentoTagsSection from '../components/AlimentoTagsSection';
import { alimentoTagsPlanApi } from '../api/planes';

// ─── helpers ────────────────────────────────────────────────────────────────

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

// ─── componente principal ────────────────────────────────────────────────────

export default function PlanEditorView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pacienteSeleccionado } = usePaciente();
  const { addToast } = useToast();
  const { invalidate: invalidatePlanes } = usePlanesStore();

  const queryParams = new URLSearchParams(location.search);
  const planId = queryParams.get('planId');
  const isNuevo = !planId;

  const [loading, setLoading] = useState(!!planId);
  const [guardando, setGuardando] = useState(false);

  // datos del plan
  const [tipoDieta, setTipoDieta] = useState('normocalorico');
  const [kcalObjetivo, setKcalObjetivo] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [activo, setActivo] = useState(true);
  const [observaciones, setObservaciones] = useState('');

  // macronutrientes
  const [pctProteinas, setPctProteinas] = useState('');
  const [pctGrasas, setPctGrasas] = useState('');
  const [pctCarbohidratos, setPctCarbohidratos] = useState('');
  const [hidrico, setHidrico] = useState('');
  const [fibra, setFibra] = useState('');

  // tiempos de comida: [{ id, nombre, hora, orden, raciones:[{id?, grupo_id, grupo_nombre, kcal_racion, cantidad}] }]
  const [tiemposComida, setTiemposComida] = useState([]);

  // catálogo de grupos de alimento desde Zustand
  const { grupos, fetchCatalogo } = useCatalogoStore();

  // tags de alimentos específicos del plan
  // [{ id?, alimento_id, alimento_nombre, alimento_grupo, tag, nota }]
  const [alimentoTags, setAlimentoTags] = useState([]);

  // modals
  const [showCalculadora, setShowCalculadora] = useState(false);
  const [addGrupoModal, setAddGrupoModal] = useState(null); // { tiempoIdx }

  // edición inline de nombre
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingNombre, setEditingNombre] = useState('');

  // ── carga inicial ──────────────────────────────────────────────────────────

  // cargar catálogo de grupos con alimentos desde Zustand
  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  // cargar plan existente
  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    planesApi
      .get(planId)
      .then((plan) => {
        setTipoDieta(plan.tipo_dieta || 'normocalorico');
        setKcalObjetivo(plan.kcal_objetivo || '');
        setFechaInicio(plan.fecha_inicio || new Date().toISOString().split('T')[0]);
        setActivo(plan.activo ?? true);
        setObservaciones(plan.observaciones || plan.notas || '');
        setPctProteinas(plan.pct_proteinas || '');
        setPctGrasas(plan.pct_grasas || '');
        setPctCarbohidratos(plan.pct_carbohidratos || '');
        setHidrico(plan.requerimiento_hidrico_ml || '');
        setFibra(plan.fibra_g || '');
        setAlimentoTags(
          (plan.alimento_tags || []).map((t) => ({
            id: t.id,
            alimento_id: t.alimento,
            alimento_nombre: t.alimento_nombre,
            alimento_grupo: t.alimento_grupo,
            tag: t.tag,
            nota: t.nota || '',
          }))
        );

        const tiempos = plan.tiempos_comida || [];
        const ordenados = [...tiempos].sort((a, b) => (a.orden || 0) - (b.orden || 0));
        setTiemposComida(
          ordenados.map((t) => ({
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
      .catch((err) => {
        console.error('Error cargando plan:', err);
        addToast({ message: 'Error al cargar el plan', type: 'error' });
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [planId, navigate]);

  // ── tiempos de comida ──────────────────────────────────────────────────────

  const agregarTiempo = () => {
    const idx = tiemposComida.length;
    setTiemposComida((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, nombre: `Comida ${idx + 1}`, hora: '', orden: idx, raciones: [] },
    ]);
  };

  const eliminarTiempo = (idx) => setTiemposComida((prev) => prev.filter((_, i) => i !== idx));

  const updateTiempo = (idx, field, value) =>
    setTiemposComida((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));

  const startEditNombre = (idx) => {
    setEditingIdx(idx);
    setEditingNombre(tiemposComida[idx].nombre);
  };

  const saveEditNombre = () => {
    if (editingIdx !== null && editingNombre.trim()) {
      updateTiempo(editingIdx, 'nombre', editingNombre.trim());
    }
    setEditingIdx(null);
    setEditingNombre('');
  };

  const cancelEditNombre = () => {
    setEditingIdx(null);
    setEditingNombre('');
  };

  // ── raciones ───────────────────────────────────────────────────────────────

  const agregarRacionConGrupo = (tiempoIdx, grupoId) => {
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return;
    setTiemposComida((prev) =>
      prev.map((t, i) => {
        if (i !== tiempoIdx) return t;
        return {
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
        };
      })
    );
    setAddGrupoModal(null);
  };

  const eliminarRacion = (tiempoIdx, racionIdx) =>
    setTiemposComida((prev) =>
      prev.map((t, i) => {
        if (i !== tiempoIdx) return t;
        return { ...t, raciones: t.raciones.filter((_, ri) => ri !== racionIdx) };
      })
    );

  const updateTag = (tiempoIdx, racionIdx, tag) =>
    setTiemposComida((prev) =>
      prev.map((t, i) => {
        if (i !== tiempoIdx) return t;
        return {
          ...t,
          raciones: t.raciones.map((r, ri) => (ri === racionIdx ? { ...r, tag } : r)),
        };
      })
    );

  const updateCantidad = (tiempoIdx, racionIdx, delta) =>
    setTiemposComida((prev) =>
      prev.map((t, i) => {
        if (i !== tiempoIdx) return t;
        const nuevasRaciones = t.raciones.map((r, ri) => {
          if (ri !== racionIdx) return r;
          return { ...r, cantidad: Math.max(0.5, parseFloat(r.cantidad || 1) + delta) };
        });
        return { ...t, raciones: nuevasRaciones };
      })
    );

  // ── cálculo de kcal ────────────────────────────────────────────────────────

  const kcalTiempo = (tiempo) =>
    tiempo.raciones.reduce((sum, r) => sum + r.kcal_racion * parseFloat(r.cantidad || 0), 0);

  const kcalTotal = tiemposComida.reduce((sum, t) => sum + kcalTiempo(t), 0);

  // suma de macros para validar
  const sumasMacros =
    (parseFloat(pctProteinas) || 0) +
    (parseFloat(pctGrasas) || 0) +
    (parseFloat(pctCarbohidratos) || 0);
  const macrosOk = sumasMacros === 0 || Math.abs(sumasMacros - 100) < 1;

  // ── guardar ────────────────────────────────────────────────────────────────

  const handleGuardar = async () => {
    if (!pacienteSeleccionado) {
      addToast({ message: 'No hay paciente seleccionado', type: 'warning' });
      return;
    }

    setGuardando(true);
    try {
      const planData = {
        paciente: pacienteSeleccionado.id,
        tipo_dieta: tipoDieta,
        kcal_objetivo: kcalObjetivo ? parseFloat(kcalObjetivo) : null,
        fecha_inicio: fechaInicio,
        activo,
        notas: observaciones,
        pct_proteinas: pctProteinas ? parseFloat(pctProteinas) : null,
        pct_grasas: pctGrasas ? parseFloat(pctGrasas) : null,
        pct_carbohidratos: pctCarbohidratos ? parseFloat(pctCarbohidratos) : null,
        requerimiento_hidrico_ml: hidrico ? parseInt(hidrico) : null,
        fibra_g: fibra ? parseFloat(fibra) : null,
      };

      let planIdFinal = planId;
      if (planId) {
        await planesApi.update(planId, planData);
      } else {
        const nuevo = await planesApi.create(planData);
        planIdFinal = nuevo.id;
      }

      for (let i = 0; i < tiemposComida.length; i++) {
        const tiempo = tiemposComida[i];
        const tiempoData = {
          plan: planIdFinal,
          nombre: tiempo.nombre,
          hora: tiempo.hora || null,
          orden: i,
        };

        let tiempoIdFinal;
        if (String(tiempo.id).startsWith('temp-')) {
          const t = await tiemposApi.create(tiempoData);
          tiempoIdFinal = t.id;
        } else {
          await tiemposApi.update(tiempo.id, tiempoData);
          tiempoIdFinal = tiempo.id;
        }

        let racionesEnBD = [];
        if (!String(tiempo.id).startsWith('temp-')) {
          const resp = await racionesApi.list(tiempoIdFinal);
          racionesEnBD = Array.isArray(resp) ? resp : resp.results || [];
        }

        for (const rBD of racionesEnBD) {
          const sigue = tiempo.raciones.some((r) => r.id === rBD.id);
          if (!sigue) await racionesApi.delete(rBD.id);
        }

        for (const racion of tiempo.raciones) {
          const racionData = {
            tiempo_comida: tiempoIdFinal,
            grupo: racion.grupo_id,
            cantidad: parseFloat(racion.cantidad || 1),
            tag: racion.tag || '',
          };
          if (racion.id) {
            await racionesApi.update(racion.id, racionData);
          } else {
            await racionesApi.create(racionData);
          }
        }
      }

      // guardar alimento_tags: obtener existentes en BD, borrar los que no están, crear/actualizar
      const tagsBD = planId
        ? (await alimentoTagsPlanApi.list('plan', planIdFinal)).results ||
          (await alimentoTagsPlanApi.list('plan', planIdFinal))
        : [];
      const tagsBDArr = Array.isArray(tagsBD) ? tagsBD : [];
      for (const tBD of tagsBDArr) {
        if (!alimentoTags.some((t) => t.id === tBD.id)) {
          await alimentoTagsPlanApi.delete(tBD.id);
        }
      }
      for (const t of alimentoTags) {
        const payload = { plan: planIdFinal, alimento: t.alimento_id, tag: t.tag, nota: t.nota || '' };
        if (t.id) {
          await alimentoTagsPlanApi.update(t.id, payload);
        } else {
          await alimentoTagsPlanApi.create(payload);
        }
      }

      addToast({ message: 'Plan guardado exitosamente', type: 'success' });
      // Invalidar cache de planes para este paciente
      if (pacienteSeleccionado?.id) {
        invalidatePlanes(pacienteSeleccionado.id);
      }
      navigate(-1);
    } catch (err) {
      console.error('Error guardando plan:', err);
      addToast({ message: 'Error al guardar el plan: ' + (err.message || ''), type: 'error' });
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
        title={planId ? 'Editar Plan' : 'Nuevo Plan'}
        subtitle={
          pacienteSeleccionado
            ? `Paciente: ${pacienteSeleccionado.user?.first_name || ''} ${pacienteSeleccionado.user?.last_name || ''}`.trim() ||
              pacienteSeleccionado.user?.username
            : 'Plan nutricional'
        }
      />

      <div className="na-planner-content">
        {/* ── botón volver ── */}
        <button
          onClick={() => navigate(-1)}
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
          <ArrowLeft size={15} /> Volver
        </button>



        {/* ── card datos del plan ── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
              }}
            >
              <ClipboardList size={16} /> Datos del Plan
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btnSecondary} onClick={() => setShowCalculadora(true)}>
                <Calculator size={13} /> Calcular
              </button>
            </div>
          </div>

          {/* fila 1: datos básicos */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
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
                <Flame size={11} style={{ display: 'inline', marginRight: 4 }} />
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
            <div>
              <label style={labelStyle}>Fecha de inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label
                style={{
                  ...labelStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 20,
                }}
              >
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Plan activo
              </label>
            </div>
          </div>

          {/* fila 2: macronutrientes */}
          <div style={{ marginBottom: 12 }}>
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
              {sumasMacros > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: macrosOk ? 'var(--accent-green)' : 'var(--accent-coral)',
                    fontWeight: 700,
                  }}
                >
                  {macrosOk ? `✓ ${sumasMacros}%` : `⚠ ${sumasMacros}% (debe sumar 100%)`}
                </span>
              )}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div>
                <label style={labelStyle}>% Proteínas</label>
                <input
                  type="number"
                  value={pctProteinas}
                  onChange={(e) => setPctProteinas(e.target.value)}
                  placeholder="20"
                  min="0"
                  max="100"
                  style={{ ...inputStyle, borderColor: pctProteinas ? '#e17c5a' : undefined }}
                />
              </div>
              <div>
                <label style={labelStyle}>% Grasas</label>
                <input
                  type="number"
                  value={pctGrasas}
                  onChange={(e) => setPctGrasas(e.target.value)}
                  placeholder="30"
                  min="0"
                  max="100"
                  style={{ ...inputStyle, borderColor: pctGrasas ? '#f0c040' : undefined }}
                />
              </div>
              <div>
                <label style={labelStyle}>% Carbohidratos</label>
                <input
                  type="number"
                  value={pctCarbohidratos}
                  onChange={(e) => setPctCarbohidratos(e.target.value)}
                  placeholder="50"
                  min="0"
                  max="100"
                  style={{ ...inputStyle, borderColor: pctCarbohidratos ? '#7db87a' : undefined }}
                />
              </div>
            </div>

            {/* barra visual de macros */}
            {sumasMacros > 0 && macrosOk && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    overflow: 'hidden',
                    display: 'flex',
                    background: 'var(--border-light)',
                  }}
                >
                  {pctProteinas && (
                    <div
                      style={{
                        width: `${pctProteinas}%`,
                        background: '#e17c5a',
                        transition: 'width 0.3s',
                      }}
                      title={`Proteínas: ${pctProteinas}%`}
                    />
                  )}
                  {pctGrasas && (
                    <div
                      style={{
                        width: `${pctGrasas}%`,
                        background: '#f0c040',
                        transition: 'width 0.3s',
                      }}
                      title={`Grasas: ${pctGrasas}%`}
                    />
                  )}
                  {pctCarbohidratos && (
                    <div
                      style={{
                        width: `${pctCarbohidratos}%`,
                        background: '#7db87a',
                        transition: 'width 0.3s',
                      }}
                      title={`Carbohidratos: ${pctCarbohidratos}%`}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 10, color: 'var(--text-tertiary)' }}>
                  <span style={{ color: '#e17c5a' }}>■ Proteínas {pctProteinas}%</span>
                  <span style={{ color: '#f0c040' }}>■ Grasas {pctGrasas}%</span>
                  <span style={{ color: '#7db87a' }}>■ Carbohidratos {pctCarbohidratos}%</span>
                </div>
              </div>
            )}
          </div>

          {/* fila 3: hidratación y fibra */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>
                <Droplets size={11} style={{ display: 'inline', marginRight: 4 }} />
                Requerimiento hídrico (ml/día)
              </label>
              <input
                type="number"
                value={hidrico}
                onChange={(e) => setHidrico(e.target.value)}
                placeholder="2000"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Fibra dietética (g/día)</label>
              <input
                type="number"
                value={fibra}
                onChange={(e) => setFibra(e.target.value)}
                placeholder="25"
                step="0.5"
                style={inputStyle}
              />
            </div>
          </div>

          {/* observaciones */}
          <div style={{ marginTop: 4 }}>
            <label style={labelStyle}>Observaciones / Notas</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Notas adicionales, indicaciones especiales..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* resumen kcal calculadas */}
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
                  / {kcalObjetivo} objetivo (
                  {Math.round((kcalTotal / parseFloat(kcalObjetivo)) * 100)}%)
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

        {/* ── timeline de tiempos de comida ── */}
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
            const totalTarget = tiempo.raciones.length;
            const pct = totalTarget > 0 ? 100 : 0;
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

                <div className="na-meal-slots">
                  {tiempo.raciones.map((racion, ri) => {
                    const meta = getGrupoStyle(racion.grupo_nombre, ri);
                    const kcalRacion = (racion.kcal_racion || 0) * parseFloat(racion.cantidad || 0);
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

                        {/* cantidad y kcal */}
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
                  {grupos.length === 0 && (
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '8px 12px' }}>
                      ⚠️ No hay grupos de alimento en el catálogo.
                    </p>
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
            onClick={() => navigate(-1)}
            style={{ ...btnSecondary, padding: '10px 20px', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              background: 'var(--accent-green)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: guardando ? 'not-allowed' : 'pointer',
              opacity: guardando ? 0.6 : 1,
            }}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Plan'}
          </button>
        </div>
      </div>

      {/* ── modals ── */}
      {showCalculadora && (
        <CalculadoraModal
          onClose={() => setShowCalculadora(false)}
          onUsar={(kcal) => {
            setKcalObjetivo(String(kcal));
            setShowCalculadora(false);
          }}
        />
      )}

      {addGrupoModal && (
        <AddGrupoModal
          grupos={grupos}
          gruposUsados={
            new Set(tiemposComida[addGrupoModal.tiempoIdx].raciones.map((r) => r.grupo_id))
          }
          onClose={() => setAddGrupoModal(null)}
          onSelect={(grupoId) => agregarRacionConGrupo(addGrupoModal.tiempoIdx, grupoId)}
        />
      )}
    </div>
  );
}

// ─── Modal Calculadora ───────────────────────────────────────────────────────

function CalculadoraModal({ onClose, onUsar }) {
  const { addToast } = useToast();
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [edad, setEdad] = useState('');
  const [sexo, setSexo] = useState('M');
  const [nivel, setNivel] = useState('sedentario');
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);

  const handleCalcular = async () => {
    if (!peso || !talla || !edad) {
      addToast({ message: 'Completa todos los campos', type: 'warning' });
      return;
    }
    setCalculando(true);
    try {
      const data = await calcularRequerimientos({
        peso_kg: parseFloat(peso),
        talla_cm: parseFloat(talla),
        edad: parseInt(edad),
        sexo,
        nivel_actividad: nivel,
      });
      setResultado(data);
    } catch {
      addToast({ message: 'Error al calcular requerimientos', type: 'error' });
    } finally {
      setCalculando(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth={460}>
      <ModalHeader
        icon={<Calculator size={20} />}
        title="Calculadora de Requerimientos"
        onClose={onClose}
      />

      {!resultado ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Peso (kg) *">
              <input
                type="number"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                step="0.1"
                placeholder="70"
                style={inputStyle}
              />
            </Field>
            <Field label="Talla (cm) *">
              <input
                type="number"
                value={talla}
                onChange={(e) => setTalla(e.target.value)}
                step="0.1"
                placeholder="170"
                style={inputStyle}
              />
            </Field>
            <Field label="Edad (años) *">
              <input
                type="number"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                placeholder="30"
                style={inputStyle}
              />
            </Field>
            <Field label="Sexo *">
              <select value={sexo} onChange={(e) => setSexo(e.target.value)} style={inputStyle}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </Field>
          </div>
          <Field label="Nivel de actividad *">
            <select value={nivel} onChange={(e) => setNivel(e.target.value)} style={inputStyle}>
              <option value="sedentario">Sedentario</option>
              <option value="ligero">Ligero</option>
              <option value="moderado">Moderado</option>
              <option value="activo">Activo</option>
              <option value="muy_activo">Muy activo</option>
            </select>
          </Field>
          <button
            onClick={handleCalcular}
            disabled={calculando}
            style={{
              background: 'var(--accent-green)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px',
              fontSize: 14,
              fontWeight: 600,
              cursor: calculando ? 'not-allowed' : 'pointer',
              marginTop: 8,
              opacity: calculando ? 0.6 : 1,
            }}
          >
            {calculando ? 'Calculando...' : 'Calcular'}
          </button>
        </div>
      ) : (
        <div>
          <div
            style={{
              background: 'var(--bg-surface-2)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 10,
                color: 'var(--text-secondary)',
              }}
            >
              Resultados (Mifflin-St Jeor)
            </h3>
            {[
              { label: 'TMB (Tasa Metabólica Basal)', value: `${resultado.tmb?.toFixed(0)} kcal` },
              { label: 'VCT (Valor Calórico Total)', value: `${resultado.vct?.toFixed(0)} kcal` },
              { label: 'Kcal objetivo', value: `${resultado.kcal_objetivo?.toFixed(0)} kcal`, hl: true },
              { label: 'Proteínas', value: `${resultado.proteinas_g?.toFixed(1)} g` },
              { label: 'Carbohidratos', value: `${resultado.carbohidratos_g?.toFixed(1)} g` },
              { label: 'Grasas', value: `${resultado.grasas_g?.toFixed(1)} g` },
            ].map(({ label, value, hl }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span
                  style={{
                    fontSize: hl ? 15 : 13,
                    fontWeight: hl ? 700 : 600,
                    color: hl ? 'var(--accent-green)' : 'var(--text-primary)',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setResultado(null)}
              style={{ flex: 1, ...btnSecondary, justifyContent: 'center', padding: '10px' }}
            >
              Calcular de nuevo
            </button>
            <button
              onClick={() => onUsar(resultado.kcal_objetivo)}
              style={{
                flex: 1,
                background: 'var(--accent-green)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Usar como objetivo
            </button>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}

// ─── Modal Agregar Grupo ─────────────────────────────────────────────────────

function AddGrupoModal({ grupos, gruposUsados, onClose, onSelect }) {
  const disponibles = grupos.filter((g) => !gruposUsados.has(g.id));

  return (
    <ModalWrapper onClose={onClose} maxWidth={480}>
      <ModalHeader icon="➕" title="Agregar Grupo de Alimento" onClose={onClose} />
      {disponibles.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 40 }}>
          Todos los grupos ya están asignados a este tiempo de comida
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
    </ModalWrapper>
  );
}

// ─── Helpers UI ──────────────────────────────────────────────────────────────

function ModalWrapper({ children, onClose, maxWidth = 480 }) {
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
      onClick={(e) => onClose && e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth,
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon, title, onClose }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          fontSize: 17,
          fontWeight: 700,
          fontFamily: 'Outfit',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {icon} {title}
      </h2>
      {onClose && (
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
          <X size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
