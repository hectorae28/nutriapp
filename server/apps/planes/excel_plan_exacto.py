"""Exportador Excel de Plan Alimenticio usando plantilla Nuevo Formato 2020."""
import io
import os
import re

import xlrd
from xlutils.copy import copy


def _find_template():
    base_dirs = [
        os.path.join(os.path.dirname(__file__), "..", "..", "templates", "excel"),
        os.path.join(os.path.dirname(__file__)),
        "/app/templates/excel",
    ]
    for base in base_dirs:
        base = os.path.normpath(base)
        if not os.path.isdir(base):
            continue
        for fname in os.listdir(base):
            if fname.lower().endswith(".xls") and "nuevo formato" in fname.lower():
                return os.path.join(base, fname)
    raise FileNotFoundError(
        "Plantilla 'Nuevo Formato Plan...' no encontrada en: " + ", ".join(base_dirs)
    )


def _load_template():
    path = _find_template()
    return xlrd.open_workbook(path, formatting_info=True)


# Mapeo flexible: cualquier variante del nombre → sección del sheet 2
# key = fragmento en mayúsculas que debe aparecer en el nombre del tiempo
TIEMPO_SECTION = [
    ("DESAYUNO",   8,  [9,  10, 11, 12, 13]),
    ("MERIENDA 1", 15, [16, 17, 18]),
    ("ALMUERZO",   19, [20, 21, 22, 23, 24, 25]),
    ("MERIENDA 2", 27, [28, 29, 30]),
    ("CENA",       32, [33, 34, 35, 36, 37, 38]),
    ("MERIENDA 3", 40, [41, 42]),
]


def _match_section(nombre):
    """Devuelve (header_row, data_rows) para el nombre del tiempo, o None."""
    n = nombre.upper().strip()
    for key, hrow, drows in TIEMPO_SECTION:
        if key in n or n in key:
            return hrow, drows
    return None


def generar_excel_plan_exacto(plan) -> bytes:
    rb = _load_template()
    wb = copy(rb)

    ws0 = wb.get_sheet(0)   # Presentación - Recomendaciones
    ws2 = wb.get_sheet(2)   # Ejemplo

    paciente = plan.paciente
    exp      = getattr(paciente, "expediente", None)
    nombre   = paciente.user.get_full_name() or paciente.user.username

    # ── Sheet 0: datos del paciente ───────────────────────────────────────────
    # Nombre en varias columnas por si hay merged cells
    for c in range(1, 8):
        ws0.write(11, c, nombre)

    peso_actual = 0.0
    if exp:
        peso_actual = float(exp.peso_usual_kg or 0)
        ws0.write(11, 38, f"{peso_actual:.2f}")

    ws0.write(11, 47, f"{float(plan.kcal_objetivo or 0):.0f}")

    req_hidrico = peso_actual * 35 if peso_actual > 0 else 0
    ws0.write(12, 44, f"{peso_actual:.2f} Kg.")
    ws0.write(11, 55, f"{req_hidrico:.0f}")

    # Fecha
    if plan.fecha_inicio:
        ws0.write(7, 45, plan.fecha_inicio.strftime("%d/%m/%Y"))

    # Macros totales
    from apps.catalogo.models import GrupoAlimento
    raciones_por_grupo = {}
    for tc in plan.tiempos_comida.all():
        for rac in tc.raciones.all():
            gn = rac.grupo.nombre.upper() if rac.grupo else ""
            raciones_por_grupo[gn] = raciones_por_grupo.get(gn, 0) + float(rac.cantidad or 0)

    total_p = total_g = total_cho = 0.0
    for gn, cantidad in raciones_por_grupo.items():
        grupo = GrupoAlimento.objects.filter(nombre__icontains=gn).first()
        if grupo:
            total_p   += cantidad * float(getattr(grupo, 'proteina_g', 0) or 0)
            total_g   += cantidad * float(getattr(grupo, 'grasa_g',    0) or 0)
            total_cho += cantidad * float(getattr(grupo, 'carb_g',     0) or 0)

    ws0.write(15, 2,  f"{total_p:.1f}")
    ws0.write(15, 13, f"{total_g:.1f}")
    ws0.write(15, 21, f"{total_cho:.1f}")

    # ── Quitar texto "¡Felicidades..." (row 18) ───────────────────────────────
    ws0.write(18, 1, "")

    # ── Recomendaciones del plan (rows 29, 31, 33 ... 49) ────────────────────
    notas_rows = [29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49]
    textos = []

    if plan.notas and plan.notas.strip():
        lineas = re.split(r'\n|(?<=\.)\s{2,}', plan.notas.strip())
        textos += [l.strip() for l in lineas if l.strip()]

    if getattr(plan, 'trat_otros', None) and plan.trat_otros.strip():
        textos.append(plan.trat_otros.strip())

    if getattr(plan, 'suplemento_complemento', None) and plan.suplemento_complemento.strip():
        textos.append(f"Suplementos: {plan.suplemento_complemento.strip()}")

    for i, row_idx in enumerate(notas_rows):
        ws0.write(row_idx, 1, textos[i] if i < len(textos) else "")

    # ── Sheet 2: Ejemplo — tiempos de comida ─────────────────────────────────
    # Limpiar primero todas las celdas de datos
    for _, hrow, drows in TIEMPO_SECTION:
        for r in drows:
            ws2.write(r, 1,  "")
            ws2.write(r, 11, "")

    # Escribir raciones del plan
    for tc in plan.tiempos_comida.prefetch_related('raciones__grupo').all():
        match = _match_section(tc.nombre)
        if not match:
            continue
        header_row, data_rows = match
        ws2.write(header_row, 1,  tc.nombre.upper())
        ws2.write(header_row, 11, "CANTIDAD")

        raciones = list(tc.raciones.select_related('grupo').all())
        for i, rac in enumerate(raciones):
            if i >= len(data_rows):
                break
            r = data_rows[i]
            grupo_nombre = rac.grupo.nombre if rac.grupo else ""
            # Cantidad como fracción o entero
            cant = float(rac.cantidad) if rac.cantidad else 0.0
            # Redondear a 0.5 y formatear
            cant_r = round(cant * 2) / 2
            whole  = int(cant_r)
            dec    = cant_r - whole
            if dec < 0.01:
                cant_str = str(whole)
            elif whole == 0:
                cant_str = "1/2"
            else:
                cant_str = f"{whole} 1/2"

            ws2.write(r, 1,  grupo_nombre)
            ws2.write(r, 11, cant_str)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
