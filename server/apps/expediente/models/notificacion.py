from django.conf import settings
from django.db import models


class Notificacion(models.Model):
    TIPOS = [
        ("sin_progreso", "Sin registro de progreso"),
        ("sin_plan", "Sin plan activo"),
        ("examen_pendiente", "Examen bioquímico pendiente"),
        ("peso_objetivo", "Cerca del peso objetivo"),
        ("nuevo_paciente", "Nuevo paciente"),
        ("sistema", "Mensaje del sistema"),
    ]

    destinatario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notificaciones",
    )
    tipo = models.CharField(max_length=30, choices=TIPOS)
    titulo = models.CharField(max_length=150)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    paciente = models.ForeignKey(
        "users.Paciente", on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "notificación"
        verbose_name_plural = "notificaciones"

    def __str__(self):
        return f"{self.tipo} para {self.destinatario.username}"
