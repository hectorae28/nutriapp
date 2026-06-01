from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, Http404
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.catalogo.views import AlimentoViewSet, GrupoAlimentoViewSet
from apps.expediente import views_reportes
from apps.expediente.views import (
    ExamenBioquimicoViewSet,
    ExpedienteClinicoViewSet,
    NotificacionViewSet,
    RecordatorioAlimentarioViewSet,
    RegistroProgresoViewSet,
)
from apps.planes.views import (
    AlimentoTagPlanViewSet,
    AlimentoTagPlantillaViewSet,
    PlanAlimenticioViewSet,
    PlantillaAlimenticiaViewSet,
    RacionPlanViewSet,
    RacionPlantillaViewSet,
    TiempoComidaViewSet,
    TiempoComidaPlantillaViewSet,
    calcular_requerimientos,
)
from apps.users.auth_views import (
    csrf_view,
    login_view,
    logout_view,
    me_view,
    register_paciente_view,
)
from apps.users.views import PacienteViewSet, PacienteExcelImportView, PacienteExcelExportView

router = DefaultRouter()
# users
router.register(r"pacientes", PacienteViewSet, basename="paciente")
# catalogo
router.register(r"grupos-alimento", GrupoAlimentoViewSet, basename="grupo-alimento")
router.register(r"alimentos", AlimentoViewSet, basename="alimento")
# expediente
router.register(r"expedientes", ExpedienteClinicoViewSet, basename="expediente")
router.register(
    r"registros-progreso", RegistroProgresoViewSet, basename="registro-progreso"
)
router.register(
    r"examenes-bioquimicos", ExamenBioquimicoViewSet, basename="examen-bioquimico"
)
router.register(
    r"recordatorios", RecordatorioAlimentarioViewSet, basename="recordatorio"
)
router.register(r"notificaciones", NotificacionViewSet, basename="notificacion")
# planes
router.register(r"planes", PlanAlimenticioViewSet, basename="plan")
router.register(r"tiempos-comida", TiempoComidaViewSet, basename="tiempo-comida")
router.register(r"raciones", RacionPlanViewSet, basename="racion")
# alias for E2E tests
router.register(r"raciones-plan", RacionPlanViewSet, basename="racion-plan")
# plantillas
router.register(r"plantillas-alimenticias", PlantillaAlimenticiaViewSet, basename="plantilla-alimenticia")
router.register(r"tiempos-comida-plantilla", TiempoComidaPlantillaViewSet, basename="tiempo-comida-plantilla")
router.register(r"raciones-plantilla", RacionPlantillaViewSet, basename="racion-plantilla")
router.register(r"alimento-tags-plan", AlimentoTagPlanViewSet, basename="alimento-tag-plan")
router.register(r"alimento-tags-plantilla", AlimentoTagPlantillaViewSet, basename="alimento-tag-plantilla")


def serve_react(request, path=""):
    import logging
    from pathlib import Path

    logger = logging.getLogger(__name__)

    candidates = [
        Path("/client/dist/index.html"),
        settings.BASE_DIR.parent / "client" / "dist" / "index.html",
    ]

    logger.debug(f"serve_react: Trying to serve path '{path}'")
    logger.debug(f"BASE_DIR: {settings.BASE_DIR}")

    for index in candidates:
        logger.debug(f"Checking candidate: {index} (exists: {index.exists()})")
        if index.exists():
            logger.debug(f"Found index at: {index}")
            return FileResponse(open(index, "rb"), content_type="text/html")

    logger.error(f"Frontend build not found. Candidates: {candidates}")
    raise Http404("Frontend build not found.")


urlpatterns = [
    path("admin/", admin.site.urls),
    # auth — antes del include para evitar conflicto de orden
    path("api/auth/csrf/", csrf_view),
    path("api/auth/login/", login_view),
    path("api/auth/logout/", logout_view),
    path("api/auth/me/", me_view),
    path("api/auth/register-paciente/", register_paciente_view),
    # planes
    path("api/calcular-requerimientos/", calcular_requerimientos),
    # importación / exportación Excel
    path("api/pacientes/importar-excel/", PacienteExcelImportView.as_view(), name="importar-excel"),
    path("api/pacientes/<int:paciente_id>/exportar-excel/", PacienteExcelExportView.as_view(), name="exportar-excel"),
    # reportes
    path("api/metricas-nutricionista/", views_reportes.metricas_nutricionista),
    path("api/reporte-paciente/<int:paciente_id>/", views_reportes.reporte_paciente),
    path("api/adherencia/", views_reportes.adherencia_plan),
    path("api/comparativa-pacientes/", views_reportes.comparativa_pacientes),
    # API router
    path("api/", include(router.urls)),
    # SPA fallback
    path("", serve_react),
    path("<path:path>", serve_react),
]
