from django.urls import path
from . import auth_views
from .views import PacienteExcelImportView

urlpatterns = [
    path("auth/csrf/", auth_views.csrf_view),
    path("auth/login/", auth_views.login_view),
    path("auth/logout/", auth_views.logout_view),
    path("auth/me/", auth_views.me_view),
    path("pacientes/importar-excel/", PacienteExcelImportView.as_view(), name="paciente-importar-excel"),
]
