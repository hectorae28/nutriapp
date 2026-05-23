import { useState } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { foodLists, LIST_COLORS } from "../data/foodLists";

export default function FoodListsView() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(1);
  const [openSubs, setOpenSubs] = useState({});

  const activeList = foodLists.find((l) => l.id === activeId);
  const c = LIST_COLORS[activeId];

  const filtered = activeList?.subcategories
    .map((sub) => ({
      ...sub,
      items: query
        ? sub.items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
        : sub.items,
    }))
    .filter((sub) => sub.items.length > 0);

  const toggle = (name) => setOpenSubs((p) => ({ ...p, [name]: !p[name] }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3">Tablas de Intercambio</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Buscar en todas las listas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        {/* List tabs */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {foodLists.map((list) => {
            const lc = LIST_COLORS[list.id];
            const active = activeId === list.id;
            return (
              <button
                key={list.id}
                onClick={() => { setActiveId(list.id); setQuery(""); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  active ? `${lc.badge} ${lc.border} shadow-sm` : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {list.icon} {list.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tables */}
      <div className="divide-y divide-gray-50">
        {filtered?.map((sub) => {
          const isOpen = openSubs[sub.name] !== false;
          return (
            <div key={sub.name}>
              <button
                onClick={() => toggle(sub.name)}
                className={`flex items-center justify-between w-full px-5 py-3 ${c.bg} hover:opacity-90`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={`font-semibold text-sm ${c.text}`}>{sub.name}</span>
                  {sub.note && <span className="text-xs text-gray-400 hidden md:block">· {sub.note}</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{sub.items.length} alimentos</span>
                  {isOpen ? <ChevronDown className={`w-4 h-4 ${c.text}`} /> : <ChevronRight className={`w-4 h-4 ${c.text}`} />}
                </div>
              </button>
              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-400 font-medium">
                        <th className="text-left px-5 py-2">Una ración de</th>
                        <th className="text-left px-3 py-2">Equivale a</th>
                        <th className="text-left px-3 py-2">Pesa / Mide</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sub.items.map((item) => (
                        <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-2.5 text-gray-700">{item.name}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{item.equivale}</span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 text-xs">{item.pesaMide}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
