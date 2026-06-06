import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Search, X as XIcon } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { EmptyState } from '../components/SharedComponents';
import { catalogoApi } from '../api/catalogo';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function CatalogoAdminView() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrupoIdx, setSelectedGrupoIdx] = useState(0);
  const [query, setQuery] = useState('');
  const [showAlimentoModal, setShowAlimentoModal] = useState(false);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [editingAlimento, setEditingAlimento] = useState(null);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const { isNutricionista, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNutricionista && !isAdmin) {
      return; // Will show 403 message
    }
    cargarGrupos();
  }, [isNutricionista, isAdmin]);

  const cargarGrupos = () => {
    setLoading(true);
    catalogoApi
      .grupos()
      .then((data) => {
        setGrupos(data);
        setLoading(false);
      })
      .catch(() => {
        showToast('Error al cargar grupos', 'error');
        setLoading(false);
      });
  };

  const selectedGrupo = grupos[selectedGrupoIdx] || null;

  const filteredAlimentos = useMemo(() => {
    if (!selectedGrupo) return [];
    const alimentos = selectedGrupo.alimentos?.filter((a) => a.activo) || [];
    if (!query.trim()) return alimentos;
    const q = query.toLowerCase();
    return alimentos.filter((a) => a.nombre.toLowerCase().includes(q));
  }, [query, selectedGrupo]);

  const handleEliminarAlimento = async (alimento) => {
    if (!confirm(`¿Eliminar "${alimento.nombre}"?`)) return;
    try {
      await catalogoApi.eliminarAlimento(alimento.id);
      showToast('Alimento eliminado', 'success');
      cargarGrupos();
    } catch (err) {
      showToast('Error al eliminar alimento', 'error');
    }
  };

  const handleEliminarGrupo = async (grupo, idx) => {
    if (!confirm(`¿Eliminar grupo "${grupo.nombre}" y todos sus alimentos?`)) return;
    try {
      await catalogoApi.eliminarGrupo(grupo.id);
      showToast('Grupo eliminado', 'success');
      if (selectedGrupoIdx === idx) setSelectedGrupoIdx(0);
      cargarGrupos();
    } catch (err) {
      showToast('Error al eliminar grupo', 'error');
    }
  };

  if (!isNutricionista && !isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Acceso denegado
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          Solo los nutricionistas pueden gestionar el catálogo.
        </p>
        <button
          onClick={() => navigate('/tablas')}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Volver a Tablas
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <TopHeader title="Gestionar Catálogo" subtitle="Cargando..." />
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
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <TopHeader
        title="Gestionar Catálogo"
        subtitle="Administra grupos alimenticios y alimentos"
      />

      <div style={{ padding: '0 20px 20px', marginBottom: 12 }}>
        <button
          onClick={() => navigate('/tablas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={14} /> Volver a Tablas
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '350px 1fr',
          gap: 20,
          padding: '0 20px',
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        {/* Left Column - Grupos */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid var(--border)',
            padding: 20,
            height: 'fit-content',
            maxHeight: 'calc(100vh - 240px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Grupos Alimenticios
            </h3>
            <button
              onClick={() => {
                setEditingGrupo(null);
                setShowGrupoModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--accent-green)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={12} /> Nuevo
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {grupos.length === 0 ? (
              <EmptyState title="Sin grupos" sub="Crea el primer grupo alimenticio" />
            ) : (
              grupos.map((grupo, idx) => (
                <div
                  key={grupo.id}
                  onClick={() => {
                    setSelectedGrupoIdx(idx);
                    setQuery('');
                  }}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: selectedGrupoIdx === idx ? 'var(--accent-green)' : 'var(--border)',
                    background: selectedGrupoIdx === idx ? '#f0fdf4' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                      {grupo.nombre}
                    </h4>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGrupo(grupo);
                          setShowGrupoModal(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--text-tertiary)',
                        }}
                        title="Editar grupo"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarGrupo(grupo, idx);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                          display: 'flex',
                          alignItems: 'center',
                          color: '#dc2626',
                        }}
                        title="Eliminar grupo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {grupo.kcal_racion} kcal · {grupo.alimentos?.length || 0} alimentos
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    P:{grupo.proteina_g}g C:{grupo.carb_g}g G:{grupo.grasa_g}g
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Alimentos */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid var(--border)',
            padding: 20,
            height: 'fit-content',
            maxHeight: 'calc(100vh - 240px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {!selectedGrupo ? (
            <EmptyState title="Selecciona un grupo" sub="Elige un grupo para gestionar sus alimentos" />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedGrupo.nombre}
                </h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={14}
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      style={{
                        paddingLeft: 28,
                        paddingRight: 10,
                        paddingTop: 6,
                        paddingBottom: 6,
                        fontSize: 13,
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        width: 180,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingAlimento(null);
                      setShowAlimentoModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--accent-green)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={12} /> Nuevo Alimento
                  </button>
                </div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filteredAlimentos.length === 0 ? (
                  <EmptyState
                    title={query ? 'Sin resultados' : 'Sin alimentos'}
                    sub={query ? 'Prueba otro término' : 'Agrega el primer alimento'}
                  />
                ) : (
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Nombre
                        </th>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Unidad
                        </th>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Porción (g)
                        </th>
                        <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlimentos.map((alimento) => (
                        <tr key={alimento.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 0', color: 'var(--text-primary)' }}>
                            {alimento.nombre}
                          </td>
                          <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>
                            {alimento.unidad}
                          </td>
                          <td style={{ padding: '10px 0', color: 'var(--text-tertiary)' }}>
                            {alimento.porcion_g}
                          </td>
                          <td style={{ padding: '10px 0', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setEditingAlimento(alimento);
                                  setShowAlimentoModal(true);
                                }}
                                style={{
                                  background: '#f0fdf4',
                                  border: '1px solid var(--accent-green)',
                                  borderRadius: 4,
                                  padding: 4,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                                title="Editar"
                              >
                                <Pencil size={12} color="var(--accent-green)" />
                              </button>
                              <button
                                onClick={() => handleEliminarAlimento(alimento)}
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #dc2626',
                                  borderRadius: 4,
                                  padding: 4,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                                title="Eliminar"
                              >
                                <Trash2 size={12} color="#dc2626" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAlimentoModal && (
        <AlimentoModal
          alimento={editingAlimento}
          grupoId={selectedGrupo?.id}
          onClose={() => {
            setShowAlimentoModal(false);
            setEditingAlimento(null);
          }}
          onSuccess={() => {
            setShowAlimentoModal(false);
            setEditingAlimento(null);
            cargarGrupos();
            showToast(editingAlimento ? 'Alimento actualizado' : 'Alimento creado', 'success');
          }}
        />
      )}

      {showGrupoModal && (
        <GrupoModal
          grupo={editingGrupo}
          onClose={() => {
            setShowGrupoModal(false);
            setEditingGrupo(null);
          }}
          onSuccess={() => {
            setShowGrupoModal(false);
            setEditingGrupo(null);
            cargarGrupos();
            showToast(editingGrupo ? 'Grupo actualizado' : 'Grupo creado', 'success');
          }}
        />
      )}
    </div>
  );
}

// ── Alimento Modal ────────────────────────────────────────────────────────────
function AlimentoModal({ alimento, grupoId, onClose, onSuccess }) {
  const [nombre, setNombre] = useState(alimento?.nombre || '');
  const [porcionG, setPorcionG] = useState(alimento?.porcion_g || '');
  const [unidad, setUnidad] = useState(alimento?.unidad || '');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !porcionG || !unidad.trim()) {
      showToast('Completa todos los campos', 'error');
      return;
    }
    setSaving(true);
    try {
      const data = {
        nombre: nombre.trim(),
        porcion_g: parseFloat(porcionG),
        unidad: unidad.trim(),
        grupo: grupoId,
      };
      if (alimento) {
        await catalogoApi.actualizarAlimento(alimento.id, data);
      } else {
        await catalogoApi.crearAlimento(data);
      }
      onSuccess();
    } catch (err) {
      showToast('Error al guardar alimento', 'error');
      setSaving(false);
    }
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
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700 }}>
            {alimento ? 'Editar Alimento' : 'Nuevo Alimento'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Nombre del alimento
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Leche descremada"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 14,
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Porción (g)
              </label>
              <input
                type="number"
                step="0.01"
                value={porcionG}
                onChange={(e) => setPorcionG(e.target.value)}
                placeholder="240"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 14,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Unidad
              </label>
              <input
                type="text"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="1 taza"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 14,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                background: 'var(--accent-green)',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Grupo Modal ───────────────────────────────────────────────────────────────
function GrupoModal({ grupo, onClose, onSuccess }) {
  const [nombre, setNombre] = useState(grupo?.nombre || '');
  const [kcalRacion, setKcalRacion] = useState(grupo?.kcal_racion || '');
  const [proteinaG, setProteinaG] = useState(grupo?.proteina_g || '');
  const [carbG, setCarbG] = useState(grupo?.carb_g || '');
  const [grasaG, setGrasaG] = useState(grupo?.grasa_g || '');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      showToast('Ingresa el nombre del grupo', 'error');
      return;
    }
    setSaving(true);
    try {
      const data = {
        nombre: nombre.trim(),
        kcal_racion: parseFloat(kcalRacion) || 0,
        proteina_g: parseFloat(proteinaG) || 0,
        carb_g: parseFloat(carbG) || 0,
        grasa_g: parseFloat(grasaG) || 0,
      };
      if (grupo) {
        await catalogoApi.actualizarGrupo(grupo.id, data);
      } else {
        await catalogoApi.crearGrupo(data);
      }
      onSuccess();
    } catch (err) {
      showToast('Error al guardar grupo', 'error');
      setSaving(false);
    }
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
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700 }}>
            {grupo ? 'Editar Grupo' : 'Nuevo Grupo'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Nombre del grupo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Lácteos descremados"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 14,
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Calorías por ración
            </label>
            <input
              type="number"
              step="0.1"
              value={kcalRacion}
              onChange={(e) => setKcalRacion(e.target.value)}
              placeholder="90"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 14,
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Proteína (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={proteinaG}
                onChange={(e) => setProteinaG(e.target.value)}
                placeholder="8"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 14,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Carbohidratos (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={carbG}
                onChange={(e) => setCarbG(e.target.value)}
                placeholder="12"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 14,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Grasa (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={grasaG}
                onChange={(e) => setGrasaG(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 14,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                background: 'var(--accent-green)',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
