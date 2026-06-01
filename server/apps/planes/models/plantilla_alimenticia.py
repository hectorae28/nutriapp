from django.db import models


TIPO_DIETA_CHOICES = [
    ("hipocalorico", "Hipocalórico"),
    ("normocalorico", "Normocalórico"),
    ("hipercalorico", "Hipercalórico"),
    ("diabetico", "Diabético"),
    ("otro", "Otro"),
]


class PlantillaAlimenticia(models.Model):
    nombre = models.CharField(max_length=150)
    emoji = models.CharField(max_length=10, blank=True, default="📋")
    tipo_dieta = models.CharField(max_length=50, choices=TIPO_DIETA_CHOICES, default="normocalorico")
    kcal_objetivo = models.IntegerField(null=True, blank=True)
    descripcion = models.TextField(blank=True)

    # Macronutrientes
    pct_proteinas = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pct_grasas = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pct_carbohidratos = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Parámetros adicionales
    requerimiento_hidrico_ml = models.IntegerField(null=True, blank=True)
    fibra_g = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sodio_mg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    potasio_mg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    cho_simples_g = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Objetivos como texto JSON-like o lista separada por comas
    objetivos = models.JSONField(default=list, blank=True)

    activa = models.BooleanField(default=True)
    es_default = models.BooleanField(
        default=False,
        help_text="Plantillas del sistema que no se pueden eliminar"
    )

    creado_por = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="plantillas_creadas",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "plantilla alimenticia"
        verbose_name_plural = "plantillas alimenticias"
        ordering = ["es_default", "nombre"]

    def __str__(self):
        return self.nombre


class TiempoComidaPlantilla(models.Model):
    plantilla = models.ForeignKey(
        PlantillaAlimenticia,
        on_delete=models.CASCADE,
        related_name="tiempos_comida",
    )
    nombre = models.CharField(max_length=100)
    hora = models.TimeField(null=True, blank=True)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "tiempo de comida (plantilla)"
        verbose_name_plural = "tiempos de comida (plantilla)"
        ordering = ["orden"]

    def __str__(self):
        return f"{self.nombre} — {self.plantilla}"


class RacionPlantilla(models.Model):
    tiempo_comida = models.ForeignKey(
        TiempoComidaPlantilla,
        on_delete=models.CASCADE,
        related_name="raciones",
    )
    grupo = models.ForeignKey("catalogo.GrupoAlimento", on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=5, decimal_places=2, default=1)

    class Meta:
        verbose_name = "ración (plantilla)"
        verbose_name_plural = "raciones (plantilla)"
        unique_together = [["tiempo_comida", "grupo"]]

    def __str__(self):
        return f"{self.cantidad}x {self.grupo} en {self.tiempo_comida}"
