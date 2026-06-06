import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Milk, 
  Beef, 
  Leaf, 
  Apple, 
  Wheat, 
  Droplets, 
  Candy,
  UtensilsCrossed,
  Settings
} from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { EmptyState } from '../components/SharedComponents';
import { catalogoApi } from '../api/catalogo';
import { useAuth } from '../contexts/AuthContext';

// Mapeo por palabras clave en el nombre del grupo (lowercase)
const GRUPO_CONFIG = [
  { keys: ['lácteo', 'lacteo', 'leche'],      color: '#5B9BD5', light: '#EBF3FB', Icon: Milk },
  { keys: ['fruta'],                            color: '#E91E63', light: '#FCE4EC', Icon: Apple },
  { keys: ['vegetal', 'verdura', 'hortaliza'], color: '#4CAF50', light: '#E8F5E9', Icon: Leaf },
  { keys: ['proteína', 'proteina', 'carne', 'pollo', 'pescado'], color: '#FF5722', light: '#FBE9E7', Icon: Beef },
  { keys: ['grasa', 'aceite'],                 color: '#FFD600', light: '#FFFDE7', Icon: Droplets },
  { keys: ['cereal', 'pan', 'carbohidrato', 'acompañante', 'acompanante', 'harina', 'arroz'], color: '#795548', light: '#EFEBE9', Icon: Wheat },
  { keys: ['azúcar', 'azucar', 'dulce', 'postre'], color: '#9C27B0', light: '#F3E5F5', Icon: Candy },
];
const DEFAULT_CONFIG = { color: '#6b7280', light: '#f3f4f6', Icon: UtensilsCrossed };

function getGrupoConfig(nombre = '') {
  const n = nombre.toLowerCase();
  return GRUPO_CONFIG.find(cfg => cfg.keys.some(k => n.includes(k))) || DEFAULT_CONFIG;
}

export default function TablesView() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [openSubs, setOpenSubs] = useState({});
  const { isNutricionista, isAdmin } = useAuth();
  const navigate = useNavigate();

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
  const paleta = getGrupoConfig(activeGrupo?.nombre);

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

      {(isNutricionista || isAdmin) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px', marginBottom: 12 }}>
          <button
            onClick={() => navigate('/tablas/admin')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'var(--accent-green)';
              e.target.style.color = 'var(--accent-green)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <Settings size={14} /> Gestionar catálogo
          </button>
        </div>
      )}

      <div className="na-tables-content">
        {/* Grid de categorías */}
        <div>
          <div className="na-cat-grid">
            {grupos.map((grupo, idx) => {
              const p = getGrupoConfig(grupo.nombre);
              const active = activeIdx === idx;
              const IconComponent = p.Icon;
              return (
                <button
                  key={grupo.id}
                  className={`na-cat-card ${active ? 'active' : ''}`}
                  style={{ '--cat-color': p.color, '--cat-light': p.light }}
                  onClick={() => { setActiveIdx(idx); setQuery(''); }}
                >
                  <span className="na-cat-icon"><IconComponent size={24} /></span>
                  <span className="na-cat-name">{grupo.nombre}</span>
                  <span className="na-cat-count">{grupo.alimentos?.length || 0} alimentos</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de detalle */}
        <div className="na-table-panel">
          <div className="na-table-panel-header" style={{ borderColor: paleta.color + '30' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28, display: 'flex', alignItems: 'center', color: paleta.color }}>
                <paleta.Icon size={28} />
              </span>
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
