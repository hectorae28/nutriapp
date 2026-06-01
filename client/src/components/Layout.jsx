import { Link, useLocation } from 'react-router-dom';
import { Users, BookOpen, TrendingUp, LayoutDashboard, LogOut } from 'lucide-react';

const navByRole = {
  nutricionista: [
    { to: '/pacientes', label: 'Pacientes', icon: Users },
    { to: '/catalogo', label: 'Catálogo', icon: BookOpen },
  ],
  paciente: [
    { to: '/mi-plan', label: 'Mi Plan', icon: LayoutDashboard },
    { to: '/mi-progreso', label: 'Mi Progreso', icon: TrendingUp },
  ],
  admin: [
    { to: '/catalogo', label: 'Catálogo', icon: BookOpen },
    { to: '/usuarios', label: 'Usuarios', icon: Users },
  ],
};

export default function Layout({ children, rol = 'paciente' }) {
  const location = useLocation();
  const links = navByRole[rol] ?? [];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="text-lg font-bold text-green-700">NutriApp</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                location.pathname.startsWith(to)
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 w-full">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
