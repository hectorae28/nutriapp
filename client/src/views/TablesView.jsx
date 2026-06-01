import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { EmptyState } from '../components/SharedComponents';
import { catalogoApi } from '../api/catalogo';

// Paleta de colores y emojis para grupos dinámicos
const PALETA = [
  { color: '#4CAF50', light: '#E8F5E9', icon: '🥛' },
  { color: '#F44336', light: '#FFEBEE', icon: '🍗' },
  { color: '#FF9800', light: '#FFF3E0', icon: '🥩' },
  { color: '#8BC34A', light: '#F1F8E9', icon: '🥦' },
  { color: '#E91E63', light: '#FCE4EC', icon: '🍎' },
  { color: '#795548', light: '#EFEBE9', icon: '🌾' },
  { color: '#FFD600', light: '#FFFDE7', icon: '🫒' },
  { color: '#9C27B0', light: '#F3E5F5', icon: '🍬' },
];

export default function TablesView() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [openSubs, setOpenSubs] = useState({});

  useEffect(() => {
    catalogoApi
      .grupos()
      .then((data) => {
        setGrupos(data);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudo cargar el catálogo');
        setLoading(false);
      });
  }, []);

  const activeGrupo = grupos[activeIdx] || null;
  const paleta = PALETA[activeIdx % PALETA.length];

  const filtered = useMemo(() => {
    if (!activeGrupo) return [];
    const alimentos = activeGrupo.alimentos?.filter((a) => a.activo) || [];
    if (!query.trim()) return alimentos;
    const q = query.toLowerCase();
    return alimentos.filter((a) => a.nombre.toLowerCase().includes(q));
  }, [query, activeGrupo]);

  const toggle = (name) => setOpenSubs((p) => ({ ...p, [name]: !p[name] }));

  if (loading)
    return (
      <div className="na-tables-view">
        <TopHeader title="Tablas de Intercambio" subtitle="Cargando catálogo..." />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid var(--accent-green)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      </div>
    );

  if (error || grupos.length === 0)
    return (
      <div className="na-tables-view">
        <TopHeader title="Tablas de Intercambio" subtitle="Sistema de intercambios venezolano" />
        <EmptyState
          title={error || 'Sin datos en el catálogo'}
          sub="El administrador debe cargar los grupos alimenticios"
        />
      </div>
    );

  return (
    <div className="na-tables-view">
      <TopHeader
        title="Tablas de Intercambio"
        subtitle="Consulta equivalencias de cada grupo alimenticio"
      />

      <div className="na-tables-content">
        {/* Grid de categorías */}
        <div className="na-cat-grid">
          {grupos.map((grupo, idx) => {
            const p = PALETA[idx % PALETA.length];
            const active = activeIdx === idx;
            return (
              <button
                key={grupo.id}
                className={`na-cat-card ${active ? 'active' : ''}`}
                style={{ '--cat-color': p.color, '--cat-light': p.light }}
                onClick={() => {
                  setActiveIdx(idx);
                  setQuery('');
                }}
              >
                <span className="na-cat-icon">{p.icon}</span>
                <span className="na-cat-name">{grupo.nombre}</span>
                <span className="na-cat-count">{grupo.alimentos?.length || 0} alimentos</span>
              </button>
            );
          })}
        </div>

        {/* Panel de detalle */}
        <div className="na-table-panel">
          <div className="na-table-panel-header" style={{ borderColor: paleta.color + '30' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>{paleta.icon}</span>
              <div>
                <h3 className="na-table-panel-title" style={{ color: paleta.color }}>
                  {activeGrupo?.nombre}
                </h3>
                <span className="na-table-panel-count">
                  {activeGrupo?.alimentos?.length || 0} alimentos · {activeGrupo?.kcal_racion}{' '}
                  kcal/ración · P:{activeGrupo?.proteina_g}g C:{activeGrupo?.carb_g}g G:
                  {activeGrupo?.grasa_g}g
                </span>
              </div>
            </div>
            <div className="na-table-search-wrap">
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none',
                }}
              />
              <input
                className="na-table-search"
                type="text"
                placeholder="Buscar alimento..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="na-table-body">
            {filtered.length === 0 ? (
              <EmptyState title="Sin resultados" sub="Prueba con otro término de búsqueda" />
            ) : (
              <div>
                <div className="na-subtable-head-row">
                  <span>Alimento</span>
                  <span>Medida</span>
                  <span>Peso</span>
                </div>
                {filtered.map((alimento) => (
                  <div key={alimento.id} className="na-subtable-row">
                    <span>{alimento.nombre}</span>
                    <span>
                      <span
                        className="na-eq-badge"
                        style={{
                          background: paleta.light,
                          color: paleta.color,
                        }}
                      >
                        {alimento.unidad}
                      </span>
                    </span>
                    <span style={{ color: 'var(--text-tertiary)' }}>{alimento.porcion_g} g</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
