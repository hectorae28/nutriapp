from django.db import models


class ExpedienteClinico(models.Model):
    ESTRENIMIENTO_CHOICES = [
        ("NO", "No"),
        ("LEVE", "Leve"),
        ("MODERADO", "Moderado"),
        ("CRONICO", "Crónico"),
    ]
    APETITO_CHOICES = [
        ("NORMAL", "Normal"),
        ("AUMENTADO", "Aumentado"),
        ("DISMINUIDO", "Disminuido"),
    ]

    paciente = models.OneToOneField(
        "users.Paciente", on_delete=models.CASCADE, related_name="expediente"
    )
    motivo_consulta = models.TextField(blank=True)
    # Antecedentes
    ant_personales = models.TextField(blank=True)
    ant_familiares = models.TextField(blank=True)
    menarquia_anos = models.PositiveSmallIntegerField(null=True, blank=True)
    fecha_ultima_menstruacion = models.DateField(null=True, blank=True)
    num_embarazos = models.PositiveSmallIntegerField(null=True, blank=True)
    edad_ultimo_embarazo = models.PositiveSmallIntegerField(null=True, blank=True)
    # Hábitos psicobiológicos
    cafeinicos_v_dia = models.PositiveSmallIntegerField(null=True, blank=True)
    alcohol = models.CharField(max_length=50, null=True, blank=True)
    tabaquicos_und_dia = models.PositiveSmallIntegerField(null=True, blank=True)
    sueno_hr_dia = models.DecimalField(
        max_digits=4, decimal_places=1, null=True, blank=True
    )
    apetito = models.CharField(
        max_length=10, choices=APETITO_CHOICES, null=True, blank=True
    )
    micciones_v_dia = models.CharField(max_length=20, null=True, blank=True)
    evacuaciones_v_dia = models.PositiveSmallIntegerField(null=True, blank=True)
    actividad_fisica = models.TextField(blank=True)
    # Trastornos gastrointestinales
    tg_dispepsia = models.BooleanField(default=False)
    tg_dispepsia_causa = models.CharField(max_length=255, blank=True, default='')
    tg_distension = models.BooleanField(default=False)
    tg_distension_causa = models.CharField(max_length=255, blank=True, default='')
    tg_aerofagia = models.BooleanField(default=False)
    tg_aerofagia_causa = models.CharField(max_length=255, blank=True, default='')
    tg_flatulencia = models.CharField(max_length=100, blank=True)
    tg_meteorismo = models.BooleanField(default=False)
    tg_meteorismo_causa = models.CharField(max_length=255, blank=True, default='')
    tg_diarrea = models.BooleanField(default=False)
    tg_diarrea_causa = models.CharField(max_length=255, blank=True, default='')
    tg_nauseas = models.BooleanField(default=False)
    tg_nauseas_causa = models.CharField(max_length=255, blank=True, default='')
    tg_vomitos = models.BooleanField(default=False)
    tg_vomitos_causa = models.CharField(max_length=255, blank=True, default='')
    tg_rgef = models.BooleanField(default=False)
    tg_rgef_causa = models.CharField(max_length=255, blank=True, default='')
    estrenimiento = models.CharField(
        max_length=10, choices=ESTRENIMIENTO_CHOICES, null=True, blank=True
    )
    # Alergias
    alergias_alimentarias = models.TextField(blank=True)
    # Tratamientos
    trat_farmacologico = models.TextField(blank=True)
    trat_suplemento_oral = models.TextField(blank=True)
    trat_otros = models.TextField(blank=True)
    # Pesos referenciales
    # max_digits=7, decimal_places=2 → permite hasta 99999.99 kg
    # (evita errores con valores del Excel que traen ceros extra como 83.0000)
    peso_maximo_kg = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    peso_minimo_kg = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    peso_usual_kg = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    peso_ideal_kg = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    peso_deseado_kg = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    circunferencia_muneca_cm = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    peso_prequirurgico_kg = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    contextura = models.CharField(max_length=50, null=True, blank=True)
    observaciones_calorias = models.TextField(blank=True)
    # Diagnóstico
    diagnostico_nutricional = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "expediente clínico"
        verbose_name_plural = "expedientes clínicos"

    def __str__(self):
        return f"Expediente de {self.paciente}"
