from django.db import models


class PlanAlimenticio(models.Model):
    paciente = models.ForeignKey(
        "users.Paciente", on_delete=models.CASCADE, related_name="planes"
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    notas = models.TextField(blank=True)
    # Tratamiento nutricional
    tipo_dieta = models.CharField(max_length=200, blank=True)
    kcal_objetivo = models.IntegerField(null=True, blank=True)
    pct_proteinas = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    pct_grasas = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    pct_carbohidratos = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    requerimiento_hidrico_ml = models.IntegerField(null=True, blank=True)
    fibra_g = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sodio_mg = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    potasio_mg = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    cho_simples_g = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    cloro_sodio_mg = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    suplemento_complemento = models.TextField(blank=True)
    trat_otros = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "plan alimenticio"
        verbose_name_plural = "planes alimenticios"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Plan {self.paciente} desde {self.fecha_inicio}"

    def save(self, *args, **kwargs):
        if self.activo:
            PlanAlimenticio.objects.filter(paciente=self.paciente, activo=True).exclude(
                pk=self.pk
            ).update(activo=False)
        super().save(*args, **kwargs)
