"""
Parser para importar planes alimenticios desde Excel (Nuevo Formato 2020).

Estructura del archivo:
  Sheet 0 (Presentación - Recomendaciones):
    - row 11, col 47: kcal_objetivo
    - row 11, col 55: requerimiento_hidrico_ml
    - row 11, col 38: peso_actual (solo referencia)

  Sheet 1 (Listas de Intercambio):
    - row 20: grupos principales con totales diarios
        LÁCTEOS    col 1  → total en col 11
        VEGETALES  col 20 → total en col 30
        FRUTAS     col 35 → total en col 44
        ACOMPAÑANTES col 52 → total en col 62
        PROTEÍNAS  col 71 → total en col 81
        GRASAS     col 90 → total en col 98
    - rows 5-12, cols 29-100: plan de comidas
        row 5:  tiempos  (DESAYUNO col29, MERIENDA col40, ALMUERZO col51 ...)
        row 6:  headers  (Raciones / Lista)
        row 7+: cantidad (col_racion) | numero_lista (col_lista)
                numero_lista → 1=LÁCTEOS 2=VEGETALES 3=FRUTAS
                               4=ACOMPAÑANTES 5=PROTEÍNAS 6=GRASAS
"""
import xlrd
from datetime import date
from decimal import Decimal, InvalidOperation


def _v(sh, r, c):
    """Valor seguro de celda, devuelve '' si fuera de rango."""
    if r >= sh.nrows or c >= sh.ncols:
        return ''
    return sh.cell_value(r, c)


def _str(val):
    if val is None:
        return ''
    return str(val).strip()


def _num(val, default=None):
    """Convierte a Decimal. Acepta '1/2', '3/4', números float, strings."""
    if val is None or _str(val) in ('', '-'):
        return default
    s = _str(val).replace(',', '.')
    # Fracciones textuales
    if '/' in s:
        try:
            num, den = s.split('/')
            return Decimal(str(round(float(num) / float(den) * 2) / 2))
        except Exception:
            return default
    try:
        f = float(s)
        # Redondear a 0.5 más cercano
        return Decimal(str(round(f * 2) / 2))
    except Exception:
        return default


# Mapeo número de lista → nombre de grupo (según el formato)
LISTA_A_GRUPO = {
    1: 'Lácteos',
    2: 'Vegetales',
    3: 'Frutas',
    4: 'Acompañantes',
    5: 'Proteínas',
    6: 'Grasas',
}

# Grupos principales y sus columnas en Sheet 1 row 20
GRUPOS_ROW20 = [
    ('Lácteos',      1,  11),
    ('Vegetales',    20, 30),
    ('Frutas',       35, 44),
    ('Acompañantes', 52, 62),
    ('Proteínas',    71, 81),
    ('Grasas',       90, 98),
]

# Tiempos de comida y sus columnas de raciones/lista en Sheet 1
COMIDAS_COLS = [
    ('Desayuno',   29, 34),
    ('Merienda 1', 40, 45),
    ('Almuerzo',   51, 56),
    ('Merienda 2', 62, 67),
    ('Cena',       73, 78),
    ('Merienda 3', 84, 89),
]


def importar_plan_desde_excel(file_path, paciente_id):
    """
    Lee el Excel y devuelve los datos del plan estructurados.

    Returns dict:
        plan_data      → campos de PlanAlimenticio
        tiempos        → [{nombre, orden}]
        raciones       → [{tiempo_nombre, grupo_nombre, cantidad}]
        alimento_tags  → []  (no manejado en este formato)
        advertencias   → [str]
    """
    try:
        wb = xlrd.open_workbook(file_path)
    except Exception as e:
        raise ValueError(f"No se pudo abrir el archivo Excel: {e}")

    if wb.nsheets < 2:
        raise ValueError("El archivo no tiene el formato esperado (necesita al menos 2 hojas)")

    sh0 = wb.sheet_by_index(0)  # Presentación - Recomendaciones
    sh1 = wb.sheet_by_index(1)  # Listas de Intercambio

    advertencias = []

    # ── Plan data (Sheet 0) ───────────────────────────────────────────────────
    kcal = _num(_v(sh0, 11, 47))
    req_hidrico = _num(_v(sh0, 11, 55))

    plan_data = {
        'paciente_id':          int(paciente_id),
        'fecha_inicio':         date.today(),
        'activo':               True,
        'tipo_dieta':           '',
        'kcal_objetivo':        int(kcal) if kcal else None,
        'requerimiento_hidrico_ml': int(req_hidrico) if req_hidrico else None,
        'pct_proteinas':        None,
        'pct_grasas':           None,
        'pct_carbohidratos':    None,
        'notas':                '',
    }

    if not kcal:
        advertencias.append("No se encontró kcal objetivo en Sheet 0 (fila 12, col AV)")

    # ── Totales diarios por grupo (Sheet 1, row 20) ───────────────────────────
    totales_grupo = {}
    for nombre, col_nombre, col_cant in GRUPOS_ROW20:
        val = _num(_v(sh1, 20, col_cant))
        if val and val > 0:
            totales_grupo[nombre] = val
        else:
            advertencias.append(f"No se encontró total diario para '{nombre}'")

    # ── Plan de comidas (Sheet 1, rows 7-12, cols por comida) ─────────────────
    tiempos_data   = []
    raciones_data  = []

    for orden, (nombre_tiempo, col_rac, col_lista) in enumerate(COMIDAS_COLS):
        # Acumular por grupo para evitar duplicados (UNIQUE tiempo+grupo)
        acumulado = {}  # grupo_nombre → Decimal cantidad total

        for data_row in range(7, 15):  # filas de datos del plan
            cant_raw  = _v(sh1, data_row, col_rac)
            lista_raw = _v(sh1, data_row, col_lista)

            cant  = _num(cant_raw)
            lista = _num(lista_raw)

            if cant and lista and int(lista) in LISTA_A_GRUPO:
                grupo_nombre = LISTA_A_GRUPO[int(lista)]
                acumulado[grupo_nombre] = acumulado.get(grupo_nombre, Decimal('0')) + cant

        if acumulado:
            tiempos_data.append({'nombre': nombre_tiempo, 'orden': orden})
            for grupo_nombre, cantidad in acumulado.items():
                raciones_data.append({
                    'tiempo_nombre': nombre_tiempo,
                    'grupo_nombre':  grupo_nombre,
                    'cantidad':      cantidad,
                })
        else:
            advertencias.append(f"Sin raciones para '{nombre_tiempo}'")

    if not tiempos_data:
        advertencias.append("No se encontró ningún tiempo de comida con raciones")

    return {
        'plan_data':     plan_data,
        'tiempos':       tiempos_data,
        'raciones':      raciones_data,
        'alimento_tags': [],
        'advertencias':  advertencias,
    }
