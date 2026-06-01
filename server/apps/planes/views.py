from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from apps.users.permissions import IsNutricionista, IsNutricionistaOrPaciente

from .models import AlimentoTagPlan, AlimentoTagPlantilla, PlanAlimenticio, PlantillaAlimenticia, RacionPlan, RacionPlantilla, TiempoComida, TiempoComidaPlantilla
from .serializers import (
    AlimentoTagPlanSerializer,
    AlimentoTagPlantillaSerializer,
    PlanAlimenticioSerializer,
    PlantillaAlimenticiaSerializer,
    RacionPlanSerializer,
    RacionPlantillaSerializer,
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
            "plantillas",
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

    @action(detail=False, methods=["get"], url_path="plantillas")
    def plantillas(self, request):
        """Retorna plantillas activas desde la base de datos"""
        qs = PlantillaAlimenticia.objects.prefetch_related(
            "tiempos_comida__raciones__grupo",
            "alimento_tags__alimento__grupo",
        ).filter(activa=True)
        serializer = PlantillaAlimenticiaSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="plantillas_legacy")
    def plantillas_legacy(self, request):
        """[LEGACY] Plantillas hardcodeadas — usar /plantillas/ en su lugar"""
        plantillas = [
            {
                "id": 1,
                "nombre": "Pérdida de peso",
                "emoji": "🔥",
                "tipo_dieta": "hipocalorico",
                "kcal_objetivo": 1400,
                "pct_proteinas": 25,
                "pct_grasas": 30,
                "pct_carbohidratos": 45,
                "requerimiento_hidrico_ml": 2000,
                "fibra_g": 25,
                "descripcion": "Plan hipocalórico para pérdida de peso gradual y saludable. Alto en proteínas para preservar masa muscular.",
                "objetivos": ["Déficit calórico moderado", "Alta saciedad", "Preservar músculo"],
                "tiempos_comida": [
                    {"nombre": "Desayuno", "hora": "07:00", "orden": 1},
                    {"nombre": "Merienda AM", "hora": "10:00", "orden": 2},
                    {"nombre": "Almuerzo", "hora": "13:00", "orden": 3},
                    {"nombre": "Merienda PM", "hora": "16:00", "orden": 4},
                    {"nombre": "Cena", "hora": "19:00", "orden": 5},
                ],
            },
            {
                "id": 2,
                "nombre": "Mantenimiento",
                "emoji": "⚖️",
                "tipo_dieta": "normocalorico",
                "kcal_objetivo": 2000,
                "pct_proteinas": 20,
                "pct_grasas": 30,
                "pct_carbohidratos": 50,
                "requerimiento_hidrico_ml": 2500,
                "fibra_g": 30,
                "descripcion": "Plan normocalórico equilibrado para mantener el peso y la salud general.",
                "objetivos": ["Balance energético", "Alimentación equilibrada", "Salud general"],
                "tiempos_comida": [
                    {"nombre": "Desayuno", "hora": "07:00", "orden": 1},
                    {"nombre": "Almuerzo", "hora": "13:00", "orden": 2},
                    {"nombre": "Merienda", "hora": "16:00", "orden": 3},
                    {"nombre": "Cena", "hora": "19:00", "orden": 4},
                ],
            },
            {
                "id": 3,
                "nombre": "Ganancia muscular",
                "emoji": "💪",
                "tipo_dieta": "hipercalorico",
                "kcal_objetivo": 2800,
                "pct_proteinas": 30,
                "pct_grasas": 25,
                "pct_carbohidratos": 45,
                "requerimiento_hidrico_ml": 3000,
                "fibra_g": 35,
                "descripcion": "Plan hipercalórico orientado a la ganancia de masa muscular con distribución estratégica pre y post entreno.",
                "objetivos": ["Superávit calórico", "Alta ingesta proteica", "Soporte al entrenamiento"],
                "tiempos_comida": [
                    {"nombre": "Desayuno", "hora": "07:00", "orden": 1},
                    {"nombre": "Pre-entreno", "hora": "10:00", "orden": 2},
                    {"nombre": "Almuerzo", "hora": "13:00", "orden": 3},
                    {"nombre": "Post-entreno", "hora": "16:00", "orden": 4},
                    {"nombre": "Cena", "hora": "19:00", "orden": 5},
                    {"nombre": "Snack Nocturno", "hora": "21:00", "orden": 6},
                ],
            },
            {
                "id": 4,
                "nombre": "Control Diabético",
                "emoji": "🩺",
                "tipo_dieta": "diabetico",
                "kcal_objetivo": 1600,
                "pct_proteinas": 20,
                "pct_grasas": 35,
                "pct_carbohidratos": 45,
                "requerimiento_hidrico_ml": 2000,
                "fibra_g": 40,
                "cho_simples_g": 25,
                "descripcion": "Plan especializado para el control glucémico. Bajo en carbohidratos simples, alto en fibra y comidas frecuentes.",
                "objetivos": ["Control glucémico", "Comidas frecuentes", "Bajo índice glucémico"],
                "tiempos_comida": [
                    {"nombre": "Desayuno", "hora": "07:00", "orden": 1},
                    {"nombre": "Merienda AM", "hora": "10:00", "orden": 2},
                    {"nombre": "Almuerzo", "hora": "13:00", "orden": 3},
                    {"nombre": "Merienda PM", "hora": "16:00", "orden": 4},
                    {"nombre": "Cena", "hora": "19:00", "orden": 5},
                ],
            },
            {
                "id": 5,
                "nombre": "Cardioprotector",
                "emoji": "❤️",
                "tipo_dieta": "normocalorico",
                "kcal_objetivo": 1800,
                "pct_proteinas": 18,
                "pct_grasas": 28,
                "pct_carbohidratos": 54,
                "requerimiento_hidrico_ml": 2500,
                "fibra_g": 35,
                "sodio_mg": 1500,
                "descripcion": "Plan orientado a la salud cardiovascular: bajo en sodio, bajo en grasas saturadas, rico en fibra y antioxidantes.",
                "objetivos": ["Salud cardiovascular", "Bajo en sodio", "Rico en fibra"],
                "tiempos_comida": [
                    {"nombre": "Desayuno", "hora": "07:30", "orden": 1},
                    {"nombre": "Almuerzo", "hora": "13:00", "orden": 2},
                    {"nombre": "Merienda", "hora": "16:30", "orden": 3},
                    {"nombre": "Cena", "hora": "19:30", "orden": 4},
                ],
            },
            {
                "id": 6,
                "nombre": "Renal",
                "emoji": "🫘",
                "tipo_dieta": "otro",
                "kcal_objetivo": 1800,
                "pct_proteinas": 12,
                "pct_grasas": 35,
                "pct_carbohidratos": 53,
                "requerimiento_hidrico_ml": 1500,
                "fibra_g": 20,
                "sodio_mg": 1000,
                "potasio_mg": 2000,
                "descripcion": "Plan terapéutico para pacientes con enfermedad renal crónica. Restricción de proteínas, sodio, potasio y fósforo.",
                "objetivos": ["Proteger función renal", "Restricción proteica", "Control electrolitos"],
                "tiempos_comida": [
                    {"nombre": "Desayuno", "hora": "07:00", "orden": 1},
                    {"nombre": "Almuerzo", "hora": "12:30", "orden": 2},
                    {"nombre": "Merienda", "hora": "15:30", "orden": 3},
                    {"nombre": "Cena", "hora": "19:00", "orden": 4},
                ],
            },
        ]
        return Response(plantillas)


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


# ─── ViewSet Plantillas ───────────────────────────────────────────────────────

class PlantillaAlimenticiaViewSet(viewsets.ModelViewSet):
    serializer_class = PlantillaAlimenticiaSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get_queryset(self):
        qs = PlantillaAlimenticia.objects.prefetch_related(
            "tiempos_comida__raciones__grupo",
            "alimento_tags__alimento__grupo",
        ).all()
        activa = self.request.query_params.get("activa")
        if activa is not None:
            qs = qs.filter(activa=activa.lower() == "true")
        return qs

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsNutricionista()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Asociar al usuario que crea la plantilla"""
        serializer.save(creado_por=self.request.user)

    def destroy(self, request, *args, **kwargs):
        plantilla = self.get_object()
        if plantilla.es_default:
            return Response(
                {"error": "No se pueden eliminar plantillas del sistema."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="duplicar")
    def duplicar(self, request, pk=None):
        """Duplica una plantilla con todos sus tiempos y raciones"""
        original = self.get_object()
        nueva = PlantillaAlimenticia.objects.create(
            nombre=f"{original.nombre} (copia)",
            emoji=original.emoji,
            tipo_dieta=original.tipo_dieta,
            kcal_objetivo=original.kcal_objetivo,
            descripcion=original.descripcion,
            pct_proteinas=original.pct_proteinas,
            pct_grasas=original.pct_grasas,
            pct_carbohidratos=original.pct_carbohidratos,
            requerimiento_hidrico_ml=original.requerimiento_hidrico_ml,
            fibra_g=original.fibra_g,
            sodio_mg=original.sodio_mg,
            potasio_mg=original.potasio_mg,
            cho_simples_g=original.cho_simples_g,
            objetivos=original.objetivos,
            activa=True,
            es_default=False,
        )
        for t in original.tiempos_comida.prefetch_related("raciones").all():
            nuevo_tiempo = TiempoComidaPlantilla.objects.create(
                plantilla=nueva,
                nombre=t.nombre,
                hora=t.hora,
                orden=t.orden,
            )
            for r in t.raciones.all():
                RacionPlantilla.objects.create(
                    tiempo_comida=nuevo_tiempo,
                    grupo=r.grupo,
                    cantidad=r.cantidad,
                )
        serializer = self.get_serializer(nueva)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─── ViewSets auxiliares para tiempos/raciones de plantilla ──────────────────

class TiempoComidaPlantillaViewSet(viewsets.ModelViewSet):
    serializer_class = TiempoComidaSerializer  # reutilizamos estructura similar
    permission_classes = [permissions.IsAuthenticated, IsNutricionista]

    def get_serializer_class(self):
        from .serializers import TiempoComidaPlantillaSerializer
        return TiempoComidaPlantillaSerializer

    def get_queryset(self):
        qs = TiempoComidaPlantilla.objects.prefetch_related("raciones__grupo").all()
        plantilla_id = self.request.query_params.get("plantilla")
        if plantilla_id:
            qs = qs.filter(plantilla_id=plantilla_id)
        return qs.order_by("orden")


class RacionPlantillaViewSet(viewsets.ModelViewSet):
    serializer_class = RacionPlantillaSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionista]

    def get_queryset(self):
        qs = RacionPlantilla.objects.select_related("grupo", "tiempo_comida").all()
        tiempo_id = self.request.query_params.get("tiempo_comida")
        if tiempo_id:
            qs = qs.filter(tiempo_comida_id=tiempo_id)
        return qs


class AlimentoTagPlanViewSet(viewsets.ModelViewSet):
    serializer_class = AlimentoTagPlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionista]

    def get_queryset(self):
        qs = AlimentoTagPlan.objects.select_related("alimento__grupo").all()
        plan_id = self.request.query_params.get("plan")
        if plan_id:
            qs = qs.filter(plan_id=plan_id)
        return qs


class AlimentoTagPlantillaViewSet(viewsets.ModelViewSet):
    serializer_class = AlimentoTagPlantillaSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionista]

    def get_queryset(self):
        qs = AlimentoTagPlantilla.objects.select_related("alimento__grupo").all()
        plantilla_id = self.request.query_params.get("plantilla")
        if plantilla_id:
            qs = qs.filter(plantilla_id=plantilla_id)
        return qs
