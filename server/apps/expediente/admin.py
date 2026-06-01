from django.contrib import admin

from .models import (
    EntradaRecordatorio,
    ExamenBioquimico,
    ExpedienteClinico,
    Notificacion,
    RecordatorioAlimentario,
    RegistroProgreso,
)

admin.site.register(ExpedienteClinico)
admin.site.register(RegistroProgreso)
admin.site.register(ExamenBioquimico)
admin.site.register(RecordatorioAlimentario)
admin.site.register(EntradaRecordatorio)
admin.site.register(Notificacion)
