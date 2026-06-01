from django.db import models

from .tiempo_comida import TiempoComida


class RacionPlan(models.Model):
    tiempo_comida = models.ForeignKey(
        TiempoComida, on_delete=models.CASCADE, related_name="raciones"
    )
    grupo = models.ForeignKey("catalogo.GrupoAlimento", on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        verbose_name = "ración del plan"
        verbose_name_plural = "raciones del plan"
        unique_together = [["tiempo_comida", "grupo"]]

    def __str__(self):
        return f"{self.cantidad} ración(es) de {self.grupo} en {self.tiempo_comida}"
