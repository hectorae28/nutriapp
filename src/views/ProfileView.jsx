import { useState } from 'react';
import {
  User, Phone, Mail, MapPin, Briefcase, Calendar,
  Activity, FileText, ChevronDown, ChevronUp,
  TrendingDown, ClipboardList, Heart, Droplets,
  Scale, Target, AlertCircle, CheckCircle2, BarChart2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import TopHeader from '../components/TopHeader';
import { Badge } from '../components/SharedComponents';
import { mockPatient } from '../data/mockPatient';

const TABS = [
  { id: 'patient', label: 'Datos del Paciente', icon: User },
  { id: 'dietary', label: 'Historia Dietética', icon: ClipboardList },
  { id: 'reports', label: 'Reportes Semanales', icon: BarChart2 },
  { id: 'weight', label: 'Evolución del Peso', icon: TrendingDown },
];

export default function ProfileView() {
  const [tab, setTab] = useState('patient');
  const p = mockPatient;

  return (
    <div className="na-profile-view">
      <TopHeader title="Perfil del Paciente" subtitle="Información personal y seguimiento nutricional" />

      <div className="na-profile-content">
        {/* Hero card */}
        <div className="na-profile-hero">
          <div className="na-profile-avatar">
            <span>{p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
          </div>
          <div className="na-profile-hero-info">
            <h2 className="na-profile-name">{p.name}</h2>
            <p className="na-profile-objective">{p.nutritionalEvaluation.diagnosis}</p>
            <div className="na-profile-tags" style={{ marginTop: 10 }}>
              <Badge color="var(--accent-green)">{p.gender}</Badge>
              <Badge color="#5B8DEF">{p.age} años</Badge>
              <Badge color="#7E57C2">{p.anthropometry.height} cm</Badge>
              <Badge color="#E05555">IMC {p.anthropometry.bmi}</Badge>
              <Badge color="#D4A257">{p.anthropometry.currentWeight} kg</Badge>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Nutricionista</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.nutritionist}</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Consulta inicial</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.consultDate}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="na-profile-tabs">
          {TABS.map(t => (
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
        {tab === 'patient' && <PatientTab p={p} />}
        {tab === 'dietary' && <DietaryTab p={p} />}
        {tab === 'reports' && <ReportsTab p={p} />}
        {tab === 'weight' && <WeightTab p={p} />}
      </div>
    </div>
  );
}

// ── Patient Data Tab ──────────────────────────────────────────────────────────

function PatientTab({ p }) {
  return (
    <div className="na-profile-grid">
      {/* Personal info */}
      <PSection title="Datos Personales" icon={User}>
        <InfoRow icon={User} label="Nombre completo" value={p.name} />
        <InfoRow icon={Calendar} label="Fecha de nacimiento" value={`${p.dob} (${p.age} años)`} />
        <InfoRow icon={User} label="Género" value={p.gender} />
        <InfoRow icon={Briefcase} label="Ocupación" value={p.occupation} />
        <InfoRow icon={Phone} label="Teléfono" value={p.phone} />
        <InfoRow icon={Mail} label="Correo" value={p.email} />
        <InfoRow icon={MapPin} label="Dirección" value={p.address} />
        <InfoRow icon={Calendar} label="Fecha de consulta" value={p.consultDate} />
        <InfoRow icon={User} label="Nutricionista" value={p.nutritionist} />
      </PSection>

      {/* Anthropometry */}
      <PSection title="Datos Antropométricos" icon={Scale}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          <MetricCard label="Peso actual" value={`${p.anthropometry.currentWeight} kg`} color="#5B8DEF" />
          <MetricCard label="Peso ideal" value={`${p.anthropometry.idealWeight} kg`} color="var(--accent-green)" />
          <MetricCard label="Talla" value={`${p.anthropometry.height} cm`} color="#7E57C2" />
          <MetricCard label="IMC" value={p.anthropometry.bmi} sub={p.anthropometry.bmiCategory} color="#EF6C00" />
          <MetricCard label="Cintura" value={`${p.anthropometry.waistCircumference} cm`} color="#E05555" />
          <MetricCard label="Cadera" value={`${p.anthropometry.hipCircumference} cm`} color="#D4A257" />
          <MetricCard label="ICC" value={p.anthropometry.waistHipRatio} color="#43A047" />
          <MetricCard label="% Grasa corporal" value={`${p.anthropometry.bodyFat}%`} color="#8D6E63" />
        </div>
      </PSection>

      {/* Labs */}
      <PSection title="Exámenes de Laboratorio" icon={Droplets}>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 12 }}>Fecha: {p.labs.date}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          <LabCard label="Glucosa" value={p.labs.glucose} unit="mg/dL" normal="70-100" warn={p.labs.glucose > 100} />
          <LabCard label="HbA1c" value={p.labs.hba1c} unit="%" normal="< 5.7" warn={p.labs.hba1c >= 5.7} />
          <LabCard label="Colesterol Total" value={p.labs.cholesterol} unit="mg/dL" normal="< 200" warn={p.labs.cholesterol >= 200} />
          <LabCard label="LDL" value={p.labs.ldl} unit="mg/dL" normal="< 130" warn={p.labs.ldl >= 130} />
          <LabCard label="HDL" value={p.labs.hdl} unit="mg/dL" normal="> 50" warn={p.labs.hdl < 50} />
          <LabCard label="Triglicéridos" value={p.labs.triglycerides} unit="mg/dL" normal="< 150" warn={p.labs.triglycerides >= 150} />
          <LabCard label="Insulina" value={p.labs.insulin} unit="μU/mL" normal="2-25" warn={false} />
        </div>
      </PSection>

      {/* Nutritional evaluation */}
      <PSection title="Evaluación Nutricional" icon={Target}>
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--radius-md)',
          background: 'color-mix(in oklch, #D4A257 10%, var(--bg-surface) 90%)',
          border: '1px solid color-mix(in oklch, #D4A257 25%, var(--border) 75%)',
          marginBottom: 14,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#D4A257', marginBottom: 4 }}>Diagnóstico</p>
          <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.nutritionalEvaluation.diagnosis}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
          <MetricCard label="Energía" value={`${p.nutritionalEvaluation.energyNeeds} kcal`} color="#EF6C00" />
          <MetricCard label="Proteínas" value={`${p.nutritionalEvaluation.proteinNeeds} g`} color="#E05555" />
          <MetricCard label="Carbohidratos" value={`${p.nutritionalEvaluation.carbNeeds} g`} color="#D4A257" />
          <MetricCard label="Grasas" value={`${p.nutritionalEvaluation.fatNeeds} g`} color="#7E57C2" />
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Objetivos:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {p.nutritionalEvaluation.objectives.map((obj, i) => (
            <div key={i} className="na-objective-item">
              <CheckCircle2 size={15} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 1 }} />
              {obj}
            </div>
          ))}
        </div>
        {p.nutritionalEvaluation.notes && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-2)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.nutritionalEvaluation.notes}</p>
          </div>
        )}
      </PSection>
    </div>
  );
}

// ── Dietary History Tab ───────────────────────────────────────────────────────

function DietaryTab({ p }) {
  const dh = p.dietaryHistory;
  return (
    <div className="na-profile-grid">
      <PSection title="Motivo de Consulta y Antecedentes" icon={FileText}>
        <InfoRow icon={AlertCircle} label="Motivo principal" value={dh.mainComplaint} />
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Dietas previas:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {dh.previousDiets.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
                {d}
              </div>
            ))}
          </div>
        </div>
      </PSection>

      <PSection title="Alergias e Intolerancias" icon={AlertCircle}>
        <TagGroup label="Alergias" tags={dh.allergies} color="#E05555" bgColor="color-mix(in oklch, #E05555 10%, var(--bg-surface) 90%)" />
        <TagGroup label="Intolerancias" tags={dh.intolerances} color="#EF6C00" bgColor="color-mix(in oklch, #EF6C00 10%, var(--bg-surface) 90%)" />
        <TagGroup label="Preferencias alimentarias" tags={dh.foodPreferences} color="var(--accent-green)" bgColor="var(--accent-green-light)" />
        <TagGroup label="Aversiones" tags={dh.foodAversions} color="var(--text-tertiary)" bgColor="var(--bg-surface-2)" />
      </PSection>

      <PSection title="Hábitos Alimentarios" icon={Activity}>
        <InfoRow icon={Droplets} label="Consumo de agua" value={dh.waterIntake} />
        <InfoRow icon={ClipboardList} label="Frec. de comidas" value={dh.mealFrequency} />
        <InfoRow icon={Activity} label="Prep. de alimentos" value={dh.cookingMethod} />
        <InfoRow icon={Activity} label="Actividad física" value={dh.physicalActivity} />
      </PSection>

      <PSection title="Estilo de Vida" icon={Heart}>
        <InfoRow icon={Activity} label="Horas de sueño" value={`${dh.sleepHours} horas/noche`} />
        <InfoRow icon={Activity} label="Nivel de estrés" value={dh.stressLevel} />
        <InfoRow icon={Activity} label="Alcohol" value={dh.alcoholConsumption} />
        <InfoRow icon={Activity} label="Tabaquismo" value={dh.smoking ? 'Sí' : 'No'} />
        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-md)',
          background: 'color-mix(in oklch, #5B8DEF 8%, var(--bg-surface) 92%)',
          border: '1px solid color-mix(in oklch, #5B8DEF 20%, var(--border) 80%)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#5B8DEF', marginBottom: 4 }}>Plan nutricional indicado</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.nutritionalEvaluation.plan}</p>
        </div>
      </PSection>
    </div>
  );
}

// ── Weekly Reports Tab ────────────────────────────────────────────────────────

function ReportsTab({ p }) {
  const [openWeek, setOpenWeek] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {p.weeklyReports.map((report, wi) => {
        const adherenceColor = report.adherence >= 80 ? 'var(--accent-green)' : report.adherence >= 60 ? '#D4A257' : '#E05555';
        const isOpen = openWeek === wi;
        return (
          <div key={wi} className="na-week-card">
            <button className="na-week-header" onClick={() => setOpenWeek(isOpen ? null : wi)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="na-week-icon"><BarChart2 size={20} /></div>
                <div>
                  <span className="na-week-title">{report.week}</span>
                  <span className="na-week-sub">{report.meals.length} días registrados</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Adherencia</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="na-adherence-bar">
                      <div className="na-adherence-fill" style={{ width: `${report.adherence}%`, background: adherenceColor }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: adherenceColor }}>{report.adherence}%</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
              </div>
            </button>

            {isOpen && (
              <div className="na-week-body">
                {report.meals.map((day, di) => (
                  <div key={di} className="na-day-card">
                    <div className="na-day-header">
                      <span>{day.day}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>{day.items.length} comidas</span>
                    </div>
                    {day.items.map((meal, mi) => (
                      <div key={mi} className="na-day-meal-row">
                        <span className="na-day-meal-label">{meal.meal}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {meal.foods.map((food, fi) => (
                            <span key={fi} className="na-food-chip">{food}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                {report.notes && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius-md)',
                    background: 'color-mix(in oklch, #5B8DEF 8%, var(--bg-surface) 92%)',
                    border: '1px solid color-mix(in oklch, #5B8DEF 20%, var(--border) 80%)',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#5B8DEF', marginBottom: 4 }}>Notas del nutricionista</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{report.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Weight Evolution Tab ──────────────────────────────────────────────────────

function WeightTab({ p }) {
  const data = p.weightHistory;
  const idealWeight = p.anthropometry.idealWeight;
  const current = data[data.length - 1].weight;
  const initial = data[0].weight;
  const lost = (initial - current).toFixed(1);
  const remaining = (current - idealWeight).toFixed(1);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--shadow-md)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{label}</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{payload[0].value} kg</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <MetricCard label="Peso inicial" value={`${initial} kg`} color="var(--text-tertiary)" />
        <MetricCard label="Peso actual" value={`${current} kg`} color="#5B8DEF" />
        <MetricCard label="Peso perdido" value={`-${lost} kg`} color="var(--accent-green)" />
        <MetricCard label="Para meta" value={`${remaining} kg`} color="#EF6C00" />
      </div>

      {/* Chart */}
      <div className="na-weight-chart-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700 }}>Evolución del Peso</h3>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {data.length} semanas de seguimiento · Meta: {idealWeight} kg
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 2, background: 'var(--accent-green)', display: 'inline-block', borderRadius: 2 }} />
              Peso real
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 2, background: '#5B8DEF', display: 'inline-block', borderRadius: 2 }} />
              Meta
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[idealWeight - 2, initial + 1]} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={idealWeight} stroke="#5B8DEF" strokeDasharray="6 3" strokeWidth={1.5}
              label={{ value: `Meta ${idealWeight}kg`, position: 'insideTopRight', fontSize: 11, fill: '#5B8DEF' }} />
            <Line type="monotone" dataKey="weight" stroke="var(--accent-green)" strokeWidth={2.5}
              dot={{ fill: 'var(--accent-green)', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: 'var(--accent-green)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weight table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
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
                    <td style={{ textAlign: 'right' }}>
                      {diff === null
                        ? <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                        : <span style={{ fontSize: 12, fontWeight: 600, color: diff < 0 ? 'var(--accent-green)' : diff > 0 ? '#E05555' : 'var(--text-tertiary)' }}>
                            {diff > 0 ? '+' : ''}{diff} kg
                          </span>
                      }
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
        <div className="na-psection-icon"><Icon size={15} /></div>
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
      <span className="na-metric-card-label" style={{ color }}>{label}</span>
      <span className="na-metric-card-value" style={{ color }}>{value}</span>
      {sub && <span className="na-metric-card-sub" style={{ color }}>{sub}</span>}
    </div>
  );
}

function LabCard({ label, value, unit, normal, warn }) {
  return (
    <div className={`na-lab-card ${warn ? 'warn' : ''}`}>
      <div className="na-lab-card-header">
        <span className="na-lab-card-name">{label}</span>
        {warn
          ? <AlertCircle size={12} style={{ color: '#D4A257' }} />
          : <CheckCircle2 size={12} style={{ color: 'var(--accent-green)' }} />
        }
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
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}:</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {tags.map((t, i) => (
          <span key={i} style={{ padding: '3px 10px', borderRadius: 999, background: bgColor, color, fontSize: 12, fontWeight: 500 }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
