// Shared UI components: StatCard, Badge, ProgressRing, EmptyState

export function StatCard({ icon: IconComp, label, value, sub, color }) {
  return (
    <div className="na-stat-card">
      <div className="na-stat-icon" style={{ background: color + '18', color }}>
        <IconComp size={20} />
      </div>
      <div className="na-stat-body">
        <span className="na-stat-value">{value}</span>
        <span className="na-stat-label">{label}</span>
        {sub && <span className="na-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

export function Badge({ children, color, style }) {
  return (
    <span className="na-badge" style={{ background: color + '20', color, ...style }}>
      {children}
    </span>
  );
}

export function ProgressRing({ value, max, size = 44, stroke = 4, color }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const complete = value >= max && max > 0;
  const c = complete ? 'var(--accent-green)' : color;

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={c} strokeWidth={stroke}
          strokeDasharray={`${circ * pct} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size < 40 ? 10 : 12, fontWeight: 700, color: complete ? 'var(--accent-green)' : 'var(--text-primary)' }}>
          {value}/{max}
        </span>
      </div>
    </div>
  );
}

export function EmptyState({ icon: IconComp, title, message }) {
  return (
    <div className="na-empty">
      <IconComp size={40} style={{ opacity: 0.2 }} />
      <p className="na-empty-title">{title}</p>
      <p className="na-empty-msg">{message}</p>
    </div>
  );
}
