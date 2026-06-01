from django.db import models


class GrupoAlimento(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    kcal_racion = models.DecimalField(max_digits=7, decimal_places=2)
    proteina_g = models.DecimalField(max_digits=6, decimal_places=2)
    carb_g = models.DecimalField(max_digits=6, decimal_places=2)
    grasa_g = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        verbose_name = "grupo de alimento"
        verbose_name_plural = "grupos de alimentos"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre
