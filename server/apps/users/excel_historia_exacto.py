"""Generador de Excel de historia nutricional — diseño propio.

Paleta extraída del design system oficial (design_handoff_nutriapp/README.md):

  NAVY    #143042   --bg-sidebar          Headers principales, título
  PETROL  #1E6E92   --accent-green        Secciones, acento primario
  SKY     #3E9DC4   gradiente logo        Sub-headers de tabla, highlight
  CORAL   #D4654A   --accent-coral        Filas TOTAL, énfasis
  SURFACE #FFFFFF   --bg-surface          Celdas de valor
  SURF2   #EAF1F5   --bg-surface-2        Filas alternas
  BGAPP   #F4F8FA   --bg-primary          Relleno suave
  LGTBLUE #D6EAF3   --accent-green-light  Fondos de etiqueta
  TEXT    #12242E   --text-primary        Todo el texto
  TEXTSEC #566B77   --text-secondary
  BORDER  #DAE4EA   --border              Bordes de celda

  Colores funcionales grupos alimenticios:
  Lácteos   #5B8DEF  Vegetales #43A047  Frutas  #EF6C00
  Acomp.    #D4A257  Proteínas #E05555  Grasas  #7E57C2
"""
import io
from datetime import date as date_type
from decimal import Decimal

import xlwt

from apps.users.models import Paciente


# ── Paleta ─────────────────────────────────────────────────────────────────────
def _rgb(hex_str: str):
    h = hex_str.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return r, g, b


# xlwt palette: indices 8-63 son sobreescribibles con set_colour_RGB
_PALETTE_SLOT = 8  # empezamos en 8 para no pisar colores estándar


def _color(wb: xlwt.Workbook, hex_str: str) -> int:
    """Registra un color custom en el siguiente slot de paleta disponible."""
    global _PALETTE_SLOT
    r, g, b = _rgb(hex_str)
    idx = _PALETTE_SLOT
    wb.set_colour_RGB(idx, r, g, b)
    _PALETTE_SLOT += 1
    return idx


# Constantes de índices de color (registradas al crear el wb)
C_NAVY = None
C_TEAL = None
C_SKY = None
C_LIGHT = None
C_WHITE = None
C_TEXT = None
C_GRAY = None
C_CORAL = None
C_LIGHT_ROW = None


C_BORDER    = None   # #DAE4EA
C_TEXTSEC   = None   # #566B77
# Colores funcionales grupos alimenticios
C_LACTEOS   = None   # #5B8DEF
C_VEG       = None   # #43A047
C_FRUTAS    = None   # #EF6C00
C_ACOMP     = None   # #D4A257
C_PROT      = None   # #E05555
C_GRASAS_C  = None   # #7E57C2
# Fondos suaves de grupos (hex + "20" opacidad simulada con mezcla sobre blanco)
C_LACTEOS_L = None
C_VEG_L     = None
C_FRUTAS_L  = None
C_ACOMP_L   = None
C_PROT_L    = None
C_GRASAS_L  = None


def _init_colors(wb):
    global C_NAVY, C_TEAL, C_SKY, C_LIGHT, C_WHITE, C_TEXT, C_GRAY, C_CORAL, C_LIGHT_ROW
    global C_BORDER, C_TEXTSEC
    global C_LACTEOS, C_VEG, C_FRUTAS, C_ACOMP, C_PROT, C_GRASAS_C
    global C_LACTEOS_L, C_VEG_L, C_FRUTAS_L, C_ACOMP_L, C_PROT_L, C_GRASAS_L
    global _PALETTE_SLOT
    _PALETTE_SLOT = 8  # reset para cada workbook

    # Paleta principal del design system
    C_NAVY      = _color(wb, "143042")   # --bg-sidebar
    C_TEAL      = _color(wb, "1E6E92")   # --accent-green (petróleo)
    C_SKY       = _color(wb, "3E9DC4")   # gradiente logo
    C_LIGHT     = _color(wb, "D6EAF3")   # --accent-green-light
    C_WHITE     = _color(wb, "FFFFFF")   # --bg-surface
    C_TEXT      = _color(wb, "12242E")   # --text-primary
    C_GRAY      = _color(wb, "EAF1F5")   # --bg-surface-2 (separadores)
    C_CORAL     = _color(wb, "D4654A")   # --accent-coral
    C_LIGHT_ROW = _color(wb, "F4F8FA")   # --bg-primary (filas alternas)
    C_BORDER    = _color(wb, "DAE4EA")   # --border
    C_TEXTSEC   = _color(wb, "566B77")   # --text-secondary

    # Colores funcionales grupos alimenticios (del design system §2.4)
    C_LACTEOS   = _color(wb, "5B8DEF")
    C_VEG       = _color(wb, "43A047")
    C_FRUTAS    = _color(wb, "EF6C00")
    C_ACOMP     = _color(wb, "D4A257")
    C_PROT      = _color(wb, "E05555")
    C_GRASAS_C  = _color(wb, "7E57C2")
    # Fondos claros de grupos (mezcla ~12% del color sobre blanco)
    C_LACTEOS_L = _color(wb, "EBF0FF")
    C_VEG_L     = _color(wb, "E8F5E9")
    C_FRUTAS_L  = _color(wb, "FFF3E0")
    C_ACOMP_L   = _color(wb, "FFF8E1")
    C_PROT_L    = _color(wb, "FFEBEE")
    C_GRASAS_L  = _color(wb, "F3E5F5")


# ── Helpers de estilo ──────────────────────────────────────────────────────────

def _font(wb, bold=False, height=180, colour_index=None, name="Calibri"):
    f = xlwt.Font()
    f.name = name
    f.bold = bold
    f.height = height  # twips = points * 20
    if colour_index is not None:
        f.colour_index = colour_index
    return f


def _borders(thin=True):
    b = xlwt.Borders()
    v = xlwt.Borders.THIN if thin else xlwt.Borders.NO_LINE
    b.left = b.right = b.top = b.bottom = v
    return b


def _borders_bottom():
    b = xlwt.Borders()
    b.bottom = xlwt.Borders.THIN
    b.left = b.right = b.top = xlwt.Borders.NO_LINE
    return b


def _al(horiz="left", vert="center", wrap=False):
    a = xlwt.Alignment()
    a.horz = {
        "left": xlwt.Alignment.HORZ_LEFT,
        "center": xlwt.Alignment.HORZ_CENTER,
        "right": xlwt.Alignment.HORZ_RIGHT,
    }[horiz]
    a.vert = {
        "center": xlwt.Alignment.VERT_CENTER,
        "top": xlwt.Alignment.VERT_TOP,
        "bottom": xlwt.Alignment.VERT_BOTTOM,
    }[vert]
    a.wrap = xlwt.Alignment.WRAP_AT_RIGHT if wrap else xlwt.Alignment.NOT_WRAP_AT_RIGHT
    return a


def _pat(colour_index):
    p = xlwt.Pattern()
    p.pattern = xlwt.Pattern.SOLID_PATTERN
    p.pattern_fore_colour = colour_index
    return p


def _xf(wb, font=None, bg=None, borders=None, alignment=None, num_format=None):
    xf = xlwt.XFStyle()
    if font:
        xf.font = font
    if bg is not None:
        xf.pattern = _pat(bg)
    if borders:
        xf.borders = borders
    if alignment:
        xf.alignment = alignment
    if num_format:
        xf.num_format_str = num_format
    return xf


# ── Estilos pre-compilados (se crean una sola vez) ────────────────────────────
def _make_styles(wb):
    """Devuelve dict con todos los estilos."""
    st = {}

    # --- header principal (navy, blanco, bold) ---
    st["h1"] = _xf(wb,
        font=_font(wb, bold=True, height=240, colour_index=C_WHITE),
        bg=C_NAVY,
        borders=_borders(False),
        alignment=_al("center"))

    # --- header sección (teal, blanco, bold) ---
    st["h2"] = _xf(wb,
        font=_font(wb, bold=True, height=180, colour_index=C_WHITE),
        bg=C_TEAL,
        borders=_borders(False),
        alignment=_al("left"))

    # --- header sección centrado ---
    st["h2c"] = _xf(wb,
        font=_font(wb, bold=True, height=180, colour_index=C_WHITE),
        bg=C_TEAL,
        borders=_borders(False),
        alignment=_al("center"))

    # --- sub-header (sky, blanco) ---
    st["h3"] = _xf(wb,
        font=_font(wb, bold=True, height=160, colour_index=C_WHITE),
        bg=C_SKY,
        borders=_borders(False),
        alignment=_al("center"))

    # --- etiqueta (light blue bg, text oscuro, bold) ---
    st["lbl"] = _xf(wb,
        font=_font(wb, bold=True, height=160, colour_index=C_TEXT),
        bg=C_LIGHT,
        borders=_borders(),
        alignment=_al("left"))

    # --- etiqueta centrada ---
    st["lblc"] = _xf(wb,
        font=_font(wb, bold=True, height=160, colour_index=C_TEXT),
        bg=C_LIGHT,
        borders=_borders(),
        alignment=_al("center"))

    # --- valor normal (blanco) ---
    st["val"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_WHITE,
        borders=_borders(),
        alignment=_al("left"))

    # --- valor centrado ---
    st["valc"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_WHITE,
        borders=_borders(),
        alignment=_al("center"))

    # --- valor numérico centrado ---
    st["num"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_WHITE,
        borders=_borders(),
        alignment=_al("center"),
        num_format="0.00")

    # --- valor wrap (textos largos) ---
    st["wrap"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_WHITE,
        borders=_borders(),
        alignment=_al("left", "top", wrap=True))

    # --- fila alterna ---
    st["alt"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_LIGHT_ROW,
        borders=_borders(),
        alignment=_al("left"))

    st["altc"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_LIGHT_ROW,
        borders=_borders(),
        alignment=_al("center"))

    st["altnum"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_LIGHT_ROW,
        borders=_borders(),
        alignment=_al("center"),
        num_format="0.00")

    # --- total (coral bg, blanco, bold) ---
    st["tot"] = _xf(wb,
        font=_font(wb, bold=True, height=160, colour_index=C_WHITE),
        bg=C_CORAL,
        borders=_borders(),
        alignment=_al("center"))

    st["totlbl"] = _xf(wb,
        font=_font(wb, bold=True, height=160, colour_index=C_WHITE),
        bg=C_CORAL,
        borders=_borders(),
        alignment=_al("left"))

    # --- fecha ---
    st["fecha"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_WHITE,
        borders=_borders(),
        alignment=_al("center"),
        num_format="DD/MM/YY")

    st["fechalt"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_LIGHT_ROW,
        borders=_borders(),
        alignment=_al("center"),
        num_format="DD/MM/YY")

    # --- separador vacío ---
    st["sep"] = _xf(wb,
        bg=C_GRAY,
        borders=_borders(False))

    # --- blanco limpio ---
    st["blank"] = _xf(wb,
        bg=C_WHITE,
        borders=_borders(False))

    # --- val bottom line only ---
    st["valbl"] = _xf(wb,
        font=_font(wb, height=160),
        bg=C_WHITE,
        borders=_borders_bottom(),
        alignment=_al("left"))

    # --- check mark cell ---
    st["check"] = _xf(wb,
        font=_font(wb, bold=True, height=180, colour_index=C_TEAL),
        bg=C_WHITE,
        borders=_borders(),
        alignment=_al("center"))

    # --- texto secundario ---
    st["valc2"] = _xf(wb,
        font=_font(wb, height=160, colour_index=C_TEXTSEC),
        bg=C_WHITE,
        borders=_borders(),
        alignment=_al("center"))

    # --- Estilos por grupo alimenticio (etiqueta + num) ---
    GRUPO_COLORS = [
        ("lacteos",  C_LACTEOS,  C_LACTEOS_L),
        ("veg",      C_VEG,      C_VEG_L),
        ("frutas",   C_FRUTAS,   C_FRUTAS_L),
        ("acomp",    C_ACOMP,    C_ACOMP_L),
        ("prot",     C_PROT,     C_PROT_L),
        ("grasas",   C_GRASAS_C, C_GRASAS_L),
    ]
    for key, fg, bg in GRUPO_COLORS:
        st[f"g_{key}_lbl"] = _xf(wb,
            font=_font(wb, bold=True, height=160, colour_index=fg),
            bg=bg,
            borders=_borders(),
            alignment=_al("left"))
        st[f"g_{key}_num"] = _xf(wb,
            font=_font(wb, height=160, colour_index=fg),
            bg=bg,
            borders=_borders(),
            alignment=_al("center"),
            num_format="0.00")

    # Resto de grupos sin color especial: vuelven a alt/val
    for key in ("azucar", "soporte"):
        st[f"g_{key}_lbl"] = st["alt"]
        st[f"g_{key}_num"] = st["altnum"]

    return st


# ── Utilidades ─────────────────────────────────────────────────────────────────

def _safe(val, default=0.0):
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _fmt_date(d):
    if d is None:
        return ""
    if isinstance(d, date_type):
        return d
    return d


def _age(fnac):
    if fnac is None:
        return ""
    hoy = date_type.today()
    return hoy.year - fnac.year - ((hoy.month, hoy.day) < (fnac.month, fnac.day))


def _w(ws, r, c, val, style):
    """Escribe una celda; ignora errores silenciosamente."""
    try:
        ws.write(r, c, val, style)
    except Exception:
        pass


def _wm(ws, r, c, rspan, cspan, val, style):
    """Escribe y fusiona celdas."""
    try:
        ws.write_merge(r, r + rspan - 1, c, c + cspan - 1, val, style)
    except Exception:
        pass


def _row_h(ws, row, points):
    ws.row(row).height_mismatch = True
    ws.row(row).height = points * 20


def _col_w(ws, col, chars):
    ws.col(col).width = int(chars * 256)


# ── Secciones ─────────────────────────────────────────────────────────────────

def _titulo(ws, st, r, paciente, exp):
    """Fila de título principal."""
    nombre = paciente.user.get_full_name() or paciente.user.username
    _row_h(ws, r, 28)
    _wm(ws, r, 0, 1, 22, "HISTORIA NUTRICIONAL", st["h1"])
    r += 1

    _row_h(ws, r, 16)
    _wm(ws, r, 0, 1, 6, "CONSULTORIO", st["lbl"])
    _wm(ws, r, 6, 1, 5, paciente.consultorio or "", st["val"])
    _wm(ws, r, 11, 1, 4, "FECHA", st["lbl"])
    _w(ws, r, 15, date_type.today(), st["fecha"])
    _wm(ws, r, 16, 1, 3, "HISTORIA NRO.", st["lbl"])
    _wm(ws, r, 19, 1, 3, paciente.historia_nro or "", st["valc"])
    r += 1

    _row_h(ws, r, 18)
    _wm(ws, r, 0, 1, 4, "PACIENTE", st["lbl"])
    _wm(ws, r, 4, 1, 12, nombre.upper(), st["val"])
    _wm(ws, r, 16, 1, 3, "CÉDULA", st["lbl"])
    _wm(ws, r, 19, 1, 3, paciente.cedula or "", st["valc"])
    r += 1

    return r


def _datos_personales(ws, st, r, paciente):
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 3, "FECHA NAC.", st["lbl"])
    fnac = paciente.fecha_nacimiento
    _wm(ws, r, 3, 1, 3, fnac.strftime("%d/%m/%Y") if fnac else "", st["valc"])
    _wm(ws, r, 6, 1, 3, "LUGAR NAC.", st["lbl"])
    _wm(ws, r, 9, 1, 3, paciente.lugar_nacimiento or "", st["val"])
    _wm(ws, r, 12, 1, 2, "EDAD", st["lbl"])
    _wm(ws, r, 14, 1, 2, str(_age(fnac)) if fnac else "", st["valc"])
    _wm(ws, r, 16, 1, 2, "SEXO", st["lbl"])
    _wm(ws, r, 18, 1, 2, paciente.sexo or "", st["valc"])
    _wm(ws, r, 20, 1, 2, "EDO. CIVIL", st["lbl"])
    _wm(ws, r, 22, 1, 0, paciente.estado_civil or "", st["valc"])
    r += 1

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 3, "DIRECCIÓN", st["lbl"])
    _wm(ws, r, 3, 1, 20, paciente.direccion or "", st["val"])
    r += 1

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 3, "RELIGIÓN", st["lbl"])
    _wm(ws, r, 3, 1, 4, paciente.religion or "", st["val"])
    _wm(ws, r, 7, 1, 4, "GRADO INSTRUCCIÓN", st["lbl"])
    _wm(ws, r, 11, 1, 4, paciente.grado_instruccion or "", st["val"])
    _wm(ws, r, 15, 1, 3, "OCUPACIÓN", st["lbl"])
    _wm(ws, r, 18, 1, 5, paciente.ocupacion or "", st["val"])
    r += 1

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 3, "TELÉFONO", st["lbl"])
    _wm(ws, r, 3, 1, 4, paciente.telefono or "", st["val"])
    _wm(ws, r, 7, 1, 4, "E-MAIL", st["lbl"])
    _wm(ws, r, 11, 1, 5, paciente.user.email or "", st["val"])
    _wm(ws, r, 16, 1, 3, "REFERIDO POR", st["lbl"])
    _wm(ws, r, 19, 1, 4, paciente.referido_por or "", st["val"])
    r += 1

    return r


def _sep(ws, st, r, h=6):
    _row_h(ws, r, h)
    _wm(ws, r, 0, 1, 22, "", st["sep"])
    return r + 1


def _section_header(ws, st, r, title, h=15):
    _row_h(ws, r, h)
    _wm(ws, r, 0, 1, 22, title, st["h2"])
    return r + 1


def _motivo_antecedentes(ws, st, r, exp):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  MOTIVO DE CONSULTA")
    _row_h(ws, r, 40)
    _wm(ws, r, 0, 1, 22, exp.motivo_consulta if exp else "", st["wrap"])
    r += 1

    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  ANTECEDENTES PERSONALES")
    _row_h(ws, r, 50)
    _wm(ws, r, 0, 1, 22, exp.ant_personales if exp else "", st["wrap"])
    r += 1

    # Obstétricos
    r = _sep(ws, st, r, 4)
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 3, "OBSTÉTRICOS", st["lbl"])
    _wm(ws, r, 3, 1, 2, "MENARQUÍA", st["lblc"])
    _wm(ws, r, 5, 1, 2, exp.menarquia_anos if exp and exp.menarquia_anos else "", st["valc"])
    _wm(ws, r, 7, 1, 2, "FUM", st["lblc"])
    _wm(ws, r, 9, 1, 2, exp.fecha_ultima_menstruacion.strftime("%d/%m/%Y") if exp and exp.fecha_ultima_menstruacion else "", st["valc"])
    _wm(ws, r, 11, 1, 2, "EMBARAZOS", st["lblc"])
    _wm(ws, r, 13, 1, 2, exp.num_embarazos if exp and exp.num_embarazos else "", st["valc"])
    _wm(ws, r, 15, 1, 3, "EDAD ÚLT. EMBARAZO", st["lblc"])
    _wm(ws, r, 18, 1, 2, exp.edad_ultimo_embarazo if exp and exp.edad_ultimo_embarazo else "", st["valc"])
    r += 1

    r = _sep(ws, st, r, 4)
    r = _section_header(ws, st, r, "  ANTECEDENTES FAMILIARES")
    _row_h(ws, r, 40)
    _wm(ws, r, 0, 1, 22, exp.ant_familiares if exp else "", st["wrap"])
    r += 1

    return r


def _habitos(ws, st, r, exp):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  HÁBITOS PSICOBIOLÓGICOS")

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 3, "CAFEÍNICOS", st["lbl"])
    _wm(ws, r, 3, 1, 2, exp.cafeinicos_v_dia if exp and exp.cafeinicos_v_dia is not None else "", st["valc"])
    _wm(ws, r, 5, 1, 2, "V/DÍA", st["lblc"])
    _wm(ws, r, 7, 1, 2, "ALCOHOL", st["lbl"])
    _wm(ws, r, 9, 1, 2, exp.alcohol if exp else "", st["valc"])
    _wm(ws, r, 11, 1, 3, "TABÁQUICOS", st["lbl"])
    _wm(ws, r, 14, 1, 2, exp.tabaquicos_und_dia if exp and exp.tabaquicos_und_dia is not None else "", st["valc"])
    _wm(ws, r, 16, 1, 3, "UND/DÍA", st["lblc"])
    r += 1

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 3, "SUEÑO", st["lbl"])
    _wm(ws, r, 3, 1, 2, exp.sueno_hr_dia if exp and exp.sueno_hr_dia is not None else "", st["valc"])
    _wm(ws, r, 5, 1, 2, "HR/DÍA", st["lblc"])
    _wm(ws, r, 7, 1, 2, "APETITO", st["lbl"])
    _wm(ws, r, 9, 1, 2, exp.apetito if exp else "", st["valc"])
    _wm(ws, r, 11, 1, 2, "MICCIONES", st["lbl"])
    _wm(ws, r, 13, 1, 2, exp.micciones_v_dia if exp else "", st["valc"])
    _wm(ws, r, 15, 1, 3, "EVACUACIONES", st["lbl"])
    _wm(ws, r, 18, 1, 2, exp.evacuaciones_v_dia if exp and exp.evacuaciones_v_dia is not None else "", st["valc"])
    r += 1

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 3, "ACTIVIDAD FÍSICA", st["lbl"])
    _wm(ws, r, 3, 1, 19, exp.actividad_fisica if exp else "", st["val"])
    r += 1

    return r


def _trastornos_gi(ws, st, r, exp):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  TRASTORNOS GASTROINTESTINALES")

    items = [
        ("DISPEPSIA",    "tg_dispepsia",    "tg_dispepsia_causa"),
        ("DISTENSIÓN",   "tg_distension",   "tg_distension_causa"),
        ("AEROFAGIA",    "tg_aerofagia",    "tg_aerofagia_causa"),
        ("FLATULENCIA",  None,              "tg_flatulencia"),
        ("METEORISMO",   "tg_meteorismo",   "tg_meteorismo_causa"),
        ("DIARREA",      "tg_diarrea",      "tg_diarrea_causa"),
        ("NÁUSEAS",      "tg_nauseas",      "tg_nauseas_causa"),
        ("VÓMITOS",      "tg_vomitos",      "tg_vomitos_causa"),
        ("R.G.E.F.",     "tg_rgef",         "tg_rgef_causa"),
    ]
    for i, (label, bool_field, val_field) in enumerate(items):
        bg = st["alt"] if i % 2 == 0 else st["val"]
        bgc = st["altc"] if i % 2 == 0 else st["valc"]
        _row_h(ws, r, 13)
        _wm(ws, r, 0, 1, 4, label, bg)
        if bool_field and exp:
            check = "✔" if getattr(exp, bool_field, False) else ""
            _wm(ws, r, 4, 1, 2, check, bgc)
        val = getattr(exp, val_field, "") if exp else ""
        _wm(ws, r, 6, 1, 16, val or "", bg)
        r += 1

    # Alergias
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 5, "ALERGIAS / INTOLERANCIAS ALIMENTARIAS", st["lbl"])
    _wm(ws, r, 5, 1, 17, exp.alergias_alimentarias if exp else "", st["val"])
    r += 1

    # Estreñimiento
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 4, "ESTREÑIMIENTO", st["lbl"])
    est = exp.estrenimiento if exp else ""
    _wm(ws, r, 4, 1, 3, "CRÓNICO", st["lblc"])
    _wm(ws, r, 7, 1, 2, "✔" if est == "CRONICO" else "", st["check"])
    _wm(ws, r, 9, 1, 3, "LEVE", st["lblc"])
    _wm(ws, r, 12, 1, 2, "✔" if est == "LEVE" else "", st["check"])
    _wm(ws, r, 14, 1, 3, "MODERADO", st["lblc"])
    _wm(ws, r, 17, 1, 2, "✔" if est == "MODERADO" else "", st["check"])
    r += 1

    return r


def _tratamientos(ws, st, r, exp):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  TRATAMIENTOS")

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 4, "FARMACOLÓGICO", st["lbl"])
    _wm(ws, r, 4, 1, 18, exp.trat_farmacologico if exp else "", st["val"])
    r += 1

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 4, "SUPLEMENTO ORAL", st["lbl"])
    _wm(ws, r, 4, 1, 18, exp.trat_suplemento_oral if exp else "", st["val"])
    r += 1

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 4, "OTROS", st["lbl"])
    _wm(ws, r, 4, 1, 18, exp.trat_otros if exp else "", st["val"])
    r += 1

    return r


def _recordatorio(ws, st, r, paciente):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  RECORDATORIO DE 24 HORAS")

    tiempos = [
        ("🌅 DESAYUNO",  0),
        ("🍎 MERIENDA",  1),
        ("🍽 ALMUERZO",  2),
        ("🍎 MERIENDA",  3),
        ("🌙 CENA",      4),
        ("🍎 MERIENDA",  5),
    ]

    recordatorios = list(
        paciente.recordatorios.all() if hasattr(paciente, "recordatorios") else []
    )

    # sub-header columnas
    _row_h(ws, r, 13)
    _wm(ws, r, 0, 1, 4, "TIEMPO", st["h3"])
    _wm(ws, r, 4, 1, 3, "HORA", st["h3"])
    _wm(ws, r, 7, 1, 15, "DESCRIPCIÓN", st["h3"])
    r += 1

    for i, (label, idx) in enumerate(tiempos):
        bg_lbl = st["lbl"] if i % 2 == 0 else st["lblc"]
        bg_val = st["val"] if i % 2 == 0 else st["alt"]
        _row_h(ws, r, 22)
        _wm(ws, r, 0, 1, 4, label, bg_lbl)

        hora_txt = ""
        desc_txt = ""
        if idx < len(recordatorios):
            rec = recordatorios[idx]
            entradas = list(rec.entradas.all() if hasattr(rec, "entradas") else [])
            if entradas:
                e = entradas[0]
                if e.hora:
                    hora_txt = e.hora.strftime("%I:%M %p")
                else:
                    hora_txt = e.nombre or ""
                desc_txt = e.descripcion or ""

        _wm(ws, r, 4, 1, 3, hora_txt, bg_val)
        _wm(ws, r, 7, 1, 15, desc_txt, bg_val)
        r += 1

    return r


def _consumo_calorico(ws, st, r, exp):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  CONSUMO CALÓRICO DIARIO")

    # header columnas
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 7, "ALIMENTO", st["h3"])
    _wm(ws, r, 7, 1, 3, "INT", st["h3"])
    _wm(ws, r, 10, 1, 3, "P (g)", st["h3"])
    _wm(ws, r, 13, 1, 3, "G (g)", st["h3"])
    _wm(ws, r, 16, 1, 3, "CHO (g)", st["h3"])
    _wm(ws, r, 19, 1, 3, "KCAL", st["h3"])
    r += 1

    # (label, db_key, estilo_key)
    grupos = [
        ("LECHE",               "LECHE",    "lacteos"),
        ("CARNES TIPO A",       "CARNES_A", "prot"),
        ("CARNES TIPO B",       "CARNES_B", "prot"),
        ("VEGETALES",           "VEGETALES","veg"),
        ("FRUTAS",              "FRUTAS",   "frutas"),
        ("ALMIDONES",           "ALMIDONES","acomp"),
        ("GRASAS",              "GRASAS",   "grasas"),
        ("AZÚCAR",              "AZUCAR",   "azucar"),
        ("SOPORTE NUTRICIONAL", "SOPORTE",  "soporte"),
    ]

    consumos = {c.grupo: c for c in (exp.consumo_calorico.all() if exp else [])}
    total_int = total_p = total_g = total_cho = total_kcal = 0

    for i, (label, key, gkey) in enumerate(grupos):
        bg  = st[f"g_{gkey}_lbl"]
        bgn = st[f"g_{gkey}_num"]
        c = consumos.get(key)
        _row_h(ws, r, 13)
        _wm(ws, r, 0, 1, 7, label, bg)
        if c:
            intc = _safe(c.intercambios)
            p    = _safe(c.proteinas_g)
            g    = _safe(c.grasas_g)
            cho  = _safe(c.cho_g)
            kcal = _safe(c.kcal)
            _wm(ws, r, 7,  1, 3, intc, bgn)
            _wm(ws, r, 10, 1, 3, p,    bgn)
            _wm(ws, r, 13, 1, 3, g,    bgn)
            _wm(ws, r, 16, 1, 3, cho,  bgn)
            _wm(ws, r, 19, 1, 3, kcal, bgn)
            total_int  += intc
            total_p    += p
            total_g    += g
            total_cho  += cho
            total_kcal += kcal
        else:
            for col in [7, 10, 13, 16, 19]:
                _wm(ws, r, col, 1, 3, "", bgn)
        r += 1

    # total
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 7, "TOTAL", st["totlbl"])
    _wm(ws, r, 7,  1, 3, total_int,  st["tot"])
    _wm(ws, r, 10, 1, 3, total_p,    st["tot"])
    _wm(ws, r, 13, 1, 3, total_g,    st["tot"])
    _wm(ws, r, 16, 1, 3, total_cho,  st["tot"])
    _wm(ws, r, 19, 1, 3, total_kcal, st["tot"])
    r += 1

    # observaciones
    r = _sep(ws, st, r, 4)
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 4, "OBSERVACIONES", st["lbl"])
    _wm(ws, r, 4, 1, 18, exp.observaciones_calorias if exp else "", st["val"])
    r += 1

    return r


def _evaluacion_objetiva(ws, st, r, exp):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  EVALUACIÓN OBJETIVA")

    _row_h(ws, r, 14)
    items = [
        ("PESO MÁX (kg)", exp.peso_maximo_kg if exp else None),
        ("PESO MÍN (kg)", exp.peso_minimo_kg if exp else None),
        ("P. USUAL (kg)", exp.peso_usual_kg if exp else None),
        ("P. IDEAL (kg)", exp.peso_ideal_kg if exp else None),
        ("P. DESEADO (kg)", exp.peso_deseado_kg if exp else None),
    ]
    col = 0
    cw = 4
    for label, val in items:
        _wm(ws, r, col, 1, cw, label, st["lbl"])
        col += cw
        _wm(ws, r, col, 1, cw, _safe(val) if val is not None else "", st["num"])
        col += cw
    r += 1

    _row_h(ws, r, 14)
    _wm(ws, r, 0,  1, 4, "P. PRE-QUIRÚRGICO (kg)", st["lbl"])
    _wm(ws, r, 4,  1, 3, _safe(exp.peso_prequirurgico_kg) if exp else "", st["num"])
    _wm(ws, r, 7,  1, 4, "C. MUÑECA (cm)", st["lbl"])
    _wm(ws, r, 11, 1, 3, _safe(exp.circunferencia_muneca_cm) if exp else "", st["num"])
    _wm(ws, r, 14, 1, 4, "CONTEXTURA", st["lbl"])
    _wm(ws, r, 18, 1, 4, exp.contextura if exp else "", st["valc"])
    r += 1

    return r


def _antropometria(ws, st, r, paciente):
    r = _sep(ws, st, r, 4)
    r = _section_header(ws, st, r, "  ANTROPOMETÍA")

    # header
    _row_h(ws, r, 13)
    cols_ant = [
        ("FECHA", 3), ("PESO", 2), ("TALLA", 2), ("IMC", 2), ("MB", 2),
        ("%GC", 2), ("%MS", 2), ("%GV", 2), ("%PP", 2), ("%PI", 2), ("%PU", 2),
    ]
    col = 0
    for label, span in cols_ant:
        _wm(ws, r, col, 1, span, label, st["h3"])
        col += span
    r += 1

    registros = list(
        paciente.registros_progreso.all().order_by("-fecha")
        if hasattr(paciente, "registros_progreso") else []
    )
    for i, reg in enumerate(registros[:14]):
        is_alt = i % 2 == 0
        fst = st["fechalt"] if is_alt else st["fecha"]
        nst = st["altnum"] if is_alt else st["num"]
        _row_h(ws, r, 13)
        col = 0
        _wm(ws, r, col, 1, 3, _fmt_date(reg.fecha), fst); col += 3
        _wm(ws, r, col, 1, 2, _safe(reg.peso_kg), nst); col += 2
        _wm(ws, r, col, 1, 2, _safe(reg.talla_cm), nst); col += 2
        # IMC calculado
        imc = ""
        if reg.peso_kg and reg.talla_cm:
            t = _safe(reg.talla_cm) / 100
            imc = round(_safe(reg.peso_kg) / (t * t), 1) if t > 0 else ""
        _wm(ws, r, col, 1, 2, imc, nst); col += 2
        _wm(ws, r, col, 1, 2, _safe(reg.metabolismo_basal) if hasattr(reg, "metabolismo_basal") else "", nst); col += 2
        _wm(ws, r, col, 1, 2, "", nst); col += 2  # %GC
        _wm(ws, r, col, 1, 2, "", nst); col += 2  # %MS
        _wm(ws, r, col, 1, 2, "", nst); col += 2  # %GV
        _wm(ws, r, col, 1, 2, "", nst); col += 2  # %PP
        _wm(ws, r, col, 1, 2, "", nst); col += 2  # %PI
        _wm(ws, r, col, 1, 2, "", nst)            # %PU
        r += 1

    return r


def _examen_bioquimico(ws, st, r, paciente):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  EXÁMENES BIOQUÍMICOS")

    # Tabla 1
    r = _section_header(ws, st, r, "  Proteínas · Renal · Lípidos · Glucosa · Insulina", 12)
    cols1 = [
        ("FECHA", 3, None), ("PT", 2, "proteinas_totales"), ("ALB", 2, "albumina"),
        ("GLO", 2, "globulina"), ("UR", 2, "urea"), ("CR", 2, "creatinina"),
        ("AU", 2, "acido_urico"), ("COL", 2, "colesterol"), ("HDL", 2, "hdl"),
        ("LDL", 2, "ldl"), ("VLDL", 2, "vldl"),
    ]
    _row_h(ws, r, 13)
    col = 0
    for label, span, _ in cols1:
        _wm(ws, r, col, 1, span, label, st["h3"])
        col += span
    r += 1

    cols1b = [
        ("TGC", 2, "trigliceridos"), ("GLI", 2, "glucosa"),
        ("GLI-P", 2, "glucosa_postprandial"), ("INS", 2, "insulina"),
        ("INS-P", 2, "insulina_postprandial"),
    ]
    # si la suma de cols1 y cols1b > 22, wrap en la misma fila de data

    examenes = list(
        paciente.examenes_bioquimicos.all().order_by("-fecha")
        if hasattr(paciente, "examenes_bioquimicos") else []
    )

    for i, ex in enumerate(examenes[:10]):
        is_alt = i % 2 == 0
        fst = st["fechalt"] if is_alt else st["fecha"]
        nst = st["altnum"] if is_alt else st["num"]
        _row_h(ws, r, 13)
        col = 0
        _wm(ws, r, col, 1, 3, _fmt_date(ex.fecha), fst); col += 3
        for _, span, attr in cols1[1:]:
            val = getattr(ex, attr, None)
            _wm(ws, r, col, 1, span, _safe(val) if val is not None else "", nst)
            col += span
        r += 1

    r = _sep(ws, st, r, 4)

    # Tabla 2
    r = _section_header(ws, st, r, "  Glucosa · Hígado · Hematología · Tiroides · Minerales", 12)
    cols2 = [
        ("FECHA", 3, None), ("HBA1C", 2, "hemoglobina_glicosilada"), ("TGC", 2, "trigliceridos"),
        ("GLI-P", 2, "glucosa_postprandial"), ("INS", 2, "insulina"), ("INS-P", 2, "insulina_postprandial"),
        ("TGO", 2, "tgo"), ("TGP", 2, "tgp"), ("BL-T", 2, "bilirrubina_total"),
        ("BL-D", 2, "bilirrubina_directa"), ("BL-I", 2, "bilirrubina_indirecta"),
    ]
    _row_h(ws, r, 13)
    col = 0
    for label, span, _ in cols2:
        _wm(ws, r, col, 1, span, label, st["h3"])
        col += span
    r += 1

    for i, ex in enumerate(examenes[:10]):
        is_alt = i % 2 == 0
        fst = st["fechalt"] if is_alt else st["fecha"]
        nst = st["altnum"] if is_alt else st["num"]
        _row_h(ws, r, 13)
        col = 0
        _wm(ws, r, col, 1, 3, _fmt_date(ex.fecha), fst); col += 3
        for _, span, attr in cols2[1:]:
            val = getattr(ex, attr, None)
            _wm(ws, r, col, 1, span, _safe(val) if val is not None else "", nst)
            col += span
        r += 1

    r = _sep(ws, st, r, 4)

    # Tabla 3: Hematología + Tiroides + Minerales
    r = _section_header(ws, st, r, "  Hematología · Tiroides · Minerales", 12)
    cols3 = [
        ("FECHA", 3, None), ("HB", 2, "hemoglobina"), ("HCT", 2, "hematocrito"),
        ("T3", 2, "t3"), ("T4", 2, "t4"), ("TSH", 2, "tsh"),
        ("FE", 2, "hierro"), ("B12", 2, "vitamina_b12"),
        ("NA", 2, "sodio"), ("K", 2, "potasio"), ("CL", 2, "cloro"), ("CA", 2, "calcio"),
    ]
    _row_h(ws, r, 13)
    col = 0
    for label, span, _ in cols3:
        _wm(ws, r, col, 1, span, label, st["h3"])
        col += span
    r += 1

    for i, ex in enumerate(examenes[:10]):
        is_alt = i % 2 == 0
        fst = st["fechalt"] if is_alt else st["fecha"]
        nst = st["altnum"] if is_alt else st["num"]
        _row_h(ws, r, 13)
        col = 0
        _wm(ws, r, col, 1, 3, _fmt_date(ex.fecha), fst); col += 3
        for _, span, attr in cols3[1:]:
            val = getattr(ex, attr, None)
            _wm(ws, r, col, 1, span, _safe(val) if val is not None else "", nst)
            col += span
        r += 1

    return r


def _diagnostico(ws, st, r, exp):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  DIAGNÓSTICO NUTRICIONAL")
    _row_h(ws, r, 40)
    _wm(ws, r, 0, 1, 22, exp.diagnostico_nutricional if exp else "", st["wrap"])
    r += 1
    return r


def _tratamiento_nutricional(ws, st, r, exp, plan):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  TRATAMIENTO NUTRICIONAL")

    vct = 0
    if plan:
        vct = _safe(plan.kcal_objetivo)
    elif exp:
        vct = sum(_safe(c.kcal) for c in exp.consumo_calorico.all()) if hasattr(exp, "consumo_calorico") else 0

    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 5, "TIPO DE DIETA", st["lbl"])
    _wm(ws, r, 5, 1, 7, "", st["val"])
    _wm(ws, r, 12, 1, 3, "VCT (kcal)", st["lbl"])
    _wm(ws, r, 15, 1, 3, vct, st["num"])
    r += 1

    # Fórmula dietética
    r = _sep(ws, st, r, 4)
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 22, "FÓRMULA DIETÉTICA", st["h3"])
    r += 1

    _row_h(ws, r, 13)
    _wm(ws, r, 0, 1, 5, "NUTRIENTE", st["h3"])
    _wm(ws, r, 5, 1, 3, "%", st["h3"])
    _wm(ws, r, 8, 1, 3, "KCAL/DÍA", st["h3"])
    _wm(ws, r, 11, 1, 3, "G/DÍA", st["h3"])
    _wm(ws, r, 14, 1, 4, "G./KG-P/DÍA", st["h3"])
    _wm(ws, r, 18, 1, 4, "FIBRA", st["h3"])
    r += 1

    peso_usual = _safe(exp.peso_usual_kg) if exp else 0

    nutrientes = [
        ("PROTEÍNAS",     25, "NA"),
        ("GRASAS",        25, "K"),
        ("CARBOHIDRATOS", 50, "CHO (S)"),
    ]
    divisores = [4, 9, 4]

    for i, ((label, pct, fibra), div) in enumerate(zip(nutrientes, divisores)):
        is_alt = i % 2 == 0
        bg = st["alt"] if is_alt else st["val"]
        bgn = st["altnum"] if is_alt else st["num"]
        kcal_d = round(vct * pct / 100, 2) if vct else 0
        g_d    = round(kcal_d / div, 2)
        g_kg   = round(g_d / peso_usual, 4) if peso_usual > 0 else ""
        _row_h(ws, r, 13)
        _wm(ws, r, 0,  1, 5, label,  bg)
        _wm(ws, r, 5,  1, 3, pct,    bgn)
        _wm(ws, r, 8,  1, 3, kcal_d, bgn)
        _wm(ws, r, 11, 1, 3, g_d,    bgn)
        _wm(ws, r, 14, 1, 4, g_kg,   bgn)
        _wm(ws, r, 18, 1, 4, fibra,  bg)
        r += 1

    # Total
    _row_h(ws, r, 14)
    _wm(ws, r, 0,  1, 5, "TOTAL",  st["totlbl"])
    _wm(ws, r, 5,  1, 3, 100,      st["tot"])
    _wm(ws, r, 8,  1, 3, vct,      st["tot"])
    _wm(ws, r, 11, 1, 3, "-",      st["tot"])
    _wm(ws, r, 14, 1, 4, "-",      st["tot"])
    _wm(ws, r, 18, 1, 4, "",       st["tot"])
    r += 1

    # Suplemento / otros
    r = _sep(ws, st, r, 4)
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 5, "SUPLEMENTO / COMPLEMENTO", st["lbl"])
    _wm(ws, r, 5, 1, 17, "", st["val"])
    r += 1
    _row_h(ws, r, 14)
    _wm(ws, r, 0, 1, 5, "OTROS", st["lbl"])
    _wm(ws, r, 5, 1, 17, "", st["val"])
    r += 1

    return r


def _plan_intercambio(ws, st, r, plan):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  CÁLCULO DE PLAN POR INTERCAMBIO")

    _row_h(ws, r, 13)
    _wm(ws, r, 0,  1, 5, "ALIMENTO",  st["h3"])
    _wm(ws, r, 5,  1, 2, "INT",       st["h3"])
    _wm(ws, r, 7,  1, 2, "P",         st["h3"])
    _wm(ws, r, 9,  1, 2, "G",         st["h3"])
    _wm(ws, r, 11, 1, 2, "CHO",       st["h3"])
    _wm(ws, r, 13, 1, 2, "KCAL",      st["h3"])
    _wm(ws, r, 15, 1, 2, "PREW",      st["h3"])
    _wm(ws, r, 17, 1, 1, "D",         st["h3"])
    _wm(ws, r, 18, 1, 1, "A",         st["h3"])
    _wm(ws, r, 19, 1, 1, "M",         st["h3"])
    _wm(ws, r, 20, 1, 1, "C",         st["h3"])
    _wm(ws, r, 21, 1, 1, "M",         st["h3"])
    r += 1

    grupos_plan = [
        ("LECHE",               "LECHE",    "lacteos"),
        ("CARNES TIPO A",       "CARNES_A", "prot"),
        ("CARNES TIPO B",       "CARNES_B", "prot"),
        ("VEGETALES",           "VEGETALES","veg"),
        ("FRUTAS",              "FRUTAS",   "frutas"),
        ("ALMIDONES",           "ALMIDONES","acomp"),
        ("GRASAS",              "GRASAS",   "grasas"),
        ("AZÚCAR",              "AZUCAR",   "azucar"),
        ("SOPORTE NUTRICIONAL", "SOPORTE",  "soporte"),
    ]

    raciones = {}
    if plan:
        for tc in plan.tiempos_comida.all():
            for rac in tc.raciones.all():
                gn = rac.grupo.nombre.upper() if rac.grupo else ""
                raciones[gn] = _safe(rac.cantidad if hasattr(rac, "cantidad") else 1)

    total_int = total_p = total_g = total_cho = total_kcal = 0

    for i, (label, key, gkey) in enumerate(grupos_plan):
        bg  = st[f"g_{gkey}_lbl"]
        bgn = st[f"g_{gkey}_num"]
        _row_h(ws, r, 13)
        _wm(ws, r, 0, 1, 5, label, bg)

        rval = raciones.get(label, 0)
        p = g = cho = kcal = 0
        try:
            from apps.catalogo.models import GrupoAlimento
            grupo = GrupoAlimento.objects.filter(nombre__icontains=label.split()[0]).first()
            if grupo:
                p    = round(rval * _safe(grupo.proteinas_por_racion), 2)
                g    = round(rval * _safe(grupo.grasas_por_racion), 2)
                cho  = round(rval * _safe(grupo.cho_por_racion), 2)
                kcal = round(rval * _safe(grupo.kcal_por_racion), 2)
        except Exception:
            pass

        _wm(ws, r, 5,  1, 2, rval, bgn)
        _wm(ws, r, 7,  1, 2, p,    bgn)
        _wm(ws, r, 9,  1, 2, g,    bgn)
        _wm(ws, r, 11, 1, 2, cho,  bgn)
        _wm(ws, r, 13, 1, 2, kcal, bgn)
        for col in range(15, 22):
            _wm(ws, r, col, 1, 1, "", bgn)
        total_int += rval; total_p += p; total_g += g; total_cho += cho; total_kcal += kcal
        r += 1

    _row_h(ws, r, 14)
    _wm(ws, r, 0,  1, 5, "TOTAL",      st["totlbl"])
    _wm(ws, r, 5,  1, 2, total_int,    st["tot"])
    _wm(ws, r, 7,  1, 2, total_p,      st["tot"])
    _wm(ws, r, 9,  1, 2, total_g,      st["tot"])
    _wm(ws, r, 11, 1, 2, total_cho,    st["tot"])
    _wm(ws, r, 13, 1, 2, total_kcal,   st["tot"])
    for col in range(15, 22):
        _wm(ws, r, col, 1, 1, "", st["tot"])
    r += 1

    return r


def _evolucion(ws, st, r, paciente):
    r = _sep(ws, st, r)
    r = _section_header(ws, st, r, "  EVOLUCIÓN Y CONTROL")
    _row_h(ws, r, 80)
    _wm(ws, r, 0, 1, 22, "", st["val"])
    r += 1
    return r


# ── Generador principal ────────────────────────────────────────────────────────

def generar_excel_historia(paciente: Paciente) -> bytes:
    wb = xlwt.Workbook(encoding="utf-8")
    _init_colors(wb)
    st = _make_styles(wb)

    ws = wb.add_sheet("Historia Nutricional")
    ws.print_scaling = 75

    # Anchos de columna (en chars × 256)
    col_widths = [10, 10, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]
    for i, w in enumerate(col_widths):
        _col_w(ws, i, w)

    exp = getattr(paciente, "expediente", None)
    plan = None
    try:
        plan = paciente.planes.filter(activo=True).first()
    except Exception:
        pass

    r = 0
    r = _titulo(ws, st, r, paciente, exp)
    r = _sep(ws, st, r, 4)
    r = _datos_personales(ws, st, r, paciente)
    r = _motivo_antecedentes(ws, st, r, exp)
    r = _habitos(ws, st, r, exp)
    r = _trastornos_gi(ws, st, r, exp)
    r = _tratamientos(ws, st, r, exp)
    r = _recordatorio(ws, st, r, paciente)
    r = _consumo_calorico(ws, st, r, exp)
    r = _evaluacion_objetiva(ws, st, r, exp)
    r = _antropometria(ws, st, r, paciente)
    r = _examen_bioquimico(ws, st, r, paciente)
    r = _diagnostico(ws, st, r, exp)
    r = _tratamiento_nutricional(ws, st, r, exp, plan)
    r = _plan_intercambio(ws, st, r, plan)
    r = _evolucion(ws, st, r, paciente)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
