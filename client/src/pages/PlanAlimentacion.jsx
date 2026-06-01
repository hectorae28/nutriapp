import { useState, useMemo, useEffect } from 'react';
import { Plus, LayoutGrid, Table2 } from 'lucide-react';
import MealCard from '../components/MealCard';
import FoodModal from '../components/FoodModal';
import DailySummary from '../components/DailySummary';
import FoodListsView from '../components/FoodListsView';
import { useCatalogo } from '../hooks/useCatalogo';

let nextId = 100;

export default function PlanAlimentacion() {
  const { grupos, loading } = useCatalogo();
  
  // Generate DEFAULT_MEALS from API grupos once loaded
  const DEFAULT_MEALS = useMemo(() => {
    if (grupos.length === 0) return [];
    return [
      {
        id: 1,
        name: 'Desayuno',
        time: '7:00 AM',
        slots: [
          { listId: grupos[0]?.id || 1, targetRations: 2 },
          { listId: grupos[2]?.id || 3, targetRations: 1 },
          { listId: grupos[3]?.id || 4, targetRations: 2 },
        ],
      },
      {
        id: 2,
        name: 'Merienda',
        time: '10:00 AM',
        slots: [
          { listId: grupos[2]?.id || 3, targetRations: 1 },
          { listId: grupos[0]?.id || 1, targetRations: 1 },
        ],
      },
      {
        id: 3,
        name: 'Almuerzo',
        time: '1:00 PM',
        slots: [
          { listId: grupos[3]?.id || 4, targetRations: 3 },
          { listId: grupos[4]?.id || 5, targetRations: 2 },
          { listId: grupos[1]?.id || 2, targetRations: 1 },
          { listId: grupos[5]?.id || 6, targetRations: 1 },
        ],
      },
      {
        id: 4,
        name: 'Merienda 2',
        time: '4:00 PM',
        slots: [
          { listId: grupos[2]?.id || 3, targetRations: 1 },
          { listId: grupos[5]?.id || 6, targetRations: 1 },
        ],
      },
      {
        id: 5,
        name: 'Cena',
        time: '7:00 PM',
        slots: [
          { listId: grupos[4]?.id || 5, targetRations: 2 },
          { listId: grupos[3]?.id || 4, targetRations: 2 },
          { listId: grupos[1]?.id || 2, targetRations: 1 },
          { listId: grupos[5]?.id || 6, targetRations: 1 },
        ],
      },
      {
        id: 6,
        name: 'Merienda 3',
        time: '10:00 PM',
        slots: [
          { listId: grupos[0]?.id || 1, targetRations: 1 },
          { listId: grupos[2]?.id || 3, targetRations: 1 },
        ],
      },
    ];
  }, [grupos]);
  
  const [meals, setMeals] = useState(DEFAULT_MEALS);
  const [selections, setSelections] = useState({});
  const [modalState, setModalState] = useState(null);
  const [view, setView] = useState('planner');
  
  // Update meals when grupos load
  useEffect(() => {
    if (DEFAULT_MEALS.length > 0 && meals.length === 0) {
      setMeals(DEFAULT_MEALS);
    }
  }, [DEFAULT_MEALS, meals.length]);

  const addMeal = () => {
    const id = nextId++;
    setMeals((prev) => [
      ...prev,
      {
        id,
        name: `Comida ${prev.length + 1}`,
        time: '12:00 PM',
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

  const addItem = (mealId, listId, item) => {
    setSelections((prev) => ({
      ...prev,
      [mealId]: {
        ...(prev[mealId] || {}),
        [listId]: [...(prev[mealId]?.[listId] || []), item],
      },
    }));
  };

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
    if (DEFAULT_MEALS.length > 0) {
      setMeals(DEFAULT_MEALS);
      setSelections({});
      setModalState(null);
    }
  };

  const totalItems = Object.values(selections).reduce(
    (acc, byList) => acc + Object.values(byList).reduce((a, arr) => a + arr.length, 0),
    0
  );
  const completedMeals = meals.filter((m) =>
    m.slots.every((s) => (selections[m.id]?.[s.listId]?.length || 0) >= s.targetRations)
  ).length;
  const totalTarget = meals.reduce(
    (a, m) => a + m.slots.reduce((b, s) => b + s.targetRations, 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* View toggle + title */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {view === 'planner' ? 'Plan del Día' : 'Tablas de Intercambio'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {view === 'planner'
              ? 'Configura tus comidas y agrega alimentos por lista'
              : 'Consulta las equivalencias de cada grupo alimenticio'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-full transition-all"
          >
            Reiniciar
          </button>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <TabBtn active={view === 'planner'} onClick={() => setView('planner')}>
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:block">Planificador</span>
            </TabBtn>
            <TabBtn active={view === 'tables'} onClick={() => setView('tables')}>
              <Table2 className="w-4 h-4" />
              <span className="hidden sm:block">Tablas</span>
            </TabBtn>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-24">
        {view === 'planner' ? (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              <StatPill label="Comidas" value={meals.length} color="bg-gray-100 text-gray-600" />
              <StatPill
                label="Completas"
                value={completedMeals}
                color="bg-emerald-100 text-emerald-700"
              />
              <StatPill label="Alimentos" value={totalItems} color="bg-blue-100 text-blue-700" />
              <StatPill
                label={`de ${totalTarget} raciones`}
                value={totalItems}
                color="bg-purple-100 text-purple-700"
              />
            </div>

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
                  grupos={grupos}
                />
              ))}

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

            <div className="mt-6 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-400 mr-1">Listas de intercambio:</span>
              {grupos.map((g) => (
                <span
                  key={g.id}
                  className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-500 flex items-center gap-1"
                >
                  {g.icon || '🍽️'} {g.nombre}
                </span>
              ))}
            </div>
          </>
        ) : (
          <FoodListsView />
        )}
      </main>

      {view === 'planner' && (
        <DailySummary meals={meals} selections={selections} onClearAll={clearAll} grupos={grupos} />
      )}

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
        active ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}
    >
      <span className="font-bold">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}
