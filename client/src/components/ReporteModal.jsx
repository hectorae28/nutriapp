import { useState, useEffect } from 'react';
import { X, Printer, Leaf, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { reportesApi } from '../api/reportes';
import { Badge } from './SharedComponents';

function getIMCClassification(imc) {
  if (!imc) return { label: '—', color: 'var(--text-tertiary)' };
  if (imc < 18.5) return { label: 'Bajo peso', color: '#5B8DEF' };
  if (imc < 25) return { label: 'Normal', color: 'var(--accent-green)' };
  if (imc < 30) return { label: 'Sobrepeso', color: '#EF6C00' };
  return { label: 'Obesidad', color: '#E05555' };
}

export default function ReporteModal({ pacienteId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await reportesApi.reportePaciente(pacienteId);
        setData(result);
      } catch (err) {
        console.error('Error cargando reporte:', err);
        setError('No se pudo cargar el reporte. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pacienteId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="na-modal-overlay">
        <div className="na-reporte-modal">
          <div className="na-reporte-header">
            <div>
              <div
                style={{
                  width: 200,
                  height: 24,
                  background: 'var(--border)',
                  borderRadius: 4,
                  animation: 'pulse 1.5s infinite',
                }}
              />
            </div>
            <button className="na-icon-btn na-reporte-no-print" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="na-reporte-body" style={{ padding: 40, textAlign: 'center' }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent-green)',
                borderRadius: '50%',
                margin: '0 auto',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Cargando reporte...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="na-modal-overlay">
        <div className="na-reporte-modal">
          <div className="na-reporte-header">
            <div>
              <h2>Error</h2>
            </div>
            <button className="na-icon-btn na-reporte-no-print" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="na-reporte-body" style={{ padding: 40, textAlign: 'center' }}>
            <AlertCircle size={48} color="#E05555" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: 16, color: 'var(--text-primary)', fontWeight: 600 }}>{error}</p>
            <button className="na-btn na-btn-primary" onClick={onClose} style={{ marginTop: 20 }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.paciente) {
    return null;
  }

  const { paciente, expediente, plan_activo, progreso, examenes } = data;
  const imcClass = getIMCClassification(paciente.imc);
  const fechaHoy = new Date().toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const chartData =
    progreso?.map((p) => ({
      fecha: new Date(p.fecha).toLocaleDateString('es-CR', { month: 'short', day: 'numeric' }),
      peso: p.peso_kg,
    })) || [];

  return (
    <div className="na-modal-overlay">
      <div className="na-reporte-modal">
        {/* Header */}
        <div className="na-reporte-header">
          <div className="na-reporte-header-left">
            <div className="na-reporte-logo">
              <div className="na-logo-icon" style={{ width: 36, height: 36 }}>
                <Leaf size={20} />
              </div>
              <div>
                <h2 className="na-reporte-title">Reporte Nutricional - NutriApp</h2>
                <p className="na-reporte-subtitle">
                  {paciente.nombre} • {fechaHoy}
                </p>
              </div>
            </div>
          </div>
          <div className="na-reporte-header-actions na-reporte-no-print">
            <button className="na-btn na-btn-primary" onClick={handlePrint}>
              <Printer size={16} />
              Imprimir / PDF
            </button>
            <button className="na-icon-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="na-reporte-body na-reporte-print">
          {/* Sección 1: Datos del Paciente */}
          <section className="na-reporte-section">
            <h3 className="na-reporte-section-title">Datos del Paciente</h3>
            <div className="na-reporte-grid">
              <div className="na-reporte-field">
                <span className="na-reporte-field-label">Nombre completo</span>
                <span className="na-reporte-field-value">{paciente.nombre}</span>
              </div>
              <div className="na-reporte-field">
                <span className="na-reporte-field-label">Cédula</span>
                <span className="na-reporte-field-value">{paciente.cedula || '—'}</span>
              </div>
              <div className="na-reporte-field">
                <span className="na-reporte-field-label">Edad</span>
                <span className="na-reporte-field-value">
                  {paciente.edad ? `${paciente.edad} años` : '—'}
                </span>
              </div>
              <div className="na-reporte-field">
                <span className="na-reporte-field-label">Sexo</span>
                <span className="na-reporte-field-value">{paciente.sexo || '—'}</span>
              </div>
              <div className="na-reporte-field">
                <span className="na-reporte-field-label">Peso actual</span>
                <span className="na-reporte-field-value">
                  {paciente.peso_actual ? `${paciente.peso_actual} kg` : '—'}
                </span>
              </div>
              <div className="na-reporte-field">
                <span className="na-reporte-field-label">Talla</span>
                <span className="na-reporte-field-value">
                  {paciente.talla_cm ? `${paciente.talla_cm} cm` : '—'}
                </span>
              </div>
              <div className="na-reporte-field">
                <span className="na-reporte-field-label">IMC</span>
                <span className="na-reporte-field-value">
                  {paciente.imc ? paciente.imc.toFixed(1) : '—'}
                  {paciente.imc && (
                    <Badge color={imcClass.color} style={{ marginLeft: 8 }}>
                      {imcClass.label}
                    </Badge>
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* Sección 2: Expediente Clínico */}
          {expediente && (
            <section className="na-reporte-section">
              <h3 className="na-reporte-section-title">Expediente Clínico</h3>
              <div className="na-reporte-grid">
                {expediente.motivo_consulta && (
                  <div className="na-reporte-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="na-reporte-field-label">Motivo de consulta</span>
                    <span className="na-reporte-field-value">{expediente.motivo_consulta}</span>
                  </div>
                )}
                {expediente.antecedentes_patologicos && (
                  <div className="na-reporte-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="na-reporte-field-label">Antecedentes patológicos</span>
                    <span className="na-reporte-field-value">
                      {expediente.antecedentes_patologicos}
                    </span>
                  </div>
                )}
                {expediente.medicamentos && (
                  <div className="na-reporte-field">
                    <span className="na-reporte-field-label">Medicamentos</span>
                    <span className="na-reporte-field-value">{expediente.medicamentos}</span>
                  </div>
                )}
                {expediente.alergias && (
                  <div className="na-reporte-field">
                    <span className="na-reporte-field-label">Alergias</span>
                    <span className="na-reporte-field-value">{expediente.alergias}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Sección 3: Plan Alimenticio Activo */}
          {plan_activo && (
            <section className="na-reporte-section">
              <h3 className="na-reporte-section-title">Plan Alimenticio Activo</h3>
              <div className="na-reporte-plan-header">
                <div className="na-reporte-field">
                  <span className="na-reporte-field-label">Nombre del plan</span>
                  <span className="na-reporte-field-value">{plan_activo.nombre}</span>
                </div>
                <div className="na-reporte-field">
                  <span className="na-reporte-field-label">Tipo de dieta</span>
                  <span className="na-reporte-field-value">{plan_activo.tipo_dieta || '—'}</span>
                </div>
                <div className="na-reporte-field">
                  <span className="na-reporte-field-label">Kcal objetivo</span>
                  <span className="na-reporte-field-value">
                    {plan_activo.kcal_objetivo ? `${plan_activo.kcal_objetivo} kcal` : '—'}
                  </span>
                </div>
              </div>

              {plan_activo.tiempos_comida && plan_activo.tiempos_comida.length > 0 && (
                <div className="na-reporte-tiempos">
                  {plan_activo.tiempos_comida.map((tc, idx) => (
                    <div key={idx} className="na-reporte-tiempo">
                      <h4 className="na-reporte-tiempo-title">
                        {tc.nombre} {tc.hora && `• ${tc.hora}`}
                      </h4>
                      {tc.raciones && tc.raciones.length > 0 ? (
                        <table className="na-reporte-table">
                          <thead>
                            <tr>
                              <th>Grupo</th>
                              <th>Raciones</th>
                              <th>Kcal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tc.raciones.map((r, ridx) => (
                              <tr key={ridx}>
                                <td>{r.grupo_nombre}</td>
                                <td>{r.cantidad}</td>
                                <td>{r.kcal_racion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="na-reporte-empty-text">Sin raciones definidas</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Sección 4: Evolución del Peso */}
          {progreso && progreso.length > 0 && (
            <section className="na-reporte-section">
              <h3 className="na-reporte-section-title">Evolución del Peso</h3>
              <div className="na-reporte-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="fecha"
                      stroke="var(--text-secondary)"
                      style={{ fontSize: 12 }}
                    />
                    <YAxis stroke="var(--text-secondary)" style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="var(--accent-green)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--accent-green)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h4 className="na-reporte-subsection-title">Últimos 5 registros</h4>
              <table className="na-reporte-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Peso (kg)</th>
                    <th>IMC</th>
                  </tr>
                </thead>
                <tbody>
                  {progreso
                    .slice(-5)
                    .reverse()
                    .map((p, idx) => (
                      <tr key={idx}>
                        <td>{new Date(p.fecha).toLocaleDateString('es-CR')}</td>
                        <td>{p.peso_kg}</td>
                        <td>{p.imc ? p.imc.toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Sección 5: Últimos Exámenes Bioquímicos */}
          {examenes && examenes.length > 0 && (
            <section className="na-reporte-section">
              <h3 className="na-reporte-section-title">Últimos Exámenes Bioquímicos</h3>
              <table className="na-reporte-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Glucosa</th>
                    <th>HbA1c</th>
                    <th>Colesterol</th>
                    <th>LDL</th>
                    <th>HDL</th>
                    <th>Triglicéridos</th>
                  </tr>
                </thead>
                <tbody>
                  {examenes
                    .slice(-5)
                    .reverse()
                    .map((e, idx) => (
                      <tr key={idx}>
                        <td>{new Date(e.fecha).toLocaleDateString('es-CR')}</td>
                        <td>{e.glucosa_mg_dl ? `${e.glucosa_mg_dl} mg/dL` : '—'}</td>
                        <td>{e.hba1c ? `${e.hba1c}%` : '—'}</td>
                        <td>{e.colesterol_total ? `${e.colesterol_total} mg/dL` : '—'}</td>
                        <td>{e.ldl ? `${e.ldl} mg/dL` : '—'}</td>
                        <td>{e.hdl ? `${e.hdl} mg/dL` : '—'}</td>
                        <td>{e.trigliceridos ? `${e.trigliceridos} mg/dL` : '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
