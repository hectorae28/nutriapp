from rest_framework import serializers

from .models import Alimento, GrupoAlimento


class AlimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alimento
        fields = "__all__"
        read_only_fields = ["id"]


class GrupoAlimentoSerializer(serializers.ModelSerializer):
    alimentos = AlimentoSerializer(many=True, read_only=True)

    class Meta:
        model = GrupoAlimento
        fields = "__all__"
        read_only_fields = ["id"]
