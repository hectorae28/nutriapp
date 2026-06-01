// Constants for ConsumoCaloricoItem groups
// These are DIFFERENT from GrupoAlimento - they represent clinical intake history
// Keys match backend's GRUPO_CHOICES enum and must not be changed

/**
 * Default empty consumption groups for clinical intake history
 * Used in patient registration and clinical evaluation forms
 */
export const CONSUMO_GRUPOS = [
  { grupo: 'LECHE', nombre: 'Leche', intercambios: '', proteinas_g: '', grasas_g: '', cho_g: '', kcal: '', orden: 0 },
  { grupo: 'CARNES_A', nombre: 'Carnes Tipo A', intercambios: '', proteinas_g: '', grasas_g: '', cho_g: '', kcal: '', orden: 1 },
  { grupo: 'CARNES_B', nombre: 'Carnes Tipo B', intercambios: '', proteinas_g: '', grasas_g: '', cho_g: '', kcal: '', orden: 2 },
  { grupo: 'VEGETALES', nombre: 'Vegetales', intercambios: '', proteinas_g: '', grasas_g: '', cho_g: '', kcal: '', orden: 3 },
  { grupo: 'FRUTAS', nombre: 'Frutas', intercambios: '', proteinas_g: '', grasas_g: '', cho_g: '', kcal: '', orden: 4 },
  { grupo: 'ALMIDONES', nombre: 'Almidones', intercambios: '', proteinas_g: '', grasas_g: '', cho_g: '', kcal: '', orden: 5 },
  { grupo: 'GRASAS', nombre: 'Grasas', intercambios: '', proteinas_g: '', grasas_g: '', cho_g: '', kcal: '', orden: 6 },
  { grupo: 'AZUCAR', nombre: 'Azúcar', intercambios: '', proteinas_g: '', grasas_g: '', cho_g: '', kcal: '', orden: 7 },
  { grupo: 'SOPORTE', nombre: 'Soporte Nutricional', intercambios: '', proteinas_g: '', grasas_g: '', cho_g: '', kcal: '', orden: 8 },
];

/**
 * Map of consumption group codes to display names
 */
export const GRUPOS_NOMBRES = {
  LECHE: 'Leche',
  CARNES_A: 'Carnes Tipo A',
  CARNES_B: 'Carnes Tipo B',
  VEGETALES: 'Vegetales',
  FRUTAS: 'Frutas',
  ALMIDONES: 'Almidones',
  GRASAS: 'Grasas',
  AZUCAR: 'Azúcar',
  SOPORTE: 'Soporte Nutricional',
  SOPORTE_NUTRICIONAL: 'Soporte Nutricional', // Alternate key
};

/**
 * Get default consumption groups with empty values
 * @returns {Array} Array of consumption group objects
 */
export function getConsumoCaloricoDefecto() {
  return CONSUMO_GRUPOS.map(g => ({ ...g }));
}
