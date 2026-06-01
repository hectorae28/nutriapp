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
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);

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

// ── Paciente Context ──
export const PacienteCtx = createContext();

export function PacienteProvider({ children }) {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  return (
    <PacienteCtx.Provider value={{ pacienteSeleccionado, setPacienteSeleccionado }}>
      {children}
    </PacienteCtx.Provider>
  );
}

export const usePaciente = () => useContext(PacienteCtx);
