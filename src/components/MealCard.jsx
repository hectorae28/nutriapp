import { useState } from "react";
import { Plus, Clock, Trash2, Edit2, Check, X } from "lucide-react";
import { foodLists, LIST_COLORS } from "../data/foodLists";

export default function MealCard({ meal, selections, onOpenModal, onRemoveMeal, onUpdateMeal, onRemoveItem }) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(meal.name);

  const saveName = () => {
    if (tempName.trim()) onUpdateMeal({ ...meal, name: tempName.trim() });
    setEditingName(false);
  };

  // Total raciones objetivo de todos los slots
  const totalTarget = meal.slots.reduce((a, s) => a + s.targetRations, 0);
  // Total raciones seleccionadas
  const totalSelected = meal.slots.reduce(
    (a, s) => a + (selections[s.listId]?.length || 0), 0
  );
  const allComplete = meal.slots.every(
    (s) => (selections[s.listId]?.length || 0) >= s.targetRations
  );

  const addSlot = () => {
    // Agrega un slot con la primera lista que no esté ya usada, o lista 1
    const usedIds = meal.slots.map((s) => s.listId);
    const nextList = foodLists.find((l) => !usedIds.includes(l.id)) || foodLists[0];
    onUpdateMeal({ ...meal, slots: [...meal.slots, { listId: nextList.id, targetRations: 1 }] });
  };

  const removeSlot = (listId) => {
    onUpdateMeal({ ...meal, slots: meal.slots.filter((s) => s.listId !== listId) });
  };

  const updateSlot = (listId, changes) => {
    onUpdateMeal({
      ...meal,
      slots: meal.slots.map((s) => (s.listId === listId ? { ...s, ...changes } : s)),
    });
  };

  return (
    <div
      className={`flex flex-col bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 w-72 flex-shrink-0 ${
        allComplete ? "border-emerald-300 shadow-emerald-100 shadow-md" : "border-gray-200"
      }`}
    >
      {/* ── Card Header ── */}
      <div
        className={`rounded-t-xl px-4 py-3 flex items-center justify-between ${
          allComplete ? "bg-emerald-500" : "bg-gray-800"
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editingName ? (
            <>
              <input
                autoFocus
                className="text-white bg-white/20 rounded px-2 py-0.5 text-sm font-semibold flex-1 outline-none placeholder-white/50"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
              />
              <button onClick={saveName} className="text-white/70 hover:text-white">
                <Check className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="text-white font-bold text-sm truncate">{meal.name}</span>
              <button onClick={() => setEditingName(true)} className="text-white/50 hover:text-white flex-shrink-0">
                <Edit2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Time */}
          <div className="flex items-center gap-1 text-white/70 text-xs">
            <Clock className="w-3 h-3" />
            <input
              type="time"
              value={to24h(meal.time)}
              onChange={(e) => onUpdateMeal({ ...meal, time: to12h(e.target.value) })}
              className="bg-transparent text-white/80 text-xs outline-none w-16 cursor-pointer"
            />
          </div>
          <button onClick={() => onRemoveMeal(meal.id)} className="text-white/50 hover:text-white">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Progress summary ── */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {totalSelected} / {totalTarget} raciones totales
        </span>
        {allComplete && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
            ✓ Completo
          </span>
        )}
      </div>

      {/* ── Slots ── */}
      <div className="px-3 pb-3 flex flex-col gap-2">
        {meal.slots.map((slot) => (
          <SlotRow
            key={slot.listId}
            slot={slot}
            selectedItems={selections[slot.listId] || []}
            onOpenModal={() => onOpenModal(meal, slot.listId)}
            onRemove={() => removeSlot(slot.listId)}
            onUpdateRations={(n) => updateSlot(slot.listId, { targetRations: n })}
            onChangeList={(newListId) => {
              // No permitir duplicados
              if (meal.slots.some((s) => s.listId === newListId)) return;
              updateSlot(slot.listId, { listId: newListId });
            }}
            canRemove={meal.slots.length > 1}
            onRemoveItem={(idx) => onRemoveItem(meal.id, slot.listId, idx)}
          />
        ))}

        {/* Add slot */}
        <button
          onClick={addSlot}
          disabled={meal.slots.length >= foodLists.length}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3" />
          Agregar lista
        </button>
      </div>
    </div>
  );
}

// ── Slot individual ──────────────────────────────────────────
function SlotRow({ slot, selectedItems, onOpenModal, onRemove, onUpdateRations, onChangeList, canRemove, onRemoveItem }) {
  const [showItems, setShowItems] = useState(false);
  const c = LIST_COLORS[slot.listId];
  const list = foodLists.find((l) => l.id === slot.listId);
  const current = selectedItems.length;
  const target = slot.targetRations;
  const complete = current >= target;
  const pct = target > 0 ? Math.min(current / target, 1) : 0;

  return (
    <div className={`rounded-xl border ${complete ? "border-emerald-200 bg-emerald-50" : `${c.border} ${c.bg}`}`}>
      {/* Slot header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* List selector */}
        <span className="text-base flex-shrink-0">{list?.icon}</span>
        <select
          value={slot.listId}
          onChange={(e) => onChangeList(Number(e.target.value))}
          className={`flex-1 min-w-0 text-xs font-semibold bg-transparent outline-none cursor-pointer ${complete ? "text-emerald-700" : c.text} truncate`}
        >
          {foodLists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.icon} Lista {l.id} — {l.name}
            </option>
          ))}
        </select>

        {/* Ration stepper */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onUpdateRations(Math.max(1, target - 1))}
            className="w-5 h-5 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 text-xs flex items-center justify-center"
          >−</button>
          <span className="text-xs font-bold text-gray-700 w-8 text-center">
            {current}/{target}
          </span>
          <button
            onClick={() => onUpdateRations(target + 1)}
            className="w-5 h-5 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 text-xs flex items-center justify-center"
          >+</button>
        </div>

        {/* Remove slot */}
        {canRemove && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-3 pb-1">
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${complete ? "bg-emerald-400" : c.dot.replace("bg-", "bg-")}`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>

      {/* Selected items */}
      {selectedItems.length > 0 && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setShowItems(!showItems)}
            className={`text-[10px] ${c.text} opacity-70 hover:opacity-100 underline`}
          >
            {showItems ? "Ocultar" : `Ver ${selectedItems.length} alimento${selectedItems.length > 1 ? "s" : ""}`}
          </button>
          {showItems && (
            <ul className="mt-1 space-y-0.5 max-h-24 overflow-y-auto scrollbar-thin">
              {selectedItems.map((item, i) => (
                <li key={i} className="flex items-center justify-between text-[11px] bg-white/70 rounded px-2 py-0.5">
                  <span className="text-gray-600 truncate flex-1">{item.name}</span>
                  <button onClick={() => onRemoveItem(i)} className="text-gray-300 hover:text-red-400 ml-1">×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Add button */}
      <div className="px-3 pb-2">
        <button
          onClick={onOpenModal}
          className={`flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${
            complete
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : `bg-white/80 ${c.text} hover:bg-white border ${c.border}`
          }`}
        >
          <Plus className="w-3 h-3" />
          Agregar alimento
        </button>
      </div>
    </div>
  );
}

function to24h(time12) {
  if (!time12) return "07:00";
  const [time, period] = time12.split(" ");
  if (!period) return time.padStart(5, "0");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function to12h(time24) {
  let [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${period}`;
}
