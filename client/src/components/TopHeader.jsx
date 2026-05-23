import { Sun, Moon, Leaf } from 'lucide-react';
import { useTheme, useIsMobile } from '../contexts/AppContext';
import { MOCK_PATIENT } from '../data/nutriData';

export default function TopHeader({ title, subtitle }) {
  const { dark, toggle } = useTheme();
  const isMobile = useIsMobile();

  return (
    <header className="na-topbar">
      <div className="na-topbar-left">
        {isMobile && (
          <div className="na-topbar-mobile-logo">
            <div className="na-logo-icon" style={{ width: 32, height: 32 }}>
              <Leaf size={18} />
            </div>
            <span className="na-logo-title" style={{ fontSize: 16 }}>NutriPlan</span>
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
          <div className="na-avatar-sm">
            {MOCK_PATIENT.name.split(' ').map(n => n[0]).join('')}
          </div>
          <span>{MOCK_PATIENT.name}</span>
        </div>
        {!isMobile && (
          <button className="na-icon-btn" onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>
    </header>
  );
}
