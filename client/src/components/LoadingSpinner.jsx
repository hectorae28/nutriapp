export function LoadingSpinner({ size = 32, message = 'Cargando...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        gap: 12,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: '3px solid var(--accent-green)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {message && <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{message}</span>}
    </div>
  );
}

export function SkeletonLine({ width = '100%', height = 16 }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: 'var(--border)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}
