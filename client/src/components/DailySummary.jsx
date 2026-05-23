import { useState } from "react";
import { ChevronUp, ChevronDown, ClipboardList, Trash2 } from "lucide-react";
import { LIST_COLORS, foodLists } from "../data/foodLists";

export default function DailySummary({ meals, selections, onClearAll }) {
  const [open, setOpen] = useState(false);

  // selections shape: { mealId: { listId: [items] } }
  const totalItems = Object.values(selections).reduce(
    (acc, byList) => acc + Object.values(byList).reduce((a, arr) => a + arr.length, 0),
    0
  );

  const completedMeals = meals.filter((m) =>
    m.slots.every((s) => (selections[m.id]?.[s.listId]?.length || 0) >= s.targetRations)
  ).length;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl transition-all duration-300 ${
        open ? "max-h-[70vh]" : "max-h-16"
      } overflow-hidden`}
    >
      {/* Toggle bar */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-gray-800 text-sm">Receta del Día</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">
                {totalItems} alimentos · {completedMeals}/{meals.length} comidas completas
              </span>
              {completedMeals === meals.length && meals.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  ✓ Plan completo
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalItems > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearAll(); }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Limpiar
            </button>
          )}
          {open ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {open && (
        <div
          className="overflow-y-auto scrollbar-thin px-6 pb-6"
          style={{ maxHeight: "calc(70vh - 64px)" }}
        >
          {totalItems === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aún no has agregado alimentos</p>
              <p className="text-xs mt-1 opacity-70">
                Haz click en "Agregar alimento" en alguna comida para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {meals.map((meal) => {
                const mealSel = selections[meal.id] || {};
                const hasAny = Object.values(mealSel).some((arr) => arr.length > 0);
                if (!hasAny) return null;

                const allComplete = meal.slots.every(
                  (s) => (mealSel[s.listId]?.length || 0) >= s.targetRations
                );

                return (
                  <div
                    key={meal.id}
                    className={`rounded-xl border-2 overflow-hidden ${
                      allComplete ? "border-emerald-200" : "border-gray-200"
                    }`}
                  >
                    {/* Meal header */}
                    <div
                      className={`px-3 py-2 flex items-center justify-between ${
                        allComplete ? "bg-emerald-500" : "bg-gray-800"
                      }`}
                    >
                      <span className="text-white font-bold text-sm">{meal.name}</span>
                      <span className="text-white/60 text-xs">{meal.time}</span>
                    </div>

                    {/* Slots */}
                    {meal.slots.map((slot) => {
                      const items = mealSel[slot.listId] || [];
                      if (items.length === 0) return null;
                      const lc = LIST_COLORS[slot.listId];
                      const list = foodLists.find((l) => l.id === slot.listId);
                      const done = items.length >= slot.targetRations;
                      return (
                        <div key={slot.listId}>
                          {/* Slot sub-header */}
                          <div className={`px-3 py-1.5 flex items-center justify-between ${lc.light}`}>
                            <span className={`text-xs font-semibold ${lc.text} flex items-center gap-1`}>
                              {list?.icon} {list?.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${done ? "bg-emerald-100 text-emerald-700" : lc.badge}`}>
                              {items.length}/{slot.targetRations}
                            </span>
                          </div>
                          {/* Items */}
                          <ul className="divide-y divide-gray-50">
                            {items.map((item, i) => (
                              <li key={i} className="px-3 py-1.5 flex items-center justify-between">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-700 truncate">{item.name}</p>
                                  <p className="text-[10px] text-gray-400">{item.equivale} · {item.pesaMide}</p>
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${lc.badge}`}>×1</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
