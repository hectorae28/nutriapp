import openpyxl
import xlrd
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


def _get_cell_value(sheet, row, col):
    """Safely gets a cell value (0-indexed row and col)."""
    try:
        if hasattr(sheet, 'cell_value'):  # xlrd
            return sheet.cell_value(row, col)
        elif hasattr(sheet, 'cell'):  # openpyxl
            return sheet.cell(row=row + 1, column=col + 1).value
        return None
    except IndexError:
        return None


def _parse_decimal(value):
    if value is None or value == '':
        return None
    if isinstance(value, str) and value.strip() in ('-', ''):
        return None
    try:
        if isinstance(value, str):
            value = value.replace(',', '.').strip()
        return Decimal(str(value))
    except (ValueError, InvalidOperation):
        return None


def _parse_peso(value):
    """Parsea un valor decimal y lo cuantiza a 2 decimales.
    Evita errores de max_digits causados por ceros extra (ej: 83.0000 → 83.00)."""
    result = _parse_decimal(value)
    if result is None:
        return None
    try:
        return result.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except InvalidOperation:
        return None


def _parse_int(value):
    if value is None or value == '':
        return None
    try:
        return int(float(str(value).replace(',', '.')))
    except (ValueError, TypeError):
        return None


def _parse_date(value):
    if value is None or value == '':
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, (int, float)):
        try:
            return xlrd.xldate_as_datetime(value, 0).date()
        except Exception:
            return None
    if isinstance(value, str):
        for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y'):
            try:
                return datetime.strptime(value.strip(), fmt).date()
            except ValueError:
                pass
    return None


def _parse_sexo(value):
    if value and isinstance(value, str):
        val = value.strip().upper()
        if val in ('M', 'MASCULINO'):
            return 'M'
        if val in ('F', 'FEMENINO'):
            return 'F'
    return None


def _parse_estado_civil(value):
    if value and isinstance(value, str):
        val = value.strip().upper()
        mapping = {
            'C': 'C', 'CASADO': 'C', 'CASADA': 'C',
            'S': 'S', 'SOLTERO': 'S', 'SOLTERA': 'S',
            'D': 'D', 'DIVORCIADO': 'D', 'DIVORCIADA': 'D',
            'V': 'V', 'VIUDO': 'V', 'VIUDA': 'V',
        }
        return mapping.get(val)
    return None


def _parse_apetito(value):
    if value and isinstance(value, str):
        val = value.strip().upper()
        if 'NORMAL' in val:
            return 'NORMAL'
        if 'AUMENTADO' in val:
            return 'AUMENTADO'
        if 'DISMINUIDO' in val:
            return 'DISMINUIDO'
    return None


def _parse_estrenimiento(value):
    if value and isinstance(value, str):
        val = value.strip().upper()
        if 'CRONICO' in val or 'CRÓNICO' in val:
            return 'CRONICO'
        if 'MODERADO' in val:
            return 'MODERADO'
        if 'LEVE' in val:
            return 'LEVE'
        if 'NO' in val:
            return 'NO'
    return None


def _str(value):
    """Convierte a string limpio."""
    if value is None:
        return ''
    return str(value).strip()


def parse_historia_nutricional(file_path):
    advertencias = []
    data = {
        'paciente': {},
        'expediente': {},
        'consumo_calorico': [],
        'examenes': [],
        'registros_progreso': [],
        'tratamiento': {},
        'recordatorio': {},
        'advertencias': advertencias,
    }
    sheet = None

    # --- Abrir archivo ---
    try:
        if file_path.lower().endswith('.xlsx'):
            workbook = openpyxl.load_workbook(file_path)
            sheet = workbook["Historia Adultos"]
        elif file_path.lower().endswith('.xls'):
            workbook = xlrd.open_workbook(file_path)
            sheet = workbook.sheet_by_name("Historia Adultos")
        else:
            advertencias.append("Formato no soportado. Se espera .xls o .xlsx.")
            return data
    except Exception as e:
        advertencias.append(f"Error al abrir el archivo: {e}")
        return data

    # ---------------------------------------------------------------
    # PACIENTE
    # Mapa real del Excel (0-indexed):
    #   [7,12]  = Nombre completo  (fila 8,  col M)
    #   [7,35]  = Cédula           (fila 8,  col AJ)
    #   [3,12]  = Consultorio      (fila 4,  col M)
    #   [3,27]  = Fecha consulta   (fila 4,  col AB)
    #   [11,12] = Día nacimiento   (fila 12, col M)
    #   [11,14] = Mes nacimiento   (fila 12, col O)
    #   [11,16] = Año nacimiento   (fila 12, col Q)
    #   [11,18] = Lugar nacimiento (fila 12, col S)
    #   [11,33] = Sexo             (fila 12, col AH)
    #   [11,36] = Estado civil     (fila 12, col AK)
    #   [15,12] = Dirección        (fila 16, col M)
    #   [23,1]  = Teléfono         (fila 24, col B)
    #   [23,12] = Email            (fila 24, col M)
    #   [19,1]  = Religión         (fila 20, col B)
    #   [19,12] = Grado instrucción(fila 20, col M)
    #   [19,27] = Ocupación        (fila 20, col AB)
    # ---------------------------------------------------------------
    try:
        nombre_completo = _str(_get_cell_value(sheet, 7, 12))
        if nombre_completo:
            parts = nombre_completo.split(' ')
            data['paciente']['nombre'] = parts[0]
            data['paciente']['apellido'] = ' '.join(parts[1:]) if len(parts) > 1 else ''
        else:
            advertencias.append("Nombre del paciente no encontrado.")

        cedula_raw = _str(_get_cell_value(sheet, 7, 35))
        cedula = ''.join(filter(str.isdigit, cedula_raw.replace('.', '')))
        data['paciente']['cedula'] = cedula or None
        if not cedula:
            advertencias.append("Cédula del paciente no encontrada.")

        # Fecha nacimiento (día/mes/año en celdas separadas)
        dia = _parse_int(_get_cell_value(sheet, 11, 12))
        mes = _parse_int(_get_cell_value(sheet, 11, 14))
        ano_raw = _get_cell_value(sheet, 11, 16)
        ano = _parse_int(ano_raw)
        if ano and ano < 100:
            ano += 1900  # "77" → 1977
        if dia and mes and ano:
            try:
                data['paciente']['fecha_nacimiento'] = datetime(ano, mes, dia).date()
            except ValueError:
                advertencias.append(f"Fecha de nacimiento inválida: {dia}/{mes}/{ano}")
        else:
            advertencias.append("Fecha de nacimiento no encontrada.")

        data['paciente']['lugar_nacimiento'] = _str(_get_cell_value(sheet, 11, 18))
        data['paciente']['sexo'] = _parse_sexo(_get_cell_value(sheet, 11, 33))
        data['paciente']['estado_civil'] = _parse_estado_civil(_get_cell_value(sheet, 11, 36))
        data['paciente']['consultorio'] = _str(_get_cell_value(sheet, 3, 12))
        data['paciente']['direccion'] = _str(_get_cell_value(sheet, 15, 12))
        data['paciente']['telefono'] = _str(_get_cell_value(sheet, 23, 1)).replace('.0', '')
        data['paciente']['email'] = _str(_get_cell_value(sheet, 23, 12))
        data['paciente']['religion'] = _str(_get_cell_value(sheet, 19, 1))
        data['paciente']['grado_instruccion'] = _str(_get_cell_value(sheet, 19, 12))
        data['paciente']['ocupacion'] = _str(_get_cell_value(sheet, 19, 27))

    except Exception as e:
        advertencias.append(f"Error al parsear datos del paciente: {e}")

    # ---------------------------------------------------------------
    # EXPEDIENTE CLÍNICO
    # [27,1]  = Motivo de consulta
    # [33,1]  = Antecedentes personales (fila 34, valor bajo el label "PERSONALES:")
    # [41,1]  = Antecedentes familiares (fila 42, valor bajo el label "FAMILIARES:")
    # [46,5]  = Cafeínicos v/día
    # [46,14] = Alcohol
    # [48,5]  = Sueño hr/día
    # [48,14] = Apetito
    # [48,25] = Micciones v/día
    # [48,35] = Evacuaciones v/día
    # [50,7]  = Actividad física
    # [60,5]  = Flatulencia
    # [72,13] = Alergias
    # [74,22] = Estreñimiento (CRÓNICO), [74,28] = LEVE, [74,34] = MODERADO
    # Pesos: fila 152 (idx 151)
    #   [151,4]=PesoMax [151,12]=PesoMin [151,20]=PesoUsual
    #   [151,28]=PesoIdeal [151,36]=PesoDeseado
    #   [153,4]=PesoPQx [153,32]=CMuñeca
    # Observaciones: [145,7]
    # Diagnóstico nutricional: [208,1]
    # ---------------------------------------------------------------
    try:
        data['expediente']['motivo_consulta'] = _str(_get_cell_value(sheet, 27, 1))
        data['expediente']['ant_personales'] = _str(_get_cell_value(sheet, 33, 1))
        data['expediente']['ant_familiares'] = _str(_get_cell_value(sheet, 41, 1))

        data['expediente']['cafeinicos_v_dia'] = _parse_int(_get_cell_value(sheet, 46, 5))
        data['expediente']['alcohol'] = _str(_get_cell_value(sheet, 46, 14))
        data['expediente']['sueno_hr_dia'] = _parse_decimal(_get_cell_value(sheet, 48, 5))
        data['expediente']['apetito'] = _parse_apetito(_get_cell_value(sheet, 48, 14))
        data['expediente']['micciones_v_dia'] = _str(_get_cell_value(sheet, 48, 25))
        data['expediente']['evacuaciones_v_dia'] = _parse_int(_get_cell_value(sheet, 48, 35))
        data['expediente']['actividad_fisica'] = _str(_get_cell_value(sheet, 50, 7))

        # TGI - cada trastorno en su propia fila (col B, idx 1)
        data['expediente']['tg_dispepsia'] = bool(_str(_get_cell_value(sheet, 54, 1))) if _get_cell_value(sheet, 54, 1) not in (None, '') else False
        data['expediente']['tg_distension'] = bool(_str(_get_cell_value(sheet, 56, 1))) if _get_cell_value(sheet, 56, 1) not in (None, '') else False
        data['expediente']['tg_aerofagia'] = bool(_str(_get_cell_value(sheet, 58, 1))) if _get_cell_value(sheet, 58, 1) not in (None, '') else False
        data['expediente']['tg_flatulencia'] = _str(_get_cell_value(sheet, 60, 5))  # valor en col F
        data['expediente']['tg_meteorismo'] = bool(_str(_get_cell_value(sheet, 62, 1))) if _get_cell_value(sheet, 62, 1) not in (None, '') else False
        data['expediente']['tg_diarrea'] = bool(_str(_get_cell_value(sheet, 64, 1))) if _get_cell_value(sheet, 64, 1) not in (None, '') else False
        data['expediente']['tg_nauseas'] = bool(_str(_get_cell_value(sheet, 66, 1))) if _get_cell_value(sheet, 66, 1) not in (None, '') else False
        data['expediente']['tg_vomitos'] = bool(_str(_get_cell_value(sheet, 68, 1))) if _get_cell_value(sheet, 68, 1) not in (None, '') else False
        data['expediente']['tg_rgef'] = bool(_str(_get_cell_value(sheet, 70, 1))) if _get_cell_value(sheet, 70, 1) not in (None, '') else False

        data['expediente']['alergias_alimentarias'] = _str(_get_cell_value(sheet, 72, 13))

        # Estreñimiento: tomar el que tenga valor (CRÓNICO col W, LEVE col AD, MODERADO col AJ)
        estren_cronico = _str(_get_cell_value(sheet, 74, 22))
        estren_leve = _str(_get_cell_value(sheet, 74, 28))
        estren_moderado = _str(_get_cell_value(sheet, 74, 34))
        estren_val = estren_cronico or estren_leve or estren_moderado
        data['expediente']['estrenimiento'] = _parse_estrenimiento(estren_val)

        # Pesos — _parse_peso cuantiza a 2 decimales para evitar errores max_digits
        data['expediente']['peso_maximo_kg'] = _parse_peso(_get_cell_value(sheet, 151, 4))
        data['expediente']['peso_minimo_kg'] = _parse_peso(_get_cell_value(sheet, 151, 12))
        data['expediente']['peso_usual_kg'] = _parse_peso(_get_cell_value(sheet, 151, 20))
        data['expediente']['peso_ideal_kg'] = _parse_peso(_get_cell_value(sheet, 151, 28))
        data['expediente']['peso_deseado_kg'] = _parse_peso(_get_cell_value(sheet, 151, 36))
        data['expediente']['peso_prequirurgico_kg'] = _parse_peso(_get_cell_value(sheet, 153, 4))
        data['expediente']['circunferencia_muneca_cm'] = _parse_peso(_get_cell_value(sheet, 153, 32))
        data['expediente']['contextura'] = _str(_get_cell_value(sheet, 153, 36))
        data['expediente']['observaciones_calorias'] = _str(_get_cell_value(sheet, 145, 7))

        # Diagnóstico nutricional
        data['expediente']['diagnostico_nutricional'] = _str(_get_cell_value(sheet, 208, 1))

    except Exception as e:
        advertencias.append(f"Error al parsear expediente clínico: {e}")

    # ---------------------------------------------------------------
    # CONSUMO CALÓRICO DIARIO
    # Tabla empieza en fila 135 (idx 134), columnas:
    #   [,1]=Alimento [,10]=INT [,16]=P [,22]=G [,28]=CHO [,34]=KCAL
    # Grupos: LECHE(134), CARNES_A(135), CARNES_B(136), VEGETALES(137),
    #         FRUTAS(138), ALMIDONES(139), GRASAS(140), AZUCAR(141), SOPORTE(142)
    # ---------------------------------------------------------------
    grupo_rows = [
        (134, 'LECHE'),
        (135, 'CARNES_A'),
        (136, 'CARNES_B'),
        (137, 'VEGETALES'),
        (138, 'FRUTAS'),
        (139, 'ALMIDONES'),
        (140, 'GRASAS'),
        (141, 'AZUCAR'),
        (142, 'SOPORTE'),
    ]
    try:
        for orden, (row_idx, grupo_name) in enumerate(grupo_rows):
            item = {
                'grupo': grupo_name,
                'intercambios': _parse_decimal(_get_cell_value(sheet, row_idx, 10)),
                'proteinas_g': _parse_decimal(_get_cell_value(sheet, row_idx, 16)),
                'grasas_g': _parse_decimal(_get_cell_value(sheet, row_idx, 22)),
                'cho_g': _parse_decimal(_get_cell_value(sheet, row_idx, 28)),
                'kcal': _parse_decimal(_get_cell_value(sheet, row_idx, 34)),
                'orden': orden,
            }
            if any(v is not None for k, v in item.items() if k not in ('grupo', 'orden')):
                data['consumo_calorico'].append(item)
    except Exception as e:
        advertencias.append(f"Error al parsear consumo calórico: {e}")

    # ---------------------------------------------------------------
    # EXÁMENES BIOQUÍMICOS
    # El Excel tiene 2 tablas visuales (para no ser tan largo horizontalmente),
    # pero corresponden a UNA SOLA FECHA de examen.
    # Tabla 1 - fila 175 (idx 174):
    #   fecha=[174,1]  PT=[174,4]  ALB=[174,6]  GLO=[174,8]  UR=[174,10]
    #   CR=[174,13]  AU=[174,16]  COL=[174,19]  HDL=[174,22]  LDL=[174,24]
    #   VLDL=[174,27]  TGC=[174,29]  GLI=[174,32]  GLI_P=[174,34]
    #   IN=[174,36]  IN_P=[174,38]
    # Tabla 2 - fila 191 (idx 190):
    #   fecha=[190,1]  HBA=[190,4]  TGO=[190,6]  TGP=[190,8]
    #   BL_T=[190,10]  BL_D=[190,12]  BL_I=[190,14]  HB=[190,16]
    #   HCT=[190,18]  T3=[190,20]  T4=[190,23]  TSH=[190,25]
    #   FE=[190,28]  B12=[190,30]  NA=[190,32]  K=[190,34]  CL=[190,36]  CA=[190,38]
    # CORRECCIÓN: Combinar ambas tablas en UN SOLO registro
    # ---------------------------------------------------------------
    try:
        fecha1 = _parse_date(_get_cell_value(sheet, 174, 1))
        fecha2 = _parse_date(_get_cell_value(sheet, 190, 1))
        # Usar fecha1 prioritariamente, si no existe usar fecha2
        fecha_examen = fecha1 or fecha2
        
        # Combinar TODOS los campos de ambas tablas en un solo diccionario
        examen_completo = {
            'fecha': fecha_examen,
            # Campos de Tabla 1
            'pt': _parse_decimal(_get_cell_value(sheet, 174, 4)),
            'alb': _parse_decimal(_get_cell_value(sheet, 174, 6)),
            'glo': _parse_decimal(_get_cell_value(sheet, 174, 8)),
            'ur': _parse_decimal(_get_cell_value(sheet, 174, 10)),
            'cr': _parse_decimal(_get_cell_value(sheet, 174, 13)),
            'au': _parse_decimal(_get_cell_value(sheet, 174, 16)),
            'col': _parse_decimal(_get_cell_value(sheet, 174, 19)),
            'hdl': _parse_decimal(_get_cell_value(sheet, 174, 22)),
            'ldl': _parse_decimal(_get_cell_value(sheet, 174, 24)),
            'vldl': _parse_decimal(_get_cell_value(sheet, 174, 27)),
            'tgc': _parse_decimal(_get_cell_value(sheet, 174, 29)),
            'gli': _parse_decimal(_get_cell_value(sheet, 174, 32)),
            'gli_p': _parse_decimal(_get_cell_value(sheet, 174, 34)),
            'insulina': _parse_decimal(_get_cell_value(sheet, 174, 36)),
            'insulina_p': _parse_decimal(_get_cell_value(sheet, 174, 38)),
            # Campos de Tabla 2
            'hba': _parse_decimal(_get_cell_value(sheet, 190, 4)),
            'tgo': _parse_decimal(_get_cell_value(sheet, 190, 6)),
            'tgp': _parse_decimal(_get_cell_value(sheet, 190, 8)),
            'bl_t': _parse_decimal(_get_cell_value(sheet, 190, 10)),
            'bl_d': _parse_decimal(_get_cell_value(sheet, 190, 12)),
            'bl_i': _parse_decimal(_get_cell_value(sheet, 190, 14)),
            'hb': _parse_decimal(_get_cell_value(sheet, 190, 16)),
            'hct': _parse_decimal(_get_cell_value(sheet, 190, 18)),
            't3': _parse_decimal(_get_cell_value(sheet, 190, 20)),
            't4': _parse_decimal(_get_cell_value(sheet, 190, 23)),
            'tsh': _parse_decimal(_get_cell_value(sheet, 190, 25)),
            'fe': _parse_decimal(_get_cell_value(sheet, 190, 28)),
            'b12': _parse_decimal(_get_cell_value(sheet, 190, 30)),
            'na': _parse_decimal(_get_cell_value(sheet, 190, 32)),
            'potasio': _parse_decimal(_get_cell_value(sheet, 190, 34)),
            'cloro': _parse_decimal(_get_cell_value(sheet, 190, 36)),
            'calcio': _parse_decimal(_get_cell_value(sheet, 190, 38)),
        }
        
        # Agregar solo si hay al menos un valor (excluyendo 'fecha')
        if any(v is not None for k, v in examen_completo.items() if k != 'fecha'):
            data['examenes'].append(examen_completo)

    except Exception as e:
        advertencias.append(f"Error al parsear exámenes bioquímicos: {e}")

    # ---------------------------------------------------------------
    # ANTROPOMETRÍA
    # Encabezados en fila 156 (idx), datos desde fila 157:
    #   col 1 = fecha, col 4 = peso (kg), col 7 = talla (cm)
    # Se leen hasta 13 filas (157-169)
    # ---------------------------------------------------------------
    try:
        registros = []
        for row_idx in range(157, 170):
            fecha_val = _get_cell_value(sheet, row_idx, 1)
            peso_val = _get_cell_value(sheet, row_idx, 4)
            talla_val = _get_cell_value(sheet, row_idx, 7)
            fecha = _parse_date(fecha_val)
            peso = _parse_peso(peso_val)
            talla = _parse_peso(talla_val)
            if fecha and peso and peso > 0:
                registros.append({
                    'fecha': fecha,
                    'peso_kg': peso,
                    'talla_cm': talla if talla and talla > 0 else None,
                })
        data['registros_progreso'] = registros
    except Exception as e:
        advertencias.append(f"Error al parsear antropometría: {e}")

    # ---------------------------------------------------------------
    # RECORDATORIO ALIMENTARIO 24H
    # Estructura del Excel:
    #   Fila 89  (idx 88): "DESAYUNO" en col 1
    #   Fila 90  (idx 89): hora col 1, AM/PM col 4, descripción col 7
    #   Fila 96  (idx 95): "MERIENDA" en col 1
    #   Fila 97  (idx 96): datos
    #   Fila 103 (idx 102): "ALMUERZO" en col 1
    #   Fila 104 (idx 103): datos
    #   Fila 110 (idx 109): "MERIENDA" en col 1
    #   Fila 111 (idx 110): datos
    #   Fila 117 (idx 116): "CENA" en col 1
    #   Fila 118 (idx 117): datos
    #   Fila 124 (idx 123): "MERIENDA" en col 1
    #   Fila 125 (idx 124): datos
    # ---------------------------------------------------------------
    _TIEMPOS_COMIDA = [
        (89, 90, 'Desayuno'),
        (96, 97, 'Merienda AM'),
        (103, 104, 'Almuerzo'),
        (110, 111, 'Merienda PM'),
        (117, 118, 'Cena'),
        (124, 125, 'Merienda Noche'),
    ]
    try:
        entradas = []
        for orden, (label_row, data_row, nombre) in enumerate(_TIEMPOS_COMIDA):
            hora_str = _str(_get_cell_value(sheet, data_row, 1))
            ampm = _str(_get_cell_value(sheet, data_row, 4))
            descripcion = _str(_get_cell_value(sheet, data_row, 7))
            
            # Parsear hora (puede venir como "5", "9:30", "6-7", etc)
            hora_obj = None
            if hora_str and ampm:
                try:
                    # Normalizar hora_str
                    hora_str = hora_str.strip()
                    # Si es un rango (ej: "6-7"), tomar el primer valor
                    if '-' in hora_str and not hora_str.startswith('-'):
                        hora_str = hora_str.split('-')[0].strip()
                    
                    if ':' in hora_str:
                        h, m = hora_str.split(':')
                    else:
                        h, m = hora_str, '0'
                    h = int(h)
                    m = int(m)
                    # Convertir AM/PM a 24h
                    if 'PM' in ampm.upper() and h != 12:
                        h += 12
                    elif 'AM' in ampm.upper() and h == 12:
                        h = 0
                    from datetime import time
                    hora_obj = time(hour=h, minute=m)
                except (ValueError, AttributeError):
                    pass
            
            # Solo agregar si hay descripción
            if descripcion:
                entradas.append({
                    'nombre': nombre,
                    'hora': hora_obj,
                    'descripcion': descripcion,
                    'orden': orden,
                })
        
        data['recordatorio'] = {
            'entradas': entradas
        }
    except Exception as e:
        advertencias.append(f"Error al parsear recordatorio alimentario: {e}")

    # ---------------------------------------------------------------
    # PLAN POR INTERCAMBIO — distribución por tiempos de comida
    # Encabezados en fila 233 (0-idx):
    #   col 7=INT  col 10=P  col 13=G  col 16=CHO  col 19=KCAL
    #   col 22=PREW  col 25=D(Desayuno)  col 28=A(Almuerzo)
    #   col 31=M(Merienda)  col 34=C(Cena)  col 37=M(Merienda 2)
    # Grupos alimenticios: filas 234-242
    # ---------------------------------------------------------------
    _PLAN_GRUPOS = [
        (234, 'Leche'),
        (235, 'Carnes Tipo A'),
        (236, 'Carnes Tipo B'),
        (237, 'Vegetales'),
        (238, 'Frutas'),
        (239, 'Almidones'),
        (240, 'Grasas'),
        (241, 'Azúcar'),
        (242, 'Soporte Nutricional'),
    ]
    _PLAN_TIEMPOS = [
        (22, 'Pre-Workout'),
        (25, 'Desayuno'),
        (28, 'Almuerzo'),
        (31, 'Merienda'),
        (34, 'Cena'),
        (37, 'Merienda 2'),
    ]
    try:
        plan_grupos = []
        for row_idx, nombre_grupo in _PLAN_GRUPOS:
            int_total = _parse_decimal(_get_cell_value(sheet, row_idx, 7))
            p_g       = _parse_decimal(_get_cell_value(sheet, row_idx, 10))
            g_g       = _parse_decimal(_get_cell_value(sheet, row_idx, 13))
            cho_g     = _parse_decimal(_get_cell_value(sheet, row_idx, 16))
            kcal      = _parse_decimal(_get_cell_value(sheet, row_idx, 19))

            if not int_total or int_total == 0:
                continue

            # Macros por ración (para GrupoAlimento)
            kcal_racion  = round(float(kcal or 0) / float(int_total), 2)
            proteina_g   = round(float(p_g or 0) / float(int_total), 2)
            carb_g_r     = round(float(cho_g or 0) / float(int_total), 2)
            grasa_g_r    = round(float(g_g or 0) / float(int_total), 2)

            # Distribución por tiempo de comida
            distribuciones = []
            for col_tc, nombre_tc in _PLAN_TIEMPOS:
                cant = _parse_decimal(_get_cell_value(sheet, row_idx, col_tc))
                if cant and cant > 0:
                    distribuciones.append({'tiempo': nombre_tc, 'cantidad': cant})

            plan_grupos.append({
                'nombre': nombre_grupo,
                'int_total': int_total,
                'kcal_racion': kcal_racion,
                'proteina_g': proteina_g,
                'carb_g': carb_g_r,
                'grasa_g': grasa_g_r,
                'distribuciones': distribuciones,
            })
        data['plan_grupos'] = plan_grupos
    except Exception as e:
        advertencias.append(f"Error al parsear plan por intercambio: {e}")

    # ---------------------------------------------------------------
    # TRATAMIENTO NUTRICIONAL
    # [213, 14] = Tipo de dieta (celda de texto fusionada)
    # [213, 30] = VCT - kcal objetivo
    # [215, 35] = Requerimiento hídrico (ml/día)
    # [219, 7]  = % Proteínas
    # [221, 7]  = % Grasas
    # [223, 7]  = % Carbohidratos
    # [219, 35] = Sodio (NA) mg
    # [221, 35] = Potasio (K) mg
    # [223, 35] = CHO simples g
    # [225, 35] = Cloro-Sodio (CL NA) mg
    # [228, 1]  = Suplemento y/o complemento (texto, fila después del label)
    # [230, 1]  = Otros (texto, fila después del label)
    # ---------------------------------------------------------------
    try:
        data['tratamiento'] = {
            'tipo_dieta': _str(_get_cell_value(sheet, 213, 14)),
            'kcal_objetivo': _parse_int(_get_cell_value(sheet, 213, 30)),
            'requerimiento_hidrico_ml': _parse_int(_get_cell_value(sheet, 215, 35)),
            'pct_proteinas': _parse_decimal(_get_cell_value(sheet, 219, 7)),
            'pct_grasas': _parse_decimal(_get_cell_value(sheet, 221, 7)),
            'pct_carbohidratos': _parse_decimal(_get_cell_value(sheet, 223, 7)),
            'sodio_mg': _parse_decimal(_get_cell_value(sheet, 219, 35)),
            'potasio_mg': _parse_decimal(_get_cell_value(sheet, 221, 35)),
            'cho_simples_g': _parse_decimal(_get_cell_value(sheet, 223, 35)),
            'cloro_sodio_mg': _parse_decimal(_get_cell_value(sheet, 225, 35)),
            'suplemento_complemento': _str(_get_cell_value(sheet, 228, 1)),
            'trat_otros': _str(_get_cell_value(sheet, 230, 1)),
        }
    except Exception as e:
        advertencias.append(f"Error al parsear tratamiento nutricional: {e}")

    return data
