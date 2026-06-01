from django.contrib import admin

from .models import PlanAlimenticio, RacionPlan, TiempoComida

admin.site.register(PlanAlimenticio)
admin.site.register(TiempoComida)
admin.site.register(RacionPlan)
