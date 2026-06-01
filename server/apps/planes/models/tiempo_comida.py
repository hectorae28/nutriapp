from django.db import models

from .plan_alimenticio import PlanAlimenticio


class TiempoComida(models.Model):
    plan = models.ForeignKey(
        PlanAlimenticio, on_delete=models.CASCADE, related_name="tiempos_comida"
    )
    nombre = models.CharField(max_length=100)
    hora = models.TimeField(null=True, blank=True)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "tiempo de comida"
        verbose_name_plural = "tiempos de comida"
        ordering = ["orden"]

    def __str__(self):
        return f"{self.nombre} ({self.plan})"
