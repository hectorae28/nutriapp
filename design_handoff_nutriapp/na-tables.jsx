/* ── NutriApp: Exchange Tables View ─────────────────────── */
const { useState: useStateTbl, useMemo: useMemoTbl } = React;

function TablesView() {
  const [query, setQuery] = useStateTbl('');
  const [activeId, setActiveId] = useStateTbl(1);
  const [openSubs, setOpenSubs] = useStateTbl({});

  const meta = LIST_META[activeId];
  const activeList = FOOD_LISTS.find(l => l.id === activeId);

  const filtered = useMemoTbl(() => {
    if (!query.trim()) return activeList?.subcategories || [];
    const q = query.toLowerCase();
    return (activeList?.subcategories || [])
      .map(sub => ({ ...sub, items: sub.items.filter(i => i.name.toLowerCase().includes(q)) }))
      .filter(sub => sub.items.length > 0);
  }, [query, activeList]);

  const toggle = (name) => setOpenSubs(p => ({ ...p, [name]: p[name] === false }));
  const isOpen = (name) => openSubs[name] !== false;

  const totalItems = activeList?.subcategories.reduce((a, s) => a + s.items.length, 0) || 0;

  return (
    <div className="na-tables-view">
      <TopHeader title="Tablas de Intercambio" subtitle="Consulta equivalencias de cada grupo alimenticio"/>

      <div className="na-tables-content">
        {/* Category cards */}
        <div className="na-cat-grid">
          {FOOD_LISTS.map(list => {
            const m = LIST_META[list.id];
            const count = list.subcategories.reduce((a, s) => a + s.items.length, 0);
            const active = activeId === list.id;
            return (
              <button key={list.id}
                className={`na-cat-card ${active ? 'active' : ''}`}
                style={{ '--cat-color': m.color, '--cat-light': m.light }}
                onClick={() => { setActiveId(list.id); setQuery(''); }}>
                <span className="na-cat-icon">{m.icon}</span>
                <span className="na-cat-name">{m.name}</span>
                <span className="na-cat-count">{count} alimentos</span>
              </button>
            );
          })}
        </div>

        {/* Search + active table */}
        <div className="na-table-panel">
          <div className="na-table-panel-header" style={{ borderColor: meta.color + '30' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:28 }}>{meta.icon}</span>
              <div>
                <h3 className="na-table-panel-title" style={{ color: meta.color }}>{meta.name}</h3>
                <span className="na-table-panel-count">{totalItems} alimentos en {activeList?.subcategories.length} categorías</span>
              </div>
            </div>
            <div className="na-table-search-wrap">
              <I.Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)' }}/>
              <input placeholder="Buscar alimentos..." value={query} onChange={e => setQuery(e.target.value)}
                className="na-table-search"/>
            </div>
          </div>

          {/* Subcategory tables */}
          <div className="na-table-body">
            {filtered.length === 0 ? (
              <EmptyState icon={I.Search} title="Sin resultados" message={`No se encontraron alimentos con "${query}"`}/>
            ) : filtered.map(sub => (
              <div key={sub.name} className="na-subtable">
                <button className="na-subtable-header" onClick={() => toggle(sub.name)}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span className="na-subtable-dot" style={{ background: meta.color }}></span>
                    <span className="na-subtable-name">{sub.name}</span>
                    {sub.note && <span className="na-subtable-note">{sub.note}</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span className="na-subtable-count">{sub.items.length}</span>
                    {isOpen(sub.name) ? <I.ChevDown size={16} style={{color: meta.color}}/> : <I.ChevRight size={16} style={{color: meta.color}}/>}
                  </div>
                </button>
                {isOpen(sub.name) && (
                  <div className="na-subtable-body">
                    <div className="na-subtable-head-row">
                      <span className="col-name">Una ración de</span>
                      <span className="col-eq">Equivale a</span>
                      <span className="col-wt">Pesa / Mide</span>
                    </div>
                    {sub.items.map((item, i) => (
                      <div key={i} className="na-subtable-row">
                        <span className="col-name">{item.name}</span>
                        <span className="col-eq">
                          <span className="na-eq-badge" style={{ background: meta.color + '15', color: meta.color }}>
                            {item.equivale}
                          </span>
                        </span>
                        <span className="col-wt">{item.pesaMide}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TablesView });
