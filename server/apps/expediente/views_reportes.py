from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.expediente.models import ExamenBioquimico, ExpedienteClinico, RegistroProgreso
from apps.expediente.serializers import (
    ExamenBioquimicoSerializer,
    ExpedienteClinicoSerializer,
    RegistroProgresoSerializer,
)
from apps.planes.models import PlanAlimenticio
from apps.planes.serializers import PlanAlimenticioSerializer
from apps.users.models import Paciente
from apps.users.permissions import IsNutricionista


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsNutricionista])
def metricas_nutricionista(request):
    """
    B1 — Métricas generales del nutricionista
    GET /api/metricas-nutricionista/
    """
    # Total de pacientes
    total_pacientes = Paciente.objects.count()

    # Pacientes con plan activo
    pacientes_activos = Paciente.objects.filter(planes__activo=True).distinct().count()

    # Planes activos
    planes_activos = PlanAlimenticio.objects.filter(activo=True).count()

    # Consultas este mes (RegistroProgreso)
    now = timezone.now()
    inicio_mes = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    consultas_este_mes = RegistroProgreso.objects.filter(
        created_at__gte=inicio_mes
    ).count()

    # Nuevos pacientes este mes
    nuevos_pacientes_mes = Paciente.objects.filter(
        user__date_joined__gte=inicio_mes
    ).count()

    # Exámenes este mes
    examenes_este_mes = ExamenBioquimico.objects.filter(
        fecha__gte=inicio_mes.date()
    ).count()

    # Pacientes con progreso reciente (últimos 30 días)
    fecha_limite = now - timedelta(days=30)
    pacientes_con_progreso_reciente = (
        Paciente.objects.filter(registros_progreso__created_at__gte=fecha_limite)
        .distinct()
        .count()
    )

    # Distribución por tipo de dieta
    distribucion_tipo_dieta_dict = {}
    planes_activos_qs = PlanAlimenticio.objects.filter(activo=True)
    for plan in planes_activos_qs:
        tipo = plan.tipo_dieta or "Sin especificar"
        distribucion_tipo_dieta_dict[tipo] = distribucion_tipo_dieta_dict.get(tipo, 0) + 1
    distribucion_tipo_dieta = [{"tipo": k, "total": v} for k, v in distribucion_tipo_dieta_dict.items()]

    return Response(
        {
            "total_pacientes": total_pacientes,
            "pacientes_activos": pacientes_activos,
            "planes_activos": planes_activos,
            "consultas_este_mes": consultas_este_mes,
            "nuevos_pacientes_mes": nuevos_pacientes_mes,
            "examenes_este_mes": examenes_este_mes,
            "pacientes_con_progreso_reciente": pacientes_con_progreso_reciente,
            "distribucion_tipo_dieta": distribucion_tipo_dieta,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsNutricionista])
def reporte_paciente(request, paciente_id):
    """
    B2 — Reporte completo de un paciente
    GET /api/reporte-paciente/{paciente_id}/
    """
    try:
        paciente = Paciente.objects.select_related("user").get(pk=paciente_id)
    except Paciente.DoesNotExist:
        return Response(
            {"error": "Paciente no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    # Datos básicos del paciente con edad e IMC
    paciente_data = {
        "id": paciente.id,
        "nombre": paciente.user.get_full_name() or paciente.user.username,
        "email": paciente.user.email,
        "cedula": paciente.cedula,
        "fecha_nacimiento": paciente.fecha_nacimiento,
        "sexo": paciente.sexo,
        "telefono": paciente.telefono,
        "edad": None,
        "imc": None,
    }

    # Calcular edad
    if paciente.fecha_nacimiento:
        today = datetime.now().date()
        edad = today.year - paciente.fecha_nacimiento.year
        if (today.month, today.day) < (
            paciente.fecha_nacimiento.month,
            paciente.fecha_nacimiento.day,
        ):
            edad -= 1
        paciente_data["edad"] = edad

    # Calcular IMC desde el último registro de progreso
    ultimo_registro = (
        RegistroProgreso.objects.filter(paciente=paciente).order_by("-fecha").first()
    )

    if (
        ultimo_registro
        and ultimo_registro.peso_kg
        and ultimo_registro.talla_cm
        and ultimo_registro.talla_cm > 0
    ):
        talla_m = float(ultimo_registro.talla_cm) / 100
        imc = float(ultimo_registro.peso_kg) / (talla_m**2)
        paciente_data["imc"] = round(imc, 2)
        paciente_data["peso_actual"] = float(ultimo_registro.peso_kg)
        paciente_data["talla_cm"] = float(ultimo_registro.talla_cm)

    # Expediente clínico
    expediente = None
    try:
        exp_obj = ExpedienteClinico.objects.get(paciente=paciente)
        expediente = ExpedienteClinicoSerializer(exp_obj).data
    except ExpedienteClinico.DoesNotExist:
        pass

    # Plan activo con tiempos_comida y raciones nested
    plan_activo = None
    plan_obj = (
        PlanAlimenticio.objects.filter(paciente=paciente, activo=True)
        .prefetch_related("tiempos_comida__raciones__grupo")
        .first()
    )

    if plan_obj:
        plan_activo = PlanAlimenticioSerializer(plan_obj).data

    # Últimos 10 registros de progreso
    progreso = RegistroProgresoSerializer(
        RegistroProgreso.objects.filter(paciente=paciente).order_by("-fecha")[:10],
        many=True,
    ).data

    # Últimos 5 exámenes bioquímicos
    examenes = ExamenBioquimicoSerializer(
        ExamenBioquimico.objects.filter(paciente=paciente).order_by("-fecha")[:5],
        many=True,
    ).data

    return Response(
        {
            "paciente": paciente_data,
            "expediente": expediente,
            "plan_activo": plan_activo,
            "progreso": progreso,
            "examenes": examenes,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsNutricionista])
def adherencia_plan(request):
    """
    B3 — Cálculo de adherencia al plan
    GET /api/adherencia/?paciente={id}&semanas={n}
    """
    paciente_id = request.query_params.get("paciente")
    if not paciente_id:
        return Response(
            {"error": "Parámetro paciente es requerido"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        paciente = Paciente.objects.get(pk=paciente_id)
    except Paciente.DoesNotExist:
        return Response(
            {"error": "Paciente no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    # Número de semanas a evaluar (default 8)
    try:
        semanas = int(request.query_params.get("semanas", 8))
    except ValueError:
        semanas = 8

    # Calcular adherencia
    semanas_con_registro = 0
    now = timezone.now()
    today = now.date()

    for i in range(semanas):
        # Semana i va de (today - (i+1)*7 días) a (today - i*7 días)
        inicio_semana = today - timedelta(days=(i + 1) * 7)
        fin_semana = today - timedelta(days=i * 7)

        # Verificar si hay al menos 1 registro en esta semana (usando campo fecha)
        tiene_registro = RegistroProgreso.objects.filter(
            paciente=paciente, fecha__gte=inicio_semana, fecha__lt=fin_semana
        ).exists()

        if tiene_registro:
            semanas_con_registro += 1

    porcentaje_adherencia = (semanas_con_registro / semanas * 100) if semanas > 0 else 0

    return Response(
        {
            "paciente_id": paciente.id,
            "paciente_nombre": str(paciente),
            "semanas_evaluadas": semanas,
            "semanas_con_registro": semanas_con_registro,
            "porcentaje_adherencia": round(porcentaje_adherencia, 2),
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsNutricionista])
def comparativa_pacientes(request):
    """
    B4 — Comparativa de todos los pacientes
    GET /api/comparativa-pacientes/
    """
    pacientes = Paciente.objects.select_related("user").all()

    resultado = []

    for paciente in pacientes:
        # Primer y último registro de progreso
        registros = RegistroProgreso.objects.filter(paciente=paciente).order_by("fecha")

        primer_registro = registros.first()
        ultimo_registro = registros.last()

        peso_inicial = float(primer_registro.peso_kg) if primer_registro else None
        peso_actual = float(ultimo_registro.peso_kg) if ultimo_registro else None

        # Diferencia en kg
        diferencia_kg = None
        if peso_inicial and peso_actual:
            diferencia_kg = round(peso_actual - peso_inicial, 2)

        # Plan activo
        plan_activo = PlanAlimenticio.objects.filter(
            paciente=paciente, activo=True
        ).first()

        plan_nombre = None
        plan_tipo_dieta = None
        if plan_activo:
            plan_nombre = str(plan_activo)
            plan_tipo_dieta = plan_activo.tipo_dieta

        # Adherencia últimas 8 semanas
        semanas_con_registro = 0
        semanas_evaluadas = 8
        now = timezone.now()
        today = now.date()

        for i in range(semanas_evaluadas):
            # Semana i va de (today - (i+1)*7 días) a (today - i*7 días)
            inicio_semana = today - timedelta(days=(i + 1) * 7)
            fin_semana = today - timedelta(days=i * 7)

            tiene_registro = RegistroProgreso.objects.filter(
                paciente=paciente, fecha__gte=inicio_semana, fecha__lt=fin_semana
            ).exists()

            if tiene_registro:
                semanas_con_registro += 1

        adherencia = round((semanas_con_registro / semanas_evaluadas * 100), 2)

        # Fecha del último registro
        fecha_ultimo_registro = ultimo_registro.fecha if ultimo_registro else None

        # Calcular IMC actual
        imc_actual = None
        if (
            ultimo_registro
            and ultimo_registro.peso_kg
            and ultimo_registro.talla_cm
            and ultimo_registro.talla_cm > 0
        ):
            talla_m = float(ultimo_registro.talla_cm) / 100
            imc_actual = round(float(ultimo_registro.peso_kg) / (talla_m**2), 2)

        resultado.append(
            {
                "paciente_id": paciente.id,
                "nombre": str(paciente),
                "peso_inicial": peso_inicial,
                "peso_actual": peso_actual,
                "diferencia_kg": diferencia_kg,
                "plan_activo": plan_nombre,
                "plan_tipo_dieta": plan_tipo_dieta,
                "adherencia_pct": adherencia,
                "imc_actual": imc_actual,
                "ultimo_registro": (
                    fecha_ultimo_registro.strftime("%d/%m/%Y")
                    if fecha_ultimo_registro
                    else None
                ),
            }
        )

    return Response(resultado)
