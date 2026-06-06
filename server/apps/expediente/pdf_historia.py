"""
Generador PDF de Historia Nutricional Completa.
Usa reportlab para producir un PDF profesional con todas las secciones
del expediente: datos personales, antecedentes, evaluación objetiva,
campos calculados (%PP/%PI/%PU, g/kg-p/día), consumo calórico,
antropometría y exámenes bioquímicos.
"""
import io
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)

# ── Constantes de branding ────────────────────────────────────────────────────
SITE_URL = os.environ.get("SITE_URL", "http://localhost:8000")
MEDICO_NOMBRE = os.environ.get("MEDICO_NOMBRE", "Dr. Domingo Porras")
MEDICO_ESPECIALIDAD = os.environ.get(
    "MEDICO_ESPECIALIDAD",
    "Medicina Interna • Cirugía Bariátrica • Nutrición Clínica",
)

# ── Paleta ────────────────────────────────────────────────────────────────────
C_GREEN      = colors.HexColor("#1E5631")
C_GREEN_MED  = colors.HexColor("#2D8653")
C_GREEN_LIGHT= colors.HexColor("#EBF7F0")
C_GREEN_ROW  = colors.HexColor("#F5FBF7")
C_TOTAL_ROW  = colors.HexColor("#C8E6C9")
C_HEADER_BG  = colors.HexColor("#1E5631")
C_GREY_TEXT  = colors.HexColor("#6B7280")
C_BORDER     = colors.HexColor("#D1D5DB")
C_WHITE      = colors.white
C_BLUE_SOFT  = colors.HexColor("#EFF6FF")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title":   ParagraphStyle("title",   parent=base["Heading1"], fontSize=16, textColor=C_WHITE,
                                  alignment=TA_CENTER, spaceAfter=0, leading=20),
        "section": ParagraphStyle("section", parent=base["Heading2"], fontSize=11, textColor=C_WHITE,
                                  alignment=TA_LEFT, spaceAfter=0, spaceBefore=0, leading=14),
        "label":   ParagraphStyle("label",   parent=base["Normal"],   fontSize=9,  textColor=C_GREY_TEXT,
                                  fontName="Helvetica-Bold"),
        "value":   ParagraphStyle("value",   parent=base["Normal"],   fontSize=9,  textColor=colors.HexColor("#111827")),
        "calc":    ParagraphStyle("calc",    parent=base["Normal"],   fontSize=10, textColor=C_GREEN,
                                  fontName="Helvetica-Bold", alignment=TA_CENTER),
        "th":      ParagraphStyle("th",      parent=base["Normal"],   fontSize=8,  textColor=C_WHITE,
                                  fontName="Helvetica-Bold", alignment=TA_CENTER),
        "td":      ParagraphStyle("td",      parent=base["Normal"],   fontSize=8,  textColor=colors.HexColor("#374151"),
                                  alignment=TA_CENTER),
        "td_left": ParagraphStyle("td_left", parent=base["Normal"],   fontSize=8,  textColor=colors.HexColor("#374151")),
        "small":   ParagraphStyle("small",   parent=base["Normal"],   fontSize=7,  textColor=C_GREY_TEXT,
                                  alignment=TA_CENTER),
        "obs":     ParagraphStyle("obs",     parent=base["Normal"],   fontSize=8,  textColor=colors.HexColor("#374151"),
                                  leading=12),
    }


def _section_header(text, st):
    """Bloque de encabezado de sección (tabla 1 col, fondo verde, texto blanco)."""
    t = Table([[Paragraph(text, st["section"])]], colWidths=[17*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_HEADER_BG),
        ("TOPPADDING",   (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
    ]))
    return t


def _kv_table(rows, st, ncols=2):
    """Tabla de clave-valor (2 o 4 columnas)."""
    if ncols == 4:
        col_widths = [4*cm, 4.5*cm, 4*cm, 4.5*cm]
    else:
        col_widths = [5.5*cm, 11.5*cm]
    data = []
    for row in rows:
        data.append([
            Paragraph(str(row[0]), st["label"]),
            Paragraph(str(row[1]) if row[1] not in (None, "", "None") else "—", st["value"]),
            *(
                [Paragraph(str(row[2]), st["label"]), Paragraph(str(row[3]) if row[3] not in (None, "", "None") else "—", st["value"])]
                if ncols == 4 else []
            ),
        ])
    t = Table(data, colWidths=col_widths, repeatRows=0)
    t.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",   (0,0), (-1,-1), 3),
        ("BOTTOMPADDING",(0,0), (-1,-1), 3),
        ("LEFTPADDING",  (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [C_WHITE, C_GREEN_ROW]),
    ]))
    return t


def _calc_table(labels, values, st):
    """Tabla de campos calculados con fondo verde claro."""
    header = [Paragraph(l, st["th"]) for l in labels]
    vals_row = [Paragraph(str(v) if v is not None else "—", st["calc"]) for v in values]
    col_w = [17*cm / len(labels)] * len(labels)
    t = Table([header, vals_row], colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), C_GREEN_MED),
        ("BACKGROUND", (0,1), (-1,1), C_GREEN_LIGHT),
        ("GRID", (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",   (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0), (-1,-1), 4),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ]))
    return t


def _data_table(headers, rows, st, col_widths=None, highlight_cols=None):
    """Tabla de datos genérica con encabezado verde y filas alternadas."""
    if col_widths is None:
        col_widths = [17*cm / len(headers)] * len(headers)
    data = [[Paragraph(h, st["th"]) for h in headers]]
    for i, row in enumerate(rows):
        data.append([
            Paragraph(str(c) if c not in (None, "", "None") else "—",
                      st["td_left"] if j == 0 else st["td"])
            for j, c in enumerate(row)
        ])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0,0), (-1,0), C_GREEN_MED),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [C_WHITE, C_GREEN_ROW]),
        ("GRID", (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",   (0,0), (-1,-1), 3),
        ("BOTTOMPADDING",(0,0), (-1,-1), 3),
        ("LEFTPADDING",  (0,0), (-1,-1), 4),
        ("RIGHTPADDING", (0,0), (-1,-1), 4),
    ]
    if highlight_cols:
        for col in highlight_cols:
            for row_i in range(1, len(data)):
                style_cmds.append(("TEXTCOLOR", (col, row_i), (col, row_i), C_GREEN))
                style_cmds.append(("FONTNAME",  (col, row_i), (col, row_i), "Helvetica-Bold"))
    t.setStyle(TableStyle(style_cmds))
    return t


def generar_pdf_historia(paciente) -> bytes:
    """
    Genera el PDF de la historia nutricional completa de un paciente.
    paciente: instancia de Paciente con user, expediente, registros_progreso, examenes_bioquimicos,
    recordatorios y planes (con tiempos_comida y raciones).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=1.5*cm,
        bottomMargin=2*cm,
        leftMargin=2*cm,
        rightMargin=2*cm,
        title=f"Historia Nutricional — {paciente.user.get_full_name()}",
        author=MEDICO_NOMBRE,
    )

    st = _styles()
    story = []
    W = 17 * cm  # ancho útil

    def sp(h=0.3): return Spacer(1, h*cm)
    def hr(): return HRFlowable(width=W, thickness=0.5, color=C_BORDER, spaceAfter=4, spaceBefore=4)

    # ── ENCABEZADO ────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph(f"<b>{MEDICO_NOMBRE}</b><br/><font size=8>{MEDICO_ESPECIALIDAD}</font>",
                  ParagraphStyle("hdr_left", parent=st["value"], leading=12)),
        Paragraph(f"HISTORIA NUTRICIONAL<br/><font size=8>{date.today().strftime('%d/%m/%Y')}</font>",
                  ParagraphStyle("hdr_right", parent=st["title"], textColor=C_GREEN, fontSize=14,
                                 alignment=TA_RIGHT, leading=16)),
    ]]
    ht = Table(header_data, colWidths=[9*cm, 8*cm])
    ht.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LINEBELOW", (0,0), (-1,-1), 1.5, C_GREEN),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    story.append(ht)
    story.append(sp(0.4))

    # ── DATOS PERSONALES ─────────────────────────────────────────────────────
    nombre = paciente.user.get_full_name() or paciente.user.username
    edad = None
    if paciente.fecha_nacimiento:
        hoy = date.today()
        edad = hoy.year - paciente.fecha_nacimiento.year
        if (hoy.month, hoy.day) < (paciente.fecha_nacimiento.month, paciente.fecha_nacimiento.day):
            edad -= 1

    story.append(_section_header("DATOS PERSONALES", st))
    story.append(_kv_table([
        ["Paciente", nombre, "Cédula", paciente.cedula],
        ["Fecha nac.", str(paciente.fecha_nacimiento or ""), "Edad", f"{edad} años" if edad else ""],
        ["Sexo", {"M":"Masculino","F":"Femenino","O":"Otro"}.get(paciente.sexo or "",""), "E. Civil",
         {"S":"Soltero/a","C":"Casado/a","D":"Divorciado/a","V":"Viudo/a","U":"Unión libre"}.get(paciente.estado_civil or "","")],
        ["Teléfono", paciente.telefono or "", "E-mail", paciente.user.email or ""],
        ["Dirección", paciente.direccion or "", "Consultorio", paciente.consultorio or ""],
        ["Ocupación", paciente.ocupacion or "", "Historia Nro.", paciente.historia_nro or ""],
    ], st, ncols=4))
    story.append(sp())

    # ── EXPEDIENTE ────────────────────────────────────────────────────────────
    try:
        exp = paciente.expediente
    except Exception:
        exp = None

    if exp:
        # Antecedentes
        story.append(_section_header("ANTECEDENTES Y HÁBITOS", st))
        ant_rows = [
            ["Motivo de consulta", exp.motivo_consulta or ""],
            ["Antecedentes personales", exp.ant_personales or ""],
            ["Antecedentes familiares", exp.ant_familiares or ""],
            ["Actividad física", exp.actividad_fisica or ""],
            ["Alergias alimentarias", exp.alergias_alimentarias or ""],
        ]
        habitos_rows = [
            ["Cafeínicos (v/día)", str(exp.cafeinicos_v_dia or ""), "Alcohol", str(exp.alcohol or "")],
            ["Sueño (hr/día)", str(exp.sueno_hr_dia or ""), "Apetito", str(exp.apetito or "")],
            ["Evacuaciones", str(exp.evacuaciones_v_dia or ""), "Estreñimiento", str(exp.estrenimiento or "")],
        ]
        story.append(_kv_table(ant_rows, st))
        story.append(_kv_table(habitos_rows, st, ncols=4))
        story.append(sp())

        # Evaluación objetiva
        p_usual  = float(exp.peso_usual_kg  or 0)
        p_ideal  = float(exp.peso_ideal_kg  or 0)
        p_prequx = float(exp.peso_prequirurgico_kg or 0)

        story.append(KeepTogether([
            _section_header("EVALUACIÓN OBJETIVA — PESOS", st),
            _kv_table([
                ["Peso Máximo (kg)", str(exp.peso_maximo_kg or ""), "Peso Mínimo (kg)", str(exp.peso_minimo_kg or "")],
                ["Peso Usual (kg)",  str(exp.peso_usual_kg  or ""), "Peso Ideal (kg)",  str(exp.peso_ideal_kg  or "")],
                ["Peso Deseado (kg)",str(exp.peso_deseado_kg or ""), "P. Pre-Qx (kg)", str(exp.peso_prequirurgico_kg or "")],
                ["Circ. Muñeca (cm)",str(exp.circunferencia_muneca_cm or ""), "Contextura",
                 {"PEQUENA":"Pequeña","MEDIANA":"Mediana","GRANDE":"Grande"}.get(exp.contextura or "", "")],
            ], st, ncols=4),
            sp(0.2),
        ]))

        # Campos calculados de pesos
        pct_pi  = f"{round(p_usual/p_ideal*100,2)}%" if p_ideal else "—"
        pct_pqx = f"{round(p_prequx/p_usual*100,2)}%" if p_usual else "—"
        story.append(_calc_table(
            ["Campo calculado", "%PI (P.Usual / P.Ideal)", "%P.Pre-Qx / P.Usual"],
            ["Valor", pct_pi, pct_pqx], st,
        ))
        story.append(sp())

        # ── Antropometría ─────────────────────────────────────────────────
        registros = list(paciente.registros_progreso.order_by("-fecha")[:15])
        if registros:
            ant_hdrs = ["Fecha","Peso (kg)","Talla (cm)","IMC","Clasif.","% PP","% PI","% PU"]
            ant_rows_data = []
            for reg in registros:
                peso = float(reg.peso_kg)
                talla = float(reg.talla_cm) if reg.talla_cm else None
                imc = round(peso/(talla/100)**2, 1) if talla else None
                imc_lbl = ""
                if imc:
                    imc_lbl = ("Bajo peso" if imc<18.5 else "Normal" if imc<25
                               else "Sobrepeso" if imc<30 else "Obesidad I" if imc<35
                               else "Obesidad II" if imc<40 else "Obesidad III")
                pp  = f"{round((p_usual-peso)/p_usual*100,2):+.2f}%" if p_usual else "—"
                pi  = f"{round(peso/p_ideal*100,2):.2f}%"             if p_ideal else "—"
                pu  = f"{round(peso/p_usual*100,2):.2f}%"             if p_usual else "—"
                ant_rows_data.append([
                    str(reg.fecha), f"{peso:.2f}", f"{talla:.1f}" if talla else "—",
                    f"{imc}" if imc else "—", imc_lbl, pp, pi, pu,
                ])
            col_w_ant = [2.5*cm, 2*cm, 2*cm, 1.5*cm, 2.5*cm, 2*cm, 2*cm, 2*cm]
            story.append(_section_header("ANTROPOMETRÍA (REGISTROS DE PROGRESO)", st))
            story.append(_data_table(ant_hdrs, ant_rows_data, st, col_widths=col_w_ant, highlight_cols=[5,6,7]))
            story.append(sp())

        # ── Consumo Calórico ──────────────────────────────────────────────
        items_cc = list(exp.consumo_calorico.all().order_by("orden"))
        if items_cc:
            GRUPOS_NOMBRES = {
                "LECHE":"Leche","CARNES_A":"Carnes Tipo A","CARNES_B":"Carnes Tipo B",
                "VEGETALES":"Vegetales","FRUTAS":"Frutas","ALMIDONES":"Almidones",
                "GRASAS":"Grasas","AZUCAR":"Azúcar","SOPORTE":"Soporte Nutricional",
            }
            cc_hdrs = ["Grupo","INT","P (g/día)","G (g/día)","CHO (g/día)","KCAL/día","P g/kg","G g/kg","CHO g/kg"]
            cc_rows = []
            tot_p = tot_g = tot_cho = tot_kcal = tot_int = 0.0
            for item in items_cc:
                p_g  = float(item.proteinas_g or 0)
                g_g  = float(item.grasas_g    or 0)
                cho  = float(item.cho_g       or 0)
                kcal = float(item.kcal        or 0)
                it   = float(item.intercambios or 0)
                tot_p += p_g; tot_g += g_g; tot_cho += cho; tot_kcal += kcal; tot_int += it
                cc_rows.append([
                    GRUPOS_NOMBRES.get(item.grupo, item.grupo),
                    f"{it:.1f}", f"{p_g:.1f}", f"{g_g:.1f}", f"{cho:.1f}", f"{kcal:.0f}",
                    f"{p_g/p_usual:.2f}" if p_usual else "—",
                    f"{g_g/p_usual:.2f}" if p_usual else "—",
                    f"{cho/p_usual:.2f}" if p_usual else "—",
                ])
            # Fila total
            cc_rows.append([
                "TOTAL",
                f"{tot_int:.1f}", f"{tot_p:.1f}", f"{tot_g:.1f}", f"{tot_cho:.1f}", f"{tot_kcal:.0f}",
                f"{tot_p/p_usual:.2f}" if p_usual else "—",
                f"{tot_g/p_usual:.2f}" if p_usual else "—",
                f"{tot_cho/p_usual:.2f}" if p_usual else "—",
            ])
            col_w_cc = [3*cm, 1.2*cm, 1.8*cm, 1.8*cm, 1.8*cm, 1.8*cm, 1.8*cm, 1.8*cm, 1.8*cm]

            story.append(_section_header("CONSUMO CALÓRICO DIARIO", st))
            tbl_cc = _data_table(cc_hdrs, cc_rows, st, col_widths=col_w_cc, highlight_cols=[6,7,8])

            # Pintar última fila (TOTAL) de verde
            n_filas = len(cc_rows) + 1  # +1 header
            tbl_cc.setStyle(TableStyle([
                ("BACKGROUND", (0, n_filas-1), (-1, n_filas-1), C_TOTAL_ROW),
                ("FONTNAME",   (0, n_filas-1), (-1, n_filas-1), "Helvetica-Bold"),
            ]))
            story.append(tbl_cc)

            if exp.observaciones_calorias:
                story.append(sp(0.2))
                story.append(Paragraph(f"<b>Observaciones:</b> {exp.observaciones_calorias}", st["obs"]))
            story.append(sp())

        # ── RECORDATORIO ALIMENTARIO 24H ──────────────────────────────────────
        recordatorio = paciente.recordatorios.order_by("-created_at").first()
        if recordatorio:
            entradas = list(recordatorio.entradas.order_by("orden"))
            if entradas:
                story.append(_section_header("RECORDATORIO ALIMENTARIO 24H", st))
                rec_hdrs = ["Tiempo de Comida", "Hora", "Descripción"]
                rec_rows = []
                for entrada in entradas:
                    hora_str = str(entrada.hora.strftime("%H:%M")) if entrada.hora else "—"
                    rec_rows.append([
                        entrada.nombre or "—",
                        hora_str,
                        entrada.descripcion or "—",
                    ])
                col_w_rec = [3.5*cm, 2*cm, 11.5*cm]
                story.append(_data_table(rec_hdrs, rec_rows, st, col_widths=col_w_rec))
                story.append(sp())

        # ── DIAGNÓSTICO NUTRICIONAL ───────────────────────────────────────────
        if exp.diagnostico_nutricional:
            story.append(_section_header("DIAGNÓSTICO NUTRICIONAL", st))
            story.append(Paragraph(exp.diagnostico_nutricional, st["obs"]))
            story.append(sp())

        # ── TRATAMIENTO NUTRICIONAL ───────────────────────────────────────────
        plan_activo = paciente.planes.filter(activo=True).first()
        if plan_activo:
            story.append(_section_header("TRATAMIENTO NUTRICIONAL", st))
            
            # Información general del plan
            trat_rows = [
                ["Tipo de dieta", plan_activo.tipo_dieta or "—"],
                ["VCT (kcal objetivo)", str(plan_activo.kcal_objetivo or "—")],
                ["Requerimiento Hídrico (ml)", str(plan_activo.requerimiento_hidrico_ml or "—")],
            ]
            story.append(_kv_table(trat_rows, st))
            story.append(sp(0.2))

            # Tabla de macronutrientes
            vct = float(plan_activo.kcal_objetivo or 0)
            peso_usual = float(exp.peso_usual_kg or 0)
            pct_p = float(plan_activo.pct_proteinas or 0)
            pct_g = float(plan_activo.pct_grasas or 0)
            pct_cho = float(plan_activo.pct_carbohidratos or 0)

            if vct > 0:
                # Cálculos de macros
                kcal_p = vct * pct_p / 100
                g_p = kcal_p / 4
                g_kg_p = g_p / peso_usual if peso_usual else 0

                kcal_g = vct * pct_g / 100
                g_g = kcal_g / 9
                g_kg_g = g_g / peso_usual if peso_usual else 0

                kcal_cho = vct * pct_cho / 100
                g_cho = kcal_cho / 4
                g_kg_cho = g_cho / peso_usual if peso_usual else 0

                macro_hdrs = ["NUTRIENTE", "%", "KCAL/DÍA", "G/DÍA", "G/KG-P/DÍA"]
                macro_rows = [
                    ["PROTEÍNAS", f"{pct_p:.1f}%", f"{kcal_p:.1f}", f"{g_p:.1f}", f"{g_kg_p:.2f}"],
                    ["GRASAS", f"{pct_g:.1f}%", f"{kcal_g:.1f}", f"{g_g:.1f}", f"{g_kg_g:.2f}"],
                    ["CARBOHIDRATOS", f"{pct_cho:.1f}%", f"{kcal_cho:.1f}", f"{g_cho:.1f}", f"{g_kg_cho:.2f}"],
                    ["TOTAL", "100%", f"{vct:.0f}", "—", "—"],
                ]
                col_w_macro = [4*cm, 2.5*cm, 3*cm, 3*cm, 4.5*cm]
                tbl_macro = _data_table(macro_hdrs, macro_rows, st, col_widths=col_w_macro)
                # Pintar última fila (TOTAL) de verde
                tbl_macro.setStyle(TableStyle([
                    ("BACKGROUND", (0, len(macro_rows)), (-1, len(macro_rows)), C_TOTAL_ROW),
                    ("FONTNAME", (0, len(macro_rows)), (-1, len(macro_rows)), "Helvetica-Bold"),
                ]))
                story.append(tbl_macro)
                story.append(sp(0.2))

            # Suplemento/Complemento y Otros
            if plan_activo.suplemento_complemento or plan_activo.trat_otros:
                trat_add_rows = []
                if plan_activo.suplemento_complemento:
                    trat_add_rows.append(["Suplemento/Complemento", plan_activo.suplemento_complemento])
                if plan_activo.trat_otros:
                    trat_add_rows.append(["Otros", plan_activo.trat_otros])
                story.append(_kv_table(trat_add_rows, st))
            story.append(sp())

        # ── PLAN POR INTERCAMBIO ──────────────────────────────────────────────
        if plan_activo:
            tiempos_comida = list(plan_activo.tiempos_comida.order_by("orden").prefetch_related("raciones__grupo"))
            if tiempos_comida:
                story.append(_section_header("PLAN POR INTERCAMBIO", st))
                
                # Obtener todos los grupos únicos del plan
                grupos_unicos = {}
                for tc in tiempos_comida:
                    for racion in tc.raciones.all():
                        if racion.grupo.nombre not in grupos_unicos:
                            grupos_unicos[racion.grupo.nombre] = racion.grupo
                
                # Headers: ALIMENTO | INT | P | G | CHO | KCAL | [tiempos de comida]
                plan_hdrs = ["ALIMENTO", "INT", "P", "G", "CHO", "KCAL"]
                for tc in tiempos_comida:
                    plan_hdrs.append(tc.nombre)
                
                # Calcular anchos de columna dinámicamente
                n_tiempos = len(tiempos_comida)
                base_cols_width = 8.5*cm  # ALIMENTO + INT + P + G + CHO + KCAL
                tiempo_col_width = (17*cm - base_cols_width) / n_tiempos if n_tiempos else 1*cm
                col_w_plan = [2.5*cm, 1*cm, 1*cm, 1*cm, 1*cm, 2*cm] + [tiempo_col_width] * n_tiempos
                
                plan_rows = []
                for grupo_nombre, grupo in grupos_unicos.items():
                    # Calcular cantidades por tiempo de comida
                    row = [
                        grupo_nombre,
                        "—",  # INT (total)
                        f"{float(grupo.proteina_g):.1f}",
                        f"{float(grupo.grasa_g):.1f}",
                        f"{float(grupo.carb_g):.1f}",
                        f"{float(grupo.kcal_racion):.0f}",
                    ]
                    total_int = 0
                    for tc in tiempos_comida:
                        racion = next((r for r in tc.raciones.all() if r.grupo.nombre == grupo_nombre), None)
                        if racion:
                            cant = float(racion.cantidad)
                            total_int += cant
                            row.append(f"{cant:.1f}")
                        else:
                            row.append("—")
                    # Actualizar INT con el total
                    row[1] = f"{total_int:.1f}"
                    plan_rows.append(row)
                
                story.append(_data_table(plan_hdrs, plan_rows, st, col_widths=col_w_plan))
                story.append(sp())

    # ── Exámenes Bioquímicos ──────────────────────────────────────────────────
    examenes = list(paciente.examenes_bioquimicos.order_by("-fecha")[:5])
    if examenes:
        story.append(_section_header("EXÁMENES BIOQUÍMICOS", st))

        # Tabla 1: perfil proteico, renal, lipídico, glucosa
        ex_hdrs1 = ["Fecha","PT","ALB","UR","CR","AU","COL","HDL","LDL","TGC","GLI","GLI-P","HBA1C"]
        ex_rows1 = []
        for ex in examenes:
            def _v(x): return f"{float(x):.2f}" if x is not None else "—"
            ex_rows1.append([
                str(ex.fecha),
                _v(ex.proteinas_totales), _v(ex.albumina),
                _v(ex.urea), _v(ex.creatinina), _v(ex.acido_urico),
                _v(ex.colesterol), _v(ex.hdl), _v(ex.ldl), _v(ex.trigliceridos),
                _v(ex.glucosa), _v(ex.glucosa_postprandial), _v(ex.hemoglobina_glicosilada),
            ])
        col_w_ex1 = [2.3*cm] + [1.15*cm]*12
        story.append(_data_table(ex_hdrs1, ex_rows1, st, col_widths=col_w_ex1))
        story.append(sp(0.2))

        # Tabla 2: hepático, hematología, tiroides, minerales
        ex_hdrs2 = ["Fecha","TGO","TGP","HB","HCT","T3","T4","TSH","FE","B12","NA","K","CL","CA"]
        ex_rows2 = []
        for ex in examenes:
            def _v(x): return f"{float(x):.2f}" if x is not None else "—"
            ex_rows2.append([
                str(ex.fecha),
                _v(ex.tgo), _v(ex.tgp), _v(ex.hemoglobina), _v(ex.hematocrito),
                _v(ex.t3), _v(ex.t4), _v(ex.tsh),
                _v(ex.hierro), _v(ex.vitamina_b12),
                _v(ex.sodio), _v(ex.potasio), _v(ex.cloro), _v(ex.calcio),
            ])
        col_w_ex2 = [2.3*cm] + [1.06*cm]*13
        story.append(_data_table(ex_hdrs2, ex_rows2, st, col_widths=col_w_ex2))
        story.append(sp())

    # ── PIE DE PÁGINA ─────────────────────────────────────────────────────────
    story.append(hr())
    story.append(Paragraph(
        f"Generado por {SITE_URL} · {MEDICO_NOMBRE} · {date.today().strftime('%d/%m/%Y')}",
        st["small"],
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
