from django.conf import settings
from django.db import models


class RegistroProgreso(models.Model):
    paciente = models.ForeignKey(
        "users.Paciente", on_delete=models.CASCADE, related_name="registros_progreso"
    )
    fecha = models.DateField()
    peso_kg = models.DecimalField(max_digits=5, decimal_places=2)
    talla_cm = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    cintura_cm = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    cadera_cm = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    notas = models.TextField(blank=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "registro de progreso"
        verbose_name_plural = "registros de progreso"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.paciente} — {self.fecha}"
