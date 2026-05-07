import { Leaf, RotateCcw } from "lucide-react";

export default function Header({ onReset }) {
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

        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            Sistema de Intercambio Alimentario
          </span>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-full transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            Reiniciar
          </button>
        </div>
      </div>
    </header>
  );
}
