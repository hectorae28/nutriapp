from django.conf import settings
from django.db import models


class RecordatorioAlimentario(models.Model):
    paciente = models.ForeignKey(
        "users.Paciente", on_delete=models.CASCADE, related_name="recordatorios"
    )
    fecha = models.DateField()
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "recordatorio alimentario"
        verbose_name_plural = "recordatorios alimentarios"
        ordering = ["-fecha"]

    def __str__(self):
        return f"Recordatorio {self.paciente} — {self.fecha}"


class EntradaRecordatorio(models.Model):
    recordatorio = models.ForeignKey(
        RecordatorioAlimentario, on_delete=models.CASCADE, related_name="entradas"
    )
    nombre = models.CharField(max_length=100)
    hora = models.TimeField(null=True, blank=True)
    descripcion = models.TextField()
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "entrada de recordatorio"
        verbose_name_plural = "entradas de recordatorio"
        ordering = ["orden"]

    def __str__(self):
        return f"{self.nombre} ({self.recordatorio})"
