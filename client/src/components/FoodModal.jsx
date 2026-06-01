import { useState, useMemo } from 'react';
import { X, Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useCatalogo } from '../hooks/useCatalogo';
import { createGrupoStyleMap } from '../constants/grupoStyles';

export default function FoodModal({ meal, slotListId, selectedItems, onClose, onAddItem }) {
  const [query, setQuery] = useState('');
  const [activeListId, setActiveListId] = useState(slotListId);
  const [openSubs, setOpenSubs] = useState({});
  
  const { grupos, alimentos, alimentosPorGrupo, loading, error } = useCatalogo();
  const LIST_COLORS = useMemo(() => createGrupoStyleMap(grupos), [grupos]);

  const c = LIST_COLORS[activeListId] || LIST_COLORS[Object.keys(LIST_COLORS)[0]] || {};
  const activeGrupo = grupos.find((g) => g.id === activeListId);
  const activeAlimentos = alimentosPorGrupo[activeListId] || [];

  // Slot activo dentro de la comida
  const activeSlot = meal.slots.find((s) => s.listId === activeListId);
  const slotItems = selectedItems[activeListId] || [];
  const slotTarget = activeSlot?.targetRations || 0;
  const slotComplete = slotItems.length >= slotTarget;

  // Group alimentos by subcategory (if they have one) - for now just show flat list
  const subcategories = useMemo(() => {
    if (!activeAlimentos || activeAlimentos.length === 0) return [];
    
    // Since backend doesn't have subcategories in the same way, we'll show one group
    return [{
      name: activeGrupo?.nombre || 'Alimentos',
      items: activeAlimentos.map(a => ({
        name: a.nombre,
        equivale: `${a.porcion_g}${a.unidad}`,
        pesaMide: `${a.porcion_g}g`,
        id: a.id,
      })),
    }];
  }, [activeAlimentos, activeGrupo]);

  const filtered = useMemo(() => {
    if (!query.trim()) return subcategories;
    const q = query.toLowerCase();
    return subcategories
      .map((sub) => ({
        ...sub,
        items: sub.items.filter((item) => item.name.toLowerCase().includes(q)),
      }))
      .filter((sub) => sub.items.length > 0);
  }, [query, subcategories]);

  const toggleSub = (name) =>
    setOpenSubs((prev) => ({ ...prev, [name]: prev[name] === false ? true : false }));

  const isSubOpen = (name) => openSubs[name] !== false;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Cargando alimentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-sm text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className={`${c.header || 'bg-gray-500'} px-5 py-4`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide font-medium">
                {meal.name} · {meal.time}
              </p>
              <h2 className="text-white font-bold text-lg leading-tight">
                {activeGrupo?.icon || '🍽️'} {activeGrupo?.nombre || 'Alimentos'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Slot progress pill */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${slotComplete ? 'bg-emerald-400/30' : 'bg-white/20'}`}
              >
                <span className="text-white text-xs font-bold">
                  {slotItems.length}/{slotTarget}
                </span>
                <span className="text-white/70 text-xs">raciones</span>
                {slotComplete && <span className="text-emerald-300 text-xs">✓</span>}
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white bg-white/10 rounded-full p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              autoFocus
              placeholder={`Buscar en ${activeGrupo?.nombre || 'alimentos'}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/20 text-white placeholder-white/50 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border border-white/20 focus:border-white/50 transition-colors"
            />
          </div>
        </div>

        {/* ── List tabs — solo las listas de esta comida ── */}
        <div className="flex overflow-x-auto gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-gray-50 scrollbar-thin">
          {meal.slots.map((slot) => {
            const grupo = grupos.find((g) => g.id === slot.listId);
            const lc = LIST_COLORS[slot.listId] || {};
            const active = activeListId === slot.listId;
            const items = selectedItems[slot.listId] || [];
            const done = items.length >= slot.targetRations;
            return (
              <button
                key={slot.listId}
                onClick={() => {
                  setActiveListId(slot.listId);
                  setQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0 ${
                  active
                    ? `${lc.badge || 'bg-gray-100 text-gray-700'} ${lc.border || 'border-gray-200'} shadow-sm`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{grupo?.icon || '🍽️'}</span>
                <span>{grupo?.nombre || `Lista ${slot.listId}`}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${done ? 'bg-emerald-100 text-emerald-700' : lc.badge || 'bg-gray-100 text-gray-700'}`}
                >
                  {items.length}/{slot.targetRations}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Food tables ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No se encontraron alimentos</p>
            </div>
          ) : (
            filtered.map((sub) => (
              <SubTable
                key={sub.name}
                sub={sub}
                listId={activeListId}
                colors={c}
                isOpen={isSubOpen(sub.name)}
                onToggle={() => toggleSub(sub.name)}
                onAdd={(item) => onAddItem(activeListId, item)}
                selectedItems={slotItems}
              />
            ))
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex gap-3">
            {meal.slots.map((slot) => {
              const lc = LIST_COLORS[slot.listId] || {};
              const items = selectedItems[slot.listId] || [];
              const done = items.length >= slot.targetRations;
              const grupo = grupos.find((g) => g.id === slot.listId);
              return (
                <div key={slot.listId} className="flex items-center gap-1 text-xs">
                  <span>{grupo?.icon || '🍽️'}</span>
                  <span className={`font-semibold ${done ? 'text-emerald-600' : 'text-gray-600'}`}>
                    {items.length}/{slot.targetRations}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SubTable ────────────────────────────────────────────────
function SubTable({ sub, listId, colors, isOpen, onToggle, onAdd, selectedItems }) {
  const c = colors || {};
  return (
    <div className={`border ${c.border || 'border-gray-200'} rounded-xl overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full px-4 py-2.5 ${c.light || 'bg-gray-50'} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${c.dot || 'bg-gray-400'}`} />
          <span className={`font-semibold text-sm ${c.text || 'text-gray-700'}`}>{sub.name}</span>
          {sub.note && <span className="text-xs text-gray-400 hidden sm:block">· {sub.note}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{sub.items.length} alimentos</span>
          {isOpen ? (
            <ChevronDown className={`w-4 h-4 ${c.text || 'text-gray-700'}`} />
          ) : (
            <ChevronRight className={`w-4 h-4 ${c.text || 'text-gray-700'}`} />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="divide-y divide-gray-50">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-1.5 bg-gray-50 text-xs text-gray-400 font-medium">
            <span className="col-span-5">Alimento</span>
            <span className="col-span-4">Equivale a</span>
            <span className="col-span-2">Pesa/Mide</span>
            <span className="col-span-1" />
          </div>
          {sub.items.map((item) => (
            <FoodRow
              key={item.id || item.name}
              item={item}
              colors={c}
              onAdd={() => onAdd(item)}
              alreadyAdded={selectedItems.some((s) => s.name === item.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FoodRow({ item, colors, onAdd, alreadyAdded }) {
  const c = colors || {};
  return (
    <div
      className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:${c.bg || 'bg-gray-50'} transition-colors group`}
    >
      <div className="col-span-5">
        <span className="text-sm text-gray-700">{item.name}</span>
      </div>
      <div className="col-span-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.badge || 'bg-gray-100 text-gray-700'}`}>
          {item.equivale}
        </span>
      </div>
      <div className="col-span-2">
        <span className="text-xs text-gray-400">{item.pesaMide}</span>
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          onClick={onAdd}
          title={alreadyAdded ? 'Agregar otra ración' : 'Agregar'}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            alreadyAdded
              ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
              : `${c.light || 'bg-gray-100'} ${c.text || 'text-gray-700'} opacity-0 group-hover:opacity-100 hover:opacity-100`
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
