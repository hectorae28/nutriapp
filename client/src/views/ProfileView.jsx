import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  ClipboardList,
  Heart,
  Droplets,
  Scale,
  Target,
  AlertCircle,
  CheckCircle2,
  BarChart2,
  LogOut,
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
import TopHeader from '../components/TopHeader';
import { Badge } from '../components/SharedComponents';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { progresoApi } from '../api/progreso';
import { expedienteApi } from '../api/expediente';
import { examenesApi } from '../api/examenes';

const TABS = [
  { id: 'patient', label: 'Datos del Paciente', icon: User },
  { id: 'dietary', label: 'Historia Dietética', icon: ClipboardList },
  { id: 'reports', label: 'Reportes Semanales', icon: BarChart2 },
  { id: 'weight', label: 'Evolución del Peso', icon: TrendingDown },
];

export default function ProfileView() {
  const [tab, setTab] = useState('patient');
  const { user, groups, logout, isNutricionista, isAdmin, isSecretario, isPaciente } = useAuth();
  const [paciente, setPaciente] = useState(null);
  const [expediente, setExpediente] = useState(null);
  const [examenes, setExamenes] = useState([]);
  const [registrosProgreso, setRegistrosProgreso] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load patient data if user is a Paciente
    if (!isPaciente) {
      setLoading(false);
      return;
    }

    api
      .get('/pacientes/')
      .then(async (data) => {
        const lista = Array.isArray(data) ? data : data.results || [];
        if (lista.length === 0) { setLoading(false); return; }
        const pac = lista[0];
        setPaciente(pac);
        const [exp, exams, regs] = await Promise.all([
          expedienteApi.obtener(pac.id).catch(() => null),
          examenesApi.lista(pac.id).catch(() => []),
          progresoApi.registros().catch(() => []),
        ]);
        setExpediente(exp);
        setExamenes(Array.isArray(exams) ? exams : exams?.results || []);
        if (Array.isArray(regs)) setRegistrosProgreso(regs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isPaciente]);

  const nombreCompleto = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username
    : 'Usuario';
  const rol = groups[0] || 'Usuario';

  // último registro de progreso (más reciente)
  const ultimoProgreso = registrosProgreso.length > 0
    ? [...registrosProgreso].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
    : null;

  // Títulos según rol
  const tituloView = isNutricionista || isAdmin 
    ? 'Mi Perfil Profesional' 
    : isSecretario 
      ? 'Mi Perfil' 
      : 'Mi Perfil';
  
  const subtituloView = isNutricionista || isAdmin
    ? 'Datos profesionales y configuración'
    : isSecretario
      ? 'Información personal y configuración'
      : 'Información personal y seguimiento nutricional';

  if (loading) {
    return (
      <div className="na-profile-view">
        <TopHeader title={tituloView} subtitle={subtituloView} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Cargando datos…</span>
        </div>
      </div>
    );
  }

  if (!paciente && isPaciente) {
    return (
      <div className="na-profile-view">
        <TopHeader title={tituloView} subtitle={subtituloView} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>No se encontró perfil de paciente.</span>
        </div>
      </div>
    );
  }

  const diagnostico = expediente?.diagnostico_nutricional || null;
  const pesoActual = ultimoProgreso ? parseFloat(ultimoProgreso.peso_kg) : null;
  const talla = ultimoProgreso ? parseFloat(ultimoProgreso.talla_cm) : null;
  const imc = ultimoProgreso?.imc ? parseFloat(ultimoProgreso.imc).toFixed(1) : null;

  // Si es Nutricionista/Admin/Secretario, mostrar perfil profesional simple
  if (isNutricionista || isAdmin || isSecretario) {
    const initials = nombreCompleto
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const memberSince = user?.date_joined 
      ? new Date(user.date_joined).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })
      : null;

    return (
      <div className="na-profile-view">
        <TopHeader title={tituloView} subtitle={subtituloView} />
        <div className="na-profile-content">
          {/* Hero card */}
          <div className="na-profile-hero">
            <div className="na-profile-avatar">
              <span>{initials}</span>
            </div>
            <div className="na-profile-hero-info">
              <h2 className="na-profile-name">{nombreCompleto}</h2>
              <p className="na-profile-objective">{user?.email || '—'}</p>
              <div className="na-profile-tags" style={{ marginTop: 10 }}>
                <Badge color="var(--accent-green)">{rol}</Badge>
              </div>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <button
                onClick={logout}
                style={{
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#E05555',
                  background: 'color-mix(in oklch, #E05555 10%, var(--bg-surface) 90%)',
                  border: '1px solid color-mix(in oklch, #E05555 25%, var(--border) 75%)',
                  borderRadius: 'var(--radius-md)',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={13} />
                Cerrar sesión
              </button>
            </div>
          </div>
          
          {/* Account info card */}
          <div className="na-psection">
            <div className="na-psection-title">
              <div className="na-psection-icon">
                <User size={15} />
              </div>
              Información de cuenta
            </div>
            <InfoRow icon={User} label="Nombre de usuario" value={user?.username || '—'} />
            <InfoRow icon={Mail} label="Correo electrónico" value={user?.email || '—'} />
            {memberSince && <InfoRow icon={Calendar} label="Miembro desde" value={memberSince} />}
          </div>

          {/* Actions card */}
          <div style={{ 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-light)', 
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.borderColor = 'var(--accent-green)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-base)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              Cambiar contraseña
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="na-profile-view">
      <TopHeader
        title={tituloView}
        subtitle={subtituloView}
      />

      <div className="na-profile-content">
        {/* Hero card */}
        <div className="na-profile-hero">
          <div className="na-profile-avatar">
            <span>
              {nombreCompleto
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
          <div className="na-profile-hero-info">
            <h2 className="na-profile-name">{nombreCompleto}</h2>
            {diagnostico && <p className="na-profile-objective">{diagnostico}</p>}
            <div className="na-profile-tags" style={{ marginTop: 10 }}>
              <Badge color="var(--accent-green)">{rol}</Badge>
              {paciente.fecha_nacimiento && (
                <Badge color="#5B8DEF">
                  {new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear()} años
                </Badge>
              )}
              {talla && <Badge color="#7E57C2">{talla} cm</Badge>}
              {imc && <Badge color="#E05555">IMC {imc}</Badge>}
              {pesoActual && <Badge color="#D4A257">{pesoActual} kg</Badge>}
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Historia Nro.</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{paciente.historia_nro || '—'}</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Registro
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {paciente.created_at ? new Date(paciente.created_at).toLocaleDateString('es-VE') : '—'}
            </span>
            <button
              onClick={logout}
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: '#E05555',
                background: 'color-mix(in oklch, #E05555 10%, var(--bg-surface) 90%)',
                border: '1px solid color-mix(in oklch, #E05555 25%, var(--border) 75%)',
                borderRadius: 'var(--radius-md)',
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              <LogOut size={13} />
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="na-profile-tabs">
          {TABS.map((t) => (
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
        {tab === 'patient' && (
          <PatientTab paciente={paciente} expediente={expediente} ultimoProgreso={ultimoProgreso} examenes={examenes} />
        )}
        {tab === 'dietary' && <DietaryTab expediente={expediente} />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'weight' && (
          <WeightTab registros={registrosProgreso} paciente={paciente} />
        )}
      </div>
    </div>
  );
}

// ── Patient Data Tab ──────────────────────────────────────────────────────────

function PatientTab({ paciente, expediente, ultimoProgreso, examenes }) {
  const sexoLabel = paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : paciente.sexo || '—';
  const ultimoExamen = examenes.length > 0
    ? [...examenes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
    : null;

  return (
    <div className="na-profile-grid">
      {/* Personal info */}
      <PSection title="Datos Personales" icon={User}>
        <InfoRow icon={User} label="Cédula" value={paciente.cedula || '—'} />
        <InfoRow icon={Calendar} label="Fecha de nacimiento" value={paciente.fecha_nacimiento || '—'} />
        <InfoRow icon={User} label="Género" value={sexoLabel} />
        <InfoRow icon={Briefcase} label="Ocupación" value={paciente.ocupacion || '—'} />
        <InfoRow icon={Phone} label="Teléfono" value={paciente.telefono || '—'} />
        <InfoRow icon={MapPin} label="Dirección" value={paciente.direccion || '—'} />
        <InfoRow icon={User} label="Estado civil" value={paciente.estado_civil || '—'} />
        <InfoRow icon={FileText} label="Historia Nro." value={paciente.historia_nro || '—'} />
        <InfoRow icon={Calendar} label="Registro" value={paciente.created_at ? new Date(paciente.created_at).toLocaleDateString('es-VE') : '—'} />
      </PSection>

      {/* Anthropometry from último progreso */}
      <PSection title="Datos Antropométricos" icon={Scale}>
        {ultimoProgreso ? (
          <>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Fecha: {ultimoProgreso.fecha}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              <MetricCard label="Peso actual" value={`${parseFloat(ultimoProgreso.peso_kg)} kg`} color="#5B8DEF" />
              {ultimoProgreso.talla_cm && <MetricCard label="Talla" value={`${parseFloat(ultimoProgreso.talla_cm)} cm`} color="#7E57C2" />}
              {ultimoProgreso.imc && <MetricCard label="IMC" value={parseFloat(ultimoProgreso.imc).toFixed(1)} sub={ultimoProgreso.imc_clasificacion} color="#EF6C00" />}
              {ultimoProgreso.cintura_cm && <MetricCard label="Cintura" value={`${parseFloat(ultimoProgreso.cintura_cm)} cm`} color="#E05555" />}
              {ultimoProgreso.cadera_cm && <MetricCard label="Cadera" value={`${parseFloat(ultimoProgreso.cadera_cm)} cm`} color="#D4A257" />}
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
            Sin registros de progreso aún.
          </p>
        )}
      </PSection>

      {/* Labs */}
      <PSection title="Exámenes de Laboratorio" icon={Droplets}>
        {ultimoExamen ? (
          <>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 12 }}>
              Fecha: {ultimoExamen.fecha}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {ultimoExamen.glucosa != null && <LabCard label="Glucosa" value={ultimoExamen.glucosa} unit="mg/dL" normal="70-100" warn={parseFloat(ultimoExamen.glucosa) > 100} />}
              {ultimoExamen.hemoglobina_glicosilada != null && <LabCard label="HbA1c" value={ultimoExamen.hemoglobina_glicosilada} unit="%" normal="< 5.7" warn={parseFloat(ultimoExamen.hemoglobina_glicosilada) >= 5.7} />}
              {ultimoExamen.colesterol != null && <LabCard label="Colesterol Total" value={ultimoExamen.colesterol} unit="mg/dL" normal="< 200" warn={parseFloat(ultimoExamen.colesterol) >= 200} />}
              {ultimoExamen.ldl != null && <LabCard label="LDL" value={ultimoExamen.ldl} unit="mg/dL" normal="< 130" warn={parseFloat(ultimoExamen.ldl) >= 130} />}
              {ultimoExamen.hdl != null && <LabCard label="HDL" value={ultimoExamen.hdl} unit="mg/dL" normal="> 50" warn={parseFloat(ultimoExamen.hdl) < 50} />}
              {ultimoExamen.trigliceridos != null && <LabCard label="Triglicéridos" value={ultimoExamen.trigliceridos} unit="mg/dL" normal="< 150" warn={parseFloat(ultimoExamen.trigliceridos) >= 150} />}
              {ultimoExamen.insulina != null && <LabCard label="Insulina" value={ultimoExamen.insulina} unit="μU/mL" normal="2-25" warn={false} />}
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
            Sin exámenes de laboratorio registrados.
          </p>
        )}
      </PSection>

      {/* Nutritional evaluation from expediente */}
      <PSection title="Evaluación Nutricional" icon={Target}>
        {expediente ? (
          <>
            {expediente.diagnostico_nutricional && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'color-mix(in oklch, #D4A257 10%, var(--bg-surface) 90%)', border: '1px solid color-mix(in oklch, #D4A257 25%, var(--border) 75%)', marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#D4A257', marginBottom: 4 }}>Diagnóstico</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{expediente.diagnostico_nutricional}</p>
              </div>
            )}
            {expediente.motivo_consulta && (
              <InfoRow icon={FileText} label="Motivo de consulta" value={expediente.motivo_consulta} />
            )}
            {expediente.ant_personales && (
              <InfoRow icon={AlertCircle} label="Antecedentes personales" value={expediente.ant_personales} />
            )}
            {expediente.ant_familiares && (
              <InfoRow icon={AlertCircle} label="Antecedentes familiares" value={expediente.ant_familiares} />
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
            Sin expediente clínico registrado.
          </p>
        )}
      </PSection>
    </div>
  );
}

// ── Dietary History Tab ───────────────────────────────────────────────────────

function DietaryTab({ expediente }) {
  if (!expediente) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
        Sin expediente clínico registrado.
      </div>
    );
  }
  const e = expediente;
  return (
    <div className="na-profile-grid">
      <PSection title="Motivo de Consulta y Antecedentes" icon={FileText}>
        {e.motivo_consulta && <InfoRow icon={AlertCircle} label="Motivo principal" value={e.motivo_consulta} />}
        {e.ant_personales && <InfoRow icon={FileText} label="Antecedentes personales" value={e.ant_personales} />}
        {e.ant_familiares && <InfoRow icon={FileText} label="Antecedentes familiares" value={e.ant_familiares} />}
      </PSection>

      <PSection title="Hábitos Psicobiológicos" icon={Activity}>
        {e.cafeinicos_v_dia != null && <InfoRow icon={Activity} label="Cafeínicos" value={`${e.cafeinicos_v_dia} veces/día`} />}
        {e.alcohol && <InfoRow icon={Activity} label="Alcohol" value={e.alcohol} />}
        {e.tabaquicos_und_dia != null && <InfoRow icon={Activity} label="Tabaco" value={`${e.tabaquicos_und_dia} und/día`} />}
        {e.sueno_hr_dia != null && <InfoRow icon={Activity} label="Sueño" value={`${e.sueno_hr_dia} horas/día`} />}
        {e.apetito && <InfoRow icon={Activity} label="Apetito" value={e.apetito} />}
        {e.actividad_fisica && <InfoRow icon={Activity} label="Actividad física" value={e.actividad_fisica} />}
      </PSection>

      {e.alergias_alimentarias && (
        <PSection title="Alergias Alimentarias" icon={AlertCircle}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.alergias_alimentarias}</p>
        </PSection>
      )}

      <PSection title="Estilo de Vida" icon={Heart}>
        {e.micciones_v_dia && <InfoRow icon={Droplets} label="Micciones" value={`${e.micciones_v_dia} veces/día`} />}
        {e.evacuaciones_v_dia != null && <InfoRow icon={Activity} label="Evacuaciones" value={`${e.evacuaciones_v_dia} veces/día`} />}
        {e.estrenimiento && <InfoRow icon={Activity} label="Estreñimiento" value={e.estrenimiento} />}
      </PSection>
    </div>
  );
}

// ── Weekly Reports Tab ────────────────────────────────────────────────────────

function ReportsTab() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
      <BarChart2 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
      <p>Los reportes semanales estarán disponibles próximamente.</p>
    </div>
  );
}

// ── Weight Evolution Tab ──────────────────────────────────────────────────────

// Custom tooltip for weight chart (declared outside to avoid recreation)
function ProfileWeightTooltip({ active, payload, label }) {
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
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {payload[0].value} kg
        </p>
      </div>
    );
  }
  return null;
}

function WeightTab({ registros = [], paciente }) {
  const registrosOrdenados = [...registros].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const data = registrosOrdenados.map((r, i) => ({
    label: `S${i + 1}`,
    date: r.fecha,
    weight: parseFloat(r.peso_kg),
    imc: r.imc,
    talla: r.talla_cm,
    clasificacion: r.imc_clasificacion,
  }));

  const idealWeight = paciente?.peso_ideal_kg ? parseFloat(paciente.peso_ideal_kg) : null;

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
        <Scale size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p>Sin registros de peso aún.</p>
      </div>
    );
  }

  const current = data[data.length - 1]?.weight;
  const initial = data[0]?.weight || current;
  const lost = (initial - current).toFixed(1);
  const remaining = idealWeight != null ? Math.max(0, current - idealWeight).toFixed(1) : null;

  const esReal = true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        {remaining != null && <MetricCard label="Para meta" value={`${remaining} kg`} color="#EF6C00" />}
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
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {data.length} semanas de seguimiento{idealWeight ? ` · Meta: ${idealWeight} kg` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
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
              Peso real
            </span>
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
              domain={[idealWeight != null ? idealWeight - 2 : 'auto', initial + 1]}
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<ProfileWeightTooltip />} />
            {idealWeight != null && (
              <ReferenceLine
                y={idealWeight}
                stroke="#5B8DEF"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: `Meta ${idealWeight}kg`, position: 'insideTopRight', fontSize: 11, fill: '#5B8DEF' }}
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
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 700 }}>Registro Semanal</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="na-weight-table">
            <thead>
              <tr>
                <th>Semana</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'right' }}>Peso (kg)</th>
                {esReal && <th style={{ textAlign: 'right' }}>IMC</th>}
                {esReal && <th>Clasificación</th>}
                <th style={{ textAlign: 'right' }}>Cambio</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const diff = i === 0 ? null : (row.weight - data[i - 1].weight).toFixed(1);
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.label}</td>
                    <td style={{ color: 'var(--text-tertiary)' }}>{row.date}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.weight}</td>
                    {esReal && <td style={{ textAlign: 'right' }}>{row.imc || '—'}</td>}
                    {esReal && (
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {row.clasificacion || '—'}
                      </td>
                    )}
                    <td style={{ textAlign: 'right' }}>
                      {diff === null ? (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
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
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function PSection({ title, icon: Icon, children }) {
  return (
    <div className="na-psection">
      <div className="na-psection-title">
        <div className="na-psection-icon">
          <Icon size={15} />
        </div>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="na-info-row">
      <Icon size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} />
      <span className="na-info-label">{label}</span>
      <span className="na-info-value">{value}</span>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="na-metric-card" style={{ background: color + '15' }}>
      <span className="na-metric-card-label" style={{ color }}>
        {label}
      </span>
      <span className="na-metric-card-value" style={{ color }}>
        {value}
      </span>
      {sub && (
        <span className="na-metric-card-sub" style={{ color }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function LabCard({ label, value, unit, normal, warn }) {
  return (
    <div className={`na-lab-card ${warn ? 'warn' : ''}`}>
      <div className="na-lab-card-header">
        <span className="na-lab-card-name">{label}</span>
        {warn ? (
          <AlertCircle size={12} style={{ color: '#D4A257' }} />
        ) : (
          <CheckCircle2 size={12} style={{ color: 'var(--accent-green)' }} />
        )}
      </div>
      <div className={`na-lab-value ${warn ? 'warn' : ''}`}>
        {value} <span style={{ fontSize: 11, fontWeight: 400 }}>{unit}</span>
      </div>
      <div className="na-lab-normal">Normal: {normal}</div>
    </div>
  );
}

function TagGroup({ label, tags, color, bgColor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {tags.map((t, i) => (
          <span
            key={i}
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              background: bgColor,
              color,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
