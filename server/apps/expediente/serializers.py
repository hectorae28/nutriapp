from rest_framework import serializers

from .models import (
    ConsumoCaloricoItem,
    DocumentoMedico,
    EntradaRecordatorio,
    ExamenBioquimico,
    ExpedienteClinico,
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

    # ── Totales calculados del Consumo Calórico ──────────────────────────────
    total_kcal_dia = serializers.SerializerMethodField()
    total_proteinas_g_dia = serializers.SerializerMethodField()
    total_grasas_g_dia = serializers.SerializerMethodField()
    total_cho_g_dia = serializers.SerializerMethodField()

    # ── g/kg-p/día (usando peso_usual_kg como referencia clínica) ────────────
    proteinas_g_kg_dia = serializers.SerializerMethodField()
    grasas_g_kg_dia = serializers.SerializerMethodField()
    cho_g_kg_dia = serializers.SerializerMethodField()

    # ── % Peso Ideal y % Peso Pre-Quirúrgico (del peso usual como referencia) ─
    pct_peso_ideal = serializers.SerializerMethodField()
    pct_peso_prequirurgico = serializers.SerializerMethodField()

    class Meta:
        model = ExpedienteClinico
        fields = "__all__"
        read_only_fields = ["id", "updated_at"]

    # ── Helpers ──────────────────────────────────────────────────────────────
    def _peso_referencia(self, obj):
        """Retorna el peso de referencia: peso_usual si existe, sino peso_ideal."""
        if obj.peso_usual_kg and obj.peso_usual_kg > 0:
            return float(obj.peso_usual_kg)
        if obj.peso_ideal_kg and obj.peso_ideal_kg > 0:
            return float(obj.peso_ideal_kg)
        return None

    def _totales_consumo(self, obj):
        """Retorna dict con totales (proteinas_g, grasas_g, cho_g, kcal) del consumo calórico."""
        totales = {'proteinas_g': 0.0, 'grasas_g': 0.0, 'cho_g': 0.0, 'kcal': 0.0}
        for item in obj.consumo_calorico.all():
            totales['proteinas_g'] += float(item.proteinas_g or 0)
            totales['grasas_g'] += float(item.grasas_g or 0)
            totales['cho_g'] += float(item.cho_g or 0)
            totales['kcal'] += float(item.kcal or 0)
        return totales

    # ── Totales Consumo Calórico ─────────────────────────────────────────────
    def get_total_kcal_dia(self, obj):
        return round(self._totales_consumo(obj)['kcal'], 2)

    def get_total_proteinas_g_dia(self, obj):
        return round(self._totales_consumo(obj)['proteinas_g'], 2)

    def get_total_grasas_g_dia(self, obj):
        return round(self._totales_consumo(obj)['grasas_g'], 2)

    def get_total_cho_g_dia(self, obj):
        return round(self._totales_consumo(obj)['cho_g'], 2)

    # ── g/kg-p/día ───────────────────────────────────────────────────────────
    def get_proteinas_g_kg_dia(self, obj):
        peso = self._peso_referencia(obj)
        if not peso:
            return None
        return round(self._totales_consumo(obj)['proteinas_g'] / peso, 2)

    def get_grasas_g_kg_dia(self, obj):
        peso = self._peso_referencia(obj)
        if not peso:
            return None
        return round(self._totales_consumo(obj)['grasas_g'] / peso, 2)

    def get_cho_g_kg_dia(self, obj):
        peso = self._peso_referencia(obj)
        if not peso:
            return None
        return round(self._totales_consumo(obj)['cho_g'] / peso, 2)

    # ── % Peso Ideal y % Peso Pre-Quirúrgico ─────────────────────────────────
    def get_pct_peso_ideal(self, obj):
        """% del Peso Ideal respecto al peso usual actual (P.Usual / P.Ideal × 100)."""
        try:
            if obj.peso_usual_kg and obj.peso_ideal_kg and float(obj.peso_ideal_kg) > 0:
                return round(float(obj.peso_usual_kg) / float(obj.peso_ideal_kg) * 100, 2)
        except Exception:
            pass
        return None

    def get_pct_peso_prequirurgico(self, obj):
        """% del Peso Pre-Quirúrgico respecto al peso usual (P.P-PQx / P.Usual × 100)."""
        try:
            if obj.peso_prequirurgico_kg and obj.peso_usual_kg and float(obj.peso_usual_kg) > 0:
                return round(float(obj.peso_prequirurgico_kg) / float(obj.peso_usual_kg) * 100, 2)
        except Exception:
            pass
        return None

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

    # ── Campos calculados: %PP, %PI, %PU ─────────────────────────────────────
    # %PP  = (P.Usual - P.Actual) / P.Usual × 100  → pérdida de peso
    # %PI  = P.Actual / P.Ideal × 100               → adecuación al peso ideal
    # %PU  = P.Actual / P.Usual × 100               → adecuación al peso usual
    pct_pp = serializers.SerializerMethodField()
    pct_pi = serializers.SerializerMethodField()
    pct_pu = serializers.SerializerMethodField()

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

    def _get_expediente(self, obj):
        try:
            return obj.paciente.expediente
        except Exception:
            return None

    def get_pct_pp(self, obj):
        """% Pérdida de Peso = (P.Usual - P.Actual) / P.Usual × 100"""
        exp = self._get_expediente(obj)
        if exp and exp.peso_usual_kg and obj.peso_kg and float(exp.peso_usual_kg) > 0:
            return round(
                (float(exp.peso_usual_kg) - float(obj.peso_kg)) / float(exp.peso_usual_kg) * 100, 2
            )
        return None

    def get_pct_pi(self, obj):
        """%Peso Ideal = P.Actual / P.Ideal × 100"""
        exp = self._get_expediente(obj)
        if exp and exp.peso_ideal_kg and obj.peso_kg and float(exp.peso_ideal_kg) > 0:
            return round(float(obj.peso_kg) / float(exp.peso_ideal_kg) * 100, 2)
        return None

    def get_pct_pu(self, obj):
        """%Peso Usual = P.Actual / P.Usual × 100"""
        exp = self._get_expediente(obj)
        if exp and exp.peso_usual_kg and obj.peso_kg and float(exp.peso_usual_kg) > 0:
            return round(float(obj.peso_kg) / float(exp.peso_usual_kg) * 100, 2)
        return None

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
        # Asignar creado_por solo si existe request en context
        if 'request' in self.context and hasattr(self.context['request'], 'user'):
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


class DocumentoMedicoSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = DocumentoMedico
        fields = ['id', 'paciente', 'paciente_nombre', 'tipo', 'tipo_display',
                  'uuid_validacion', 'fecha_emision', 'contenido', 'created_at']
        read_only_fields = ['uuid_validacion', 'fecha_emision', 'created_at']

    def get_paciente_nombre(self, obj):
        return obj.paciente.user.get_full_name() or obj.paciente.user.username
