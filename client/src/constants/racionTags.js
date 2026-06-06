/**
 * Tags para raciones en planes alimenticios.
 * value: string enviado al backend (o '' para sin tag)
 */
export const RACION_TAGS = [
  {
    value: '',
    label: 'Sin etiqueta',
    color: 'var(--text-tertiary)',
    bg: 'transparent',
    border: 'var(--border)',
    dot: '#bbb',
  },
  {
    value: 'evitar',
    label: 'Evitar consumo',
    color: '#757575',
    bg: '#f5f5f5',
    border: '#9e9e9e',
    dot: '#9e9e9e',
  },
  {
    value: 'ocasional',
    label: 'Consumo ocasional',
    color: '#b45309',
    bg: '#fef9c3',
    border: '#facc15',
    dot: '#f59e0b',
  },
  {
    value: 'incrementar',
    label: 'Incrementar consumo',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#93c5fd',
    dot: '#3b82f6',
  },
];

export const getTagMeta = (value) =>
  RACION_TAGS.find((t) => t.value === value) || RACION_TAGS[0];
