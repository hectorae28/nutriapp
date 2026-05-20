import { createContext, useContext, useState, useEffect } from 'react';

// ── Theme Context ──
export const ThemeCtx = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('na-theme') === 'dark');

  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('na-theme', theme);
  }, [dark]);

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);

// ── Navigation Context ──
export const NavCtx = createContext();

export function NavProvider({ children }) {
  const [view, setView] = useState('planner');

  return (
    <NavCtx.Provider value={{ view, setView }}>
      {children}
    </NavCtx.Provider>
  );
}

export const useNav = () => useContext(NavCtx);

// ── Mobile hook ──
export function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
}
