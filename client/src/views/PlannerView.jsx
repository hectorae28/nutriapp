import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Search,
  ChevronDown,
  Clock,
  Utensils,
  Flame,
  BarChart2,
} from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { EmptyState } from '../components/SharedComponents';
import { planesApi } from '../api/planes';
import { catalogoApi } from '../api/catalogo';
import { createGrupoStyleMap, getGrupoStyle } from '../constants/grupoStyles';

let _nextMealId = 100;

// ─── helpers ─────────────────────────────────────────────────────────────────

function totalKcalMeal(meal, selections, grupos) {
  return Object.entries(selections[meal.id] || {}).reduce((sum, [listId, items]) => {
    const grupo = grupos.find(g => g.id === listId);
    return sum + items.length * (grupo?.kcal_racion || 0);
  }, 0);
}

function totalSelections(selections) {
  return Object.values(selections).reduce(
    (a, bl) => a + Object.values(bl).reduce((b, arr) => b + arr.length, 0),
    0
  );
}

// ─── component ───────────────────────────────────────────────────────────────

export default function PlannerView() {
  const [grupos, setGrupos] = useState([]);
  const [alimentos, setAlimentos] = useState([]);
  const [meals, setMeals] = useState([]);
  const [selections, setSelections] = useState({});
  const [modalState, setModalState] = useState(null); // { meal, slotListId }
  const [planActivo, setPlanActivo] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  
  const LIST_META = useMemo(() => {
    const meta = {};
    grupos.forEach(g => {
      const style = getGrupoStyle(g.nombre, g.id - 1);
      meta[g.id] = {
        name: g.nombre,
        icon: g.icon || style.icon,
        color: style.color,
        light: style.light,
        dark: style.dark,
        kcalRacion: g.kcal_racion || 0,
      };
    });
    return meta;
  }, [grupos]);
  
  const FOOD_LISTS = useMemo(() => {
    return grupos.map(g => ({
      id: g.id,
      name: g.nombre,
      icon: g.icon || '🍽️',
      subcategories: [],
    }));
  }, [grupos]);

  useEffect(() => {
    Promise.all([
      planesApi.miPlanActivo().catch(() => null),
      catalogoApi.grupos().catch(() => []),
      catalogoApi.alimentos().catch(() => []),
    ]).then(([plan, gruposData, alimentosData]) => {
      if (Array.isArray(plan) && plan.length > 0) setPlanActivo(plan[0]);
      else if (plan && plan.id) setPlanActivo(plan);
      
      const gruposArr = Array.isArray(gruposData) ? gruposData : [];
      setGrupos(gruposArr);
      setAlimentos(Array.isArray(alimentosData) ? alimentosData : []);
      
      // Initialize DEFAULT_MEALS from grupos
      if (gruposArr.length > 0 && meals.length === 0) {
        const defaultMeals = [
          {
            id: 1,
            name: 'Desayuno',
            time: '7:00',
            slots: [{ listId: gruposArr[0]?.id || 1, targetRations: 2 }],
          },
        ];
        setMeals(defaultMeals);
      }
      
      setPlanLoading(false);
    });
  }, []);

  const addMeal = () => {
    const id = _nextMealId++;
    const firstGrupoId = grupos.length > 0 ? grupos[0].id : 1;
    setMeals((prev) => [
      ...prev,
      { id, name: `Comida ${prev.length + 1}`, time: '12:00', slots: [{ listId: firstGrupoId, targetRations: 1 }] },
    ]);
  };

  const removeMeal = (id) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    setSelections((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const updateMeal = (u) => setMeals((prev) => prev.map((m) => (m.id === u.id ? u : m)));

  const addItem = (mealId, listId, item) =>
    setSelections((prev) => ({
      ...prev,
      [mealId]: { ...(prev[mealId] || {}), [listId]: [...(prev[mealId]?.[listId] || []), item] },
    }));

  const removeItem = (mealId, listId, idx) =>
    setSelections((prev) => ({
      ...prev,
      [mealId]: { ...(prev[mealId] || {}), [listId]: (prev[mealId]?.[listId] || []).filter((_, i) => i !== idx) },
    }));

  const clearMeal = (mealId) =>
    setSelections((prev) => { const n = { ...prev }; delete n[mealId]; return n; });

  const totalItems = totalSelections(selections);
  const completedMeals = meals.filter((m) =>
    m.slots.every((s) => (selections[m.id]?.[s.listId]?.length || 0) >= s.targetRations)
  ).length;
  const pctGlobal = meals.length > 0 ? Math.round((completedMeals / meals.length) * 100) : 0;

  // contenido reutilizable del sidebar (desktop y mobile drawer)
  const sidebarContent = (
    <>
      {/* Resumen del día */}
      <div className="npv-sidebar-card">
        <h3 className="npv-sidebar-title"><BarChart2 size={14} /> Resumen del día</h3>
        <div className="npv-summary-grid">
          <div className="npv-summary-item">
            <span className="npv-summary-val">{meals.length}</span>
            <span className="npv-summary-lbl">comidas</span>
          </div>
          <div className="npv-summary-item">
            <span className="npv-summary-val" style={{ color: 'var(--accent-green)' }}>{completedMeals}</span>
            <span className="npv-summary-lbl">completas</span>
          </div>
          <div className="npv-summary-item">
            <span className="npv-summary-val">{totalItems}</span>
            <span className="npv-summary-lbl">alimentos</span>
          </div>
        </div>
        <div className="npv-global-bar">
          <div className="npv-global-fill" style={{ width: `${pctGlobal}%` }} />
        </div>
        <span className="npv-global-pct">{pctGlobal}% completado</span>
      </div>

      {/* Plan activo */}
      {!planLoading && planActivo && (
        <div className="npv-sidebar-card">
          <h3 className="npv-sidebar-title"><Flame size={14} /> Plan activo</h3>
          <div className="npv-plan-info">
            {planActivo.tipo_dieta && <span className="npv-plan-badge">{planActivo.tipo_dieta}</span>}
            {planActivo.kcal_objetivo && (
              <div className="npv-plan-row"><span>Kcal objetivo</span><strong>{planActivo.kcal_objetivo} kcal</strong></div>
            )}
            {planActivo.proteinas_g && (
              <div className="npv-plan-row"><span>Proteínas</span><strong>{planActivo.proteinas_g} g</strong></div>
            )}
            {planActivo.grasas_g && (
              <div className="npv-plan-row"><span>Grasas</span><strong>{planActivo.grasas_g} g</strong></div>
            )}
            {planActivo.carbohidratos_g && (
              <div className="npv-plan-row"><span>Carbohidratos</span><strong>{planActivo.carbohidratos_g} g</strong></div>
            )}
          </div>
          {planActivo.tiempos_comida?.length > 0 && (
            <div className="npv-tiempos">
              <p className="npv-tiempos-title">Tiempos del plan</p>
              {planActivo.tiempos_comida.slice().sort((a, b) => a.orden - b.orden).map((tc) => (
                <div key={tc.id} className="npv-tc-row">
                  <div className="npv-tc-header">
                    <Clock size={11} />
                    <span className="npv-tc-name">{tc.nombre}</span>
                    {tc.hora && <span className="npv-tc-hora">{tc.hora}</span>}
                  </div>
                  {tc.raciones?.length > 0 && (
                    <div className="npv-tc-raciones">
                      {tc.raciones.map((r) => (
                        <span key={r.id} className="npv-tc-chip">{r.cantidad} {r.grupo_nombre}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grupos de intercambio */}
      <div className="npv-sidebar-card">
        <h3 className="npv-sidebar-title"><Utensils size={14} /> Grupos de intercambio</h3>
        <div className="npv-groups-list">
          {Object.entries(LIST_META).map(([id, m]) => (
            <div key={id} className="npv-group-row" style={{ '--gc': m.color, '--gl': m.light }}>
              <span className="npv-group-dot" />
              <span className="npv-group-icon">{m.icon}</span>
              <span className="npv-group-name">{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="npv-root">
      <TopHeader
        title="Planificador"
        subtitle="Distribuye los grupos de alimentos por tiempo de comida"
      />

      <div className="npv-body">
        {/* ── Sidebar desktop ── */}
        <aside className="npv-sidebar">{sidebarContent}</aside>

        {/* ── Resumen mobile (solo visible en mobile, dentro del flow normal) ── */}
        <div className="npv-mobile-bar">
          <div className="npv-mobile-stat">
            <span className="npv-mobile-val">{meals.length}</span>
            <span className="npv-mobile-lbl">comidas</span>
          </div>
          <div className="npv-mobile-divider" />
          <div className="npv-mobile-stat">
            <span className="npv-mobile-val" style={{ color: 'var(--accent-green)' }}>{completedMeals}</span>
            <span className="npv-mobile-lbl">completas</span>
          </div>
          <div className="npv-mobile-divider" />
          <div className="npv-mobile-stat">
            <span className="npv-mobile-val">{totalItems}</span>
            <span className="npv-mobile-lbl">alimentos</span>
          </div>
          <div className="npv-mobile-progress">
            <div className="npv-mobile-fill" style={{ width: `${pctGlobal}%` }} />
          </div>
          <span className="npv-mobile-pct">{pctGlobal}%</span>
        </div>

        {/* ── Área principal: tarjetas de comidas ── */}
        <main className="npv-main">
          <div className="npv-meals-grid">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                selections={selections[meal.id] || {}}
                listMeta={LIST_META}
                onOpenModal={(slotListId) => setModalState({ meal, slotListId })}
                onRemoveMeal={removeMeal}
                onUpdateMeal={updateMeal}
                onRemoveItem={(listId, i) => removeItem(meal.id, listId, i)}
                onClearMeal={() => clearMeal(meal.id)}
              />
            ))}
            <button className="npv-add-meal" onClick={addMeal}>
              <div className="npv-add-meal-inner">
                <Plus size={22} />
                <span>Agregar comida</span>
              </div>
            </button>
          </div>
        </main>
      </div>

      {/* Modal de selección de alimentos */}
      {modalState && (
        <FoodModal
          meal={modalState.meal}
          slotListId={modalState.slotListId}
          selectedItems={selections[modalState.meal.id] || {}}
          listMeta={LIST_META}
          foodLists={FOOD_LISTS}
          alimentos={alimentos}
          onClose={() => setModalState(null)}
          onAddItem={(listId, item) => addItem(modalState.meal.id, listId, item)}
        />
      )}
    </div>
  );
}

// ─── Meal Card ────────────────────────────────────────────────────────────────

function MealCard({ meal, selections, listMeta, onOpenModal, onRemoveMeal, onUpdateMeal, onRemoveItem, onClearMeal }) {
  const LIST_META = listMeta || {};
  const [editingName, setEditingName] = useState(false);
  const [tmpName, setTmpName] = useState(meal.name);
  const [expanded, setExpanded] = useState(true);

  const totalTarget = meal.slots.reduce((a, s) => a + s.targetRations, 0);
  const totalSel = meal.slots.reduce((a, s) => a + (selections[s.listId]?.length || 0), 0);
  const allComplete = meal.slots.every((s) => (selections[s.listId]?.length || 0) >= s.targetRations);
  const pct = totalTarget > 0 ? Math.min(100, Math.round((totalSel / totalTarget) * 100)) : 0;
  const hasAnyItems = Object.values(selections).some((a) => a.length > 0);

  const saveName = () => {
    if (tmpName.trim()) onUpdateMeal({ ...meal, name: tmpName.trim() });
    setEditingName(false);
  };

  const addSlot = () => {
    const used = meal.slots.map((s) => s.listId);
    const avail = Object.keys(LIST_META).map(Number);
    const next = avail.find((id) => !used.includes(id)) ?? avail[0];
    onUpdateMeal({ ...meal, slots: [...meal.slots, { listId: next, targetRations: 1 }] });
  };

  return (
    <div className={`npv-meal-card ${allComplete ? 'complete' : ''}`}>
      {/* Cabecera */}
      <div className="npv-meal-top">
        <div className="npv-meal-left">
          {/* Círculo de progreso */}
          <div className="npv-meal-ring" style={{ '--pct': pct, '--rc': allComplete ? 'var(--accent-green)' : '#5B8DEF' }}>
            <svg viewBox="0 0 36 36" className="npv-ring-svg">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke="var(--rc)" strokeWidth="3"
                strokeDasharray={`${pct * 0.942} 94.2`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <span className="npv-ring-pct">{pct}%</span>
          </div>

          <div className="npv-meal-info">
            {editingName ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  className="na-input-inline"
                  autoFocus
                  value={tmpName}
                  onChange={(e) => setTmpName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                  style={{ fontSize: 14, fontWeight: 700 }}
                />
                <button className="na-icon-btn-sm" onClick={saveName}><Check size={12} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="npv-meal-name">{meal.name}</span>
                <button className="na-icon-btn-sm" onClick={() => { setTmpName(meal.name); setEditingName(true); }}>
                  <Pencil size={11} />
                </button>
              </div>
            )}
            <div className="npv-meal-meta">
              <Clock size={11} />
              <input
                type="time"
                value={meal.time}
                onChange={(e) => onUpdateMeal({ ...meal, time: e.target.value })}
                className="npv-time-input"
              />
              <span className="npv-meal-count">{totalSel}/{totalTarget} raciones</span>
            </div>
          </div>
        </div>

        <div className="npv-meal-actions">
          {hasAnyItems && (
            <button className="na-icon-btn-sm" title="Limpiar" onClick={onClearMeal}>
              <Trash2 size={11} />
            </button>
          )}
          <button className="na-icon-btn-sm na-danger" title="Eliminar comida" onClick={() => onRemoveMeal(meal.id)}>
            <X size={13} />
          </button>
          <button
            className="na-icon-btn-sm"
            onClick={() => setExpanded((v) => !v)}
            style={{ transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
          >
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* Grupos / Slots */}
      {expanded && (
        <div className="npv-meal-body">
          {meal.slots.map((slot) => {
            const meta = LIST_META[slot.listId];
            const items = selections[slot.listId] || [];
            const done = items.length >= slot.targetRations;

            return (
              <div key={slot.listId} className={`npv-slot ${done ? 'done' : ''}`} style={{ '--sc': meta.color, '--sl': meta.light }}>
                {/* Fila grupo */}
                <div className="npv-slot-row">
                  <span className="npv-slot-icon">{meta.icon}</span>
                  <span className="npv-slot-name">{meta.name}</span>

                  {/* Stepper */}
                  <div className="npv-stepper">
                    <button className="npv-step"
                      onClick={() => onUpdateMeal({ ...meal, slots: meal.slots.map((s) => s.listId === slot.listId ? { ...s, targetRations: Math.max(1, s.targetRations - 1) } : s) })}>
                      −
                    </button>
                    <span className="npv-step-val">{items.length}/{slot.targetRations}</span>
                    <button className="npv-step"
                      onClick={() => onUpdateMeal({ ...meal, slots: meal.slots.map((s) => s.listId === slot.listId ? { ...s, targetRations: s.targetRations + 1 } : s) })}>
                      +
                    </button>
                  </div>

                  <button
                    className="npv-slot-add"
                    style={{ '--sc': meta.color }}
                    onClick={() => onOpenModal(slot.listId)}
                    title="Agregar alimento"
                  >
                    <Plus size={12} />
                  </button>

                  {meal.slots.length > 1 && (
                    <button className="na-icon-btn-sm na-danger"
                      onClick={() => onUpdateMeal({ ...meal, slots: meal.slots.filter((s) => s.listId !== slot.listId) })}>
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* Alimentos seleccionados */}
                {items.length > 0 && (
                  <div className="npv-items">
                    {items.map((item, i) => (
                      <span key={i} className="npv-item-chip" style={{ '--sc': meta.color, '--sl': meta.light }}>
                        {item.name}
                        <button onClick={() => onRemoveItem(slot.listId, i)} className="npv-item-x">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Agregar grupo */}
          {meal.slots.length < Object.keys(LIST_META).length && (
            <button className="npv-add-slot" onClick={addSlot}>
              <Plus size={12} /> Agregar grupo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Food Modal ───────────────────────────────────────────────────────────────

function FoodModal({ meal, slotListId, selectedItems, listMeta, foodLists, alimentos, onClose, onAddItem }) {
  const LIST_META = listMeta || {};
  const FOOD_LISTS = foodLists || [];
  const [query, setQuery] = useState('');
  const [activeListId, setActiveListId] = useState(slotListId);

  const meta = LIST_META[activeListId] || {};
  const activeList = FOOD_LISTS.find((l) => l.id === activeListId);
  const slotItems = selectedItems[activeListId] || [];
  const slotTarget = meal.slots.find((s) => s.listId === activeListId)?.targetRations || 0;

  const allItems = useMemo(
    () => (alimentos || [])
      .filter((a) => a.grupo === activeListId)
      .map((a) => ({ name: a.nombre, equivale: a.unidad, pesaMide: a.porcion_g ? `${a.porcion_g} g` : '-', sub: '' })),
    [alimentos, activeListId]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter((i) => i.name.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q));
  }, [query, allItems]);

  return (
    <div className="npv-overlay" onClick={onClose}>
      <div className="npv-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="npv-modal-head" style={{ '--mc': meta.color }}>
          <div>
            <p className="npv-modal-sub">{meal.name}</p>
            <h2 className="npv-modal-title">{meta.icon} {meta.name}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="npv-modal-counter">{slotItems.length}/{slotTarget}</span>
            <button className="npv-modal-close" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Tabs de grupos */}
        <div className="npv-modal-tabs">
          {meal.slots.map((slot) => {
            const m = LIST_META[slot.listId];
            const cnt = selectedItems[slot.listId]?.length || 0;
            const done = cnt >= slot.targetRations;
            return (
              <button
                key={slot.listId}
                className={`npv-modal-tab ${activeListId === slot.listId ? 'active' : ''}`}
                style={{ '--tc': m.color }}
                onClick={() => { setActiveListId(slot.listId); setQuery(''); }}
              >
                {m.icon}
                <span className="npv-tab-label">{m.name}</span>
                <span className={`npv-tab-cnt ${done ? 'done' : ''}`}>{cnt}/{slot.targetRations}</span>
              </button>
            );
          })}
        </div>

        {/* Búsqueda */}
        <div className="npv-modal-search">
          <Search size={14} className="npv-search-icon" />
          <input
            autoFocus
            placeholder={`Buscar en ${meta.name}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="npv-search-input"
          />
        </div>

        {/* Lista de alimentos */}
        <div className="npv-modal-body">
          {filtered.length === 0 ? (
            <EmptyState title="Sin resultados" sub="Prueba con otro término" />
          ) : (
            <table className="npv-food-table">
              <thead>
                <tr>
                  <th>Alimento</th>
                  <th>Medida</th>
                  <th>Peso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const added = slotItems.some((s) => s.name === item.name);
                  return (
                    <tr key={i} className={added ? 'added' : ''}>
                      <td>
                        <span className="npv-food-name">{item.name}</span>
                        <span className="npv-food-sub">{item.sub}</span>
                      </td>
                      <td>
                        <span className="npv-food-badge" style={{ '--fc': meta.color, '--fl': meta.light }}>
                          {item.equivale}
                        </span>
                      </td>
                      <td className="npv-food-weight">{item.pesaMide}</td>
                      <td>
                        <button
                          className={`npv-food-btn ${added ? 'added' : ''}`}
                          style={{ '--fc': meta.color }}
                          onClick={() => !added && onAddItem(activeListId, item)}
                          disabled={added}
                        >
                          {added ? <Check size={13} /> : <Plus size={13} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="npv-modal-foot">
          <div className="npv-foot-pills">
            {meal.slots.map((slot) => {
              const m = LIST_META[slot.listId];
              const cnt = selectedItems[slot.listId]?.length || 0;
              const done = cnt >= slot.targetRations;
              return (
                <span key={slot.listId} className={`npv-foot-pill ${done ? 'done' : ''}`} style={{ '--fc': m.color }}>
                  {m.icon} {cnt}/{slot.targetRations}
                </span>
              );
            })}
          </div>
          <button className="npv-foot-btn" onClick={onClose}>Listo ✓</button>
        </div>
      </div>
    </div>
  );
}
