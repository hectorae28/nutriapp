from django.db import models


class Paciente(models.Model):
    SEXO_CHOICES = [("M", "Masculino"), ("F", "Femenino"), ("O", "Otro")]
    ESTADO_CIVIL_CHOICES = [
        ("S", "Soltero/a"),
        ("C", "Casado/a"),
        ("D", "Divorciado/a"),
        ("V", "Viudo/a"),
        ("U", "Unión libre"),
    ]

    user = models.OneToOneField(
        "users.User", on_delete=models.CASCADE, related_name="paciente"
    )
    cedula = models.CharField(max_length=20, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    lugar_nacimiento = models.CharField(max_length=100, blank=True)
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES, blank=True)
    estado_civil = models.CharField(
        max_length=1, choices=ESTADO_CIVIL_CHOICES, blank=True
    )
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.TextField(blank=True)
    religion = models.CharField(max_length=100, blank=True)
    grado_instruccion = models.CharField(max_length=100, blank=True)
    ocupacion = models.CharField(max_length=100, blank=True)
    referido_por = models.CharField(max_length=100, blank=True)
    historia_nro = models.CharField(max_length=50, blank=True)
    consultorio = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "paciente"
        verbose_name_plural = "pacientes"

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}"
