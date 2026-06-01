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
  const { isNutricionista, isAdmin, logout } = useAuth();

  if (!isMobile) return null;

  const items = isNutricionista || isAdmin ? [...NUTRICIONISTA_ITEMS, ...NAV_ITEMS_BASE] : NAV_ITEMS_BASE;

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
