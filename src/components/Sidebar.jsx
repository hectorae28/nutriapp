import {
  Calendar,
  LayoutGrid,
  BarChart2,
  User,
  Sun,
  Moon,
  Leaf,
} from "lucide-react";
import { useNav, useTheme, useIsMobile } from "../contexts/AppContext";
import { MOCK_PATIENT } from "../data/nutriData";

export const NAV_ITEMS = [
  { id: "planner", label: "Planificador", icon: Calendar },
  { id: "tables", label: "Tablas", icon: LayoutGrid },
  { id: "reports", label: "Reportes", icon: BarChart2 },
  { id: "profile", label: "Paciente", icon: User },
];

export default function Sidebar() {
  const { view, setView } = useNav();
  const { dark, toggle } = useTheme();
  const isMobile = useIsMobile();

  if (isMobile) return null;

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
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`na-nav-item ${view === item.id ? "active" : ""}`}
            onClick={() => setView(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="na-sidebar-footer">
        <div className="na-patient-card-mini">
          <div className="na-avatar">
            {MOCK_PATIENT.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="na-patient-info-mini">
            <span className="na-patient-name-mini">{MOCK_PATIENT.name}</span>
            <span className="na-patient-meta-mini">
              {MOCK_PATIENT.objective}
            </span>
          </div>
        </div>
        <button
          className="na-theme-toggle"
          onClick={toggle}
          title={dark ? "Modo claro" : "Modo oscuro"}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </aside>
  );
}
