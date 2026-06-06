import io
import os
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT


SITE_URL = os.environ.get('SITE_URL', 'http://localhost:8000')
MEDICO_NOMBRE = os.environ.get('MEDICO_NOMBRE', 'Dr. Domingo Porras')
MEDICO_ESPECIALIDAD = os.environ.get('MEDICO_ESPECIALIDAD', 'Medicina Interna • Cirugía Bariátrica • Nutrición Clínica')
MEDICO_CONTACTO = SITE_URL
NUTRIAPP_URL = SITE_URL


def _generar_qr_image(uuid_str: str) -> Image:
    """Genera imagen QR como objeto reportlab Image."""
    url = f"{SITE_URL}/api/documentos/verificar/{uuid_str}/"
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return Image(buffer, width=2.5*cm, height=2.5*cm)


def generar_pdf_documento(documento) -> bytes:
    """
    Genera el PDF de un DocumentoMedico y retorna los bytes.
    documento: instancia de DocumentoMedico con paciente y creado_por cargados.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2*cm,
        bottomMargin=3*cm,
        leftMargin=2.5*cm,
        rightMargin=2.5*cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Encabezado ────────────────────────────────────────────────────────────
    titulo_style = ParagraphStyle('titulo', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=14, spaceAfter=4)
    sub_style = ParagraphStyle('sub', parent=styles['Normal'], alignment=TA_CENTER, fontSize=10, textColor=colors.grey, spaceAfter=2)

    story.append(Paragraph(MEDICO_NOMBRE, titulo_style))
    story.append(Paragraph(MEDICO_ESPECIALIDAD, sub_style))
    story.append(Spacer(1, 0.3*cm))

    # Línea separadora
    story.append(Table([['']], colWidths=[15*cm], rowHeights=[1],
                       style=TableStyle([('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#2563eb'))])))
    story.append(Spacer(1, 0.4*cm))

    # ── Datos del paciente ────────────────────────────────────────────────────
    paciente = documento.paciente
    nombre_paciente = paciente.user.get_full_name() or paciente.user.username
    cedula = paciente.cedula or "—"
    fecha = documento.fecha_emision.strftime("%d/%m/%Y")

    from datetime import date
    edad = None
    if paciente.fecha_nacimiento:
        hoy = date.today()
        edad = hoy.year - paciente.fecha_nacimiento.year
        if (hoy.month, hoy.day) < (paciente.fecha_nacimiento.month, paciente.fecha_nacimiento.day):
            edad -= 1

    datos_table = [
        [Paragraph('<b>Paciente:</b>', styles['Normal']), Paragraph(nombre_paciente, styles['Normal']),
         Paragraph('<b>Fecha:</b>', styles['Normal']), Paragraph(fecha, styles['Normal'])],
        [Paragraph('<b>Cédula:</b>', styles['Normal']), Paragraph(cedula, styles['Normal']),
         Paragraph('<b>Edad:</b>', styles['Normal']), Paragraph(f"{edad} años" if edad else "—", styles['Normal'])],
    ]
    t = Table(datos_table, colWidths=[3*cm, 5.5*cm, 2.5*cm, 4*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.25, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    # ── Título del documento ──────────────────────────────────────────────────
    tipo_label = documento.get_tipo_display()
    story.append(Paragraph(f"<b>{tipo_label}</b>", ParagraphStyle(
        'tipo_doc', parent=styles['Heading2'], fontSize=12, spaceAfter=6,
        textColor=colors.HexColor('#1e40af')
    )))

    # ── Contenido según tipo ──────────────────────────────────────────────────
    contenido = documento.contenido

    if documento.tipo == 'receta':
        # Esperar: {"medicamentos": [{"nombre": str, "dosis": str, "frecuencia": str, "duracion": str}], "indicaciones": str}
        medicamentos = contenido.get('medicamentos', [])
        for i, med in enumerate(medicamentos, 1):
            story.append(Paragraph(
                f"<b>{i}. {med.get('nombre', '')}</b> — {med.get('dosis', '')} — {med.get('frecuencia', '')} — {med.get('duracion', '')}",
                styles['Normal']
            ))
            story.append(Spacer(1, 0.2*cm))
        if contenido.get('indicaciones'):
            story.append(Spacer(1, 0.3*cm))
            story.append(Paragraph(f"<b>Indicaciones:</b> {contenido['indicaciones']}", styles['Normal']))

    elif documento.tipo in ('orden_laboratorio', 'orden_imagenologia'):
        # Esperar: {"estudios": ["Hemograma", "Glicemia", ...], "indicaciones": str}
        estudios = contenido.get('estudios', [])
        for estudio in estudios:
            story.append(Paragraph(f"• {estudio}", styles['Normal']))
            story.append(Spacer(1, 0.15*cm))
        if contenido.get('indicaciones'):
            story.append(Spacer(1, 0.3*cm))
            story.append(Paragraph(f"<b>Indicaciones clínicas:</b> {contenido['indicaciones']}", styles['Normal']))

    elif documento.tipo == 'constancia':
        # Esperar: {"texto": str}
        texto = contenido.get('texto', '')
        story.append(Paragraph(texto, ParagraphStyle(
            'constancia', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=8
        )))

    story.append(Spacer(1, 1*cm))

    # ── Firma ─────────────────────────────────────────────────────────────────
    firma_table = [[
        Paragraph("_______________________________", styles['Normal']),
        '',
        _generar_qr_image(str(documento.uuid_validacion)),
    ], [
        Paragraph(f"<b>{MEDICO_NOMBRE}</b>", styles['Normal']),
        '',
        Paragraph(f"<font size=7>Escanea para validar\nautenticidad del documento</font>", styles['Normal']),
    ]]
    ft = Table(firma_table, colWidths=[7*cm, 3*cm, 5*cm])
    ft.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'BOTTOM'), ('ALIGN', (2,0), (2,-1), 'CENTER')]))
    story.append(ft)

    # ── Pie de página ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.3*cm))
    story.append(Table([['']], colWidths=[15*cm], rowHeights=[1],
                       style=TableStyle([('LINEABOVE', (0,0), (-1,-1), 0.5, colors.grey)])))
    story.append(Paragraph(
        f"<font size=7>Documento emitido digitalmente por {NUTRIAPP_URL} · UUID: {documento.uuid_validacion} · Fecha: {fecha}</font>",
        ParagraphStyle('pie', parent=styles['Normal'], alignment=TA_CENTER, textColor=colors.grey)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
