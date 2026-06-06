/* ── NutriApp Shared: Icons, Theme, Layout ─────────────── */
const { useState, useEffect, useContext, createContext, useCallback } = React;

// ── Icons (Lucide-style SVGs) ──
const Icon = ({ d, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {typeof d === 'string' ? <path d={d}/> : d}
  </svg>
);
const I = {
  Home:     (p) => <Icon {...p} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>,
  Calendar: (p) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}/>,
  Table:    (p) => <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></>}/>,
  Chart:    (p) => <Icon {...p} d={<><path d="M18 20V10M12 20V4M6 20v-6"/></>}/>,
  User:     (p) => <Icon {...p} d={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>,
  Sun:      (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>}/>,
  Moon:     (p) => <Icon {...p} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
  Search:   (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>}/>,
  Plus:     (p) => <Icon {...p} d="M12 5v14M5 12h14"/>,
  X:        (p) => <Icon {...p} d="M18 6L6 18M6 6l12 12"/>,
  ChevDown: (p) => <Icon {...p} d="M6 9l6 6 6-6"/>,
  ChevRight:(p) => <Icon {...p} d="M9 18l6-6-6-6"/>,
  Clock:    (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>}/>,
  Trash:    (p) => <Icon {...p} d={<><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>}/>,
  Edit:     (p) => <Icon {...p} d={<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>,
  Check:    (p) => <Icon {...p} d="M20 6L9 17l-5-5"/>,
  Filter:   (p) => <Icon {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>,
  Leaf:     (p) => <Icon {...p} d={<><path d="M11 20A7 7 0 019.8 6.9C15.5 4.9 20 1 20 1s-1.4 7.4-5 11c-1.3 1.3-2.8 2.3-4 3z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>}/>,
  Bell:     (p) => <Icon {...p} d={<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>}/>,
  Menu:     (p) => <Icon {...p} d="M3 12h18M3 6h18M3 18h18"/>,
  Weight:   (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6"/><path d="M8 16h8"/></>}/>,
  Target:   (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}/>,
  TrendUp:  (p) => <Icon {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>,
  TrendDn:  (p) => <Icon {...p} d={<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>}/>,
  Clipboard:(p) => <Icon {...p} d={<><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>}/>,
  Heart:    (p) => <Icon {...p} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>,
  Minus:    (p) => <Icon {...p} d="M5 12h14"/>,
  Droplet:  (p) => <Icon {...p} d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>,
  Activity: (p) => <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
};

// ── Theme Context ──
const ThemeCtx = createContext();
function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('na-theme') === 'dark');
  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('na-theme', theme);
  }, [dark]);
  return <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>{children}</ThemeCtx.Provider>;
}
const useTheme = () => useContext(ThemeCtx);

// ── Navigation Context ──
const NavCtx = createContext();
function NavProvider({ children }) {
  const [view, setView] = useState('planner');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <NavCtx.Provider value={{ view, setView, sidebarOpen, setSidebarOpen }}>
    {children}
  </NavCtx.Provider>;
}
const useNav = () => useContext(NavCtx);

// ── Sidebar ──
const NAV_ITEMS = [
  { id: 'planner', label: 'Planificador', icon: I.Calendar },
  { id: 'tables', label: 'Tablas', icon: I.Table },
  { id: 'reports', label: 'Reportes', icon: I.Chart },
  { id: 'profile', label: 'Paciente', icon: I.User },
];

function Sidebar() {
  const { view, setView, sidebarOpen, setSidebarOpen } = useNav();
  const { dark, toggle } = useTheme();
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <aside className="na-sidebar">
      <div className="na-sidebar-logo">
        <div className="na-logo-icon"><span className="na-logo-mark">dp</span></div>
        <div className="na-logo-text">
          <span className="na-logo-title">Domingo Porras</span>
          <span className="na-logo-sub">Nutricionista</span>
        </div>
      </div>

      <nav className="na-sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            className={`na-nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}>
            <item.icon size={20}/>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="na-sidebar-footer">
        <div className="na-patient-card-mini">
          <div className="na-avatar">MG</div>
          <div className="na-patient-info-mini">
            <span className="na-patient-name-mini">{MOCK_PATIENT.name}</span>
            <span className="na-patient-meta-mini">{MOCK_PATIENT.objective}</span>
          </div>
        </div>
        <button className="na-theme-toggle" onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}>
          {dark ? <I.Sun size={18}/> : <I.Moon size={18}/>}
        </button>
      </div>
    </aside>
  );
}

// ── Mobile Bottom Nav ──
function BottomNav() {
  const { view, setView } = useNav();
  const { dark, toggle } = useTheme();
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <nav className="na-bottom-nav">
      {NAV_ITEMS.map(item => (
        <button key={item.id}
          className={`na-bnav-item ${view === item.id ? 'active' : ''}`}
          onClick={() => setView(item.id)}>
          <item.icon size={20}/>
          <span>{item.label}</span>
        </button>
      ))}
      <button className="na-bnav-item" onClick={toggle}>
        {dark ? <I.Sun size={20}/> : <I.Moon size={20}/>}
        <span>Tema</span>
      </button>
    </nav>
  );
}

// ── Top Header ──
function TopHeader({ title, subtitle }) {
  const { dark, toggle } = useTheme();
  const { setSidebarOpen } = useNav();
  const isMobile = useIsMobile();

  return (
    <header className="na-topbar">
      <div className="na-topbar-left">
        {isMobile && (
          <div className="na-topbar-mobile-logo">
            <div className="na-logo-icon" style={{width:32,height:32}}><span className="na-logo-mark" style={{fontSize:17}}>dp</span></div>
            <span className="na-logo-title" style={{fontSize:16}}>Domingo Porras</span>
          </div>
        )}
        {!isMobile && (
          <div>
            <h1 className="na-topbar-title">{title}</h1>
            {subtitle && <p className="na-topbar-subtitle">{subtitle}</p>}
          </div>
        )}
      </div>
      <div className="na-topbar-right">
        <div className="na-patient-pill">
          <div className="na-avatar-sm">MG</div>
          <span>{MOCK_PATIENT.name}</span>
        </div>
        {!isMobile && (
          <button className="na-icon-btn" onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}>
            {dark ? <I.Sun size={18}/> : <I.Moon size={18}/>}
          </button>
        )}
      </div>
    </header>
  );
}

// ── Hooks ──
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
}

// ── Shared UI Components ──
function StatCard({ icon: IconComp, label, value, sub, color }) {
  return (
    <div className="na-stat-card">
      <div className="na-stat-icon" style={{ background: color + '18', color: color }}>
        <IconComp size={20}/>
      </div>
      <div className="na-stat-body">
        <span className="na-stat-value">{value}</span>
        <span className="na-stat-label">{label}</span>
        {sub && <span className="na-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

function Badge({ children, color, style }) {
  return (
    <span className="na-badge" style={{ background: color + '20', color, ...style }}>
      {children}
    </span>
  );
}

function ProgressRing({ value, max, size = 44, stroke = 4, color }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const complete = value >= max && max > 0;
  const c = complete ? 'var(--accent-green)' : color;
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="var(--border)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={c} strokeWidth={stroke}
          strokeDasharray={`${circ * pct} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize: size < 40 ? 10 : 12, fontWeight:700, color: complete ? 'var(--accent-green)' : 'var(--text-primary)' }}>
          {value}/{max}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ icon: IconComp, title, message }) {
  return (
    <div className="na-empty">
      <IconComp size={40} style={{ opacity: 0.2 }}/>
      <p className="na-empty-title">{title}</p>
      <p className="na-empty-msg">{message}</p>
    </div>
  );
}

Object.assign(window, {
  I, Icon, ThemeCtx, ThemeProvider, useTheme, NavCtx, NavProvider, useNav,
  Sidebar, BottomNav, TopHeader, useIsMobile,
  StatCard, Badge, ProgressRing, EmptyState, NAV_ITEMS,
});
