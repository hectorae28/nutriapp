import uuid
from django.conf import settings
from django.db import models


class DocumentoMedico(models.Model):
    TIPO_CHOICES = [
        ('receta', 'Récipe / Receta'),
        ('orden_laboratorio', 'Orden de Laboratorio'),
        ('orden_imagenologia', 'Orden de Imagenología'),
        ('constancia', 'Constancia Médica'),
    ]

    paciente = models.ForeignKey(
        'users.Paciente', on_delete=models.CASCADE, related_name='documentos'
    )
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    uuid_validacion = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    fecha_emision = models.DateField(auto_now_add=True)
    contenido = models.JSONField(
        help_text='Datos del documento: medicamentos, estudios, texto libre según tipo'
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='documentos_creados'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_tipo_display()} — {self.paciente} ({self.fecha_emision})"
