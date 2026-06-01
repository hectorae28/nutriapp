// Stable color palette for GrupoAlimento (food groups from backend API)
// Keyed by lowercase group name for stability across IDs

export const GRUPO_STYLES = {
  'lácteos': {
    color: '#5B8DEF',
    light: '#EBF0FF',
    dark: '#1E2A4A',
    icon: '🥛',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
    header: 'bg-blue-500',
    text: 'text-blue-700',
    ring: 'ring-blue-300',
  },
  'vegetales': {
    color: '#43A047',
    light: '#E8F5E9',
    dark: '#1B3A1E',
    icon: '🥦',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-400',
    header: 'bg-green-500',
    text: 'text-green-700',
    ring: 'ring-green-300',
  },
  'frutas': {
    color: '#EF6C00',
    light: '#FFF3E0',
    dark: '#3A2510',
    icon: '🍎',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-400',
    header: 'bg-orange-500',
    text: 'text-orange-700',
    ring: 'ring-orange-300',
  },
  'acompañantes': {
    color: '#D4A257',
    light: '#FFF8E1',
    dark: '#3A3018',
    icon: '🌾',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-400',
    header: 'bg-yellow-500',
    text: 'text-yellow-700',
    ring: 'ring-yellow-300',
  },
  'proteínas': {
    color: '#E05555',
    light: '#FFEBEE',
    dark: '#3A1B1B',
    icon: '🥩',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-400',
    header: 'bg-red-500',
    text: 'text-red-700',
    ring: 'ring-red-300',
  },
  'grasas': {
    color: '#7E57C2',
    light: '#F3E5F5',
    dark: '#2A1E3A',
    icon: '🥑',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-400',
    header: 'bg-purple-500',
    text: 'text-purple-700',
    ring: 'ring-purple-300',
  },
};

// Fallback colors for groups not in the main palette
const FALLBACK_COLORS = [
  { color: '#00897B', light: '#E0F2F1', icon: '🍵' },
  { color: '#F06292', light: '#FCE4EC', icon: '🫐' },
  { color: '#FFA726', light: '#FFF3E0', icon: '🌰' },
];

/**
 * Get style object for a food group by name
 * @param {string} nombre - Group name (e.g., "Lácteos")
 * @param {number} fallbackIndex - Index for fallback color if not found
 * @returns {object} Style object with color, light, icon, etc.
 */
export function getGrupoStyle(nombre, fallbackIndex = 0) {
  if (!nombre) {
    const fallback = FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
    return { ...fallback, ...generateTailwindClasses(fallback.color) };
  }
  
  const key = nombre.toLowerCase().trim();
  const style = GRUPO_STYLES[key];
  
  if (style) {
    return style;
  }
  
  // Use fallback for unknown groups
  const fallback = FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
  return { ...fallback, ...generateTailwindClasses(fallback.color) };
}

/**
 * Generate Tailwind classes for a hex color (best effort mapping)
 * @param {string} hexColor - Hex color code
 * @returns {object} Object with Tailwind class strings
 */
function generateTailwindClasses(hexColor) {
  // This is a simplified mapping - in production you'd want a proper color mapping
  return {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    dot: 'bg-gray-400',
    header: 'bg-gray-500',
    text: 'text-gray-700',
    ring: 'ring-gray-300',
  };
}

/**
 * Convert a grupo object to LIST_COLORS-compatible format
 * @param {object} grupo - GrupoAlimento object from API with { id, nombre, ... }
 * @returns {object} Style object compatible with old LIST_COLORS[id] format
 */
export function grupoToListColors(grupo) {
  if (!grupo) return GRUPO_STYLES['lácteos']; // Default fallback
  return getGrupoStyle(grupo.nombre, grupo.id - 1);
}

/**
 * Create a map of grupo ID to style
 * @param {Array} grupos - Array of GrupoAlimento objects
 * @returns {object} Map of { [grupoId]: styleObject }
 */
export function createGrupoStyleMap(grupos) {
  if (!Array.isArray(grupos)) return {};
  
  return grupos.reduce((map, grupo) => {
    map[grupo.id] = grupoToListColors(grupo);
    return map;
  }, {});
}

/**
 * Get hex color for SVG stroke based on grupo name
 * @param {string} nombre - Group name
 * @returns {string} Hex color code
 */
export function getGrupoColorStroke(nombre) {
  const style = getGrupoStyle(nombre);
  return style.color || '#60a5fa';
}
