import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  TrendingDown,
  ClipboardList,
  Droplets,
  Plus,
  FileText,
  Download,
  FileSpreadsheet,
  ChevronDown,
  Mail,
  Calendar,
  Edit2,
  Check,
  X as XIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useForm } from 'react-hook-form'; // Keep useForm for NuevoRegistroModal
import { yupResolver } from '@hookform/resolvers/yup'; // Keep yupResolver for NuevoRegistroModal
import * as yup from 'yup'; // Keep yup for NuevoRegistroModal
import TopHeader from '../components/TopHeader';
import { Badge, EmptyState } from '../components/SharedComponents';
import { usePaciente } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { pacientesApi } from '../api/pacientes';
import { progresoApi } from '../api/progreso';
import { planesApi } from '../api/planes';
import { examenesApi } from '../api/examenes';
import { documentosApi } from '../api/documentos';
import ImportarExcel from '../components/ImportarExcel';
import HistoriaCompletaTab from '../components/HistoriaCompletaTab';

const TABS = [
  { id: 'historia', label: 'Historia', icon: BookOpen }, // Updated tab label
  { id: 'progreso', label: 'Progreso', icon: TrendingDown },
  { id: 'planes', label: 'Planes', icon: ClipboardList },
  { id: 'examenes', label: 'Exámenes', icon: Droplets },
  { id: 'documentos', label: 'Documentos', icon: FileText },
];

export default function PacienteDetalleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pacienteSeleccionado, setPacienteSeleccionado } = usePaciente();
  const [tab, setTab] = useState('historia'); // Default to new 'historia' tab
  const [loadingPaciente, setLoadingPaciente] = useState(false);
  const [showImport, setShowImport] = useState(false); // State for ImportarExcel modal
  const { showToast } = useToast();
  const { isSecretario, isNutricionista } = useAuth();
  const [exportando, setExportando] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [editandoCita, setEditandoCita] = useState(false);
  const [proximaCitaTemp, setProximaCitaTemp] = useState('');
  const [guardandoCita, setGuardandoCita] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const descargarArchivo = async (url, filename) => {
    const resp = await fetch(url, { credentials: 'include' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  };

  const handleExportar = async (tipo) => {
    setDropdownOpen(false);
    setExportando(tipo);
    try {
      const pid = id;
      const nombre = `historia_paciente_${pid}`;
      if (tipo === 'excel') {
        await descargarArchivo(`/api/pacientes/${pid}/exportar-excel/`, `${nombre}.xls`);
        showToast('✓ Excel descargado', 'success');
      } else {
        await descargarArchivo(`/api/pacientes/${pid}/exportar-pdf/`, `${nombre}.pdf`);
        showToast('✓ PDF descargado', 'success');
      }
    } catch (e) {
      showToast(`Error al exportar: ${e.message}`, 'error');
    } finally {
      setExportando(null);
    }
  };

  const cargarPacienteData = useCallback(() => {
    setLoadingPaciente(true);
    pacientesApi
      .get(id)
      .then((data) => setPacienteSeleccionado(data))
      .catch((err) => {
        console.error('Error cargando paciente:', err);
        showToast('Error cargando los datos del paciente.', 'error');
        navigate('/pacientes', { replace: true });
      })
      .finally(() => setLoadingPaciente(false));
  }, [id, navigate, setPacienteSeleccionado, showToast]);

  const handleGuardarProximaCita = async () => {
    setGuardandoCita(true);
    try {
      const data = await pacientesApi.update(id, { proxima_cita: proximaCitaTemp || null });
      setPacienteSeleccionado(data);
      showToast('Próxima consulta actualizada', 'success');
      setEditandoCita(false);
    } catch (err) {
      console.error('Error actualizando próxima cita:', err);
      showToast('Error al guardar la fecha', 'error');
    } finally {
      setGuardandoCita(false);
    }
  };

  const handleToggleActivo = async () => {
    setToggling(true);
    try {
      const data = await pacientesApi.toggleActivo(id);
      setPacienteSeleccionado(data);
      showToast(
        data.is_active ? 'Paciente activado' : 'Paciente desactivado',
        'success'
      );
    } catch (err) {
      console.error('Error cambiando estado:', err);
      showToast('Error al cambiar el estado del paciente', 'error');
    } finally {
      setToggling(false);
    }
  };

  // If navigated directly via URL (no context), fetch patient
  useEffect(() => {
    if (!pacienteSeleccionado || String(pacienteSeleccionado.id) !== String(id)) {
      cargarPacienteData();
    }
  }, [id, pacienteSeleccionado, cargarPacienteData]);

  const handleExcelImportSuccess = (pacienteId) => {
    setShowImport(false);
    showToast('Historia importada exitosamente.', 'success');
    cargarPacienteData(); // Refresh patient data including the new expediente
    if (String(pacienteId) !== String(id)) {
      navigate(`/pacientes/${pacienteId}`, { replace: true });
    }
  };

  if (loadingPaciente || !pacienteSeleccionado || String(pacienteSeleccionado.id) !== String(id)) {
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
  }

  const p = pacienteSeleccionado;
  const nombreCompleto =
    `${p.user?.first_name ?? ''} ${p.user?.last_name ?? ''}`.trim() || p.user?.username || '—';
  const iniciales = () => {
    const fn = p.user?.first_name?.[0] || '';
    const ln = p.user?.last_name?.[0] || '';
    return (fn + ln).toUpperCase() || p.user?.username?.[0]?.toUpperCase() || '?';
  };

  // Filtrar tabs según rol
  const visibleTabs = TABS.filter((t) => {
    if (isSecretario && (t.id === 'planes' || t.id === 'documentos')) return false;
    return true;
  });

  return (
    <div className="na-profile-view">
      <TopHeader title="Detalle del Paciente" subtitle="Expediente y seguimiento completo" />

      {/* Badge indicador para Secretario */}
      {isSecretario && (
        <div
          style={{
            background: 'color-mix(in oklch, #5B8DEF 10%, var(--bg-surface) 90%)',
            border: '1px solid color-mix(in oklch, #5B8DEF 25%, var(--border) 75%)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 12,
            fontWeight: 600,
            color: '#5B8DEF',
            textAlign: 'center',
          }}
        >
          👁 Vista de Secretario — Solo lectura
        </div>
      )}

      <div className="na-profile-content">
        {/* Back + Download buttons - above hero card */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => navigate('/pacientes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
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

          {/* Botón Descargar con dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              disabled={exportando !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: exportando ? '#e5e7eb' : '#16a34a',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                cursor: exportando ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!exportando) e.currentTarget.style.background = '#15803d';
              }}
              onMouseLeave={(e) => {
                if (!exportando) e.currentTarget.style.background = '#16a34a';
              }}
            >
              {exportando ? (
                <>
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin .6s linear infinite',
                    }}
                  />{' '}
                  {exportando === 'excel' ? 'Excel...' : 'PDF...'}
                </>
              ) : (
                <>
                  <Download size={14} /> Descargar <ChevronDown size={13} />
                </>
              )}
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 999,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: 180,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => handleExportar('excel')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#15803d',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <FileSpreadsheet size={16} /> Exportar Excel (.xlsx)
                </button>
                <div style={{ height: 1, background: '#f3f4f6' }} />
                <button
                  onClick={() => handleExportar('pdf')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#dc2626',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <FileText size={16} /> Exportar PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hero card */}
        <div className="na-profile-hero">
          <div className="na-profile-avatar">
            <span>{iniciales()}</span>
          </div>
          <div className="na-profile-hero-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 className="na-profile-name" style={{ margin: 0 }}>{nombreCompleto}</h2>
              {/* TODO: Backend should expose is_active. Using fallback for now */}
              <Badge color={p.is_active !== false ? '#16a34a' : '#dc2626'}>
                {p.is_active !== false ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="na-profile-objective">{p.cedula || 'Sin cédula registrada'}</p>
            <div className="na-profile-tags" style={{ marginTop: 10 }}>
              <Badge color="var(--accent-green)">Paciente</Badge>
              {p.sexo && (
                <Badge color="#5B8DEF">
                  {p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : 'Otro'}
                </Badge>
              )}
              {p.telefono && <Badge color="#7E57C2">{p.telefono}</Badge>}
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 8,
              flexShrink: 0,
            }}
          >
            {/* Toggle Activo/Inactivo - solo para Nutricionista y Secretario */}
            {(isNutricionista || isSecretario) && (
              <button
                onClick={handleToggleActivo}
                disabled={toggling}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: p.is_active !== false ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${p.is_active !== false ? '#fca5a5' : '#86efac'}`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: p.is_active !== false ? '#dc2626' : '#16a34a',
                  cursor: toggling ? 'not-allowed' : 'pointer',
                  opacity: toggling ? 0.6 : 1,
                }}
              >
                {toggling ? 'Guardando...' : p.is_active !== false ? 'Desactivar' : 'Activar'}
              </button>
            )}

            {/* Próxima consulta */}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Calendar size={11} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Próxima Consulta
                </span>
                {(isNutricionista || isSecretario) && !editandoCita && (
                  <button
                    onClick={() => {
                      setProximaCitaTemp(p.proxima_cita || '');
                      setEditandoCita(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: 'var(--accent-green)',
                    }}
                  >
                    <Edit2 size={11} />
                  </button>
                )}
              </div>
              {editandoCita ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="date"
                    value={proximaCitaTemp}
                    onChange={(e) => setProximaCitaTemp(e.target.value)}
                    disabled={guardandoCita}
                    style={{
                      fontSize: 12,
                      padding: '4px 6px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      width: 130,
                    }}
                  />
                  <button
                    onClick={handleGuardarProximaCita}
                    disabled={guardandoCita}
                    style={{
                      background: 'var(--accent-green)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 6px',
                      cursor: guardandoCita ? 'not-allowed' : 'pointer',
                      color: '#fff',
                    }}
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setEditandoCita(false)}
                    disabled={guardandoCita}
                    style={{
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      color: '#6b7280',
                    }}
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {p.proxima_cita || '—'}
                </span>
              )}
            </div>

            {p.fecha_nacimiento && (
              <>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  Fecha de nacimiento
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.fecha_nacimiento}</span>
              </>
            )}
            {p.ocupacion && (
              <>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    marginTop: 8,
                  }}
                >
                  Ocupación
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.ocupacion}</span>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="na-profile-tabs">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              className={`na-profile-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'historia' && (
          <HistoriaCompletaTab
            paciente={p}
            onExpedienteUpdated={cargarPacienteData}
            readOnly={isSecretario}
          />
        )}
        {tab === 'progreso' && <ProgresoTab paciente={p} />}
        {tab === 'planes' && <PlanesTab paciente={p} />}
        {tab === 'examenes' && <ExamenesTab paciente={p} />}
        {tab === 'documentos' && <DocumentosTab paciente={p} />}
      </div>

      {showImport && (
        <ImportarExcel onClose={() => setShowImport(false)} onSuccess={handleExcelImportSuccess} />
      )}
    </div>
  );
}

// ── Tab Progreso ──────────────────────────────────────────────────────────────
// ... (ProgresoTab, ProgresoCustomTooltip, MetricCard, NuevoRegistroModal, RegistroFieldError as existing)

// Custom tooltip for weight chart (declared outside to avoid recreation)
function ProgresoCustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            marginBottom: 2,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {payload[0].value} kg
        </p>
      </div>
    );
  }
  return null;
}

function ProgresoTab({ paciente }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const cargar = () => {
    setLoading(true);
    progresoApi
      .registros(paciente.id)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.results || [];
        setRegistros(lista);
      })
      .catch(() => setRegistros([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, [paciente.id]);

  if (loading) {
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
  }

  if (registros.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState
          icon={TrendingDown}
          title="Sin registros de progreso"
          message="Agrega el primer registro para comenzar el seguimiento"
        />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent-green)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Agregar registro
          </button>
        </div>
        {showModal && (
          <NuevoRegistroModal
            paciente={paciente}
            onClose={() => setShowModal(false)}
            onCreado={() => {
              setShowModal(false);
              cargar();
            }}
          />
        )}
      </div>
    );
  }

  const registrosOrdenados = [...registros].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const data = registrosOrdenados.map((r, i) => ({
    label: `R${i + 1}`,
    date: r.fecha,
    weight: parseFloat(r.peso_kg),
    imc: r.imc,
    talla: r.talla_cm,
    clasificacion: r.imc_clasificacion,
  }));

  const current = data[data.length - 1]?.weight || 0;
  const initial = data[0]?.weight || current;
  const lost = (initial - current).toFixed(1);
  const pesoIdeal = parseFloat(paciente.peso_ideal_kg || 0);
  const remaining = Math.max(0, current - pesoIdeal).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--accent-green)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Agregar registro
        </button>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
        }}
      >
        <MetricCard label="Peso inicial" value={`${initial} kg`} color="var(--text-tertiary)" />
        <MetricCard label="Peso actual" value={`${current} kg`} color="#5B8DEF" />
        <MetricCard label="Peso perdido" value={`-${lost} kg`} color="var(--accent-green)" />
        {pesoIdeal > 0 && (
          <MetricCard label="Para meta" value={`${remaining} kg`} color="#EF6C00" />
        )}
      </div>

      {/* Chart */}
      <div className="na-weight-chart-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700 }}>
              Evolución del Peso
            </h3>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-tertiary)',
                marginTop: 2,
              }}
            >
              {data.length} registros ·{' '}
              {pesoIdeal > 0 ? `Meta: ${pesoIdeal} kg` : 'Sin meta definida'}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 2,
                  background: 'var(--accent-green)',
                  display: 'inline-block',
                  borderRadius: 2,
                }}
              />
              Peso
            </span>
            {pesoIdeal > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 2,
                    background: '#5B8DEF',
                    display: 'inline-block',
                    borderRadius: 2,
                  }}
                />
                Meta
              </span>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={pesoIdeal > 0 ? [pesoIdeal - 2, initial + 1] : ['auto', 'auto']}
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<ProgresoCustomTooltip />} />
            {pesoIdeal > 0 && (
              <ReferenceLine
                y={pesoIdeal}
                stroke="#5B8DEF"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `Meta ${pesoIdeal}kg`,
                  position: 'insideTopRight',
                  fontSize: 11,
                  fill: '#5B8DEF',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--accent-green)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--accent-green)', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: 'var(--accent-green)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weight table */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <h3 style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 700 }}>
            Últimos 10 Registros
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="na-weight-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'right' }}>Peso (kg)</th>
                <th style={{ textAlign: 'right' }}>Talla (cm)</th>
                <th style={{ textAlign: 'right' }}>IMC</th>
                <th>Clasificación</th>
                <th style={{ textAlign: 'right' }}>Cambio</th>
              </tr>
            </thead>
            <tbody>
              {[...data]
                .reverse()
                .slice(0, 10)
                .map((row, i) => {
                  const realIndex = data.length - 1 - i;
                  const diff =
                    realIndex === 0 ? null : (row.weight - data[realIndex - 1].weight).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.label}</td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{row.date}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.weight}</td>
                      <td style={{ textAlign: 'right' }}>{row.talla || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{row.imc || '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {row.clasificacion || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {diff === null ? (
                          <span
                            style={{
                              color: 'var(--text-tertiary)',
                              fontSize: 12,
                            }}
                          >
                            —
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color:
                                parseFloat(diff) < 0
                                  ? 'var(--accent-green)'
                                  : parseFloat(diff) > 0
                                    ? '#E05555'
                                    : 'var(--text-tertiary)',
                            }}
                          >
                            {parseFloat(diff) > 0 ? '+' : ''}
                            {diff} kg
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <NuevoRegistroModal
          paciente={paciente}
          onClose={() => setShowModal(false)}
          onCreado={() => {
            setShowModal(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}

// ── Tab Planes ────────────────────────────────────────────────────────────────

function PlanesTab({ paciente }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duplicando, setDuplicando] = useState(null);
  const [exportandoPlan, setExportandoPlan] = useState(null); // plan_id
  const [descargandoPdf, setDescargandoPdf] = useState(null); // plan_id
  const [importandoPlan, setImportandoPlan] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(null); // plan_id
  const importInputRef = useRef(null);

  const handleExportarPlan = async (planId, nombrePaciente) => {
    setExportandoPlan(planId);
    try {
      const resp = await fetch(`/api/planes/${planId}/exportar-excel/`, {
        credentials: 'include',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `plan_${(nombrePaciente || 'paciente').replace(/\s+/g, '_')}.xls`;
      a.click();
      URL.revokeObjectURL(href);
      addToast({ message: '✓ Plan exportado a Excel', type: 'success' });
    } catch (e) {
      addToast({ message: `Error exportando: ${e.message}`, type: 'error' });
    } finally {
      setExportandoPlan(null);
    }
  };

  const handleImportarPlan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportandoPlan(true);
    try {
      const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
      const form = new FormData();
      form.append('file', file);
      const resp = await fetch(`/api/pacientes/${paciente.id}/importar-plan-excel/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: form,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
      addToast({ message: '✓ Plan importado correctamente', type: 'success' });
      if (data.advertencias?.length) {
        data.advertencias.forEach((w) => addToast({ message: `! ${w}`, type: 'warning' }));
      }
      cargarPlanes();
    } catch (e) {
      addToast({ message: `Error importando: ${e.message}`, type: 'error' });
    } finally {
      setImportandoPlan(false);
    }
  };

  const cargarPlanes = () => {
    setLoading(true);
    planesApi
      .list(paciente.id)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.results || [];
        setPlanes(lista);
      })
      .catch(() => setPlanes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarPlanes();
  }, [paciente.id]);

  const handleDuplicar = async (planId) => {
    setDuplicando(planId);
    try {
      await planesApi.duplicar(planId);
      addToast({ message: 'Plan duplicado exitosamente', type: 'success' });
      cargarPlanes();
    } catch (err) {
      console.error('Error duplicando plan:', err);
      addToast({ message: 'Error al duplicar el plan', type: 'error' });
    } finally {
      setDuplicando(null);
    }
  };

  const handleNuevoPlan = () => {
    navigate(`/pacientes/${paciente.id}/plan-editor`);
  };

  const handleEditarPlan = (planId) => {
    navigate(`/pacientes/${paciente.id}/plan-editor?planId=${planId}`);
  };

  const handleDescargarPdf = async (planId) => {
    setDescargandoPdf(planId);
    try {
      await planesApi.descargarPdfPlan(planId);
      addToast({ message: '✓ PDF descargado', type: 'success' });
    } catch (e) {
      addToast({
        message: `Error descargando PDF: ${e.message}`,
        type: 'error',
      });
    } finally {
      setDescargandoPdf(null);
    }
  };

  const handleEnviarEmail = async (planId) => {
    if (!paciente.user?.email) {
      addToast({
        message: 'El paciente no tiene email registrado',
        type: 'error',
      });
      return;
    }
    setEnviandoEmail(planId);
    try {
      await planesApi.enviarPlanPorEmail(planId);
      addToast({
        message: '✓ Plan enviado al correo del paciente',
        type: 'success',
      });
    } catch (err) {
      console.error('Error enviando email:', err);
      addToast({ message: 'Error al enviar el email', type: 'error' });
    } finally {
      setEnviandoEmail(null);
    }
  };

  if (loading) {
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
  }

  if (planes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState
          icon={ClipboardList}
          title="Sin planes nutricionales"
          message="Este paciente aún no tiene planes asignados"
        />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleNuevoPlan}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent-green)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Nuevo Plan
          </button>
        </div>
      </div>
    );
  }

  const planesOrdenados = [...planes].sort(
    (a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* input oculto para importar */}
      <input
        ref={importInputRef}
        type="file"
        accept=".xls,.xlsx"
        style={{ display: 'none' }}
        onChange={handleImportarPlan}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {/* Importar plan desde Excel */}
        <button
          onClick={() => importInputRef.current?.click()}
          disabled={importandoPlan}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#fff',
            color: '#15803d',
            border: '1px solid #86efac',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: importandoPlan ? 'not-allowed' : 'pointer',
            opacity: importandoPlan ? 0.6 : 1,
          }}
        >
          {importandoPlan ? (
            <>
              <span
                style={{
                  width: 13,
                  height: 13,
                  border: '2px solid #15803d',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin .6s linear infinite',
                }}
              />{' '}
              Importando...
            </>
          ) : (
            <>
              <FileSpreadsheet size={14} /> Importar Excel
            </>
          )}
        </button>
        <button
          onClick={handleNuevoPlan}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--accent-green)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Nuevo Plan
        </button>
      </div>

      {planesOrdenados.map((plan) => (
        <div
          key={plan.id}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <h3
                  style={{
                    fontFamily: 'Outfit',
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {plan.nombre || 'Plan Nutricional'}
                </h3>
                {plan.activo && <Badge color="var(--accent-green)">Activo</Badge>}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                Inicio: {plan.fecha_inicio || '—'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  marginBottom: 2,
                }}
              >
                Objetivo calórico
              </p>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--accent-green)',
                }}
              >
                {plan.kcal_objetivo || '—'} kcal
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 10,
              marginBottom: 12,
            }}
          >
            {plan.tipo_dieta && (
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    marginBottom: 2,
                  }}
                >
                  Tipo de dieta
                </p>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {plan.tipo_dieta}
                </p>
              </div>
            )}
            {plan.observaciones && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    marginBottom: 2,
                  }}
                >
                  Observaciones
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{plan.observaciones}</p>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border-light)',
              paddingTop: 12,
            }}
          >
            <button
              onClick={() => handleEditarPlan(plan.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Editar
            </button>
            <button
              onClick={() => handleDuplicar(plan.id)}
              disabled={duplicando === plan.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: duplicando === plan.id ? 'not-allowed' : 'pointer',
                opacity: duplicando === plan.id ? 0.6 : 1,
              }}
            >
              {duplicando === plan.id ? 'Duplicando...' : 'Duplicar'}
            </button>
            {/* Exportar este plan a Excel */}
            <button
              onClick={() =>
                handleExportarPlan(
                  plan.id,
                  `${paciente.user?.first_name || ''} ${paciente.user?.last_name || ''}`.trim()
                )
              }
              disabled={exportandoPlan === plan.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: exportandoPlan === plan.id ? '#f0fdf4' : '#fff',
                border: '1px solid #86efac',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#15803d',
                cursor: exportandoPlan === plan.id ? 'not-allowed' : 'pointer',
              }}
            >
              {exportandoPlan === plan.id ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: '2px solid #15803d',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin .6s linear infinite',
                    }}
                  />{' '}
                  Excel...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={13} /> Exportar
                </>
              )}
            </button>
            {/* Descargar PDF del plan */}
            <button
              onClick={() => handleDescargarPdf(plan.id)}
              disabled={descargandoPdf === plan.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: descargandoPdf === plan.id ? '#faf5ff' : '#fff',
                border: '1px solid #c4b5fd',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#7c3aed',
                cursor: descargandoPdf === plan.id ? 'not-allowed' : 'pointer',
              }}
            >
              {descargandoPdf === plan.id ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: '2px solid #7c3aed',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin .6s linear infinite',
                    }}
                  />{' '}
                  PDF...
                </>
              ) : (
                <>
                  <FileText size={13} /> Descargar PDF
                </>
              )}
            </button>
            {/* Enviar PDF por email */}
            {paciente.user?.email && (
              <button
                onClick={() => handleEnviarEmail(plan.id)}
                disabled={enviandoEmail === plan.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: enviandoEmail === plan.id ? '#eff6ff' : '#fff',
                  border: '1px solid #93c5fd',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1e40af',
                  cursor: enviandoEmail === plan.id ? 'not-allowed' : 'pointer',
                }}
              >
                {enviandoEmail === plan.id ? (
                  <>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        border: '2px solid #1e40af',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin .6s linear infinite',
                      }}
                    />{' '}
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail size={13} /> Enviar PDF
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab Exámenes ──────────────────────────────────────────────────────────────

// Categorías con todos los campos del modelo ExamenBioquimico
const EXAMEN_CATEGORIAS = [
  {
    titulo: '🩸 Glucosa / Insulina',
    campos: [
      { key: 'glucosa', label: 'Glucosa', unit: 'mg/dL' },
      { key: 'glucosa_postprandial', label: 'Glucosa PP', unit: 'mg/dL' },
      { key: 'hemoglobina_glicosilada', label: 'HbA1c', unit: '%' },
      { key: 'insulina', label: 'Insulina', unit: 'µU/mL' },
      { key: 'insulina_postprandial', label: 'Insulina PP', unit: 'µU/mL' },
    ],
  },
  {
    titulo: '🫀 Lípidos',
    campos: [
      { key: 'colesterol', label: 'Col. Total', unit: 'mg/dL' },
      { key: 'hdl', label: 'HDL', unit: 'mg/dL' },
      { key: 'ldl', label: 'LDL', unit: 'mg/dL' },
      { key: 'vldl', label: 'VLDL', unit: 'mg/dL' },
      { key: 'trigliceridos', label: 'Triglicéridos', unit: 'mg/dL' },
    ],
  },
  {
    titulo: '🧬 Proteínas',
    campos: [
      { key: 'proteinas_totales', label: 'Proteínas Totales', unit: 'g/dL' },
      { key: 'albumina', label: 'Albúmina', unit: 'g/dL' },
      { key: 'globulina', label: 'Globulina', unit: 'g/dL' },
    ],
  },
  {
    titulo: '🫘 Renal',
    campos: [
      { key: 'urea', label: 'Urea', unit: 'mg/dL' },
      { key: 'creatinina', label: 'Creatinina', unit: 'mg/dL' },
      { key: 'acido_urico', label: 'Ácido Úrico', unit: 'mg/dL' },
    ],
  },
  {
    titulo: '🟡 Hepáticos',
    campos: [
      { key: 'tgo', label: 'TGO (AST)', unit: 'U/L' },
      { key: 'tgp', label: 'TGP (ALT)', unit: 'U/L' },
      { key: 'bilirrubina_total', label: 'Bilirrubina Total', unit: 'mg/dL' },
      {
        key: 'bilirrubina_directa',
        label: 'Bilirrubina Directa',
        unit: 'mg/dL',
      },
      {
        key: 'bilirrubina_indirecta',
        label: 'Bilirrubina Indirecta',
        unit: 'mg/dL',
      },
    ],
  },
  {
    titulo: '💉 Hematología',
    campos: [
      { key: 'hemoglobina', label: 'Hemoglobina', unit: 'g/dL' },
      { key: 'hematocrito', label: 'Hematocrito', unit: '%' },
    ],
  },
  {
    titulo: '🦋 Tiroides',
    campos: [
      { key: 't3', label: 'T3', unit: 'ng/dL' },
      { key: 't4', label: 'T4', unit: 'µg/dL' },
      { key: 'tsh', label: 'TSH', unit: 'µU/mL' },
    ],
  },
  {
    titulo: '⚗ Minerales',
    campos: [
      { key: 'hierro', label: 'Hierro', unit: 'µg/dL' },
      { key: 'vitamina_b12', label: 'Vitamina B12', unit: 'pg/mL' },
      { key: 'sodio', label: 'Sodio', unit: 'mEq/L' },
      { key: 'potasio', label: 'Potasio', unit: 'mEq/L' },
      { key: 'cloro', label: 'Cloro', unit: 'mEq/L' },
      { key: 'calcio', label: 'Calcio', unit: 'mg/dL' },
    ],
  },
];

function ExamenCard({ examen, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 10,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-surface-2)',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 13,
          color: 'var(--text-primary)',
        }}
      >
        <span>📅 {examen.fecha}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {open ? '▲ Cerrar' : '▼ Ver detalles'}
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {EXAMEN_CATEGORIAS.map((cat) => {
            const camposConValor = cat.campos.filter((c) => examen[c.key] != null);
            if (camposConValor.length === 0) return null;
            return (
              <div key={cat.titulo}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  {cat.titulo}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 6,
                  }}
                >
                  {camposConValor.map((campo) => (
                    <div
                      key={campo.key}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 7,
                        padding: '6px 10px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-tertiary)',
                          fontWeight: 600,
                          marginBottom: 2,
                        }}
                      >
                        {campo.label}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {examen[campo.key]}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 400,
                            color: 'var(--text-tertiary)',
                            marginLeft: 3,
                          }}
                        >
                          {campo.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExamenesTab({ paciente }) {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    examenesApi
      .lista(paciente.id)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.results || [];
        setExamenes(lista);
      })
      .catch(() => setExamenes([]))
      .finally(() => setLoading(false));
  }, [paciente.id]);

  if (loading) {
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
  }

  if (examenes.length === 0) {
    return (
      <EmptyState
        icon={Droplets}
        title="Sin exámenes bioquímicos"
        message="Este paciente aún no tiene exámenes registrados"
      />
    );
  }

  const examenesOrdenados = [...examenes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          padding: '4px 0 10px',
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontWeight: 600,
        }}
      >
        {examenesOrdenados.length} examen
        {examenesOrdenados.length !== 1 ? 'es' : ''} registrado
        {examenesOrdenados.length !== 1 ? 's' : ''}
      </div>
      {examenesOrdenados.map((examen, i) => (
        <ExamenCard key={examen.id ?? i} examen={examen} defaultOpen={i === 0} />
      ))}
    </div>
  );
}

// ── Tab Documentos ────────────────────────────────────────────────────────────

const TIPOS_DOCUMENTO = [
  { value: 'receta', label: 'Récipe / Receta' },
  { value: 'orden_laboratorio', label: 'Orden de Laboratorio' },
  { value: 'orden_imagenologia', label: 'Orden de Imagenología' },
  { value: 'constancia', label: 'Constancia Médica' },
];

const documentoSchema = yup.object({
  tipo: yup.string().required('Tipo de documento requerido'),
  // Receta
  medicamentos: yup.array().when('tipo', {
    is: 'receta',
    then: (schema) =>
      schema
        .of(
          yup.object({
            nombre: yup.string().required('Nombre del medicamento requerido'),
            dosis: yup.string(),
            frecuencia: yup.string(),
            duracion: yup.string(),
          })
        )
        .min(1, 'Agrega al menos un medicamento'),
    otherwise: (schema) => schema.notRequired(),
  }),
  indicaciones: yup.string().when('tipo', {
    is: 'receta',
    then: (schema) => schema,
    otherwise: (schema) => schema.notRequired(),
  }),
  // Orden lab/img
  estudios: yup.array().when('tipo', {
    is: (val) => val === 'orden_laboratorio' || val === 'orden_imagenologia',
    then: (schema) =>
      schema
        .of(yup.string().required('Nombre del estudio requerido'))
        .min(1, 'Agrega al menos un estudio'),
    otherwise: (schema) => schema.notRequired(),
  }),
  indicaciones_clinicas: yup.string().when('tipo', {
    is: (val) => val === 'orden_laboratorio' || val === 'orden_imagenologia',
    then: (schema) => schema,
    otherwise: (schema) => schema.notRequired(),
  }),
  // Constancia
  texto: yup.string().when('tipo', {
    is: 'constancia',
    then: (schema) =>
      schema.required('Texto requerido').min(20, 'El texto debe tener al menos 20 caracteres'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

function DocumentosTab({ paciente }) {
  const { showToast } = useToast();
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(documentoSchema),
    defaultValues: {
      tipo: '',
      medicamentos: [{ nombre: '', dosis: '', frecuencia: '', duracion: '' }],
      indicaciones: '',
      estudios: [''],
      indicaciones_clinicas: '',
      texto: '',
    },
  });

  const tipoSeleccionado = watch('tipo');
  const medicamentos = watch('medicamentos');
  const estudios = watch('estudios');

  const cargarDocumentos = useCallback(() => {
    setLoading(true);
    documentosApi
      .listar(paciente.id)
      .then((data) => setDocumentos(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error cargando documentos:', err);
        setDocumentos([]);
      })
      .finally(() => setLoading(false));
  }, [paciente.id]);

  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  const onSubmit = async (data) => {
    setGenerando(true);
    try {
      let contenido = {};

      if (data.tipo === 'receta') {
        contenido = {
          medicamentos: data.medicamentos,
          indicaciones: data.indicaciones || '',
        };
      } else if (data.tipo === 'orden_laboratorio' || data.tipo === 'orden_imagenologia') {
        contenido = {
          estudios: data.estudios.filter((e) => e.trim()),
          indicaciones: data.indicaciones_clinicas || '',
        };
      } else if (data.tipo === 'constancia') {
        contenido = {
          texto: data.texto,
        };
      }

      const { blob, documentoId } = await documentosApi.generar(paciente.id, data.tipo, contenido);

      const tipoLabel = TIPOS_DOCUMENTO.find((t) => t.value === data.tipo)?.label || 'documento';
      const filename = `${tipoLabel.replace(/\s+/g, '_')}_${paciente.cedula || paciente.id}_${new Date().toISOString().split('T')[0]}.pdf`;

      documentosApi.triggerDownload(blob, filename);

      showToast('Documento generado y descargado correctamente', 'success');

      reset();
      cargarDocumentos();
    } catch (err) {
      console.error('Error generando documento:', err);
      showToast(err.message || 'Error al generar el documento', 'error');
    } finally {
      setGenerando(false);
    }
  };

  const agregarMedicamento = () => {
    const current = watch('medicamentos');
    reset({
      ...watch(),
      medicamentos: [...current, { nombre: '', dosis: '', frecuencia: '', duracion: '' }],
    });
  };

  const eliminarMedicamento = (index) => {
    const current = watch('medicamentos');
    if (current.length > 1) {
      reset({
        ...watch(),
        medicamentos: current.filter((_, i) => i !== index),
      });
    }
  };

  const agregarEstudio = () => {
    const current = watch('estudios');
    reset({
      ...watch(),
      estudios: [...current, ''],
    });
  };

  const eliminarEstudio = (index) => {
    const current = watch('estudios');
    if (current.length > 1) {
      reset({
        ...watch(),
        estudios: current.filter((_, i) => i !== index),
      });
    }
  };

  const handleDescargarPDF = async (doc) => {
    try {
      const blob = await documentosApi.descargar(doc.id);
      const filename = `${doc.tipo_display.replace(/\s+/g, '_')}_${doc.paciente_nombre.replace(/\s+/g, '_')}_${doc.fecha_emision}.pdf`;
      documentosApi.triggerDownload(blob, filename);
      showToast('PDF descargado correctamente', 'success');
    } catch (err) {
      console.error('Error descargando PDF:', err);
      showToast('Error al descargar el PDF', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sección 1: Formulario Generar Documento */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}
      >
        <h3
          style={{
            fontFamily: 'Outfit',
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          📄 Generar Documento
        </h3>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Tipo de documento */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Tipo de documento *
            </label>
            <select
              {...register('tipo')}
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
                background: 'var(--bg-input, var(--bg-surface))',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Selecciona un tipo</option>
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <p style={{ fontSize: 11, color: '#E05555', marginTop: 3 }}>{errors.tipo.message}</p>
            )}
          </div>

          {/* Campos dinámicos para RECETA */}
          {tipoSeleccionado === 'receta' && (
            <>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Medicamentos *
                </label>
                {medicamentos.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Medicamento {index + 1}
                      </span>
                      {medicamentos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarMedicamento(index)}
                          style={{
                            background: '#E05555',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                      }}
                    >
                      <div style={{ gridColumn: '1 / -1' }}>
                        <input
                          {...register(`medicamentos.${index}.nombre`)}
                          placeholder="Nombre del medicamento *"
                          style={{
                            width: '100%',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: '6px 8px',
                            fontSize: 13,
                            background: 'var(--bg-surface)',
                          }}
                        />
                        {errors.medicamentos?.[index]?.nombre && (
                          <p
                            style={{
                              fontSize: 11,
                              color: '#E05555',
                              marginTop: 2,
                            }}
                          >
                            {errors.medicamentos[index].nombre.message}
                          </p>
                        )}
                      </div>
                      <input
                        {...register(`medicamentos.${index}.dosis`)}
                        placeholder="Dosis (ej: 500mg)"
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          fontSize: 13,
                          background: 'var(--bg-surface)',
                        }}
                      />
                      <input
                        {...register(`medicamentos.${index}.frecuencia`)}
                        placeholder="Frecuencia (ej: 2 veces/día)"
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          fontSize: 13,
                          background: 'var(--bg-surface)',
                        }}
                      />
                      <input
                        {...register(`medicamentos.${index}.duracion`)}
                        placeholder="Duración (ej: 30 días)"
                        style={{
                          gridColumn: '1 / -1',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '6px 8px',
                          fontSize: 13,
                          background: 'var(--bg-surface)',
                        }}
                      />
                    </div>
                  </div>
                ))}
                {errors.medicamentos && typeof errors.medicamentos.message === 'string' && (
                  <p
                    style={{
                      fontSize: 11,
                      color: '#E05555',
                      marginTop: -6,
                      marginBottom: 6,
                    }}
                  >
                    {errors.medicamentos.message}
                  </p>
                )}
                <button
                  type="button"
                  onClick={agregarMedicamento}
                  style={{
                    background: 'var(--accent-green)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={14} /> Agregar medicamento
                </button>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Indicaciones adicionales
                </label>
                <textarea
                  {...register('indicaciones')}
                  rows={3}
                  placeholder="Indicaciones generales para el paciente..."
                  style={{
                    width: '100%',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 13,
                    background: 'var(--bg-input, var(--bg-surface))',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            </>
          )}

          {/* Campos dinámicos para ORDEN LABORATORIO / IMAGENOLOGÍA */}
          {(tipoSeleccionado === 'orden_laboratorio' ||
            tipoSeleccionado === 'orden_imagenologia') && (
            <>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Estudios solicitados *
                </label>
                {estudios.map((_, index) => (
                  <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      {...register(`estudios.${index}`)}
                      placeholder={`Estudio ${index + 1} (ej: Hemograma, Glicemia)`}
                      style={{
                        flex: 1,
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '8px 10px',
                        fontSize: 13,
                        background: 'var(--bg-input, var(--bg-surface))',
                      }}
                    />
                    {estudios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarEstudio(index)}
                        style={{
                          background: '#E05555',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
                {errors.estudios && typeof errors.estudios.message === 'string' && (
                  <p
                    style={{
                      fontSize: 11,
                      color: '#E05555',
                      marginTop: -4,
                      marginBottom: 6,
                    }}
                  >
                    {errors.estudios.message}
                  </p>
                )}
                <button
                  type="button"
                  onClick={agregarEstudio}
                  style={{
                    background: 'var(--accent-green)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={14} /> Agregar estudio
                </button>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Indicaciones clínicas
                </label>
                <textarea
                  {...register('indicaciones_clinicas')}
                  rows={3}
                  placeholder="Indicaciones clínicas o motivo de la solicitud..."
                  style={{
                    width: '100%',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 13,
                    background: 'var(--bg-input, var(--bg-surface))',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            </>
          )}

          {/* Campos dinámicos para CONSTANCIA */}
          {tipoSeleccionado === 'constancia' && (
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Texto de la constancia *
              </label>
              <textarea
                {...register('texto')}
                rows={6}
                placeholder="Se hace constar que el paciente..."
                style={{
                  width: '100%',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 13,
                  background: 'var(--bg-input, var(--bg-surface))',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              {errors.texto && (
                <p style={{ fontSize: 11, color: '#E05555', marginTop: 3 }}>
                  {errors.texto.message}
                </p>
              )}
            </div>
          )}

          {/* Botón generar */}
          <button
            type="submit"
            disabled={generando || !tipoSeleccionado}
            style={{
              background:
                generando || !tipoSeleccionado ? 'var(--bg-surface-2)' : 'var(--accent-green)',
              color: generando || !tipoSeleccionado ? 'var(--text-tertiary)' : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px',
              fontSize: 14,
              fontWeight: 600,
              cursor: generando || !tipoSeleccionado ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {generando ? (
              <>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Generando...
              </>
            ) : (
              <>
                <FileText size={16} />
                Generar y Descargar PDF
              </>
            )}
          </button>
        </form>
      </div>

      {/* Sección 2: Historial de documentos */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <h3 style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 700 }}>
            Historial de Documentos
          </h3>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div
              style={{
                width: 28,
                height: 28,
                border: '3px solid var(--accent-green)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : documentos.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              No hay documentos generados aún
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-2)' }}>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Tipo
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Fecha
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc, index) => (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom:
                        index < documentos.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: '12px',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {doc.tipo_display}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: 13,
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {doc.fecha_emision}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDescargarPDF(doc)}
                        style={{
                          background: 'var(--accent-green)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        ⬇ PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal: Nuevo Registro de Progreso ────────────────────────────────────────

const registroSchema = yup.object({
  fecha: yup.string().required('Fecha requerida'),
  peso_kg: yup
    .number()
    .typeError('Ingresa un peso válido')
    .positive('Debe ser positivo')
    .required('Peso requerido'),
  talla_cm: yup
    .number()
    .typeError('Ingresa una talla válida')
    .positive('Debe ser positivo')
    .nullable()
    .transform((v, orig) => (orig === '' ? null : v)),
  cintura_cm: yup
    .number()
    .typeError('Valor inválido')
    .positive('Debe ser positivo')
    .nullable()
    .transform((v, orig) => (orig === '' ? null : v)),
  cadera_cm: yup
    .number()
    .typeError('Valor inválido')
    .positive('Debe ser positivo')
    .nullable()
    .transform((v, orig) => (orig === '' ? null : v)),
  notas: yup.string(),
});

const modalInputStyle = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 13,
  background: 'var(--bg-input, var(--bg-surface))',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
};

function RegistroFieldError({ error }) {
  if (!error) return null;
  return <p style={{ fontSize: 11, color: '#E05555', marginTop: 3 }}>{error.message}</p>;
}

function NuevoRegistroModal({ paciente, onClose, onCreado }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registroSchema),
    defaultValues: { fecha: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data) => {
    try {
      await progresoApi.crear({
        paciente: paciente.id,
        fecha: data.fecha,
        peso_kg: data.peso_kg,
        talla_cm: data.talla_cm ?? null,
        cintura_cm: data.cintura_cm ?? null,
        cadera_cm: data.cadera_cm ?? null,
        notas: data.notas || '',
      });
      onCreado();
    } catch {
      setError('root', {
        message: 'Error al crear registro. Verifica los datos.',
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
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
          maxWidth: 420,
          boxShadow: 'var(--shadow-xl)',
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
          <h2 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Outfit' }}>
            Nuevo Registro de Progreso
          </h2>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <Plus
              size={20}
              style={{
                color: 'var(--text-secondary)',
                transform: 'rotate(45deg)',
              }}
            />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {[
            { label: 'Fecha *', name: 'fecha', type: 'date' },
            {
              label: 'Peso (kg) *',
              name: 'peso_kg',
              type: 'number',
              step: '0.01',
            },
            {
              label: 'Talla (cm)',
              name: 'talla_cm',
              type: 'number',
              step: '0.1',
            },
            {
              label: 'Cintura (cm)',
              name: 'cintura_cm',
              type: 'number',
              step: '0.1',
            },
            {
              label: 'Cadera (cm)',
              name: 'cadera_cm',
              type: 'number',
              step: '0.1',
            },
          ].map(({ label, name, type, step }) => (
            <div key={name}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                {label}
              </label>
              <input type={type} step={step} {...register(name)} style={modalInputStyle} />
              <RegistroFieldError error={errors[name]} />
            </div>
          ))}

          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Notas
            </label>
            <textarea
              {...register('notas')}
              rows={2}
              style={{
                ...modalInputStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {errors.root && (
            <p style={{ fontSize: 12, color: '#E05555', textAlign: 'center' }}>
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: 'var(--accent-green)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 4,
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function MetricCard({ label, value, color }) {
  return (
    <div className="na-metric-card" style={{ background: color + '15' }}>
      <span className="na-metric-card-label" style={{ color }}>
        {label}
      </span>
      <span className="na-metric-card-value" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
