import { NavLink } from 'react-router-dom';
import { Leaf, LayoutGrid, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-none">NutriPlan</h1>
            <p className="text-xs text-gray-400 leading-none mt-0.5">Plan de Alimentación</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/planalimentacion"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:block">Plan</span>
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:block">Admin</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
