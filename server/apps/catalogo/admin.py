from django.contrib import admin

from .models import Alimento, GrupoAlimento

admin.site.register(GrupoAlimento)
admin.site.register(Alimento)
