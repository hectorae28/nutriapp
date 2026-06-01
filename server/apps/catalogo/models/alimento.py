from django.db import models

from .grupo_alimento import GrupoAlimento


class Alimento(models.Model):
    grupo = models.ForeignKey(
        GrupoAlimento, on_delete=models.CASCADE, related_name="alimentos"
    )
    nombre = models.CharField(max_length=150)
    porcion_g = models.DecimalField(max_digits=7, decimal_places=2)
    unidad = models.CharField(max_length=50)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "alimento"
        verbose_name_plural = "alimentos"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.grupo})"
