import { NavLink } from 'react-router-dom';
import { Sun, Moon, Users, Home, LogOut } from 'lucide-react';
import { useTheme, useIsMobile } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { NAV_ITEMS_BASE } from './Sidebar';

const NUTRICIONISTA_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/pacientes', label: 'Pacientes', icon: Users },
];

export default function BottomNav() {
  const { dark, toggle } = useTheme();
  const isMobile = useIsMobile();
  const { isNutricionista, isAdmin, isSecretario, logout } = useAuth();

  if (!isMobile) return null;

  const items = (() => {
    if (isNutricionista || isAdmin) return [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/pacientes', label: 'Pacientes', icon: Users },
      { path: '/planner', label: 'Plan Alimenticio', icon: NAV_ITEMS_BASE[0].icon },
      { path: '/tablas', label: 'Tablas', icon: NAV_ITEMS_BASE[1].icon },
      { path: '/reportes', label: 'Reportes', icon: NAV_ITEMS_BASE[2].icon },
      { path: '/perfil', label: 'Perfil', icon: NAV_ITEMS_BASE[3].icon },
    ];
    if (isSecretario) return [
      { path: '/pacientes', label: 'Pacientes', icon: Users },
      { path: '/perfil', label: 'Perfil', icon: NAV_ITEMS_BASE[3].icon },
    ];
    // Paciente
    return [
      { path: '/planner', label: 'Mi Plan', icon: NAV_ITEMS_BASE[0].icon },
      { path: '/reportes', label: 'Mi Progreso', icon: NAV_ITEMS_BASE[2].icon },
      { path: '/perfil', label: 'Perfil', icon: NAV_ITEMS_BASE[3].icon },
    ];
  })();

  return (
    <nav className="na-bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `na-bnav-item${isActive ? ' active' : ''}`}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <button className="na-bnav-item" onClick={toggle}>
        {dark ? <Sun size={20} /> : <Moon size={20} />}
        <span>Tema</span>
      </button>
      <button className="na-bnav-item" onClick={logout}>
        <LogOut size={20} />
        <span>Salir</span>
      </button>
    </nav>
  );
}
