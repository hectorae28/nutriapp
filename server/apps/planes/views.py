from django.conf import settings
from django.core.mail import EmailMessage
from django.db import transaction
from django.http import HttpResponse
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from apps.users.permissions import IsNutricionista, IsNutricionistaOrPaciente

from .models import AlimentoTagPlan, PlanAlimenticio, RacionPlan, TiempoComida
from .pdf_plan import generar_pdf_plan
from .serializers import (
    AlimentoTagPlanSerializer,
    PlanAlimenticioSerializer,
    RacionPlanSerializer,
    TiempoComidaSerializer,
)


class PlanAlimenticioViewSet(viewsets.ModelViewSet):
    serializer_class = PlanAlimenticioSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get_queryset(self):
        user = self.request.user
        qs = PlanAlimenticio.objects.prefetch_related(
            "tiempos_comida__raciones__grupo",
            "alimento_tags__alimento__grupo",
        ).select_related("paciente__user")

        if user.groups.filter(name="Paciente").exists():
            qs = qs.filter(paciente__user=user, activo=True)
            return qs

        # Filtros opcionales para nutricionista
        paciente_id = self.request.query_params.get("paciente")
        if paciente_id:
            qs = qs.filter(paciente_id=paciente_id)
        activo = self.request.query_params.get("activo")
        if activo is not None:
            qs = qs.filter(activo=activo.lower() == "true")
        return qs

    def get_permissions(self):
        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "duplicar",
        ]:
            return [permissions.IsAuthenticated(), IsNutricionista()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], url_path="duplicar")
    def duplicar(self, request, pk=None):
        """Duplica un plan con todos sus tiempos de comida y raciones"""
        plan_original = self.get_object()

        # Crear copia del plan
        plan_nuevo = PlanAlimenticio.objects.create(
            paciente=plan_original.paciente,
            fecha_inicio=plan_original.fecha_inicio,
            fecha_fin=plan_original.fecha_fin,
            activo=False,  # El duplicado queda inactivo por defecto
            notas=plan_original.notas,
            tipo_dieta=plan_original.tipo_dieta,
            kcal_objetivo=plan_original.kcal_objetivo,
            pct_proteinas=plan_original.pct_proteinas,
            pct_grasas=plan_original.pct_grasas,
            pct_carbohidratos=plan_original.pct_carbohidratos,
            requerimiento_hidrico_ml=plan_original.requerimiento_hidrico_ml,
            fibra_g=plan_original.fibra_g,
            sodio_mg=plan_original.sodio_mg,
            potasio_mg=plan_original.potasio_mg,
            cho_simples_g=plan_original.cho_simples_g,
            cloro_sodio_mg=plan_original.cloro_sodio_mg,
            suplemento_complemento=plan_original.suplemento_complemento,
            trat_otros=plan_original.trat_otros,
        )

        # Copiar tiempos de comida y raciones
        for tiempo_original in plan_original.tiempos_comida.all():
            tiempo_nuevo = TiempoComida.objects.create(
                plan=plan_nuevo,
                nombre=tiempo_original.nombre,
                orden=tiempo_original.orden,
            )

            # Copiar raciones de este tiempo de comida
            for racion_original in tiempo_original.raciones.all():
                RacionPlan.objects.create(
                    tiempo_comida=tiempo_nuevo,
                    grupo=racion_original.grupo,
                    cantidad=racion_original.cantidad,
                )

        serializer = self.get_serializer(plan_nuevo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='pdf')
    def descargar_pdf(self, request, pk=None):
        """Descarga el plan alimenticio como PDF"""
        plan = self.get_object()
        pdf_bytes = generar_pdf_plan(plan)
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="plan_{plan.id}.pdf"'
        return response

    @action(detail=True, methods=['post'], url_path='enviar-email')
    def enviar_email(self, request, pk=None):
        """Envía el plan alimenticio por email al paciente"""
        plan = self.get_object()
        paciente = plan.paciente
        email = paciente.user.email
        
        if not email or '@nutriapp.com' in email:
            return Response(
                {'error': 'El paciente no tiene email válido registrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pdf_bytes = generar_pdf_plan(plan)
        nombre = paciente.user.get_full_name() or paciente.user.username
        
        msg = EmailMessage(
            subject='Tu Plan Alimenticio — NutriApp',
            body=f"""Hola {nombre},

Adjunto encontrarás tu plan alimenticio actualizado.

Saludos,
Equipo NutriApp""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        msg.attach(f'plan_alimenticio.pdf', pdf_bytes, 'application/pdf')
        
        try:
            msg.send(fail_silently=False)
            return Response({'detail': 'Email enviado correctamente.'})
        except Exception as e:
            return Response(
                {'error': f'Error al enviar email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TiempoComidaViewSet(viewsets.ModelViewSet):
    serializer_class = TiempoComidaSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get_queryset(self):
        qs = TiempoComida.objects.prefetch_related("raciones__grupo").all()
        plan_id = self.request.query_params.get("plan")
        if plan_id:
            qs = qs.filter(plan_id=plan_id)
        return qs.order_by("orden")

    def get_permissions(self):
        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "reordenar",
        ]:
            return [permissions.IsAuthenticated(), IsNutricionista()]
        return super().get_permissions()

    @action(detail=False, methods=["post"], url_path="reordenar")
    def reordenar(self, request):
        """Actualiza el orden de múltiples tiempos de comida"""
        items = request.data
        if not isinstance(items, list):
            return Response(
                {"error": "Se espera una lista de objetos con id y orden"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Bulk update de orden
        for item in items:
            tiempo_id = item.get("id")
            nuevo_orden = item.get("orden")
            if tiempo_id and nuevo_orden is not None:
                TiempoComida.objects.filter(id=tiempo_id).update(orden=nuevo_orden)

        # Retornar lista actualizada ordenada
        tiempo_ids = [item.get("id") for item in items if item.get("id")]
        tiempos = TiempoComida.objects.filter(id__in=tiempo_ids).order_by("orden")
        serializer = self.get_serializer(tiempos, many=True)
        return Response(serializer.data)


class RacionPlanViewSet(viewsets.ModelViewSet):
    serializer_class = RacionPlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get_queryset(self):
        qs = RacionPlan.objects.select_related("grupo", "tiempo_comida").all()
        tiempo_comida_id = self.request.query_params.get("tiempo_comida")
        if tiempo_comida_id:
            qs = qs.filter(tiempo_comida_id=tiempo_comida_id)
        return qs

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsNutricionista()]
        return super().get_permissions()


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsNutricionista])
def calcular_requerimientos(request):
    """
    Calcula requerimientos nutricionales usando la fórmula Mifflin-St Jeor

    Body esperado:
    {
        "peso_kg": float,
        "talla_cm": float,
        "edad": int,
        "sexo": "M" o "F",
        "nivel_actividad": "sedentario"|"ligero"|"moderado"|"activo"|"muy_activo"
    }
    """
    # Validar datos de entrada
    required_fields = ["peso_kg", "talla_cm", "edad", "sexo", "nivel_actividad"]
    for field in required_fields:
        if field not in request.data:
            return Response(
                {"error": f"Campo requerido: {field}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    peso_kg = float(request.data["peso_kg"])
    talla_cm = float(request.data["talla_cm"])
    edad = int(request.data["edad"])
    sexo = request.data["sexo"].upper()
    nivel_actividad = request.data["nivel_actividad"].lower()

    # Validar sexo
    if sexo not in ["M", "F"]:
        return Response(
            {"error": 'sexo debe ser "M" o "F"'}, status=status.HTTP_400_BAD_REQUEST
        )

    # Factores de actividad física
    factores_actividad = {
        "sedentario": 1.2,
        "ligero": 1.375,
        "moderado": 1.55,
        "activo": 1.725,
        "muy_activo": 1.9,
    }

    if nivel_actividad not in factores_actividad:
        return Response(
            {
                "error": f'nivel_actividad debe ser uno de: {", ".join(factores_actividad.keys())}'
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Calcular TMB usando Mifflin-St Jeor
    if sexo == "M":
        tmb = 10 * peso_kg + 6.25 * talla_cm - 5 * edad + 5
    else:  # F
        tmb = 10 * peso_kg + 6.25 * talla_cm - 5 * edad - 161

    # Calcular VCT (Valor Calórico Total)
    factor = factores_actividad[nivel_actividad]
    vct = tmb * factor

    # Calcular macronutrientes
    # Proteínas: 20% del VCT, 4 kcal/g
    proteinas_g = round((vct * 0.20) / 4, 1)

    # Carbohidratos: 50% del VCT, 4 kcal/g
    carbohidratos_g = round((vct * 0.50) / 4, 1)

    # Grasas: 30% del VCT, 9 kcal/g
    grasas_g = round((vct * 0.30) / 9, 1)

    return Response(
        {
            "tmb": round(tmb, 1),
            "vct": round(vct, 1),
            "kcal_objetivo": round(vct, 0),
            "proteinas_g": proteinas_g,
            "carbohidratos_g": carbohidratos_g,
            "grasas_g": grasas_g,
        }
    )


class AlimentoTagPlanViewSet(viewsets.ModelViewSet):
    serializer_class = AlimentoTagPlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionista]

    def get_queryset(self):
        qs = AlimentoTagPlan.objects.select_related("alimento__grupo").all()
        plan_id = self.request.query_params.get("plan")
        if plan_id:
            qs = qs.filter(plan_id=plan_id)
        return qs


class PlanExcelExportView(APIView):
    """Exporta un plan alimenticio a Excel"""
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get(self, request, plan_id):
        from django.http import HttpResponse
        from .excel_plan_exacto import generar_excel_plan_exacto
        from .models import PlanAlimenticio

        try:
            plan = PlanAlimenticio.objects.select_related(
                "paciente__user",
                "paciente__expediente"
            ).prefetch_related(
                "paciente__registros_progreso",
                "tiempos_comida__raciones__grupo",
                "alimento_tags__alimento"
            ).get(id=plan_id)
        except PlanAlimenticio.DoesNotExist:
            return Response(
                {"error": "Plan no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generar Excel
        excel_bytes = generar_excel_plan_exacto(plan)

        # Retornar como respuesta
        response = HttpResponse(
            excel_bytes,
            content_type="application/vnd.ms-excel"
        )
        filename = f"plan_alimenticio_{plan.paciente.user.username}_{plan.fecha_inicio}.xls"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class PlanExcelImportView(APIView):
    """Importa un plan alimenticio desde Excel"""
    permission_classes = [permissions.IsAuthenticated, IsNutricionista]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, paciente_id=None):
        from .excel_plan_parser import importar_plan_desde_excel
        from .models import PlanAlimenticio, TiempoComida, RacionPlan, AlimentoTagPlan
        from apps.users.models import Paciente
        from apps.catalogo.models import GrupoAlimento, Alimento
        import os
        
        # Paciente_id puede venir como parámetro de URL o en el body
        if not paciente_id:
            paciente_id = request.data.get('paciente_id')
        
        if not paciente_id:
            return Response(
                {"error": "Se requiere paciente_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el paciente existe
        try:
            paciente = Paciente.objects.get(id=paciente_id)
        except Paciente.DoesNotExist:
            return Response(
                {"error": "Paciente no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar archivo (acepta 'file' o 'archivo')
        file = request.FILES.get('file') or request.FILES.get('archivo')
        if not file:
            return Response(
                {"error": "No se ha proporcionado ningún archivo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Guardar temporalmente
        _, ext = os.path.splitext(file.name)
        ext = ext.lower() if ext else '.xlsx'
        tmp_path = f'/tmp/plan_excel{ext}'

        with open(tmp_path, 'wb') as f:
            for chunk in file.chunks():
                f.write(chunk)

        # Parsear Excel
        try:
            datos = importar_plan_desde_excel(tmp_path, paciente_id)
        except Exception as e:
            return Response(
                {"error": f"Error al parsear el archivo: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        # Crear PlanAlimenticio
        plan_data = datos.get('plan_data', {})
        tiempos_data = datos.get('tiempos', [])
        raciones_data = datos.get('raciones', [])
        alimento_tags_data = datos.get('alimento_tags', [])
        advertencias = datos.get('advertencias', [])

        with transaction.atomic():
            # Crear plan
            plan = PlanAlimenticio.objects.create(**plan_data)

            # Crear tiempos de comida
            tiempos_map = {}  # nombre -> instancia
            for tiempo_data in tiempos_data:
                tiempo = TiempoComida.objects.create(
                    plan=plan,
                    nombre=tiempo_data['nombre'],
                    hora=tiempo_data.get('hora'),
                    orden=tiempo_data.get('orden', 0)
                )
                tiempos_map[tiempo_data['nombre']] = tiempo
            
            # Crear raciones
            for racion_data in raciones_data:
                tiempo_nombre = racion_data['tiempo_nombre']
                grupo_nombre = racion_data['grupo_nombre']
                
                # Buscar tiempo
                tiempo = tiempos_map.get(tiempo_nombre)
                if not tiempo:
                    advertencias.append(f"Tiempo '{tiempo_nombre}' no encontrado para ración")
                    continue
                
                # Buscar grupo por nombre (case insensitive)
                grupo = GrupoAlimento.objects.filter(
                    nombre__icontains=grupo_nombre
                ).first()
                
                if not grupo:
                    advertencias.append(f"Grupo '{grupo_nombre}' no encontrado, se omitirá")
                    continue
                
                RacionPlan.objects.create(
                    tiempo_comida=tiempo,
                    grupo=grupo,
                    cantidad=racion_data['cantidad']
                )
            
            # Crear tags de alimentos
            for tag_data in alimento_tags_data:
                alimento_nombre = tag_data['alimento_nombre']
                tag = tag_data['tag']
                
                # Buscar alimento por nombre
                alimento = Alimento.objects.filter(
                    nombre__icontains=alimento_nombre
                ).first()
                
                if alimento:
                    AlimentoTagPlan.objects.get_or_create(
                        plan=plan,
                        alimento=alimento,
                        defaults={'tag': tag}
                    )
                else:
                    advertencias.append(f"Alimento '{alimento_nombre}' no encontrado para tag")

        # Serializar y retornar
        serializer = PlanAlimenticioSerializer(plan)
        return Response({
            'plan': serializer.data,
            'advertencias': advertencias,
            'mensaje': 'Plan importado exitosamente'
        }, status=status.HTTP_201_CREATED)
