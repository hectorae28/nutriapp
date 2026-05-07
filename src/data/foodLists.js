export const LIST_COLORS = {
  1: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-400", header: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-300" },
  2: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", dot: "bg-green-400", header: "bg-green-500", light: "bg-green-100", text: "text-green-700", ring: "ring-green-300" },
  3: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-400", header: "bg-orange-500", light: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-300" },
  4: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400", header: "bg-yellow-500", light: "bg-yellow-100", text: "text-yellow-700", ring: "ring-yellow-300" },
  5: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", dot: "bg-red-400", header: "bg-red-500", light: "bg-red-100", text: "text-red-700", ring: "ring-red-300" },
  6: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", dot: "bg-purple-400", header: "bg-purple-500", light: "bg-purple-100", text: "text-purple-700", ring: "ring-purple-300" },
};

export const foodLists = [
  {
    id: 1,
    name: "Lácteos",
    icon: "🥛",
    subcategories: [
      {
        name: "Leche de Origen Animal",
        items: [
          { name: "Líquida completa", equivale: "1 Taza", pesaMide: "240 ml" },
          { name: "Líquida descremada", equivale: "1 Taza", pesaMide: "240 ml" },
          { name: "Líquida deslactosada", equivale: "1 Taza", pesaMide: "240 ml" },
          { name: "Líquida deslactosada semidescremada", equivale: "1 Taza", pesaMide: "240 ml" },
          { name: "Líquida de cabra", equivale: "1 Taza", pesaMide: "240 ml" },
          { name: "En polvo completa", equivale: "4 Cda.", pesaMide: "25 gr" },
          { name: "En polvo descremada", equivale: "4 Cda.", pesaMide: "25 gr" },
          { name: "En polvo deslactosada", equivale: "4 Cda.", pesaMide: "25 gr" },
          { name: "En polvo deslactosada semidescremada", equivale: "4 Cda.", pesaMide: "25 gr" },
        ],
      },
      {
        name: "Yogur de Origen Animal",
        items: [
          { name: "Yogur entero", equivale: "1 Taza", pesaMide: "240 ml" },
          { name: "Yogur descremado", equivale: "1 Taza", pesaMide: "240 ml" },
        ],
      },
      {
        name: "Leche de Origen Vegetal",
        items: [
          { name: "Almendras, avellanas, nueces, maní", equivale: "1 Taza", pesaMide: "240 ml" },
          { name: "Líquida de coco", equivale: "1 Taza", pesaMide: "240 ml" },
          { name: "Líquida de soya", equivale: "1 Taza", pesaMide: "240 ml" },
        ],
      },
      {
        name: "Yogur de Origen Vegetal",
        items: [
          { name: "Yogur de almendras", equivale: "1 Taza", pesaMide: "240 ml" },
          { name: "Yogur de coco", equivale: "1 Taza", pesaMide: "240 ml" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Vegetales",
    icon: "🥦",
    subcategories: [
      {
        name: "Vegetales",
        note: "Entre 1 y 2 tazas, solos o combinados entre sí",
        items: [
          { name: "Acelgas", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Ají", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Ajoporro / Puerro", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Alcachofa", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Alfalfa", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Apio España / Célery", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Berenjena", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Berro", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Calabacín / Zuquini", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Cebollín / Cebolla larga", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Champiñón", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Chayota / Guatila", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Coliflor, Brócoli, Repollo, Radiquio, Repollitos", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Escarola", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Espárrago", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Espinaca", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Perejil, cilantro, hierbabuena", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Hongos", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Lechuga", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Palmito", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Pepino", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Pimentón", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Rábano", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Rúgula / Rúcula", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Tomate", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Tomate cherry", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Auyama", equivale: "1/2 Taza", pesaMide: "-" },
          { name: "Cebolla", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Guisante (Petit-Pois)", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Nabo", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Remolacha", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Vainitas / Habichuelas", equivale: "1-2 Tazas", pesaMide: "-" },
          { name: "Zanahoria", equivale: "1-2 Tazas", pesaMide: "-" },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Frutas",
    icon: "🍎",
    subcategories: [
      {
        name: "Frutas",
        items: [
          { name: "Albaricoque", equivale: "1 Und. Med.", pesaMide: "100 gr" },
          { name: "Arándanos / Blueberry", equivale: "1 Taza", pesaMide: "100 gr" },
          { name: "Cambur / Banano", equivale: "1/2 Und.", pesaMide: "80 gr" },
          { name: "Cereza / Cherry", equivale: "1 Taza", pesaMide: "100 gr" },
          { name: "Ciruela", equivale: "2 Und.", pesaMide: "100 gr" },
          { name: "Ciruela de huesitos", equivale: "1 Taza", pesaMide: "100 gr" },
          { name: "Ensalada de frutas", equivale: "1/4 Taza", pesaMide: "-" },
          { name: "Durazno", equivale: "1 Und. Med.", pesaMide: "100 gr" },
          { name: "Frambuesa / Raspberry", equivale: "1 1/4 Taza", pesaMide: "160 gr" },
          { name: "Fresa / Strawberry / Frutilla", equivale: "1 1/4 Taza", pesaMide: "160 gr" },
          { name: "Guanábana", equivale: "1/2 Taza", pesaMide: "160 gr" },
          { name: "Guayaba", equivale: "1 Und. Med.", pesaMide: "100 gr" },
          { name: "Higo", equivale: "2 Und. Peq.", pesaMide: "75 gr" },
          { name: "Pitahaya", equivale: "1/2 Taza", pesaMide: "90 gr" },
          { name: "Kiwi", equivale: "1 Und. Med.", pesaMide: "100 gr" },
          { name: "Lechosa / Papaya", equivale: "1 Taza", pesaMide: "170 gr" },
          { name: "Limón", equivale: "2 Und.", pesaMide: "100 gr" },
          { name: "Mamón", equivale: "1/2 Taza", pesaMide: "90 gr" },
          { name: "Mandarina", equivale: "1 Und. Med.", pesaMide: "140 gr" },
          { name: "Mango", equivale: "1/2 Und. Peq.", pesaMide: "100 gr" },
          { name: "Manzana", equivale: "1 Und. Peq.", pesaMide: "100 gr" },
          { name: "Melocotón", equivale: "1 Und. Med.", pesaMide: "100 gr" },
          { name: "Melón", equivale: "1 Taza", pesaMide: "300 gr" },
          { name: "Mora / Blackberry", equivale: "1 Taza", pesaMide: "100 gr" },
          { name: "Naranja", equivale: "1 Und. Med.", pesaMide: "140 gr" },
          { name: "Naranja en jugo", equivale: "1/2 Vaso", pesaMide: "125 ml" },
          { name: "Níspero", equivale: "1 Und. Med.", pesaMide: "90 gr" },
          { name: "Parchita / Maracuyá", equivale: "1/2 Taza", pesaMide: "140 gr" },
          { name: "Pasas", equivale: "1 Cda.", pesaMide: "-" },
          { name: "Patilla / Sandía", equivale: "1 1/4 Taza", pesaMide: "300 gr" },
          { name: "Pera", equivale: "1 Und. Med.", pesaMide: "90 gr" },
          { name: "Piña", equivale: "1 Rodaja", pesaMide: "100 gr" },
          { name: "Tamarindo", equivale: "1/4 Taza", pesaMide: "-" },
          { name: "Toronja / Grapefruit", equivale: "1/2 Und.", pesaMide: "200 gr" },
          { name: "Uvas", equivale: "7 Und. Gde.", pesaMide: "100 gr" },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Acompañantes",
    icon: "🌾",
    subcategories: [
      {
        name: "Cereales",
        items: [
          { name: "Avena en Hojuelas", equivale: "1/2 Taza", pesaMide: "-" },
          { name: "Avena en Harina", equivale: "2 Cucharadas", pesaMide: "-" },
          { name: "Harina de Cebada", equivale: "1/2 Taza", pesaMide: "-" },
          { name: "Harina de Arroz", equivale: "1/2 Taza", pesaMide: "-" },
          { name: "Harina de maíz tostado (fororo)", equivale: "1/2 Taza", pesaMide: "-" },
          { name: "Arroz tostado", equivale: "1/2 Taza", pesaMide: "-" },
          { name: "Germen de trigo", equivale: "1/2 Taza", pesaMide: "-" },
          { name: "Hojuelas de maíz no azucarada", equivale: "3/4 Taza", pesaMide: "-" },
          { name: "Cereal integral no azucarado", equivale: "1/2 Taza", pesaMide: "-" },
          { name: "Trigo inflado", equivale: "1/2 Taza", pesaMide: "-" },
        ],
      },
      {
        name: "Contornos",
        items: [
          { name: "Arepa Asada", equivale: "1 Unidad Pequeña", pesaMide: "50 gr" },
          { name: "Arroz cocido", equivale: "1/2 Taza", pesaMide: "100 gr" },
          { name: "Hallaquita / Bollito", equivale: "1 Unidad Mediana", pesaMide: "50 gr" },
          { name: "Maíz entero / Mazorca / Choclo", equivale: "1 Trozo cocido", pesaMide: "90 gr" },
          { name: "Pasta cocida", equivale: "1/2 Taza", pesaMide: "100 gr" },
          { name: "Plátano cocido", equivale: "1/4 Unidad", pesaMide: "50 gr" },
          { name: "Quinoa / Quinua cocida", equivale: "1/2 Taza", pesaMide: "100 gr" },
        ],
      },
      {
        name: "Tubérculos",
        items: [
          { name: "Apio entero", equivale: "1/2 Taza cocida", pesaMide: "90 grs" },
          { name: "Batata entera", equivale: "1/2 Taza cocida", pesaMide: "90 grs" },
          { name: "Ñame entero", equivale: "1/2 Taza cocida", pesaMide: "90 grs" },
          { name: "Ocumo entero", equivale: "1/2 Taza cocida", pesaMide: "90 grs" },
          { name: "Papa entera", equivale: "1 Trozo cocido", pesaMide: "90 grs" },
          { name: "Yuca entera", equivale: "1 Trozo cocido", pesaMide: "90 grs" },
          { name: "Puré de cualquier tubérculo", equivale: "1/2 Taza cocida", pesaMide: "90 grs" },
        ],
      },
      {
        name: "Granos / Leguminosas",
        items: [
          { name: "Arveja / Alverja", equivale: "1/2 Taza cocida", pesaMide: "100 grs" },
          { name: "Caraotas / Frijol negro", equivale: "1/2 Taza cocida", pesaMide: "100 grs" },
          { name: "Frijol Rojo", equivale: "1/2 Taza cocida", pesaMide: "100 grs" },
          { name: "Garbanzo", equivale: "1/2 Taza cocida", pesaMide: "100 grs" },
          { name: "Lentejas", equivale: "1/2 Taza cocida", pesaMide: "100 grs" },
          { name: "Soya", equivale: "1/2 Taza cocida", pesaMide: "100 grs" },
        ],
      },
      {
        name: "Panes",
        items: [
          { name: "Árabe", equivale: "1/4 Unidad", pesaMide: "-" },
          { name: "Bagel", equivale: "1/2 Unidad", pesaMide: "50 gr" },
          { name: "Baguette, Francés, Campesino, Canilla", equivale: "1 Trozo", pesaMide: "30 gr" },
          { name: "Sándwich Blanco", equivale: "1 Rebanada", pesaMide: "-" },
          { name: "Sándwich Ligero", equivale: "2 Rebanadas", pesaMide: "-" },
          { name: "Hamburguesa o Perro Caliente", equivale: "1/2 Unidad", pesaMide: "50 gr" },
          { name: "Casabe / Croqueta de yuca", equivale: "2 Unidades Medianas", pesaMide: "25 gr" },
          { name: "Tortilla de trigo", equivale: "1 Unidad Mediana", pesaMide: "50 gr" },
          { name: "Panqueca y Waffles, Cachapas", equivale: "1 Unidad Pequeña", pesaMide: "50 gr" },
          { name: "Pita", equivale: "1/2 Unidad", pesaMide: "-" },
          { name: "Pan dulce sin azúcar por encima", equivale: "1 Rebanada", pesaMide: "25 gr" },
          { name: "Pan rallado", equivale: "3 Cucharadas", pesaMide: "20 gr" },
        ],
      },
      {
        name: "Galletas y Tortas",
        items: [
          { name: "Galletas de arroz inflado", equivale: "2 Unidades", pesaMide: "-" },
          { name: "Galletas de soda", equivale: "1 Paquete", pesaMide: "-" },
          { name: "Galletas integrales", equivale: "1 Paquete", pesaMide: "-" },
          { name: "Galletas tipo maría", equivale: "1/2 Paquete", pesaMide: "-" },
          { name: "Señoritas / Palitroque", equivale: "2 Unidades", pesaMide: "-" },
          { name: "Galletas de avena o naranja", equivale: "1 Unidad Mediana", pesaMide: "-" },
          { name: "Galleta tipo pasta seca sin crema", equivale: "3 Unidades Pequeñas", pesaMide: "-" },
          { name: "Torta tipo ponqué sin crema", equivale: "1 Rebanada", pesaMide: "25 gr" },
          { name: "Brownie", equivale: "1 Rebanada", pesaMide: "25 gr" },
          { name: "Muffin", equivale: "1/2 Unidad", pesaMide: "25 gr" },
          { name: "Barra de cereales", equivale: "1 Unidad Mediana", pesaMide: "-" },
          { name: "Cotufas / Palomitas de maíz", equivale: "2 a 3 Tazas", pesaMide: "-" },
        ],
      },
    ],
  },
  {
    id: 5,
    name: "Proteínas",
    icon: "🥩",
    subcategories: [
      {
        name: "Carne de Res",
        items: [
          { name: "Entera (Milanesa, medallón, otro)", equivale: "1 porción", pesaMide: "30 grs" },
          { name: "Molida o desmechada", equivale: "2 cucharadas", pesaMide: "30 grs" },
        ],
      },
      {
        name: "Carne de Aves (pollo, gallina o pavo)",
        items: [
          { name: "Entero (Milanesa, medallón, presa)", equivale: "1 porción", pesaMide: "30 grs" },
          { name: "Molida o desmechada", equivale: "2 cucharadas", pesaMide: "30 grs" },
        ],
      },
      {
        name: "Pescado Fresco",
        items: [
          { name: "Filete o entero", equivale: "1 porción", pesaMide: "30 grs" },
          { name: "Desmenuzado", equivale: "2 cucharadas", pesaMide: "30 grs" },
        ],
      },
      {
        name: "Mariscos",
        items: [
          { name: "Cangrejo, Camarón, calamar, langosta", equivale: "1/2 Taza", pesaMide: "30 gr" },
        ],
      },
      {
        name: "Vísceras",
        items: [
          { name: "Hígado de res", equivale: "1 porción", pesaMide: "30 gr" },
        ],
      },
      {
        name: "Huevos",
        items: [
          { name: "Entero, revuelto, a la plancha", equivale: "1 Und.", pesaMide: "-" },
          { name: "Claras de huevo", equivale: "2 Und.", pesaMide: "-" },
        ],
      },
      {
        name: "Quesos",
        items: [
          { name: "Ricota, requesón o cuajada", equivale: "1/4 Taza", pesaMide: "30 gr" },
          { name: "Mozzarella o descremado", equivale: "1 Rebanada", pesaMide: "30 gr" },
          { name: "Queso blanco bajo en sal", equivale: "1 Porción o 2 cdas.", pesaMide: "30 gr" },
          { name: "Queso blanco semigraso", equivale: "1 Porción o 2 cdas.", pesaMide: "30 gr" },
          { name: "Amarillo, pecorino, azul, cheddar", equivale: "1 Rebanada", pesaMide: "30 gr" },
        ],
      },
      {
        name: "Embutidos",
        items: [
          { name: "Jamón (pavo, pollo o pierna de cerdo)", equivale: "1 Rebanada", pesaMide: "30 gr" },
          { name: "Salchicha de pollo o pavo", equivale: "1 Und.", pesaMide: "30 gr" },
        ],
      },
    ],
  },
  {
    id: 6,
    name: "Grasas",
    icon: "🥑",
    subcategories: [
      {
        name: "Insaturadas",
        items: [
          { name: "Aceite (maíz, girasol, oliva, ajonjolí, coco)", equivale: "1 Cucharadita", pesaMide: "5 ml" },
          { name: "Aceitunas", equivale: "5 Und. Grandes", pesaMide: "-" },
          { name: "Aguacate", equivale: "1 Lonja fina", pesaMide: "10 gr" },
          { name: "Margarina", equivale: "1 Cucharadita", pesaMide: "5 gr" },
        ],
      },
      {
        name: "Frutos Secos",
        items: [
          { name: "Almendra, Merey o Avellana", equivale: "6 Unidades", pesaMide: "-" },
          { name: "Maní en concha", equivale: "10 Unidades", pesaMide: "-" },
          { name: "Maní sin concha", equivale: "20 Unidades", pesaMide: "-" },
          { name: "Nueces", equivale: "2 Unidades", pesaMide: "-" },
          { name: "Coco rallado", equivale: "2 Cucharaditas", pesaMide: "-" },
          { name: "Harina de frutos secos", equivale: "2 Cucharaditas", pesaMide: "-" },
          { name: "Mantequilla de maní", equivale: "1 Cucharadita", pesaMide: "5 gr" },
        ],
      },
      {
        name: "Aderezos",
        items: [
          { name: "Vinagreta ligera", equivale: "2 Cucharaditas", pesaMide: "10 ml" },
          { name: "Salsa italiana o americana ligera", equivale: "1 Cucharada", pesaMide: "15 ml" },
          { name: "Mostaza", equivale: "1 Cucharadita", pesaMide: "5 gr" },
          { name: "Mayonesa natural o ligera", equivale: "1 Cucharadita", pesaMide: "5 gr" },
          { name: "Aderezo Dulce (no graso)", equivale: "1 Cucharadita", pesaMide: "5 gr" },
        ],
      },
      {
        name: "Saturadas",
        items: [
          { name: "Crema agria", equivale: "2 Cucharaditas", pesaMide: "10 gr" },
          { name: "Suero de leche", equivale: "2 Cucharaditas", pesaMide: "10 gr" },
          { name: "Crema de leche", equivale: "1 Cucharada", pesaMide: "15 gr" },
          { name: "Queso Crema", equivale: "1 Cucharada", pesaMide: "15 gr" },
          { name: "Mantequilla", equivale: "1 Cucharadita", pesaMide: "5 gr" },
          { name: "Tocineta", equivale: "1 Lonja fina", pesaMide: "20 gr" },
        ],
      },
    ],
  },
];

// Cada comida tiene un array de "slots": { listId, targetRations }
// selections shape: { mealId: { listId: [items] } }
export const DEFAULT_MEALS = [
  {
    id: 1, name: "Desayuno", time: "7:00 AM",
    slots: [
      { listId: 1, targetRations: 2 },
      { listId: 3, targetRations: 1 },
      { listId: 4, targetRations: 2 },
    ],
  },
  {
    id: 2, name: "Merienda", time: "10:00 AM",
    slots: [
      { listId: 3, targetRations: 1 },
      { listId: 1, targetRations: 1 },
    ],
  },
  {
    id: 3, name: "Almuerzo", time: "1:00 PM",
    slots: [
      { listId: 4, targetRations: 3 },
      { listId: 5, targetRations: 2 },
      { listId: 2, targetRations: 1 },
      { listId: 6, targetRations: 1 },
    ],
  },
  {
    id: 4, name: "Merienda 2", time: "4:00 PM",
    slots: [
      { listId: 3, targetRations: 1 },
      { listId: 6, targetRations: 1 },
    ],
  },
  {
    id: 5, name: "Cena", time: "7:00 PM",
    slots: [
      { listId: 5, targetRations: 2 },
      { listId: 4, targetRations: 2 },
      { listId: 2, targetRations: 1 },
      { listId: 6, targetRations: 1 },
    ],
  },
  {
    id: 6, name: "Merienda 3", time: "10:00 PM",
    slots: [
      { listId: 1, targetRations: 1 },
      { listId: 3, targetRations: 1 },
    ],
  },
];
