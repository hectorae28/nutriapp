from rest_framework import serializers

from apps.catalogo.models import GrupoAlimento

from .models import AlimentoTagPlan, AlimentoTagPlantilla, PlanAlimenticio, PlantillaAlimenticia, RacionPlan, RacionPlantilla, TiempoComida, TiempoComidaPlantilla


class RacionPlanSerializer(serializers.ModelSerializer):
    grupo_nombre = serializers.CharField(source="grupo.nombre", read_only=True)
    kcal_racion = serializers.DecimalField(
        source="grupo.kcal_racion", max_digits=7, decimal_places=2, read_only=True
    )

    class Meta:
        model = RacionPlan
        fields = ["id", "tiempo_comida", "grupo", "grupo_nombre", "kcal_racion", "cantidad"]
        read_only_fields = ["id"]


class AlimentoTagPlanSerializer(serializers.ModelSerializer):
    alimento_nombre = serializers.CharField(source="alimento.nombre", read_only=True)
    alimento_grupo = serializers.CharField(source="alimento.grupo.nombre", read_only=True)
    tag_display = serializers.CharField(source="get_tag_display", read_only=True)

    class Meta:
        model = AlimentoTagPlan
        fields = ["id", "plan", "alimento", "alimento_nombre", "alimento_grupo", "tag", "tag_display", "nota"]
        read_only_fields = ["id"]


class AlimentoTagPlantillaSerializer(serializers.ModelSerializer):
    alimento_nombre = serializers.CharField(source="alimento.nombre", read_only=True)
    alimento_grupo = serializers.CharField(source="alimento.grupo.nombre", read_only=True)
    tag_display = serializers.CharField(source="get_tag_display", read_only=True)

    class Meta:
        model = AlimentoTagPlantilla
        fields = ["id", "plantilla", "alimento", "alimento_nombre", "alimento_grupo", "tag", "tag_display", "nota"]
        read_only_fields = ["id"]


class TiempoComidaSerializer(serializers.ModelSerializer):
    raciones = RacionPlanSerializer(many=True, read_only=True)

    class Meta:
        model = TiempoComida
        fields = "__all__"
        read_only_fields = ["id"]


class PlanAlimenticioSerializer(serializers.ModelSerializer):
    tiempos_comida = TiempoComidaSerializer(many=True, read_only=True)
    alimento_tags = AlimentoTagPlanSerializer(many=True, read_only=True)
    proteinas_g = serializers.SerializerMethodField()
    grasas_g = serializers.SerializerMethodField()
    carbohidratos_g = serializers.SerializerMethodField()
    paciente_nombre = serializers.CharField(source="paciente.__str__", read_only=True)

    class Meta:
        model = PlanAlimenticio
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

    def get_proteinas_g(self, obj):
        if obj.kcal_objetivo and obj.pct_proteinas:
            return round(
                float(obj.kcal_objetivo) * float(obj.pct_proteinas) / 100 / 4, 1
            )
        return None

    def get_grasas_g(self, obj):
        if obj.kcal_objetivo and obj.pct_grasas:
            return round(float(obj.kcal_objetivo) * float(obj.pct_grasas) / 100 / 9, 1)
        return None

    def get_carbohidratos_g(self, obj):
        if obj.kcal_objetivo and obj.pct_carbohidratos:
            return round(
                float(obj.kcal_objetivo) * float(obj.pct_carbohidratos) / 100 / 4, 1
            )
        return None


# ─── Plantillas ──────────────────────────────────────────────────────────────

class RacionPlantillaSerializer(serializers.ModelSerializer):
    grupo_nombre = serializers.CharField(source="grupo.nombre", read_only=True)
    kcal_racion = serializers.DecimalField(
        source="grupo.kcal_racion", max_digits=7, decimal_places=2, read_only=True
    )

    class Meta:
        model = RacionPlantilla
        fields = ["id", "grupo", "grupo_nombre", "kcal_racion", "cantidad", "tag"]
        read_only_fields = ["id"]


class TiempoComidaPlantillaSerializer(serializers.ModelSerializer):
    raciones = RacionPlantillaSerializer(many=True, read_only=True)

    class Meta:
        model = TiempoComidaPlantilla
        fields = ["id", "nombre", "hora", "orden", "raciones"]
        read_only_fields = ["id"]


class PlantillaAlimenticiaSerializer(serializers.ModelSerializer):
    tiempos_comida = TiempoComidaPlantillaSerializer(many=True, required=False)
    alimento_tags = AlimentoTagPlantillaSerializer(many=True, read_only=True)
    creado_por_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PlantillaAlimenticia
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "creado_por", "es_default"]

    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            u = obj.creado_por
            return f"{u.first_name} {u.last_name}".strip() or u.username
        return "Sistema"

    def create(self, validated_data):
        tiempos_data = validated_data.pop("tiempos_comida", [])
        plantilla = PlantillaAlimenticia.objects.create(**validated_data)
        for i, t in enumerate(tiempos_data):
            raciones_data = t.pop("raciones", [])
            t.setdefault("orden", i)
            tiempo = TiempoComidaPlantilla.objects.create(plantilla=plantilla, **t)
            for r in raciones_data:
                RacionPlantilla.objects.create(tiempo_comida=tiempo, **r)
        return plantilla

    def update(self, instance, validated_data):
        tiempos_data = validated_data.pop("tiempos_comida", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tiempos_data is not None:
            instance.tiempos_comida.all().delete()
            for i, t in enumerate(tiempos_data):
                raciones_data = t.pop("raciones", [])
                t.setdefault("orden", i)
                tiempo = TiempoComidaPlantilla.objects.create(plantilla=instance, **t)
                for r in raciones_data:
                    RacionPlantilla.objects.create(tiempo_comida=tiempo, **r)

        return instance
