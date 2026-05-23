import { Sun, Moon } from 'lucide-react';
import { useNav, useTheme, useIsMobile } from '../contexts/AppContext';
import { NAV_ITEMS } from './Sidebar';

export default function BottomNav() {
  const { view, setView } = useNav();
  const { dark, toggle } = useTheme();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <nav className="na-bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`na-bnav-item ${view === item.id ? 'active' : ''}`}
          onClick={() => setView(item.id)}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </button>
      ))}
      <button className="na-bnav-item" onClick={toggle}>
        {dark ? <Sun size={20} /> : <Moon size={20} />}
        <span>Tema</span>
      </button>
    </nav>
  );
}
