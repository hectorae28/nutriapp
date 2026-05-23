import { useState, useMemo } from "react";
import {
  Calendar,
  Check,
  Leaf,
  Target,
  Clock,
  Trash2,
  Pencil,
  Plus,
  Minus,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import TopHeader from "../components/TopHeader";
import {
  StatCard,
  Badge,
  ProgressRing,
  EmptyState,
} from "../components/SharedComponents";
import { LIST_META, FOOD_LISTS, DEFAULT_MEALS } from "../data/nutriData";

let _nextMealId = 100;

export default function PlannerView() {
  const [meals, setMeals] = useState(DEFAULT_MEALS);
  const [selections, setSelections] = useState({});
  const [modalState, setModalState] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const addMeal = () => {
    const id = _nextMealId++;
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
  const updateMeal = (u) =>
    setMeals((prev) => prev.map((m) => (m.id === u.id ? u : m)));
  const addItem = (mealId, listId, item) => {
    setSelections((prev) => ({
      ...prev,
      [mealId]: {
        ...(prev[mealId] || {}),
        [listId]: [...(prev[mealId]?.[listId] || []), item],
      },
    }));
  };
  const removeItem = (mealId, listId, idx) => {
    setSelections((prev) => ({
      ...prev,
      [mealId]: {
        ...(prev[mealId] || {}),
        [listId]: (prev[mealId]?.[listId] || []).filter((_, i) => i !== idx),
      },
    }));
  };
  const clearAll = () => setSelections({});

  const totalItems = Object.values(selections).reduce(
    (a, bl) => a + Object.values(bl).reduce((b, arr) => b + arr.length, 0),
    0,
  );
  const totalTarget = meals.reduce(
    (a, m) => a + m.slots.reduce((b, s) => b + s.targetRations, 0),
    0,
  );
  const completedMeals = meals.filter((m) =>
    m.slots.every(
      (s) => (selections[m.id]?.[s.listId]?.length || 0) >= s.targetRations,
    ),
  ).length;

  return (
    <div className="na-planner">
      <TopHeader
        title="Planificador"
        subtitle="Configura las comidas del día y asigna alimentos por grupo"
      />

      <div className="na-planner-content">
        <div className="na-stats-row">
          <StatCard
            icon={Calendar}
            label="Comidas"
            value={meals.length}
            color="#5B8DEF"
          />
          <StatCard
            icon={Check}
            label="Completas"
            value={`${completedMeals}/${meals.length}`}
            color="var(--accent-green)"
          />
          <StatCard
            icon={Leaf}
            label="Alimentos"
            value={totalItems}
            color="#EF6C00"
          />
          <StatCard
            icon={Target}
            label="Raciones"
            value={`${totalItems}/${totalTarget}`}
            color="#7E57C2"
          />
        </div>

        <div className="na-meals-timeline">
          {meals.map((meal, idx) => (
            <MealCard
              key={meal.id}
              meal={meal}
              index={idx}
              selections={selections[meal.id] || {}}
              onOpenModal={(m, slotListId) =>
                setModalState({ meal: m, slotListId })
              }
              onRemoveMeal={removeMeal}
              onUpdateMeal={updateMeal}
              onRemoveItem={(mealId, listId, i) =>
                removeItem(mealId, listId, i)
              }
            />
          ))}

          <button className="na-add-meal-btn" onClick={addMeal}>
            <div className="na-add-meal-icon">
              <Plus size={20} />
            </div>
            <span>Agregar Comida</span>
          </button>
        </div>

        <div className="na-legend mb-32">
          <span className="na-legend-label">Listas de intercambio:</span>
          {Object.entries(LIST_META).map(([id, m]) => (
            <span
              key={id}
              className="na-legend-chip"
              style={{ borderColor: m.color + "40", background: m.light }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: m.color,
                  display: "inline-block",
                }}
              ></span>
              {m.icon} {m.name}
            </span>
          ))}
        </div>
      </div>

      <DailySummaryBar
        meals={meals}
        selections={selections}
        open={summaryOpen}
        onToggle={() => setSummaryOpen(!summaryOpen)}
        onClear={clearAll}
      />

      {modalState && (
        <FoodModal
          meal={modalState.meal}
          slotListId={modalState.slotListId}
          selectedItems={selections[modalState.meal.id] || {}}
          onClose={() => setModalState(null)}
          onAddItem={(listId, item) =>
            addItem(modalState.meal.id, listId, item)
          }
        />
      )}
    </div>
  );
}

// ── Meal Card ──
function MealCard({
  meal,
  index,
  selections,
  onOpenModal,
  onRemoveMeal,
  onUpdateMeal,
  onRemoveItem,
}) {
  const [editing, setEditing] = useState(false);
  const [tmpName, setTmpName] = useState(meal.name);

  const totalTarget = meal.slots.reduce((a, s) => a + s.targetRations, 0);
  const totalSel = meal.slots.reduce(
    (a, s) => a + (selections[s.listId]?.length || 0),
    0,
  );
  const allComplete = meal.slots.every(
    (s) => (selections[s.listId]?.length || 0) >= s.targetRations,
  );
  const pct = totalTarget > 0 ? Math.round((totalSel / totalTarget) * 100) : 0;

  const saveName = () => {
    if (tmpName.trim()) onUpdateMeal({ ...meal, name: tmpName.trim() });
    setEditing(false);
  };

  const addSlot = () => {
    const used = meal.slots.map((s) => s.listId);
    const next = FOOD_LISTS.find((l) => !used.includes(l.id)) || FOOD_LISTS[0];
    onUpdateMeal({
      ...meal,
      slots: [...meal.slots, { listId: next.id, targetRations: 1 }],
    });
  };

  return (
    <div className={`na-meal-card ${allComplete ? "complete" : ""}`}>
      <div
        className="na-timeline-dot"
        style={{
          background: allComplete ? "var(--accent-green)" : "var(--border)",
        }}
      >
        {allComplete ? (
          <Check size={12} style={{ color: "#fff" }} />
        ) : (
          <span className="na-dot-num">{index + 1}</span>
        )}
      </div>

      <div className="na-meal-header">
        <div className="na-meal-title-row">
          {editing ? (
            <div
              style={{ display: "flex", gap: 6, alignItems: "center", flex: 1 }}
            >
              <input
                className="na-input-inline"
                autoFocus
                value={tmpName}
                onChange={(e) => setTmpName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
              />
              <button className="na-icon-btn-sm" onClick={saveName}>
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 className="na-meal-name">{meal.name}</h3>
              <button
                className="na-icon-btn-sm"
                onClick={() => {
                  setTmpName(meal.name);
                  setEditing(true);
                }}
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="na-meal-time">
              <Clock size={12} /> {meal.time}
            </span>
            <button
              className="na-icon-btn-sm na-danger"
              onClick={() => onRemoveMeal(meal.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="na-meal-progress-wrap">
          <div className="na-meal-progress-bar">
            <div
              className="na-meal-progress-fill"
              style={{
                width: `${pct}%`,
                background: allComplete
                  ? "var(--accent-green)"
                  : "var(--accent-coral)",
              }}
            />
          </div>
          <span className="na-meal-progress-label">
            {totalSel}/{totalTarget} raciones
          </span>
          {allComplete && <Badge color="var(--accent-green)">Completo</Badge>}
        </div>
      </div>

      <div className="na-meal-slots">
        {meal.slots.map((slot) => {
          const meta = LIST_META[slot.listId];
          const items = selections[slot.listId] || [];
          const done = items.length >= slot.targetRations;
          return (
            <div
              key={slot.listId}
              className={`na-slot ${done ? "done" : ""}`}
              style={{ "--slot-color": meta.color, "--slot-light": meta.light }}
            >
              <div className="na-slot-header">
                <span className="na-slot-icon">{meta.icon}</span>
                <span className="na-slot-name">{meta.name}</span>
                <ProgressRing
                  value={items.length}
                  max={slot.targetRations}
                  size={34}
                  stroke={3}
                  color={meta.color}
                />
                <div className="na-slot-stepper">
                  <button
                    className="na-step-btn"
                    onClick={() =>
                      onUpdateMeal({
                        ...meal,
                        slots: meal.slots.map((s) =>
                          s.listId === slot.listId
                            ? {
                                ...s,
                                targetRations: Math.max(1, s.targetRations - 1),
                              }
                            : s,
                        ),
                      })
                    }
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    className="na-step-btn"
                    onClick={() =>
                      onUpdateMeal({
                        ...meal,
                        slots: meal.slots.map((s) =>
                          s.listId === slot.listId
                            ? { ...s, targetRations: s.targetRations + 1 }
                            : s,
                        ),
                      })
                    }
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  className="na-icon-btn-sm na-danger"
                  onClick={() =>
                    meal.slots.length > 1 &&
                    onUpdateMeal({
                      ...meal,
                      slots: meal.slots.filter((s) => s.listId !== slot.listId),
                    })
                  }
                >
                  <X size={12} />
                </button>
              </div>

              {items.length > 0 && (
                <div className="na-slot-items">
                  {items.map((item, i) => (
                    <div key={i} className="na-slot-item">
                      <span>{item.name}</span>
                      <span className="na-slot-item-eq">{item.equivale}</span>
                      <button
                        className="na-slot-item-x"
                        onClick={() => onRemoveItem(meal.id, slot.listId, i)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="na-slot-add-btn"
                onClick={() => onOpenModal(meal, slot.listId)}
              >
                <Plus size={14} /> Agregar alimento
              </button>
            </div>
          );
        })}

        {meal.slots.length < 6 && (
          <button className="na-add-slot-btn" onClick={addSlot}>
            <Plus size={14} /> Agregar lista
          </button>
        )}
      </div>
    </div>
  );
}

// ── Daily Summary Bar ──
function DailySummaryBar({ meals, selections, open, onToggle, onClear }) {
  const totalItems = Object.values(selections).reduce(
    (a, bl) => a + Object.values(bl).reduce((b, arr) => b + arr.length, 0),
    0,
  );
  const completed = meals.filter((m) =>
    m.slots.every(
      (s) => (selections[m.id]?.[s.listId]?.length || 0) >= s.targetRations,
    ),
  ).length;

  return (
    <div className={`na-summary-bar ${open ? "open" : ""}`}>
      <button className="na-summary-toggle" onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="na-summary-icon">
            <ClipboardList size={16} />
          </div>
          <div>
            <span className="na-summary-title">Resumen del Día</span>
            <span className="na-summary-meta">
              {totalItems} alimentos · {completed}/{meals.length} comidas
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {totalItems > 0 && (
            <button
              className="na-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <Trash2 size={12} /> Limpiar
            </button>
          )}
          <ChevronDown
            size={18}
            style={{
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </div>
      </button>
      {open && (
        <div className="na-summary-content">
          {totalItems === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin alimentos"
              message="Agrega alimentos desde el planificador"
            />
          ) : (
            <div className="na-summary-grid">
              {meals.map((meal) => {
                const mSel = selections[meal.id] || {};
                const hasAny = Object.values(mSel).some((a) => a.length > 0);
                if (!hasAny) return null;
                const allDone = meal.slots.every(
                  (s) => (mSel[s.listId]?.length || 0) >= s.targetRations,
                );
                return (
                  <div
                    key={meal.id}
                    className={`na-summary-meal ${allDone ? "done" : ""}`}
                  >
                    <div className="na-summary-meal-header">
                      <span>{meal.name}</span>
                      <span className="na-summary-meal-time">{meal.time}</span>
                    </div>
                    {meal.slots.map((slot) => {
                      const items = mSel[slot.listId] || [];
                      if (!items.length) return null;
                      const meta = LIST_META[slot.listId];
                      return (
                        <div key={slot.listId} className="na-summary-slot">
                          <span
                            className="na-summary-slot-label"
                            style={{ color: meta.color }}
                          >
                            {meta.icon} {meta.name} ({items.length}/
                            {slot.targetRations})
                          </span>
                          {items.map((item, i) => (
                            <div key={i} className="na-summary-item">
                              {item.name} — {item.equivale}
                            </div>
                          ))}
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

// ── Food Modal ──
function FoodModal({ meal, slotListId, selectedItems, onClose, onAddItem }) {
  const [query, setQuery] = useState("");
  const [activeListId, setActiveListId] = useState(slotListId);
  const [openSubs, setOpenSubs] = useState({});

  const meta = LIST_META[activeListId];
  const activeList = FOOD_LISTS.find((l) => l.id === activeListId);
  const slotItems = selectedItems[activeListId] || [];
  const activeSlot = meal.slots.find((s) => s.listId === activeListId);
  const slotTarget = activeSlot?.targetRations || 0;
  const slotDone = slotItems.length >= slotTarget;

  const filtered = useMemo(() => {
    if (!query.trim()) return activeList?.subcategories || [];
    const q = query.toLowerCase();
    return (activeList?.subcategories || [])
      .map((sub) => ({
        ...sub,
        items: sub.items.filter((i) => i.name.toLowerCase().includes(q)),
      }))
      .filter((sub) => sub.items.length > 0);
  }, [query, activeList]);

  const toggleSub = (name) =>
    setOpenSubs((p) => ({ ...p, [name]: p[name] === false }));
  const isOpen = (name) => openSubs[name] !== false;

  return (
    <div className="na-modal-overlay" onClick={onClose}>
      <div className="na-modal" onClick={(e) => e.stopPropagation()}>
        <div className="na-modal-header" style={{ background: meta.color }}>
          <div>
            <p className="na-modal-subtitle">
              {meal.name} · {meal.time}
            </p>
            <h2 className="na-modal-title">
              {meta.icon} {meta.name}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className={`na-modal-pill ${slotDone ? "done" : ""}`}>
              {slotItems.length}/{slotTarget} raciones {slotDone && "✓"}
            </span>
            <button className="na-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="na-modal-search">
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 28,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
            }}
          />
          <input
            autoFocus
            placeholder={`Buscar en ${meta.name}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="na-modal-search-input"
          />
        </div>

        <div className="na-modal-tabs">
          {meal.slots.map((slot) => {
            const m = LIST_META[slot.listId];
            const items = selectedItems[slot.listId] || [];
            const done = items.length >= slot.targetRations;
            return (
              <button
                key={slot.listId}
                className={`na-modal-tab ${activeListId === slot.listId ? "active" : ""}`}
                style={{ "--tab-color": m.color }}
                onClick={() => {
                  setActiveListId(slot.listId);
                  setQuery("");
                }}
              >
                {m.icon} {m.name}
                <span className={`na-modal-tab-count ${done ? "done" : ""}`}>
                  {items.length}/{slot.targetRations}
                </span>
              </button>
            );
          })}
        </div>

        <div className="na-modal-body">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Sin resultados"
              message="Intenta con otro término"
            />
          ) : (
            filtered.map((sub) => (
              <div key={sub.name} className="na-modal-sub">
                <button
                  className="na-modal-sub-header"
                  onClick={() => toggleSub(sub.name)}
                  style={{ background: meta.color + "10" }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: meta.color,
                      }}
                    ></span>
                    <span style={{ fontWeight: 600, color: meta.color }}>
                      {sub.name}
                    </span>
                    {sub.note && (
                      <span
                        style={{ fontSize: 12, color: "var(--text-tertiary)" }}
                      >
                        · {sub.note}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {sub.items.length} alimentos
                    {isOpen(sub.name) ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </div>
                </button>
                {isOpen(sub.name) && (
                  <div className="na-modal-table">
                    <div className="na-modal-table-head">
                      <span className="col-name">Alimento</span>
                      <span className="col-eq">Equivale a</span>
                      <span className="col-wt">Pesa/Mide</span>
                      <span className="col-act"></span>
                    </div>
                    {sub.items.map((item) => {
                      const added = slotItems.some((s) => s.name === item.name);
                      return (
                        <div key={item.name} className="na-modal-table-row">
                          <span className="col-name">{item.name}</span>
                          <span className="col-eq">
                            <Badge color={meta.color}>{item.equivale}</Badge>
                          </span>
                          <span className="col-wt">{item.pesaMide}</span>
                          <span className="col-act">
                            <button
                              className={`na-add-food-btn ${added ? "added" : ""}`}
                              style={{ "--btn-color": meta.color }}
                              onClick={() => onAddItem(activeListId, item)}
                            >
                              <Plus size={14} />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="na-modal-footer">
          <div className="na-modal-footer-stats">
            {meal.slots.map((slot) => {
              const m = LIST_META[slot.listId];
              const items = selectedItems[slot.listId] || [];
              const done = items.length >= slot.targetRations;
              return (
                <span
                  key={slot.listId}
                  style={{
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {m.icon}
                  <strong
                    style={{
                      color: done
                        ? "var(--accent-green)"
                        : "var(--text-primary)",
                    }}
                  >
                    {items.length}/{slot.targetRations}
                  </strong>
                </span>
              );
            })}
          </div>
          <button className="na-btn-primary" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
