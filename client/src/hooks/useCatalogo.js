import { useState, useEffect, useMemo } from 'react';
import { catalogoApi } from '../api/catalogo';

/**
 * Custom hook to fetch and manage food catalog data (grupos and alimentos)
 * Fetches from backend API on mount and provides memoized data
 * 
 * @returns {object} { grupos, alimentos, alimentosPorGrupo, loading, error, refetch }
 */
export function useCatalogo() {
  const [grupos, setGrupos] = useState([]);
  const [alimentos, setAlimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [gruposData, alimentosData] = await Promise.all([
        catalogoApi.grupos(),
        catalogoApi.alimentos(),
      ]);
      
      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setAlimentos(Array.isArray(alimentosData) ? alimentosData : []);
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setError(err.message || 'Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Memoized map of alimentos grouped by grupo.id
  const alimentosPorGrupo = useMemo(() => {
    if (!Array.isArray(alimentos)) return {};
    
    return alimentos.reduce((map, alimento) => {
      const grupoId = alimento.grupo;
      if (!map[grupoId]) {
        map[grupoId] = [];
      }
      map[grupoId].push(alimento);
      return map;
    }, {});
  }, [alimentos]);

  return {
    grupos,
    alimentos,
    alimentosPorGrupo,
    loading,
    error,
    refetch: fetchData,
  };
}
