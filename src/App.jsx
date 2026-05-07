import { useState } from "react";
import { Plus, LayoutGrid, Table2 } from "lucide-react";
import Header from "./components/Header";
import MealCard from "./components/MealCard";
import FoodModal from "./components/FoodModal";
import DailySummary from "./components/DailySummary";
import FoodListsView from "./components/FoodListsView";
import { DEFAULT_MEALS } from "./data/foodLists";

let nextId = 100;

// selections shape: { mealId: { listId: [items] } }

export default function App() {
  const [meals, setMeals] = useState(DEFAULT_MEALS);
  const [selections, setSelections] = useState({});
  // modal state: which meal + which slot's listId
  const [modalState, setModalState] = useState(null); // { meal, slotListId }
  const [view, setView] = useState("planner");

  // ── Meal CRUD ──────────────────────────────────────────────
  const addMeal = () => {
    const id = nextId++;
    setMeals((prev) => [
      ...prev,
      {
        id,
        name: `Comida ${prev.length + 1}`,
        time: "12:00 PM",
        slots: [{ listId: 1, targetRations: 1 }],
      },
    ]);
  };

  const removeMeal = (id) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    setSelections((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const updateMeal = (updated) =>
    setMeals((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

  // ── Item selection ──────────────────────────────────────────
  // Add item to mealId → listId bucket
  const addItem = (mealId, listId, item) => {
    setSelections((prev) => ({
      ...prev,
      [mealId]: {
        ...(prev[mealId] || {}),
        [listId]: [...(prev[mealId]?.[listId] || []), item],
      },
    }));
  };

  // Remove item by index from mealId → listId bucket
  const removeItem = (mealId, listId, index) => {
    setSelections((prev) => ({
      ...prev,
      [mealId]: {
        ...(prev[mealId] || {}),
        [listId]: (prev[mealId]?.[listId] || []).filter((_, i) => i !== index),
      },
    }));
  };

  const clearAll = () => setSelections({});

  const reset = () => {
    setMeals(DEFAULT_MEALS);
    setSelections({});
    setModalState(null);
  };

  // ── Stats ──────────────────────────────────────────────────
  const totalItems = Object.values(selections).reduce(
    (acc, byList) => acc + Object.values(byList).reduce((a, arr) => a + arr.length, 0),
    0
  );
  const completedMeals = meals.filter((m) =>
    m.slots.every((s) => (selections[m.id]?.[s.listId]?.length || 0) >= s.targetRations)
  ).length;
  const totalTarget = meals.reduce((a, m) => a + m.slots.reduce((b, s) => b + s.targetRations, 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 flex flex-col">
      <Header onReset={reset} />

      {/* ── View toggle + title ── */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {view === "planner" ? "Plan del Día" : "Tablas de Intercambio"}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {view === "planner"
              ? "Configura tus comidas y agrega alimentos por lista"
              : "Consulta las equivalencias de cada grupo alimenticio"}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <TabBtn active={view === "planner"} onClick={() => setView("planner")}>
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:block">Planificador</span>
          </TabBtn>
          <TabBtn active={view === "tables"} onClick={() => setView("tables")}>
            <Table2 className="w-4 h-4" />
            <span className="hidden sm:block">Tablas</span>
          </TabBtn>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-24">
        {view === "planner" ? (
          <>
            {/* Stats bar */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <StatPill label="Comidas" value={meals.length} color="bg-gray-100 text-gray-600" />
              <StatPill label="Completas" value={completedMeals} color="bg-emerald-100 text-emerald-700" />
              <StatPill label="Alimentos" value={totalItems} color="bg-blue-100 text-blue-700" />
              <StatPill label={`de ${totalTarget} raciones`} value={totalItems} color="bg-purple-100 text-purple-700" />
            </div>

            {/* Meals grid */}
            <div className="flex flex-wrap gap-4 items-start">
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  selections={selections[meal.id] || {}}
                  onOpenModal={(m, slotListId) => setModalState({ meal: m, slotListId })}
                  onRemoveMeal={removeMeal}
                  onUpdateMeal={updateMeal}
                  onRemoveItem={(mealId, listId, idx) => removeItem(mealId, listId, idx)}
                />
              ))}

              {/* Add meal button */}
              <button
                onClick={addMeal}
                className="w-72 min-h-[180px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-white transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Agregar Comida</span>
              </button>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-400 mr-1">Listas de intercambio:</span>
              {[
                { id: 1, icon: "🥛", name: "Lácteos" },
                { id: 2, icon: "🥦", name: "Vegetales" },
                { id: 3, icon: "🍎", name: "Frutas" },
                { id: 4, icon: "🌾", name: "Acompañantes" },
                { id: 5, icon: "🥩", name: "Proteínas" },
                { id: 6, icon: "🥑", name: "Grasas" },
              ].map((l) => (
                <span
                  key={l.id}
                  className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-500 flex items-center gap-1"
                >
                  {l.icon} {l.name}
                </span>
              ))}
            </div>
          </>
        ) : (
          <FoodListsView />
        )}
      </main>

      {/* Daily summary */}
      {view === "planner" && (
        <DailySummary meals={meals} selections={selections} onClearAll={clearAll} />
      )}

      {/* Food modal */}
      {modalState && (
        <FoodModal
          meal={modalState.meal}
          slotListId={modalState.slotListId}
          selectedItems={selections[modalState.meal.id] || {}}
          onClose={() => setModalState(null)}
          onAddItem={(listId, item) => addItem(modalState.meal.id, listId, item)}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        active ? "bg-gray-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}>
      <span className="font-bold">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}
