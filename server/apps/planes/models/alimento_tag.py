from django.db import models

TAG_CHOICES = [
    ("evitar", "Evitar consumo"),
    ("ocasional", "Consumo ocasional"),
    ("incrementar", "Incrementar consumo"),
]


class AlimentoTagPlan(models.Model):
    """Etiqueta sobre un alimento específico dentro de un plan alimenticio."""
    plan = models.ForeignKey(
        "planes.PlanAlimenticio",
        on_delete=models.CASCADE,
        related_name="alimento_tags",
    )
    alimento = models.ForeignKey(
        "catalogo.Alimento",
        on_delete=models.CASCADE,
        related_name="+",
    )
    tag = models.CharField(max_length=20, choices=TAG_CHOICES)
    nota = models.CharField(max_length=300, blank=True, default="")

    class Meta:
        verbose_name = "etiqueta de alimento (plan)"
        verbose_name_plural = "etiquetas de alimentos (plan)"
        unique_together = [["plan", "alimento"]]
        ordering = ["tag", "alimento__nombre"]

    def __str__(self):
        return f"{self.get_tag_display()} — {self.alimento} ({self.plan})"
