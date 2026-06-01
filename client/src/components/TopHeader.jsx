import { Sun, Moon, Leaf } from 'lucide-react';
import { useTheme, useIsMobile } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

export default function TopHeader({ title, subtitle, action }) {
  const { dark, toggle } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // Get user display name from auth context
  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Usuario'
    : 'Usuario';
  
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="na-topbar">
      <div className="na-topbar-left">
        {isMobile && (
          <div className="na-topbar-mobile-logo">
            <div className="na-logo-icon" style={{ width: 32, height: 32 }}>
              <Leaf size={18} />
            </div>
            <span className="na-logo-title" style={{ fontSize: 16 }}>
              NutriPlan
            </span>
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
        {action && action}
        <NotificationBell />
        <div className="na-patient-pill">
          <div className="na-avatar-sm">
            {initials}
          </div>
          <span>{displayName}</span>
        </div>
        {!isMobile && (
          <button
            className="na-icon-btn"
            onClick={toggle}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>
    </header>
  );
}
