from django.db import models


class ConfiguracionSistema(models.Model):
    """Almacena variables de configuración del sistema en BD."""
    clave = models.CharField(max_length=100, unique=True)
    valor = models.CharField(max_length=500)
    descripcion = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "configuración del sistema"
        verbose_name_plural = "configuraciones del sistema"
        ordering = ['clave']
    
    def __str__(self):
        return f"{self.clave} = {self.valor}"
    
    @classmethod
    def get(cls, clave, default=None):
        """Obtiene el valor de una clave, o default si no existe."""
        try:
            return cls.objects.get(clave=clave).valor
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set(cls, clave, valor, descripcion=''):
        """Establece o actualiza una clave."""
        obj, created = cls.objects.update_or_create(
            clave=clave,
            defaults={'valor': valor, 'descripcion': descripcion}
        )
        return obj
