export const LIST_META = {
  1: { name: "Lácteos", icon: "🥛", color: "#5B8DEF", light: "#EBF0FF", dark: "#1E2A4A" },
  2: { name: "Vegetales", icon: "🥦", color: "#43A047", light: "#E8F5E9", dark: "#1B3A1E" },
  3: { name: "Frutas", icon: "🍎", color: "#EF6C00", light: "#FFF3E0", dark: "#3A2510" },
  4: { name: "Acompañantes", icon: "🌾", color: "#D4A257", light: "#FFF8E1", dark: "#3A3018" },
  5: { name: "Proteínas", icon: "🥩", color: "#E05555", light: "#FFEBEE", dark: "#3A1B1B" },
  6: { name: "Grasas", icon: "🥑", color: "#7E57C2", light: "#F3E5F5", dark: "#2A1E3A" },
};

export const FOOD_LISTS = [
  { id: 1, name: "Lácteos", icon: "🥛", subcategories: [
    { name: "Leche de Origen Animal", items: [
      { name: "Líquida completa", equivale: "1 Taza", pesaMide: "240 ml" },
      { name: "Líquida descremada", equivale: "1 Taza", pesaMide: "240 ml" },
      { name: "Líquida deslactosada", equivale: "1 Taza", pesaMide: "240 ml" },
      { name: "Deslactosada semidescremada", equivale: "1 Taza", pesaMide: "240 ml" },
      { name: "Líquida de cabra", equivale: "1 Taza", pesaMide: "240 ml" },
      { name: "En polvo completa", equivale: "4 Cda.", pesaMide: "25 gr" },
      { name: "En polvo descremada", equivale: "4 Cda.", pesaMide: "25 gr" },
      { name: "En polvo deslactosada", equivale: "4 Cda.", pesaMide: "25 gr" },
    ]},
    { name: "Yogur de Origen Animal", items: [
      { name: "Yogur entero", equivale: "1 Taza", pesaMide: "240 ml" },
      { name: "Yogur descremado", equivale: "1 Taza", pesaMide: "240 ml" },
    ]},
    { name: "Leche de Origen Vegetal", items: [
      { name: "Almendras, avellanas, nueces, maní", equivale: "1 Taza", pesaMide: "240 ml" },
      { name: "Líquida de coco", equivale: "1 Taza", pesaMide: "240 ml" },
      { name: "Líquida de soya", equivale: "1 Taza", pesaMide: "240 ml" },
    ]},
    { name: "Yogur de Origen Vegetal", items: [
      { name: "Yogur de almendras", equivale: "1 Taza", pesaMide: "240 ml" },
      { name: "Yogur de coco", equivale: "1 Taza", pesaMide: "240 ml" },
    ]},
  ]},
  { id: 2, name: "Vegetales", icon: "🥦", subcategories: [
    { name: "Vegetales", note: "Entre 1 y 2 tazas, solos o combinados", items: [
      { name: "Acelgas", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Ají", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Ajoporro / Puerro", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Alcachofa", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Apio España / Célery", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Berenjena", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Berro", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Calabacín / Zuquini", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Champiñón", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Coliflor, Brócoli, Repollo", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Espárrago", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Espinaca", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Lechuga", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Pepino", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Pimentón", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Rúgula / Rúcula", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Tomate", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Auyama", equivale: "1/2 Taza", pesaMide: "-" },
      { name: "Cebolla", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Remolacha", equivale: "1-2 Tazas", pesaMide: "-" },
      { name: "Zanahoria", equivale: "1-2 Tazas", pesaMide: "-" },
    ]},
  ]},
  { id: 3, name: "Frutas", icon: "🍎", subcategories: [
    { name: "Frutas", items: [
      { name: "Arándanos / Blueberry", equivale: "1 Taza", pesaMide: "100 gr" },
      { name: "Cambur / Banano", equivale: "1/2 Und.", pesaMide: "80 gr" },
      { name: "Durazno", equivale: "1 Und. Med.", pesaMide: "100 gr" },
      { name: "Fresa / Frutilla", equivale: "1¼ Taza", pesaMide: "160 gr" },
      { name: "Guayaba", equivale: "1 Und. Med.", pesaMide: "100 gr" },
      { name: "Kiwi", equivale: "1 Und. Med.", pesaMide: "100 gr" },
      { name: "Lechosa / Papaya", equivale: "1 Taza", pesaMide: "170 gr" },
      { name: "Mandarina", equivale: "1 Und. Med.", pesaMide: "140 gr" },
      { name: "Mango", equivale: "1/2 Und.", pesaMide: "100 gr" },
      { name: "Manzana", equivale: "1 Und. Peq.", pesaMide: "100 gr" },
      { name: "Melón", equivale: "1 Taza", pesaMide: "300 gr" },
      { name: "Naranja", equivale: "1 Und. Med.", pesaMide: "140 gr" },
      { name: "Patilla / Sandía", equivale: "1¼ Taza", pesaMide: "300 gr" },
      { name: "Pera", equivale: "1 Und. Med.", pesaMide: "90 gr" },
      { name: "Piña", equivale: "1 Rodaja", pesaMide: "100 gr" },
      { name: "Uvas", equivale: "7 Und. Gde.", pesaMide: "100 gr" },
    ]},
  ]},
  { id: 4, name: "Acompañantes", icon: "🌾", subcategories: [
    { name: "Cereales", items: [
      { name: "Avena en Hojuelas", equivale: "1/2 Taza", pesaMide: "-" },
      { name: "Avena en Harina", equivale: "2 Cucharadas", pesaMide: "-" },
      { name: "Arroz tostado", equivale: "1/2 Taza", pesaMide: "-" },
      { name: "Hojuelas de maíz", equivale: "3/4 Taza", pesaMide: "-" },
      { name: "Cereal integral", equivale: "1/2 Taza", pesaMide: "-" },
    ]},
    { name: "Contornos", items: [
      { name: "Arepa Asada", equivale: "1 Und. Peq.", pesaMide: "50 gr" },
      { name: "Arroz cocido", equivale: "1/2 Taza", pesaMide: "100 gr" },
      { name: "Pasta cocida", equivale: "1/2 Taza", pesaMide: "100 gr" },
      { name: "Plátano cocido", equivale: "1/4 Und.", pesaMide: "50 gr" },
      { name: "Quinoa cocida", equivale: "1/2 Taza", pesaMide: "100 gr" },
    ]},
    { name: "Tubérculos", items: [
      { name: "Batata entera", equivale: "1/2 Taza cocida", pesaMide: "90 gr" },
      { name: "Papa entera", equivale: "1 Trozo cocido", pesaMide: "90 gr" },
      { name: "Yuca entera", equivale: "1 Trozo cocido", pesaMide: "90 gr" },
    ]},
    { name: "Granos / Leguminosas", items: [
      { name: "Caraotas / Frijol negro", equivale: "1/2 Taza cocida", pesaMide: "100 gr" },
      { name: "Garbanzo", equivale: "1/2 Taza cocida", pesaMide: "100 gr" },
      { name: "Lentejas", equivale: "1/2 Taza cocida", pesaMide: "100 gr" },
    ]},
    { name: "Panes", items: [
      { name: "Arepa", equivale: "1 Und. Peq.", pesaMide: "50 gr" },
      { name: "Pan Sándwich", equivale: "1 Rebanada", pesaMide: "-" },
      { name: "Tortilla de trigo", equivale: "1 Und. Med.", pesaMide: "50 gr" },
    ]},
  ]},
  { id: 5, name: "Proteínas", icon: "🥩", subcategories: [
    { name: "Carne de Res", items: [
      { name: "Entera (Milanesa, medallón)", equivale: "1 porción", pesaMide: "30 gr" },
      { name: "Molida o desmechada", equivale: "2 cucharadas", pesaMide: "30 gr" },
    ]},
    { name: "Carne de Aves", items: [
      { name: "Pollo entero (presa)", equivale: "1 porción", pesaMide: "30 gr" },
      { name: "Pollo molido o desmechado", equivale: "2 cucharadas", pesaMide: "30 gr" },
    ]},
    { name: "Pescado", items: [
      { name: "Filete o entero", equivale: "1 porción", pesaMide: "30 gr" },
      { name: "Desmenuzado", equivale: "2 cucharadas", pesaMide: "30 gr" },
    ]},
    { name: "Huevos", items: [
      { name: "Entero", equivale: "1 Und.", pesaMide: "-" },
      { name: "Claras de huevo", equivale: "2 Und.", pesaMide: "-" },
    ]},
    { name: "Quesos", items: [
      { name: "Ricota, requesón", equivale: "1/4 Taza", pesaMide: "30 gr" },
      { name: "Mozzarella o descremado", equivale: "1 Rebanada", pesaMide: "30 gr" },
      { name: "Queso blanco bajo en sal", equivale: "1 Porción", pesaMide: "30 gr" },
    ]},
  ]},
  { id: 6, name: "Grasas", icon: "🥑", subcategories: [
    { name: "Insaturadas", items: [
      { name: "Aceite (oliva, girasol, coco)", equivale: "1 Cucharadita", pesaMide: "5 ml" },
      { name: "Aceitunas", equivale: "5 Und. Grandes", pesaMide: "-" },
      { name: "Aguacate", equivale: "1 Lonja fina", pesaMide: "10 gr" },
    ]},
    { name: "Frutos Secos", items: [
      { name: "Almendra o Avellana", equivale: "6 Unidades", pesaMide: "-" },
      { name: "Maní sin concha", equivale: "20 Unidades", pesaMide: "-" },
      { name: "Nueces", equivale: "2 Unidades", pesaMide: "-" },
      { name: "Mantequilla de maní", equivale: "1 Cucharadita", pesaMide: "5 gr" },
    ]},
    { name: "Aderezos", items: [
      { name: "Vinagreta ligera", equivale: "2 Cucharaditas", pesaMide: "10 ml" },
      { name: "Mostaza", equivale: "1 Cucharadita", pesaMide: "5 gr" },
      { name: "Mayonesa ligera", equivale: "1 Cucharadita", pesaMide: "5 gr" },
    ]},
  ]},
];

export const DEFAULT_MEALS = [
  { id: 1, name: "Desayuno", time: "7:00 AM", slots: [
    { listId: 1, targetRations: 2 }, { listId: 3, targetRations: 1 }, { listId: 4, targetRations: 2 },
  ]},
  { id: 2, name: "Merienda AM", time: "10:00 AM", slots: [
    { listId: 3, targetRations: 1 }, { listId: 1, targetRations: 1 },
  ]},
  { id: 3, name: "Almuerzo", time: "1:00 PM", slots: [
    { listId: 4, targetRations: 3 }, { listId: 5, targetRations: 2 }, { listId: 2, targetRations: 1 }, { listId: 6, targetRations: 1 },
  ]},
  { id: 4, name: "Merienda PM", time: "4:00 PM", slots: [
    { listId: 3, targetRations: 1 }, { listId: 6, targetRations: 1 },
  ]},
  { id: 5, name: "Cena", time: "7:00 PM", slots: [
    { listId: 5, targetRations: 2 }, { listId: 4, targetRations: 2 }, { listId: 2, targetRations: 1 }, { listId: 6, targetRations: 1 },
  ]},
];

export const MOCK_PATIENT = {
  name: "María García",
  age: 32,
  sex: "Femenino",
  height: 165,
  email: "maria.garcia@email.com",
  phone: "+58 412-555-1234",
  objective: "Pérdida de peso saludable",
  allergies: ["Maní", "Mariscos"],
  conditions: ["Resistencia a la insulina"],
  startDate: "2026-02-15",
  nextVisit: "2026-05-22",
};

export const MOCK_WEIGHT_DATA = [
  { week: "Sem 1", date: "Feb 15", weight: 78.5, target: 78 },
  { week: "Sem 2", date: "Feb 22", weight: 78.1, target: 77.5 },
  { week: "Sem 3", date: "Mar 1", weight: 77.4, target: 77 },
  { week: "Sem 4", date: "Mar 8", weight: 77.0, target: 76.5 },
  { week: "Sem 5", date: "Mar 15", weight: 76.8, target: 76 },
  { week: "Sem 6", date: "Mar 22", weight: 76.2, target: 75.5 },
  { week: "Sem 7", date: "Mar 29", weight: 75.9, target: 75 },
  { week: "Sem 8", date: "Abr 5", weight: 75.5, target: 74.5 },
  { week: "Sem 9", date: "Abr 12", weight: 75.1, target: 74 },
  { week: "Sem 10", date: "Abr 19", weight: 74.6, target: 73.5 },
  { week: "Sem 11", date: "Abr 26", weight: 74.2, target: 73 },
  { week: "Sem 12", date: "May 3", weight: 73.8, target: 72.5 },
];

export const MOCK_MEASUREMENTS = [
  { date: "Feb 15", cintura: 88, cadera: 102, brazo: 31, muslo: 58 },
  { date: "Mar 15", cintura: 85, cadera: 100, brazo: 30, muslo: 57 },
  { date: "Abr 15", cintura: 82, cadera: 98, brazo: 29, muslo: 55 },
  { date: "May 3", cintura: 80, cadera: 97, brazo: 28.5, muslo: 54 },
];

export const MOCK_MACROS = { proteinas: 25, carbohidratos: 45, grasas: 30 };

export const MOCK_ADHERENCE = [
  { month: "Feb", weeks: [85, 78, 90, 82] },
  { month: "Mar", weeks: [88, 92, 85, 95] },
  { month: "Abr", weeks: [90, 88, 93, 91] },
  { month: "May", weeks: [94, 90] },
];

export const MOCK_VISIT_NOTES = [
  { date: "May 3, 2026", note: "Excelente progreso. Bajó 0.4kg. Ajustar raciones de acompañantes a 2 en cena. Continuar plan actual.", type: "control" },
  { date: "Abr 15, 2026", note: "Mediciones corporales actualizadas. Reducción notable en cintura (-3cm). Mantener actividad física 4x/semana.", type: "medicion" },
  { date: "Mar 15, 2026", note: "Revisión de adherencia. Mejorar consumo de vegetales. Agregar snack de frutas en la tarde.", type: "control" },
  { date: "Feb 15, 2026", note: "Consulta inicial. Plan de 1800 kcal. Meta: -5kg en 12 semanas. Restricción de maní y mariscos.", type: "inicial" },
];
