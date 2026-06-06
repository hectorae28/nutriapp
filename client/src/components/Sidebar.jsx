import { NavLink } from 'react-router-dom';
import { Calendar, LayoutGrid, BarChart2, User, Users, Sun, Moon, Leaf, Home, LogOut } from 'lucide-react';
import { useTheme, useIsMobile } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

export const NAV_ITEMS_BASE = [
  { path: '/planner', label: 'Plan Alimenticio', icon: Calendar },
  { path: '/tablas', label: 'Tablas', icon: LayoutGrid },
  { path: '/reportes', label: 'Reportes', icon: BarChart2 },
  { path: '/perfil', label: 'Paciente', icon: User },
];

export const NAV_ITEMS = NAV_ITEMS_BASE;

export default function Sidebar() {
  const { dark, toggle } = useTheme();
  const isMobile = useIsMobile();
  const { user, groups, isNutricionista, isAdmin, isSecretario, logout } = useAuth();

  if (isMobile) return null;

  const navItems = (() => {
    if (isNutricionista || isAdmin) return [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/pacientes', label: 'Pacientes', icon: Users },
      { path: '/planner', label: 'Plan Alimenticio', icon: Calendar },
      { path: '/tablas', label: 'Tablas', icon: LayoutGrid },
      { path: '/perfil', label: 'Perfil', icon: User },
    ];
    if (isSecretario) return [
      { path: '/pacientes', label: 'Pacientes', icon: Users },
      { path: '/perfil', label: 'Perfil', icon: User },
    ];
    // Paciente
    return [
      { path: '/planner', label: 'Mi Plan', icon: Calendar },
      { path: '/reportes', label: 'Mi Progreso', icon: BarChart2 },
      { path: '/perfil', label: 'Perfil', icon: User },
    ];
  })();

  const nombreCompleto = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username
    : '—';
  const rol = groups?.[0] || 'Usuario';

  return (
    <aside className="na-sidebar">
      <div className="na-sidebar-logo">
        <div className="na-logo-icon">
          <Leaf size={22} />
        </div>
        <div className="na-logo-text">
          <span className="na-logo-title">Domingo Porras</span>
          <span className="na-logo-sub">Gestión Nutricional</span>
        </div>
      </div>

      <nav className="na-sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `na-nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="na-sidebar-footer">
        <div className="na-patient-card-mini">
          <div className="na-avatar">
            {nombreCompleto
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || '?'}
          </div>
          <div className="na-patient-info-mini">
            <span className="na-patient-name-mini">{nombreCompleto}</span>
            <span className="na-patient-meta-mini">{rol}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="na-theme-toggle"
            onClick={toggle}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="na-theme-toggle"
            onClick={logout}
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
