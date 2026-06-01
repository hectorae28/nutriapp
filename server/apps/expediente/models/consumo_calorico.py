from django.db import models

class ConsumoCaloricoItem(models.Model):
    GRUPO_CHOICES = [
        ('LECHE', 'Leche'),
        ('CARNES_A', 'Carnes Tipo A'),
        ('CARNES_B', 'Carnes Tipo B'),
        ('VEGETALES', 'Vegetales'),
        ('FRUTAS', 'Frutas'),
        ('ALMIDONES', 'Almidones'),
        ('GRASAS', 'Grasas'),
        ('AZUCAR', 'Azúcar'),
        ('SOPORTE', 'Soporte Nutricional'),
    ]
    expediente = models.ForeignKey(
        'expediente.ExpedienteClinico',
        on_delete=models.CASCADE,
        related_name='consumo_calorico'
    )
    grupo = models.CharField(max_length=20, choices=GRUPO_CHOICES)
    intercambios = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    proteinas_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    grasas_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    cho_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    kcal = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['orden']
        verbose_name = 'ítem consumo calórico'
        verbose_name_plural = 'ítems consumo calórico'

    def __str__(self):
        return f'{self.expediente.paciente.user.get_full_name()} - {self.grupo}'
