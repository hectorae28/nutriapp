import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, X, Eye } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { EmptyState } from '../components/SharedComponents';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import { usePacientesStore } from '../stores';
import WizardNuevoPaciente from '../components/WizardNuevoPaciente';

export default function PacientesView() {
  const { pacientes, loading, fetchPacientes } = usePacientesStore();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();

  // Cargar pacientes al montar (sin búsqueda)
  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  // Debounce search
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      fetchPacientes(search)
        .then((data) => setSearchResults(data))
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [search, fetchPacientes]);

  const displayedPacientes = searchResults !== null ? searchResults : pacientes;
  const isLoading = searching || loading;

  const verPaciente = (p) => navigate(`/pacientes/${p.id}`);

  const iniciales = (p) => {
    const fn = p.user?.first_name?.[0] || '';
    const ln = p.user?.last_name?.[0] || '';
    return (fn + ln).toUpperCase() || p.user?.username?.[0]?.toUpperCase() || '?';
  };

  const nombreCompleto = (p) =>
    `${p.user?.first_name ?? ''} ${p.user?.last_name ?? ''}`.trim() || p.user?.username || '—';

  return (
    <div style={{ padding: '0 0 24px' }}>
      <TopHeader
        title="Pacientes"
        subtitle="Gestión de expedientes y seguimiento"
        action={
          <button
            onClick={() => setShowWizard(true)} // Open the wizard
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent-green)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Nuevo paciente
          </button>
        }
      />

      {/* Buscador */}
      <div style={{ padding: '16px 24px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '8px 14px',
            maxWidth: 420,
          }}
        >
          <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              color: 'var(--text-primary)',
              width: '100%',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          <LoadingSpinner size={28} message="Cargando pacientes..." />
        ) : displayedPacientes.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Sin resultados' : 'Sin pacientes registrados'}
            message={
              search
                ? `No hay pacientes que coincidan con "${search}"`
                : 'Registra el primer paciente con el botón de arriba'
            }
          />
        ) : (
          displayedPacientes.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                padding: '12px 16px',
                transition: 'box-shadow 0.15s',
                cursor: 'pointer',
              }}
              onClick={() => verPaciente(p)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              {/* Avatar con indicador de estado */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--accent-green)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {iniciales(p)}
                </div>
                {/* Dot indicator - green if active (or undefined), red if inactive */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: p.is_active !== false ? '#16a34a' : '#dc2626',
                    border: '2px solid var(--bg-surface)',
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 2,
                    color: 'var(--text-primary)',
                  }}
                >
                  {nombreCompleto(p)}
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {p.cedula && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {/* <CreditCard size={12} /> */} {p.cedula}
                    </span>
                  )}
                  {p.telefono && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {/* <Phone size={12} /> */} {p.telefono}
                    </span>
                  )}
                  {p.sexo && (
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : 'Otro'}
                    </span>
                  )}
                </div>
              </div>

              <Eye size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>

      {/* Nuevo Paciente Wizard */}
      {showWizard && (
        <WizardNuevoPaciente
          onClose={() => setShowWizard(false)}
          onSuccess={(pacienteId) => {
            setShowWizard(false);
            fetchPacientes('', true); // forzar recarga
            if (pacienteId) {
              navigate(`/pacientes/${pacienteId}`);
            }
          }}
        />
      )}
    </div>
  );
}

