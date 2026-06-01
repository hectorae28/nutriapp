from django.db import models


class ExamenBioquimico(models.Model):
    paciente = models.ForeignKey(
        "users.Paciente", on_delete=models.CASCADE, related_name="examenes_bioquimicos"
    )
    fecha = models.DateField()
    # Proteínas
    proteinas_totales = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    albumina = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    globulina = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    # Renal
    urea = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    creatinina = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    acido_urico = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    # Lípidos
    colesterol = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    hdl = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    ldl = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    vldl = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    trigliceridos = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    # Glucosa / Insulina
    glucosa = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    glucosa_postprandial = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    insulina = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    insulina_postprandial = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    hemoglobina_glicosilada = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    # Hepáticos
    tgo = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    tgp = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    bilirrubina_total = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    bilirrubina_directa = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    bilirrubina_indirecta = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    # Hematología
    hemoglobina = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    hematocrito = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    # Tiroides
    t3 = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    t4 = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    tsh = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    # Minerales
    hierro = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    vitamina_b12 = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    sodio = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    potasio = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    cloro = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    calcio = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = "examen bioquímico"
        verbose_name_plural = "exámenes bioquímicos"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.paciente} — {self.fecha}"
