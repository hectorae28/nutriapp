"""
Generador de PDF para Plan Alimenticio.
- Números como entero + fracción (2½, 1¼, etc.)
- Diseño profesional con colores
- Tablas de alimentos: EVITAR / AUMENTAR / OCASIONAL
- Sin firma del doctor
"""
import io
import os
from datetime import date
from fractions import Fraction

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

MEDICO_NOMBRE = os.environ.get('MEDICO_NOMBRE', 'Dr. Domingo Porras')
MEDICO_ESPECIALIDAD = os.environ.get('MEDICO_ESPECIALIDAD', 'Medicina Interna • Cirugía Bariátrica • Nutrición Clínica')
SITE_URL = os.environ.get('SITE_URL', 'http://localhost:8000')

# ── Paleta de colores ─────────────────────────────────────────────────────────
C_DARK   = colors.HexColor('#1B3A5C')   # azul oscuro — headers
C_MID    = colors.HexColor('#2E6DA4')   # azul medio
C_LIGHT  = colors.HexColor('#EBF3FB')   # azul muy claro — fila alt
C_GREEN  = colors.HexColor('#1A7A4A')   # verde — aumentar
C_GREEN_L= colors.HexColor('#E8F5EE')
C_RED    = colors.HexColor('#B91C1C')   # rojo — evitar
C_RED_L  = colors.HexColor('#FEF2F2')
C_AMBER  = colors.HexColor('#B45309')   # ámbar — ocasional
C_AMBER_L= colors.HexColor('#FFFBEB')
C_GRAY   = colors.HexColor('#64748B')
C_GRAY_L = colors.HexColor('#F8FAFC')
C_WHITE  = colors.white
C_BORDER = colors.HexColor('#CBD5E1')

PAGE_W = letter[0] - 1.5*inch   # ancho útil


# ── Conversión decimal → fracción ─────────────────────────────────────────────
def _to_medio_str(value):
    """
    Convierte un número a entero o 'X y medio'.
    Redondea al 0.5 más cercano.
    0.5 → 'medio'  |  1.5 → '1 y medio'  |  2.0 → '2'  |  2.7 → '3'
    """
    if value is None:
        return '-'
    try:
        value = float(value)
    except (TypeError, ValueError):
        return str(value)

    # Redondear al 0.5 más cercano
    rounded = round(value * 2) / 2

    whole = int(rounded)
    decimal = rounded - whole

    if decimal < 0.01:
        return str(whole) if whole > 0 else '0'
    else:  # 0.5
        if whole == 0:
            return '1/2'
        return f'{whole} 1/2'


def _frac_or_dash(value):
    if not value:
        return '-'
    return _to_medio_str(value)


# ── Estilos de párrafo ─────────────────────────────────────────────────────────
def _make_styles():
    s = getSampleStyleSheet()

    titulo = ParagraphStyle(
        'Titulo',
        parent=s['Normal'],
        fontSize=18,
        fontName='Helvetica-Bold',
        textColor=C_WHITE,
        leading=22,
        spaceAfter=0,
    )
    subtitulo = ParagraphStyle(
        'Subtitulo',
        parent=s['Normal'],
        fontSize=9,
        fontName='Helvetica',
        textColor=colors.HexColor('#BFD9F2'),
        leading=13,
        spaceAfter=0,
    )
    seccion = ParagraphStyle(
        'Seccion',
        parent=s['Normal'],
        fontSize=10,
        fontName='Helvetica-Bold',
        textColor=C_DARK,
        spaceBefore=10,
        spaceAfter=4,
    )
    normal = ParagraphStyle(
        'NormalCustom',
        parent=s['Normal'],
        fontSize=9,
        fontName='Helvetica',
        textColor=colors.HexColor('#334155'),
        leading=13,
    )
    small = ParagraphStyle(
        'Small',
        parent=s['Normal'],
        fontSize=8,
        fontName='Helvetica',
        textColor=C_GRAY,
        leading=11,
    )
    label = ParagraphStyle(
        'Label',
        parent=s['Normal'],
        fontSize=8,
        fontName='Helvetica-Bold',
        textColor=C_GRAY,
        leading=11,
    )
    value = ParagraphStyle(
        'Value',
        parent=s['Normal'],
        fontSize=9,
        fontName='Helvetica',
        textColor=colors.HexColor('#0F172A'),
        leading=12,
    )
    center = ParagraphStyle(
        'Center',
        parent=s['Normal'],
        fontSize=9,
        fontName='Helvetica',
        textColor=colors.HexColor('#0F172A'),
        alignment=1,
        leading=12,
    )
    return {
        'titulo': titulo, 'subtitulo': subtitulo,
        'seccion': seccion, 'normal': normal,
        'small': small, 'label': label, 'value': value, 'center': center,
    }


# ── Header decorativo ─────────────────────────────────────────────────────────
def _header_table(medico_nombre, medico_especialidad, fecha_plan, st):
    """Barra superior azul con nombre, especialidad y fecha."""
    col1 = [
        Paragraph(medico_nombre, st['titulo']),
        Spacer(1, 3),
        Paragraph(medico_especialidad, st['subtitulo']),
    ]
    col2_style = ParagraphStyle(
        'DateRight', parent=st['titulo'],
        fontSize=10, alignment=2,  # right
        textColor=colors.HexColor('#BFD9F2'),
    )
    col2 = [Paragraph(fecha_plan, col2_style)]

    inner = Table(
        [[col1, col2]],
        colWidths=[PAGE_W * 0.70, PAGE_W * 0.30],
    )
    inner.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    outer = Table([[inner]], colWidths=[PAGE_W])
    outer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    return outer


# ── Tabla de datos del paciente (2 columnas dobles) ───────────────────────────
def _paciente_table(paciente, plan, st):
    nombre = paciente.user.get_full_name() or paciente.user.username
    cedula = paciente.cedula or 'N/A'
    email  = paciente.user.email or 'N/A'

    edad_str = 'N/A'
    if paciente.fecha_nacimiento:
        hoy = date.today()
        edad = hoy.year - paciente.fecha_nacimiento.year
        if (hoy.month, hoy.day) < (paciente.fecha_nacimiento.month, paciente.fecha_nacimiento.day):
            edad -= 1
        edad_str = f"{edad} años"

    def cell(lbl, val):
        return [Paragraph(lbl, st['label']), Paragraph(str(val), st['value'])]

    rows = [
        [*cell('PACIENTE', nombre),       *cell('CÉDULA', cedula)],
        [*cell('EDAD', edad_str),          *cell('EMAIL', email)],
        [*cell('FECHA INICIO', plan.fecha_inicio.strftime('%d/%m/%Y')),
         *cell('TIPO DE DIETA', plan.tipo_dieta or 'N/A')],
    ]

    t = Table(rows, colWidths=[0.85*inch, PAGE_W*0.37, 0.85*inch, PAGE_W*0.37])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_GRAY_L),
        ('BOX', (0, 0), (-1, -1), 0.8, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return t


# ── Tabla indicaciones nutricionales ─────────────────────────────────────────
def _indicaciones_table(plan, st):
    campos = [
        ('CALORÍAS OBJETIVO', f"{plan.kcal_objetivo} kcal" if plan.kcal_objetivo else None),
        ('PROTEÍNAS', f"{_to_medio_str(plan.pct_proteinas)}%" if plan.pct_proteinas else None),
        ('GRASAS', f"{_to_medio_str(plan.pct_grasas)}%" if plan.pct_grasas else None),
        ('CARBOHIDRATOS', f"{_to_medio_str(plan.pct_carbohidratos)}%" if plan.pct_carbohidratos else None),
        ('AGUA', f"{plan.requerimiento_hidrico_ml} ml/día" if plan.requerimiento_hidrico_ml else None),
        ('FIBRA', f"{_to_medio_str(plan.fibra_g)} g" if plan.fibra_g else None),
        ('SODIO', f"{_to_medio_str(plan.sodio_mg)} mg" if plan.sodio_mg else None),
        ('POTASIO', f"{_to_medio_str(plan.potasio_mg)} mg" if plan.potasio_mg else None),
        ('CHO SIMPLES', f"{_to_medio_str(plan.cho_simples_g)} g" if plan.cho_simples_g else None),
    ]
    activos = [(k, v) for k, v in campos if v]
    if not activos:
        return None

    # Organizar en filas de 3 celdas dobles (label + valor)
    cols_per_row = 3
    rows = []
    for i in range(0, len(activos), cols_per_row):
        chunk = activos[i:i+cols_per_row]
        while len(chunk) < cols_per_row:
            chunk.append(('', ''))
        row = []
        for lbl, val in chunk:
            row += [Paragraph(lbl, st['label']), Paragraph(val, st['value'])]
        rows.append(row)

    col_w = PAGE_W / cols_per_row
    col_widths = [col_w * 0.38, col_w * 0.62] * cols_per_row

    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.8, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return t


# ── Tabla distribución de raciones ───────────────────────────────────────────
def _raciones_table(plan, st):
    tiempos = list(plan.tiempos_comida.prefetch_related('raciones__grupo').all())
    if not tiempos:
        return None

    grupos_set = {}
    for t in tiempos:
        for r in t.raciones.all():
            if r.grupo_id not in grupos_set:
                grupos_set[r.grupo_id] = r.grupo

    grupos_list = sorted(grupos_set.values(), key=lambda g: g.nombre)

    # Calcular anchos: col grupo fija, resto distribuye
    n_tiempos = len(tiempos)
    col_grupo = 1.9 * inch
    col_tiempo = (PAGE_W - col_grupo) / n_tiempos if n_tiempos else inch

    # Header
    header = [Paragraph('GRUPO ALIMENTICIO', ParagraphStyle(
        'TH', fontName='Helvetica-Bold', fontSize=8,
        textColor=C_WHITE, alignment=0,
    ))]
    for t in tiempos:
        header.append(Paragraph(t.nombre.upper(), ParagraphStyle(
            'TH2', fontName='Helvetica-Bold', fontSize=8,
            textColor=C_WHITE, alignment=1,
        )))

    data = [header]
    for i, grupo in enumerate(grupos_list):
        bg = C_LIGHT if i % 2 == 0 else C_WHITE
        row = [Paragraph(grupo.nombre, st['normal'])]
        for t in tiempos:
            racion = next((r for r in t.raciones.all() if r.grupo == grupo), None)
            val = _frac_or_dash(racion.cantidad if racion else None)
            row.append(Paragraph(val, st['center']))
        data.append(row)

    col_widths = [col_grupo] + [col_tiempo] * n_tiempos
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), C_MID),
        ('TEXTCOLOR', (0, 0), (-1, 0), C_WHITE),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        # Body
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        # Bordes
        ('BOX', (0, 0), (-1, -1), 0.8, C_BORDER),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, C_BORDER),
        ('LINEAFTER', (0, 0), (-1, -1), 0.4, C_BORDER),
        # Alternado
        *[('BACKGROUND', (0, i+1), (-1, i+1), C_LIGHT if i % 2 == 0 else C_WHITE)
          for i in range(len(grupos_list))],
    ]))
    return tbl


# ── Tabla de alimentos (evitar / aumentar / ocasional) ────────────────────────
def _alimentos_table(plan, st):
    """
    Retorna tabla de dos columnas: EVITAR | AUMENTAR CONSUMO
    Más fila extra para OCASIONAL si existe.
    """
    tags = list(plan.alimento_tags.select_related('alimento').all())
    if not tags:
        return None

    evitar    = [t.alimento.nombre for t in tags if t.tag in ('evitar', 'evitar_consumo')]
    aumentar  = [t.alimento.nombre for t in tags if t.tag in ('incrementar', 'aumentar', 'aumentar_consumo')]
    ocasional = [t.alimento.nombre for t in tags if t.tag in ('ocasional', 'moderado')]

    def _bullet_list(nombres, color):
        if not nombres:
            return Paragraph('<i>Ninguno indicado</i>', ParagraphStyle(
                'NoItem', fontName='Helvetica-Oblique', fontSize=8,
                textColor=color, leading=11,
            ))
        lines = ''.join(f'• {n}<br/>' for n in nombres)
        return Paragraph(lines, ParagraphStyle(
            'BulletList', fontName='Helvetica', fontSize=8.5,
            textColor=colors.HexColor('#1E293B'), leading=13,
        ))

    def _header_cell(text, bg, fg):
        return Paragraph(text, ParagraphStyle(
            'AlimHeader', fontName='Helvetica-Bold', fontSize=9,
            textColor=fg, alignment=1,
        ))

    col = PAGE_W / 2

    # Cabecera
    hdr_row = [
        _header_cell('🚫  EVITAR', C_RED, C_WHITE),
        _header_cell('✅  AUMENTAR CONSUMO', C_GREEN, C_WHITE),
    ]
    body_row = [_bullet_list(evitar, C_RED), _bullet_list(aumentar, C_GREEN)]

    data = [hdr_row, body_row]
    col_widths = [col, col]

    tbl = Table(data, colWidths=col_widths)
    tbl.setStyle(TableStyle([
        # Headers
        ('BACKGROUND', (0, 0), (0, 0), C_RED),
        ('BACKGROUND', (1, 0), (1, 0), C_GREEN),
        ('TOPPADDING', (0, 0), (-1, 0), 7),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        # Body
        ('BACKGROUND', (0, 1), (0, 1), C_RED_L),
        ('BACKGROUND', (1, 1), (1, 1), C_GREEN_L),
        ('TOPPADDING', (0, 1), (-1, 1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.8, C_BORDER),
        ('LINEAFTER', (0, 0), (0, -1), 0.8, C_BORDER),
    ]))

    elements = [tbl]

    if ocasional:
        elements.append(Spacer(1, 6))
        occ_hdr = Table(
            [[_header_cell('⚠️  CONSUMO OCASIONAL / MODERADO', C_AMBER, C_WHITE)]],
            colWidths=[PAGE_W],
        )
        occ_hdr.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_AMBER),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        occ_body = Table(
            [[_bullet_list(ocasional, C_AMBER)]],
            colWidths=[PAGE_W],
        )
        occ_body.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_AMBER_L),
            ('BOX', (0, 0), (-1, -1), 0.8, C_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements += [occ_hdr, occ_body]

    return elements


# ── Tablas de catálogo por grupo ──────────────────────────────────────────────
def _catalogo_por_grupo(plan, st):
    """
    Una tabla por cada grupo alimenticio con todos sus alimentos.
    Columnas: Alimento | Porción | Unidad | Recomendación (tag del plan)
    Recomendación usa color: rojo=evitar, verde=incrementar, ámbar=ocasional
    """
    from apps.catalogo.models import GrupoAlimento
    from reportlab.platypus import PageBreak

    # Construir mapa alimento_id → tag del plan
    tags_map = {
        t.alimento_id: t.tag
        for t in plan.alimento_tags.select_related('alimento').all()
    }

    TAG_LABEL = {
        'evitar':      ('EVITAR',      C_RED,   C_RED_L),
        'incrementar': ('AUMENTAR',    C_GREEN, C_GREEN_L),
        'ocasional':   ('OCASIONAL',   C_AMBER, C_AMBER_L),
    }

    th_style = ParagraphStyle(
        'CatTH', fontName='Helvetica-Bold', fontSize=8,
        textColor=C_WHITE, alignment=1, leading=10,
    )
    td_style = ParagraphStyle(
        'CatTD', fontName='Helvetica', fontSize=8,
        textColor=colors.HexColor('#1E293B'), leading=11,
    )
    td_center = ParagraphStyle(
        'CatTDC', fontName='Helvetica', fontSize=8,
        textColor=colors.HexColor('#1E293B'), alignment=1, leading=11,
    )

    # Anchos de columna
    W_NOMBRE  = PAGE_W * 0.42
    W_PORCION = PAGE_W * 0.13
    W_UNIDAD  = PAGE_W * 0.27
    W_TAG     = PAGE_W * 0.18

    grupos = (
        GrupoAlimento.objects
        .prefetch_related('alimentos')
        .order_by('nombre')
    )

    elements = [PageBreak()]

    for grupo in grupos:
        alimentos = list(grupo.alimentos.filter(activo=True).order_by('nombre'))
        if not alimentos:
            continue

        # Cabecera del grupo
        grp_hdr = Table(
            [[Paragraph(grupo.nombre.upper(), ParagraphStyle(
                'GrpHdr', fontName='Helvetica-Bold', fontSize=10,
                textColor=C_WHITE, leading=13,
            ))]],
            colWidths=[PAGE_W],
        )
        grp_hdr.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_MID),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(grp_hdr)

        # Header de la tabla de alimentos
        hdr_row = [
            Paragraph('ALIMENTO', th_style),
            Paragraph('PORCIÓN', th_style),
            Paragraph('UNIDAD / MEDIDA', th_style),
            Paragraph('RECOMENDACIÓN', th_style),
        ]
        data = [hdr_row]

        for i, alim in enumerate(alimentos):
            tag = tags_map.get(alim.id)
            if tag:
                lbl, fg, bg = TAG_LABEL[tag]
                tag_p = Paragraph(lbl, ParagraphStyle(
                    f'Tag{i}', fontName='Helvetica-Bold', fontSize=7.5,
                    textColor=fg, alignment=1, leading=10,
                ))
            else:
                bg = C_WHITE if i % 2 == 0 else C_LIGHT
                tag_p = Paragraph('', td_center)

            porcion = _to_medio_str(alim.porcion_g) + ' g' if alim.porcion_g else '-'

            row = [
                Paragraph(alim.nombre, td_style),
                Paragraph(porcion, td_center),
                Paragraph(alim.unidad or '-', td_style),
                tag_p,
            ]
            data.append(row)

        tbl = Table(
            data,
            colWidths=[W_NOMBRE, W_PORCION, W_UNIDAD, W_TAG],
            repeatRows=1,
        )

        # Estilos base
        style_cmds = [
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), C_DARK),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('BOX', (0, 0), (-1, -1), 0.6, C_BORDER),
            ('LINEBELOW', (0, 0), (-1, -1), 0.3, C_BORDER),
            ('LINEAFTER', (0, 0), (-1, -1), 0.3, C_BORDER),
        ]

        # Alternar filas y colorear tags
        for i, alim in enumerate(alimentos):
            row_idx = i + 1
            tag = tags_map.get(alim.id)
            if tag:
                _, _, bg = TAG_LABEL[tag]
                style_cmds.append(('BACKGROUND', (0, row_idx), (-1, row_idx), bg))
            else:
                bg = C_LIGHT if i % 2 == 0 else C_WHITE
                style_cmds.append(('BACKGROUND', (0, row_idx), (-1, row_idx), bg))

        tbl.setStyle(TableStyle(style_cmds))
        elements.append(tbl)
        elements.append(Spacer(1, 10))

    return elements


# ── Sección con barra de color ────────────────────────────────────────────────
def _section_bar(text, st):
    """Barra de sección azul oscuro con texto blanco."""
    p = Paragraph(text.upper(), ParagraphStyle(
        'SectionBar', fontName='Helvetica-Bold', fontSize=9,
        textColor=C_WHITE, leading=12,
    ))
    t = Table([[p]], colWidths=[PAGE_W])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t


# ── Función principal ─────────────────────────────────────────────────────────
def generar_pdf_plan(plan):
    """Genera bytes del PDF del plan alimenticio."""
    # Prefetch si no está hecho
    from django.db.models import Prefetch
    from .models import TiempoComida, RacionPlan, AlimentoTagPlan

    # Recargar con relaciones si es necesario
    try:
        plan = (
            plan.__class__.objects
            .select_related('paciente__user', 'paciente')
            .prefetch_related(
                Prefetch('tiempos_comida', queryset=TiempoComida.objects
                         .prefetch_related('raciones__grupo')),
                Prefetch('alimento_tags', queryset=AlimentoTagPlan.objects
                         .select_related('alimento')),
            )
            .get(pk=plan.pk)
        )
    except Exception:
        pass  # usar el plan como viene

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
    )

    st = _make_styles()
    story = []

    paciente = plan.paciente
    fecha_str = plan.fecha_inicio.strftime('%d / %m / %Y')

    # ── 1. Header ─────────────────────────────────────────────────────────────
    story.append(_header_table(MEDICO_NOMBRE, MEDICO_ESPECIALIDAD, fecha_str, st))
    story.append(Spacer(1, 10))

    # Título del documento
    titulo_doc = ParagraphStyle(
        'TituloDoc', fontName='Helvetica-Bold', fontSize=13,
        textColor=C_DARK, spaceBefore=0, spaceAfter=6, alignment=1,
    )
    story.append(Paragraph('PLAN ALIMENTICIO', titulo_doc))
    story.append(HRFlowable(width=PAGE_W, thickness=2, color=C_MID, spaceAfter=8))

    # ── 2. Datos del paciente ─────────────────────────────────────────────────
    story.append(_section_bar('Datos del Paciente', st))
    story.append(Spacer(1, 4))
    story.append(_paciente_table(paciente, plan, st))
    story.append(Spacer(1, 10))

    # ── 3. Indicaciones nutricionales ─────────────────────────────────────────
    ind = _indicaciones_table(plan, st)
    if ind:
        story.append(_section_bar('Indicaciones Nutricionales', st))
        story.append(Spacer(1, 4))
        story.append(ind)
        story.append(Spacer(1, 10))

    # ── 4. Distribución de raciones ───────────────────────────────────────────
    rac = _raciones_table(plan, st)
    if rac:
        story.append(_section_bar('Distribución de Raciones por Tiempo de Comida', st))
        story.append(Spacer(1, 4))
        story.append(rac)
        story.append(Spacer(1, 10))

    # ── 5. Tabla de alimentos ─────────────────────────────────────────────────
    alim = _alimentos_table(plan, st)
    if alim:
        story.append(_section_bar('Recomendaciones de Alimentos', st))
        story.append(Spacer(1, 4))
        for el in alim:
            story.append(el)
        story.append(Spacer(1, 10))

    # ── 6. Suplementos ───────────────────────────────────────────────────────
    if plan.suplemento_complemento:
        story.append(_section_bar('Suplementos / Complementos', st))
        story.append(Spacer(1, 4))
        supp_bg = Table(
            [[Paragraph(plan.suplemento_complemento, st['normal'])]],
            colWidths=[PAGE_W],
        )
        supp_bg.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.8, C_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(supp_bg)
        story.append(Spacer(1, 10))

    # ── 7. Observaciones ─────────────────────────────────────────────────────
    if plan.notas:
        story.append(_section_bar('Observaciones del Nutricionista', st))
        story.append(Spacer(1, 4))
        notas_bg = Table(
            [[Paragraph(plan.notas, st['normal'])]],
            colWidths=[PAGE_W],
        )
        notas_bg.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_AMBER_L),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#FCD34D')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(notas_bg)
        story.append(Spacer(1, 10))

    # ── 8. Catálogo completo por grupo (nueva página) ─────────────────────────
    for el in _catalogo_por_grupo(plan, st):
        story.append(el)

    # ── 9. Footer ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width=PAGE_W, thickness=0.5, color=C_BORDER))
    story.append(Spacer(1, 4))
    footer_style = ParagraphStyle(
        'Footer', fontName='Helvetica', fontSize=7.5,
        textColor=C_GRAY, alignment=1,
    )
    story.append(Paragraph(
        f'{MEDICO_NOMBRE} • {MEDICO_ESPECIALIDAD} • Generado el {date.today().strftime("%d/%m/%Y")}',
        footer_style,
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
