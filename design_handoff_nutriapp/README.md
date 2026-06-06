# Design System — Domingo Porras Nutricionista (NutriApp)

> Documento de sistema de diseño para implementar/actualizar el proyecto `hectorae28/nutriapp` con Claude Code.
> Stack del repo: **React + Vite + Tailwind CSS + lucide-react**.

---

## 1. Identidad de Marca

**Domingo Porras — Nutricionista.** Marca profesional clínica con paleta **azul petróleo / navy acero** derivada del logo "dp". Transmite confianza, profesionalismo médico y calma. NO usar verde (era el placeholder anterior).

- **Logo**: monograma "dp" en minúsculas, font Outfit 800, letter-spacing -1.5px, sobre caja con gradiente `linear-gradient(135deg, #3E9DC4, #143042)`, border-radius 12px.
- **Nombre completo**: "Domingo Porras" (título) + "Nutricionista" (subtítulo).

---

## 2. Design Tokens

### 2.1 Colores — Tema Claro
| Token | Hex | Uso |
|-------|-----|-----|
| `--bg-primary` | `#F4F8FA` | Fondo de la app (azul muy claro frío) |
| `--bg-surface` | `#FFFFFF` | Cards, paneles, modales |
| `--bg-surface-2` | `#EAF1F5` | Inputs, hovers, fondos secundarios |
| `--bg-sidebar` | `#143042` | Sidebar (navy, fijo en ambos temas) |
| `--bg-sidebar-hover` | `#1F4255` | Hover de items del sidebar |
| `--text-primary` | `#12242E` | Texto principal (navy casi negro) |
| `--text-secondary` | `#566B77` | Texto secundario |
| `--text-tertiary` | `#94A6B0` | Labels, captions, placeholders |
| `--border` | `#DAE4EA` | Bordes principales |
| `--border-light` | `#EAF0F4` | Bordes sutiles |
| `--accent-green`* | `#1E6E92` | **Acento primario** (azul petróleo): nav activo, botones, anillos, estado completo |
| `--accent-green-light`* | `#D6EAF3` | Fondo del acento primario |
| `--accent-coral` | `#D4654A` | Acento secundario / metas en gráficos (contraste cálido) |
| `--accent-coral-light` | `#FDEAE4` | Fondo del acento coral |

\* **Nota importante**: la variable se llama `--accent-green` por herencia histórica pero su valor es **azul petróleo**. Al migrar a Tailwind, renómbrala a `--accent-primary` / `primary` para evitar confusión.

### 2.2 Colores — Tema Oscuro
| Token | Hex |
|-------|-----|
| `--bg-primary` | `#0D1A22` |
| `--bg-surface` | `#142632` |
| `--bg-surface-2` | `#1D3543` |
| `--bg-sidebar` | `#081720` |
| `--bg-sidebar-hover` | `#15303D` |
| `--text-primary` | `#E7EEF2` |
| `--text-secondary` | `#8FA2AD` |
| `--text-tertiary` | `#506570` |
| `--border` | `#274049` |
| `--border-light` | `#1E343E` |
| `--accent-green`* | `#46A6CC` (petróleo más claro para contraste) |
| `--accent-green-light`* | `#12323F` |
| `--accent-coral` | `#F2A65A` |
| `--accent-coral-light` | `#3A2D1E` |

### 2.3 Gradientes de marca
| Uso | Valor |
|-----|-------|
| Logo / monograma "dp" | `linear-gradient(135deg, #3E9DC4, #143042)` |
| Avatares (paciente) | `linear-gradient(135deg, #3E9DC4, #1E6E92)` |
| Barra IMC (gauge) | `linear-gradient(to right, #3E9DC4, #D4A257, #E05555)` |

### 2.4 Colores funcionales — Listas de Intercambio
Estos NO cambian con la marca; son código de color funcional para los 6 grupos alimenticios:
| ID | Grupo | Color | Fondo claro |
|----|-------|-------|-------------|
| 1 | Lácteos | `#5B8DEF` | `#EBF0FF` |
| 2 | Vegetales | `#43A047` | `#E8F5E9` |
| 3 | Frutas | `#EF6C00` | `#FFF3E0` |
| 4 | Acompañantes | `#D4A257` | `#FFF8E1` |
| 5 | Proteínas | `#E05555` | `#FFEBEE` |
| 6 | Grasas | `#7E57C2` | `#F3E5F5` |

### 2.5 Tipografía
- **Headings (h1–h4)**: `Outfit` (Google Fonts), weights 400/500/600/700/800
- **Body / UI**: `DM Sans` (Google Fonts), weights 400/500/600/700

| Elemento | Font | Tamaño | Peso |
|----------|------|--------|------|
| Título de página | Outfit | 22px | 700 |
| Título de card | Outfit | 20px | 700 |
| Valor de stat | Outfit | 20–24px | 700 |
| Título de sección | DM Sans | 16px | 700 |
| Body | DM Sans | 13–14px | 400–500 |
| Label | DM Sans | 12px | 500 |
| Caption | DM Sans | 11px | 400 |

### 2.6 Border Radius
| Token | Valor |
|-------|-------|
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `18px` |
| `--radius-xl` | `24px` |

### 2.7 Sombras
| Token | Valor (claro) |
|-------|---------------|
| `--shadow-sm` | `0 1px 3px rgba(27,27,24,.04)` |
| `--shadow-md` | `0 4px 16px rgba(27,27,24,.07)` |
| `--shadow-lg` | `0 12px 32px rgba(27,27,24,.10)` |

### 2.8 Espaciado
- Padding de contenido (desktop): `20px 28px`
- Padding de contenido (mobile): `16px 14px`
- Padding de card: `16–20px`
- Gap entre cards: `12–16px`
- Breakpoint principal: `768px`

---

## 3. Sistema de Tema Claro/Oscuro

- Implementado con CSS custom properties + atributo `data-theme="light|dark"` en `<html>`.
- Toggle en sidebar footer (desktop) y bottom nav (mobile).
- Persiste en `localStorage` key `na-theme`.
- También se setea `document.documentElement.style.colorScheme`.
- **Recomendación Tailwind**: usar estrategia `darkMode: 'class'` o mantener las CSS variables como `theme.extend.colors` que referencien `var(--token)`.

---

## 4. Layout

### Desktop (≥768px)
Grid de 2 columnas: `grid-template-columns: 250px 1fr`
- Columna 1: Sidebar fija (navy, altura completa)
- Columna 2: Main scrollable con TopHeader sticky

### Mobile (<768px)
- 1 columna + `padding-bottom: 68px`
- Sidebar oculta → Bottom Navigation fija

---

## 5. Componentes

### 5.1 Sidebar (desktop)
- Ancho 250px, bg `#143042`
- Logo (monograma "dp" + nombre) arriba
- Nav items: 4 vistas. Activo = gradiente/bg `--accent-green`, texto blanco, weight 600
- Footer: mini-card del paciente (avatar + nombre + objetivo) + toggle de tema

### 5.2 Bottom Nav (mobile)
- Fixed bottom, 5 items (4 vistas + toggle tema), icon 20px + label 10px

### 5.3 Top Header
- Sticky, bg surface, border-bottom. Título + subtítulo a la izquierda; pill del paciente + toggle a la derecha

### 5.4 StatCard
- Ícono 42×42px (radius 12px, fondo = color con 18% alpha) + valor (Outfit 20px 700) + label + sub opcional

### 5.5 ProgressRing
- SVG circular, anillo de fondo `--border` + arco de progreso (color de lista; verde→azul petróleo cuando completo). Texto central `current/max`

### 5.6 Badge
- inline-flex, padding 3px 10px, radius full, fondo = color con 20% alpha, texto = color, font 11px 600

---

## 6. Vistas

### 6.1 Planificador
Timeline vertical de comidas con línea conectora. Cada comida = card con:
- Header: nombre editable inline, hora, botón eliminar
- Progress bar de raciones
- Slots (grupos de alimentos): ícono + nombre + ProgressRing + stepper (±) + items seleccionados (chips) + botón "Agregar alimento"
- Botón "Agregar Comida" (dashed)
- Barra de resumen colapsable fija abajo
- **Modal de alimentos**: header coloreado por grupo, búsqueda, tabs por lista, subcategorías colapsables con tabla (Alimento | Equivale a | Pesa/Mide | +), footer con resumen

### 6.2 Tablas de Intercambio
- Grid de 6 tarjetas de categoría (selección)
- Panel con búsqueda + subcategorías colapsables + tablas de equivalencias con badges de color

### 6.3 Reportes
- Stats row (peso perdido, IMC, adherencia, duración)
- Grid de gráficos SVG: línea de progresión de peso (real petróleo + meta coral dashed), donut de macros, barras de adherencia semanal, tabla de medidas corporales, timeline de notas de consulta

### 6.4 Perfil del Paciente
- Hero card (avatar + nombre + objetivo + badges)
- Cards: info de contacto, métricas actuales + gauge IMC, alergias/condiciones (tags), próxima consulta, distribución calórica (barras)

---

## 7. Estado

### Global
- `dark` (bool, persistido) — tema
- `view` ('planner'|'tables'|'reports'|'profile') — vista activa

### Planificador
- `meals`: `[{ id, name, time, slots: [{ listId, targetRations }] }]`
- `selections`: `{ [mealId]: { [listId]: [items] } }`
- `modalState`: `{ meal, slotListId } | null`

### Tablas
- `activeId` (number), `query` (string), `openSubs` (object)

---

## 8. Estructura de Datos

### Listas de alimentos (`src/data/foodLists.js` — existente)
```js
{ id, name, icon, subcategories: [{ name, note?, items: [{ name, equivale, pesaMide }] }] }
```

### Mock paciente (nuevo)
```js
{ name, age, sex, height, email, phone, objective, allergies[], conditions[], startDate, nextVisit }
```

### Mock reportes (nuevo)
```js
weightData:  [{ week, date, weight, target }]   // 12 semanas
measurements:[{ date, cintura, cadera, brazo, muslo }]
macros:      { proteinas, carbohidratos, grasas }  // %
adherence:   [{ month, weeks: [%] }]
visitNotes:  [{ date, note, type }]  // type: control|medicion|inicial
```

---

## 9. Archivos de referencia (en este bundle)
| Archivo | Contenido |
|---------|-----------|
| `NutriApp.html` | HTML + CSS completo con la paleta de marca aplicada (referencia visual canónica) |
| `na-shared.jsx` | Íconos SVG, ThemeProvider, NavProvider, Sidebar, BottomNav, TopHeader, StatCard, Badge, ProgressRing, logo "dp" |
| `na-data.jsx` | Listas de alimentos + data mock de paciente/reportes |
| `na-planner.jsx` | PlannerView, MealCard, DailySummaryBar, FoodModal |
| `na-tables.jsx` | TablesView |
| `na-reports.jsx` | ReportsView + gráficos SVG |
| `na-profile.jsx` | ProfileView |
| `na-app.jsx` | Layout raíz + routing |

---

## 10. Notas de Implementación para Claude Code

1. **Estos archivos son referencia de diseño**, no código de producción. Recrear los diseños en el entorno existente del repo (React + Vite + Tailwind), usando sus patrones.
2. **Migrar tokens a Tailwind**: definir la paleta de marca en `tailwind.config.js` (`theme.extend.colors`). Renombrar `--accent-green` → `primary` (su valor real es azul petróleo `#1E6E92`).
3. **Iconos**: reemplazar los SVG custom por `lucide-react` (ya instalado). Los nombres usados mapean a: Calendar, Table2, BarChart3, User, Sun, Moon, Search, Plus, X, ChevronDown, ChevronRight, Clock, Trash2, Edit2, Check, Minus, ClipboardList, TrendingUp, TrendingDown, Target, Activity.
4. **Fuentes**: añadir Google Fonts `Outfit` + `DM Sans`.
5. **Tema oscuro**: estrategia `class` de Tailwind o CSS variables. Persistir en localStorage.
6. **Logo**: monograma "dp" con gradiente de marca. Si tienen el SVG oficial del logo, usarlo en su lugar.
7. **Data mock**: reportes y perfil usan datos simulados — conectar a API real cuando exista.
8. **Responsive**: breakpoint 768px. Sidebar ↔ Bottom nav.
