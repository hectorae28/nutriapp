/* ── NutriApp: Patient Profile View ─────────────────────── */
const { useState: useStatePrf } = React;

function ProfileView() {
  const p = MOCK_PATIENT;
  const w = MOCK_WEIGHT_DATA;
  const currentW = w[w.length - 1].weight;
  const bmi = (currentW / ((p.height / 100) ** 2)).toFixed(1);
  const bmiCat = bmi < 18.5 ? 'Bajo peso' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Sobrepeso' : 'Obesidad';
  const bmiPct = Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100);

  const daysSince = Math.floor((new Date() - new Date(p.startDate)) / 86400000);
  const daysToNext = Math.max(0, Math.floor((new Date(p.nextVisit) - new Date()) / 86400000));

  return (
    <div className="na-profile-view">
      <TopHeader title="Perfil del Paciente" subtitle="Información personal y objetivos"/>

      <div className="na-profile-content">
        {/* Patient card */}
        <div className="na-profile-hero">
          <div className="na-profile-avatar">
            <span>{p.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="na-profile-hero-info">
            <h2 className="na-profile-name">{p.name}</h2>
            <p className="na-profile-objective">{p.objective}</p>
            <div className="na-profile-tags">
              <Badge color="var(--accent-green)">{p.sex}</Badge>
              <Badge color="#5B8DEF">{p.age} años</Badge>
              <Badge color="#7E57C2">{p.height} cm</Badge>
            </div>
          </div>
        </div>

        <div className="na-profile-grid">
          {/* Contact info */}
          <div className="na-pcard">
            <h4 className="na-pcard-title">Información de Contacto</h4>
            <div className="na-pcard-rows">
              <div className="na-pcard-row">
                <span className="na-pcard-label">Email</span>
                <span className="na-pcard-value">{p.email}</span>
              </div>
              <div className="na-pcard-row">
                <span className="na-pcard-label">Teléfono</span>
                <span className="na-pcard-value">{p.phone}</span>
              </div>
              <div className="na-pcard-row">
                <span className="na-pcard-label">Inicio del plan</span>
                <span className="na-pcard-value">{p.startDate.split('-').reverse().join('/')}</span>
              </div>
              <div className="na-pcard-row">
                <span className="na-pcard-label">Días en plan</span>
                <span className="na-pcard-value">{daysSince} días</span>
              </div>
            </div>
          </div>

          {/* Current metrics */}
          <div className="na-pcard">
            <h4 className="na-pcard-title">Métricas Actuales</h4>
            <div className="na-metrics-grid">
              <div className="na-metric">
                <span className="na-metric-value">{currentW}</span>
                <span className="na-metric-unit">kg</span>
                <span className="na-metric-label">Peso</span>
              </div>
              <div className="na-metric">
                <span className="na-metric-value">{bmi}</span>
                <span className="na-metric-unit">IMC</span>
                <span className="na-metric-label">{bmiCat}</span>
              </div>
              <div className="na-metric">
                <span className="na-metric-value">{MOCK_MEASUREMENTS[MOCK_MEASUREMENTS.length - 1].cintura}</span>
                <span className="na-metric-unit">cm</span>
                <span className="na-metric-label">Cintura</span>
              </div>
              <div className="na-metric">
                <span className="na-metric-value">{w[0].weight - currentW > 0 ? '-' : ''}{(w[0].weight - currentW).toFixed(1)}</span>
                <span className="na-metric-unit">kg</span>
                <span className="na-metric-label">Perdido</span>
              </div>
            </div>
            {/* BMI gauge */}
            <div className="na-bmi-gauge">
              <div className="na-bmi-bar">
                <div className="na-bmi-fill" style={{ width: `${bmiPct}%` }}></div>
                <div className="na-bmi-marker" style={{ left: `${bmiPct}%` }}></div>
              </div>
              <div className="na-bmi-labels">
                <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
              </div>
            </div>
          </div>

          {/* Allergies & conditions */}
          <div className="na-pcard">
            <h4 className="na-pcard-title">Alergias y Condiciones</h4>
            <div className="na-pcard-section">
              <span className="na-pcard-section-label">Alergias alimentarias</span>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {p.allergies.map(a => (
                  <span key={a} className="na-allergy-tag">{a}</span>
                ))}
              </div>
            </div>
            <div className="na-pcard-section" style={{ marginTop:16 }}>
              <span className="na-pcard-section-label">Condiciones médicas</span>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {p.conditions.map(c => (
                  <span key={c} className="na-condition-tag">{c}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Next visit */}
          <div className="na-pcard na-next-visit-card">
            <h4 className="na-pcard-title">Próxima Consulta</h4>
            <div className="na-next-visit">
              <div className="na-next-visit-icon"><I.Calendar size={28}/></div>
              <div>
                <span className="na-next-visit-date">{p.nextVisit.split('-').reverse().join('/')}</span>
                <span className="na-next-visit-days">{daysToNext > 0 ? `En ${daysToNext} días` : 'Hoy'}</span>
              </div>
            </div>
          </div>

          {/* Macro targets */}
          <div className="na-pcard wide">
            <h4 className="na-pcard-title">Distribución Calórica Objetivo</h4>
            <div className="na-macro-bars">
              {[
                { label: 'Proteínas', pct: MOCK_MACROS.proteinas, color: '#E05555', kcal: Math.round(1800 * MOCK_MACROS.proteinas / 100) },
                { label: 'Carbohidratos', pct: MOCK_MACROS.carbohidratos, color: '#D4A257', kcal: Math.round(1800 * MOCK_MACROS.carbohidratos / 100) },
                { label: 'Grasas', pct: MOCK_MACROS.grasas, color: '#7E57C2', kcal: Math.round(1800 * MOCK_MACROS.grasas / 100) },
              ].map(m => (
                <div key={m.label} className="na-macro-bar-row">
                  <div className="na-macro-bar-label">
                    <span className="na-macro-bar-dot" style={{ background: m.color }}></span>
                    <span>{m.label}</span>
                    <span className="na-macro-bar-pct">{m.pct}%</span>
                    <span className="na-macro-bar-kcal">{m.kcal} kcal</span>
                  </div>
                  <div className="na-macro-bar-track">
                    <div className="na-macro-bar-fill" style={{ width: `${m.pct}%`, background: m.color }}></div>
                  </div>
                </div>
              ))}
              <div className="na-macro-total">
                <span>Total diario objetivo:</span>
                <strong>1,800 kcal</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileView });
