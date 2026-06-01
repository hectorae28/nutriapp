from rest_framework import serializers

from .models import (
    ConsumoCaloricoItem,
    EntradaRecordatorio,
    ExamenBioquimico,
    ExpedienteClinico,
    Notificacion,
    RecordatorioAlimentario,
    RegistroProgreso,
)


class ConsumoCaloricoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsumoCaloricoItem
        fields = "__all__"
        read_only_fields = ["id", "expediente"]


class ExpedienteClinicoSerializer(serializers.ModelSerializer):
    consumo_calorico = ConsumoCaloricoItemSerializer(many=True, required=False)

    class Meta:
        model = ExpedienteClinico
        fields = "__all__"
        read_only_fields = ["id", "updated_at"]

    def create(self, validated_data):
        consumo_calorico_data = validated_data.pop('consumo_calorico', [])
        expediente = ExpedienteClinico.objects.create(**validated_data)
        for item_data in consumo_calorico_data:
            ConsumoCaloricoItem.objects.create(expediente=expediente, **item_data)
        return expediente

    def update(self, instance, validated_data):
        consumo_calorico_data = validated_data.pop('consumo_calorico', [])

        # Update ExpedienteClinico fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle ConsumoCaloricoItem
        # Delete existing items not in the update list
        existing_items = instance.consumo_calorico.all()
        existing_item_ids = [item.id for item in existing_items]
        
        updated_item_ids = []
        for item_data in consumo_calorico_data:
            item_id = item_data.get('id', None)
            if item_id and item_id in existing_item_ids:
                # Update existing item
                item = ConsumoCaloricoItem.objects.get(id=item_id, expediente=instance)
                for attr, value in item_data.items():
                    setattr(item, attr, value)
                item.save()
                updated_item_ids.append(item_id)
            else:
                # Create new item
                ConsumoCaloricoItem.objects.create(expediente=instance, **item_data)
        
        # Delete items that were not in the updated list
        ConsumoCaloricoItem.objects.filter(expediente=instance, id__in=list(set(existing_item_ids) - set(updated_item_ids))).delete()
        
        return instance


class RegistroProgresoSerializer(serializers.ModelSerializer):
    imc = serializers.SerializerMethodField()
    imc_clasificacion = serializers.SerializerMethodField()

    class Meta:
        model = RegistroProgreso
        fields = "__all__"
        read_only_fields = ["id", "created_at", "creado_por"]

    def get_imc(self, obj):
        if obj.peso_kg and obj.talla_cm and obj.talla_cm > 0:
            talla_m = obj.talla_cm / 100
            imc = float(obj.peso_kg) / (float(talla_m) ** 2)
            return round(imc, 2)
        return None

    def get_imc_clasificacion(self, obj):
        imc = self.get_imc(obj)
        if imc is None:
            return None
        if imc < 18.5:
            return "Bajo peso"
        elif imc < 25:
            return "Normal"
        elif imc < 30:
            return "Sobrepeso"
        elif imc < 35:
            return "Obesidad I"
        elif imc < 40:
            return "Obesidad II"
        return "Obesidad III"

    def create(self, validated_data):
        validated_data["creado_por"] = self.context["request"].user
        return super().create(validated_data)


class ExamenBioquimicoSerializer(serializers.ModelSerializer):
    # Alias para compatibilidad con frontend
    glucosa_mg_dl = serializers.DecimalField(
        source="glucosa",
        max_digits=8, # Updated max_digits
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    hba1c = serializers.DecimalField(
        source="hemoglobina_glicosilada",
        max_digits=8, # Updated max_digits
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    colesterol_total = serializers.DecimalField(
        source="colesterol",
        max_digits=8, # Updated max_digits
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ExamenBioquimico
        fields = "__all__"
        read_only_fields = ["id"]


class EntradaRecordatorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntradaRecordatorio
        fields = "__all__"
        read_only_fields = ["id", "recordatorio"]


class RecordatorioAlimentarioSerializer(serializers.ModelSerializer):
    entradas = EntradaRecordatorioSerializer(many=True, required=False)

    class Meta:
        model = RecordatorioAlimentario
        fields = "__all__"
        read_only_fields = ["id", "created_at", "creado_por"]

    def create(self, validated_data):
        entradas_data = validated_data.pop('entradas', [])
        validated_data["creado_por"] = self.context["request"].user
        recordatorio = RecordatorioAlimentario.objects.create(**validated_data)
        for entrada_data in entradas_data:
            EntradaRecordatorio.objects.create(recordatorio=recordatorio, **entrada_data)
        return recordatorio

    def update(self, instance, validated_data):
        entradas_data = validated_data.pop('entradas', [])

        # Update RecordatorioAlimentario fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle EntradaRecordatorio
        # Delete existing items not in the update list
        existing_entradas = instance.entradas.all()
        existing_entrada_ids = [entrada.id for entrada in existing_entradas]
        
        updated_entrada_ids = []
        for entrada_data in entradas_data:
            entrada_id = entrada_data.get('id', None)
            if entrada_id and entrada_id in existing_entrada_ids:
                # Update existing entrada
                entrada = EntradaRecordatorio.objects.get(id=entrada_id, recordatorio=instance)
                for attr, value in entrada_data.items():
                    setattr(entrada, attr, value)
                entrada.save()
                updated_entrada_ids.append(entrada_id)
            else:
                # Create new entrada
                EntradaRecordatorio.objects.create(recordatorio=instance, **entrada_data)
        
        # Delete entradas that were not in the updated list
        EntradaRecordatorio.objects.filter(recordatorio=instance, id__in=list(set(existing_entrada_ids) - set(updated_entrada_ids))).delete()
        
        return instance


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = ["id", "tipo", "titulo", "mensaje", "leida", "paciente", "created_at"]
        read_only_fields = ["id", "created_at"]
