import { useState, useEffect } from 'react';
import TopHeader from '../components/TopHeader';
import { StatCard, Badge } from '../components/SharedComponents';
import { TrendingDown, Activity, Target, Calendar } from 'lucide-react';
import { progresoApi } from '../api/progreso';
import { planesApi } from '../api/planes';
import { useAuth } from '../contexts/AuthContext';

// Minimal fallback data for empty states
const MOCK_WEIGHT_DATA = [
  { date: 'Inicio', weight: 70, target: 70 },
];
const MOCK_MACROS = { proteinas: 30, carbohidratos: 40, grasas: 30 };
const MOCK_ADHERENCE = [{ month: 'Actual', weeks: [0] }];
const MOCK_VISIT_NOTES = [];
const MOCK_MEASUREMENTS = [];

export default function ReportsView() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [planActivo, setPlanActivo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([progresoApi.registros().catch(() => []), planesApi.miPlanActivo().catch(() => [])])
      .then(([regs, planes]) => {
        if (Array.isArray(regs)) setRegistros(regs);
        const plan = Array.isArray(planes) ? planes[0] : planes;
        if (plan?.id) setPlanActivo(plan);
      })
      .finally(() => setLoading(false));
  }, []);

  // Construir datos del gráfico desde registros reales o mock como fallback
  const weightData =
    registros.length >= 2
      ? registros
          .slice()
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          .map((r) => ({ date: r.fecha.slice(5), weight: parseFloat(r.peso_kg), target: null }))
      : MOCK_WEIGHT_DATA;

  const ultimoRegistro =
    registros.length > 0
      ? registros.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
      : null;

  // Calcular stats reales si hay datos, si no usar mock
  const startW = weightData[0]?.weight || MOCK_WEIGHT_DATA[0].weight;
  const endW = ultimoRegistro
    ? parseFloat(ultimoRegistro.peso_kg)
    : weightData[weightData.length - 1]?.weight ||
      MOCK_WEIGHT_DATA[MOCK_WEIGHT_DATA.length - 1].weight;
  const lost = (startW - endW).toFixed(1);
  const talla = ultimoRegistro?.talla_cm || 165;
  const bmiCurrent = ultimoRegistro?.imc
    ? parseFloat(ultimoRegistro.imc).toFixed(1)
    : (endW / (talla / 100) ** 2).toFixed(1);

  // Para macros: usar plan activo si existe, convirtiendo g → %
  const macroData = planActivo
    ? (() => {
        const totalG =
          (planActivo.proteinas_g || 0) +
          (planActivo.grasas_g || 0) +
          (planActivo.carbohidratos_g || 0);
        if (totalG === 0) return MOCK_MACROS;
        return {
          proteinas: Math.round((planActivo.proteinas_g / totalG) * 100),
          grasas: Math.round((planActivo.grasas_g / totalG) * 100),
          carbohidratos: Math.round((planActivo.carbohidratos_g / totalG) * 100),
        };
      })()
    : MOCK_MACROS;

  const nombrePaciente = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username
    : 'Paciente';

  const avgAdherence = Math.round(
    MOCK_ADHERENCE.flatMap((m) => m.weeks).reduce((a, b) => a + b, 0) /
      MOCK_ADHERENCE.flatMap((m) => m.weeks).length
  );

  if (loading) {
    return (
      <div className="na-reports-view">
        <TopHeader title="Reportes" subtitle="Seguimiento nutricional" />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          }}
        >
          <span style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Cargando datos…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="na-reports-view">
      <TopHeader title="Reportes" subtitle={`Seguimiento nutricional de ${nombrePaciente}`} />

      <div className="na-reports-content">
        <div className="na-stats-row">
          <StatCard
            icon={TrendingDown}
            label="Peso perdido"
            value={`${lost} kg`}
            sub={`${startW} → ${endW} kg`}
            color="#E05555"
          />
          <StatCard
            icon={Activity}
            label="IMC actual"
            value={bmiCurrent}
            sub={parseFloat(bmiCurrent) < 25 ? 'Normal' : 'Sobrepeso'}
            color="#5B8DEF"
          />
          <StatCard
            icon={Target}
            label="Adherencia"
            value={`${avgAdherence}%`}
            sub="Promedio 12 semanas"
            color="var(--accent-green)"
          />
          <StatCard
            icon={Calendar}
            label="Duración"
            value={`${registros.length} reg.`}
            sub={planActivo?.fecha_inicio ? `Desde ${planActivo.fecha_inicio.split('-').reverse().join('/')}` : 'Sin plan activo'}
            color="#7E57C2"
          />
        </div>

        <div className="na-charts-grid">
          <div className="na-chart-card wide">
            <div className="na-chart-header">
              <h3>Progresión de Peso</h3>
              <div className="na-chart-legend">
                <span className="na-legend-dot">Peso real</span>
                <span className="na-legend-dot">Meta</span>
              </div>
            </div>
            <WeightChart data={weightData} />
          </div>

          <div className="na-chart-card">
            <h3 className="na-chart-header">Distribución de Macros</h3>
            <MacroDonut data={macroData} />
          </div>

          <div className="na-chart-card">
            <h3 className="na-chart-header">Adherencia Semanal</h3>
            <AdherenceBars data={MOCK_ADHERENCE} />
          </div>

          <div className="na-chart-card wide">
            <h3 className="na-chart-header">Medidas Corporales (cm)</h3>
            <MeasurementsTable data={MOCK_MEASUREMENTS} />
          </div>

          <div className="na-chart-card wide">
            <h3 className="na-chart-header">Notas de Consulta</h3>
            <VisitNotes notes={MOCK_VISIT_NOTES} />
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightChart({ data }) {
  const W = 600,
    H = 200,
    PAD = 40;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 1.5;
  // Filter out null targets before computing min/max
  const allVals = data.flatMap((d) => [d.weight, d.target].filter((v) => v != null));
  const minV = Math.floor(Math.min(...allVals) - 1);
  const maxV = Math.ceil(Math.max(...allVals) + 1);
  const rangeV = maxV - minV || 1;

  const x = (i) => PAD + (i / (data.length - 1)) * plotW;
  const y = (v) => PAD + plotH - ((v - minV) / rangeV) * plotH;

  const realPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.weight).toFixed(1)}`)
    .join(' ');
  // Only draw target path if at least one target value exists
  const hasTarget = data.some((d) => d.target != null);
  const targetPath = hasTarget
    ? data
        .filter((d) => d.target != null)
        .map((d, i, arr) => {
          const origIdx = data.indexOf(d);
          return `${i === 0 ? 'M' : 'L'}${x(origIdx).toFixed(1)},${y(d.target).toFixed(1)}`;
        })
        .join(' ')
    : '';

  const yTicks = [];
  for (let v = minV; v <= maxV; v += 1) yTicks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="na-svg-chart">
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={PAD}
            y1={y(v)}
            x2={W - PAD}
            y2={y(v)}
            stroke="var(--border)"
            strokeWidth="0.5"
          />
          <text x={PAD - 6} y={y(v) + 3} textAnchor="end" fill="var(--text-tertiary)" fontSize="9">
            {v}
          </text>
        </g>
      ))}
      {data.map(
        (d, i) =>
          i % 2 === 0 && (
            <text
              key={i}
              x={x(i)}
              y={H - 4}
              textAnchor="middle"
              fill="var(--text-tertiary)"
              fontSize="8"
            >
              {d.date}
            </text>
          )
      )}
      {hasTarget && (
        <path
          d={targetPath}
          fill="none"
          stroke="var(--accent-coral)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.6"
        />
      )}
      <path
        d={realPath}
        fill="none"
        stroke="var(--accent-green)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <g key={i}>
          <circle
            cx={x(i)}
            cy={y(d.weight)}
            r="4"
            fill="var(--accent-green)"
            stroke="var(--bg-surface)"
            strokeWidth="2"
          />
          <title>
            {d.date}: {d.weight} kg
          </title>
        </g>
      ))}
    </svg>
  );
}

function MacroDonut({ data }) {
  const size = 180,
    cx = size / 2,
    cy = size / 2,
    r = 65,
    sw = 22;
  const circ = 2 * Math.PI * r;
  const segments = [
    { label: 'Proteínas', pct: data.proteinas, color: '#E05555' },
    { label: 'Carbohidratos', pct: data.carbohidratos, color: '#D4A257' },
    { label: 'Grasas', pct: data.grasas, color: '#7E57C2' },
  ];
  let offset = 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '16px 0',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * circ;
          const gap = circ - dash;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              style={{ transition: 'all 0.5s' }}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: seg.color,
                display: 'inline-block',
              }}
            ></span>
            <span style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
            <strong style={{ color: 'var(--text-primary)' }}>{seg.pct}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdherenceBars({ data }) {
  const allWeeks = data.flatMap((m) =>
    m.weeks.map((v, i) => ({ month: m.month, week: i + 1, value: v }))
  );
  return (
    <div style={{ padding: '16px 0' }}>
      <div
        style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 120, padding: '0 8px' }}
      >
        {allWeeks.map((w, i) => {
          const color =
            w.value >= 90 ? 'var(--accent-green)' : w.value >= 80 ? '#D4A257' : '#E05555';
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{w.value}%</span>
              <div
                style={{
                  width: '100%',
                  maxWidth: 28,
                  height: `${w.value}%`,
                  borderRadius: '4px 4px 0 0',
                  background: color,
                  transition: 'height 0.4s',
                  minHeight: 4,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', marginTop: 8, padding: '0 8px' }}>
        {data.map((m) => (
          <div
            key={m.month}
            style={{
              flex: m.weeks.length,
              textAlign: 'center',
              fontSize: 10,
              color: 'var(--text-tertiary)',
              borderTop: '1px solid var(--border)',
              paddingTop: 4,
            }}
          >
            {m.month}
          </div>
        ))}
      </div>
    </div>
  );
}

function MeasurementsTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <p style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
        Sin medidas corporales registradas.
      </p>
    );
  }
  const fields = [
    { key: 'cintura', label: 'Cintura' },
    { key: 'cadera', label: 'Cadera' },
    { key: 'brazo', label: 'Brazo' },
    { key: 'muslo', label: 'Muslo' },
  ];
  return (
    <div className="na-meas-table-wrap">
      <table className="na-meas-table">
        <thead>
          <tr>
            <th>Medida</th>
            {data.map((d) => (
              <th key={d.date}>{d.date}</th>
            ))}
            <th>Cambio</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => {
            const first = data[0][f.key];
            const last = data[data.length - 1][f.key];
            const diff = (last - first).toFixed(1);
            return (
              <tr key={f.key}>
                <td className="na-meas-label">{f.label}</td>
                {data.map((d) => (
                  <td key={d.date}>{d[f.key]} cm</td>
                ))}
                <td>
                  <span
                    className="na-meas-diff"
                    style={{ color: diff < 0 ? 'var(--accent-green)' : '#E05555' }}
                  >
                    {diff > 0 ? '+' : ''}
                    {diff} cm
                    {diff < 0 ? ' ↓' : ' ↑'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VisitNotes({ notes }) {
  const typeColors = { control: '#5B8DEF', medicion: '#7E57C2', inicial: 'var(--accent-green)' };
  const typeLabels = { control: 'Control', medicion: 'Medición', inicial: 'Inicial' };
  return (
    <div className="na-notes-list">
      {notes.map((n, i) => (
        <div key={i} className="na-note-item">
          <div className="na-note-dot" style={{ background: typeColors[n.type] }}></div>
          <div className="na-note-body">
            <div className="na-note-meta">
              <span className="na-note-date">{n.date}</span>
              <Badge color={typeColors[n.type]}>{typeLabels[n.type]}</Badge>
            </div>
            <p className="na-note-text">{n.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
