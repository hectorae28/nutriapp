import { useState, useEffect } from 'react';
import { Users, Activity, Clipboard, UserPlus, FlaskConical, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TopHeader from '../components/TopHeader';
import { StatCard, Badge } from '../components/SharedComponents';
import { reportesApi } from '../api/reportes';
import ReporteModal from '../components/ReporteModal';

const DIET_COLORS = {
  hipocalorico: '#5B8DEF',
  normocalorico: '#43A047',
  hipercalorico: '#E05555',
  diabetico: '#D4A257',
  otro: '#7E57C2',
};

function getAdherenciaColor(pct) {
  if (pct >= 75) return 'var(--accent-green)';
  if (pct >= 50) return '#EF6C00';
  return '#E05555';
}

function AdherenciaBar({ pct }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--border-light)',
        borderRadius: 6,
        height: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(pct, 100)}%`,
          height: '100%',
          background: getAdherenciaColor(pct),
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

export default function DashboardView() {
  const [metricas, setMetricas] = useState(null);
  const [comparativa, setComparativa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [metricasData, comparativaData] = await Promise.all([
          reportesApi.metricas(),
          reportesApi.comparativa(),
        ]);
        setMetricas(metricasData);
        setComparativa(comparativaData);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="na-view">
        <TopHeader title="Dashboard" subtitle="Métricas generales" />
        <div className="na-dashboard-content">
          <div className="na-stats-row">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="na-stat-card" style={{ minHeight: 80 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    background: 'var(--border)',
                    borderRadius: 'var(--radius-md)',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      width: 60,
                      height: 20,
                      background: 'var(--border)',
                      borderRadius: 4,
                      marginBottom: 6,
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                  <div
                    style={{
                      width: 100,
                      height: 12,
                      background: 'var(--border)',
                      borderRadius: 4,
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metricas) {
    return (
      <div className="na-view">
        <TopHeader title="Dashboard" subtitle="Métricas generales" />
        <div className="na-dashboard-content">
          <div className="na-empty">
            <Activity size={40} style={{ opacity: 0.2 }} />
            <p className="na-empty-title">No hay datos disponibles</p>
            <p className="na-empty-msg">Intenta nuevamente más tarde</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData =
    metricas.distribucion_tipo_dieta?.map((d) => ({
      name: d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1),
      value: d.total,
    })) || [];

  return (
    <div className="na-view">
      <TopHeader title="Dashboard" subtitle="Métricas generales de nutricionista" />

      <div className="na-dashboard-content">
        {/* Sección 1: Tarjetas de métricas */}
        <div className="na-stats-row">
          <StatCard
            icon={Users}
            label="Total pacientes"
            value={metricas.total_pacientes || 0}
            color="#5B8DEF"
          />
          <StatCard
            icon={Activity}
            label="Pacientes activos"
            value={metricas.pacientes_activos || 0}
            color="var(--accent-green)"
          />
          <StatCard
            icon={Clipboard}
            label="Planes activos"
            value={metricas.planes_activos || 0}
            color="#7E57C2"
          />
          <StatCard
            icon={UserPlus}
            label="Nuevos este mes"
            value={metricas.nuevos_pacientes_mes || 0}
            color="#EF6C00"
          />
          <StatCard
            icon={FlaskConical}
            label="Exámenes este mes"
            value={metricas.examenes_este_mes || 0}
            color="#E05555"
          />
          <StatCard
            icon={TrendingUp}
            label="Con progreso reciente"
            value={metricas.pacientes_con_progreso_reciente || 0}
            color="#D4A257"
          />
        </div>

        {/* Sección 2: Gráficas */}
        <div className="na-dashboard-charts">
          <div className="na-dashboard-chart-card">
            <h3 className="na-dashboard-chart-title">Distribución de Dietas</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => {
                      const color = DIET_COLORS[entry.name.toLowerCase()] || '#7E57C2';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="na-empty" style={{ padding: '40px 20px' }}>
                <p className="na-empty-msg">No hay datos de dietas</p>
              </div>
            )}
          </div>

          <div className="na-dashboard-chart-card">
            <h3 className="na-dashboard-chart-title">Resumen de Adherencia</h3>
            <div className="na-adherencia-list">
              {comparativa.slice(0, 5).map((p) => (
                <div key={p.paciente_id} className="na-adherencia-item">
                  <div className="na-adherencia-item-header">
                    <span className="na-adherencia-name">{p.nombre}</span>
                    <Badge color={getAdherenciaColor(p.adherencia_pct)}>
                      {p.adherencia_pct || 0}%
                    </Badge>
                  </div>
                  <AdherenciaBar pct={p.adherencia_pct || 0} />
                </div>
              ))}
              {comparativa.length === 0 && (
                <div className="na-empty" style={{ padding: '40px 20px' }}>
                  <p className="na-empty-msg">No hay datos de adherencia</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección 3: Tabla comparativa */}
        <div className="na-dashboard-table-card">
          <h3 className="na-dashboard-section-title">Tabla Comparativa de Pacientes</h3>
          {comparativa.length > 0 ? (
            <div className="na-table-container">
              <table className="na-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Peso</th>
                    <th>Δ kg</th>
                    <th>IMC</th>
                    <th>Plan activo</th>
                    <th>Adherencia</th>
                    <th>Último registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comparativa.map((p) => {
                    const diff = p.diferencia_kg || 0;
                    const diffColor =
                      diff < 0
                        ? 'var(--accent-green)'
                        : diff > 0
                          ? '#E05555'
                          : 'var(--text-secondary)';
                    const diffSign = diff > 0 ? '+' : '';

                    return (
                      <tr key={p.paciente_id}>
                        <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                        <td>
                          {p.peso_inicial
                            ? `${p.peso_inicial} → ${p.peso_actual} kg`
                            : `${p.peso_actual} kg`}
                        </td>
                        <td style={{ color: diffColor, fontWeight: 600 }}>
                          {diffSign}
                          {diff.toFixed(1)} kg
                        </td>
                        <td>{p.imc_actual ? p.imc_actual.toFixed(1) : '—'}</td>
                        <td>
                          {p.plan_activo ? (
                            <Badge color="#7E57C2">{p.plan_activo}</Badge>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)' }}>Sin plan</span>
                          )}
                        </td>
                        <td>
                          <Badge color={getAdherenciaColor(p.adherencia_pct || 0)}>
                            {p.adherencia_pct || 0}%
                          </Badge>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                          {p.ultimo_registro || '—'}
                        </td>
                        <td>
                          <button
                            className="na-btn-sm na-btn-primary"
                            onClick={() => setSelectedPacienteId(p.paciente_id)}
                          >
                            📄 Reporte
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="na-empty">
              <Users size={40} style={{ opacity: 0.2 }} />
              <p className="na-empty-title">No hay pacientes</p>
              <p className="na-empty-msg">Agrega pacientes para ver la comparativa</p>
            </div>
          )}
        </div>
      </div>

      {selectedPacienteId && (
        <ReporteModal pacienteId={selectedPacienteId} onClose={() => setSelectedPacienteId(null)} />
      )}
    </div>
  );
}
