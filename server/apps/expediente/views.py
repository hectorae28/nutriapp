from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.planes.models import PlanAlimenticio
from apps.users.models import Paciente
from apps.users.permissions import IsNutricionista, IsNutricionistaOrPaciente

from .models import (
    ExamenBioquimico,
    ExpedienteClinico,
    Notificacion,
    RecordatorioAlimentario,
    RegistroProgreso,
)
from .serializers import (
    ExamenBioquimicoSerializer,
    ExpedienteClinicoSerializer,
    NotificacionSerializer,
    RecordatorioAlimentarioSerializer,
    RegistroProgresoSerializer,
)


class ExpedienteClinicoViewSet(viewsets.ModelViewSet):
    serializer_class = ExpedienteClinicoSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get_queryset(self):
        user = self.request.user
        qs = ExpedienteClinico.objects.select_related("paciente__user")

        # Superusuario o Nutricionista: acceso completo con filtro opcional por paciente
        if user.is_superuser or user.groups.filter(name="Nutricionista").exists():
            paciente_id = self.request.query_params.get("paciente")
            if paciente_id:
                qs = qs.filter(paciente_id=paciente_id)
            return qs

        # Paciente solo ve su propio expediente
        try:
            return qs.filter(paciente__user=user)
        except Exception:
            return ExpedienteClinico.objects.none()

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsNutricionista()]
        return super().get_permissions()


class RegistroProgresoViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroProgresoSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get_queryset(self):
        user = self.request.user
        qs = RegistroProgreso.objects.select_related("paciente__user").all()
        # Solo pacientes ven únicamente su propio registro
        if not user.is_superuser and not user.groups.filter(name="Nutricionista").exists():
            qs = qs.filter(paciente__user=user)
        paciente_id = self.request.query_params.get("paciente")
        if paciente_id:
            qs = qs.filter(paciente_id=paciente_id)
        return qs.order_by("-fecha")


class ExamenBioquimicoViewSet(viewsets.ModelViewSet):
    serializer_class = ExamenBioquimicoSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get_queryset(self):
        user = self.request.user
        qs = ExamenBioquimico.objects.select_related("paciente__user").all()
        if not user.is_superuser and not user.groups.filter(name="Nutricionista").exists():
            qs = qs.filter(paciente__user=user)
        paciente_id = self.request.query_params.get("paciente")
        if paciente_id:
            qs = qs.filter(paciente_id=paciente_id)
        return qs.order_by("-fecha")

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsNutricionista()]
        return super().get_permissions()


class RecordatorioAlimentarioViewSet(viewsets.ModelViewSet):
    serializer_class = RecordatorioAlimentarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get_queryset(self):
        user = self.request.user
        qs = RecordatorioAlimentario.objects.prefetch_related(
            "entradas"
        ).select_related("paciente__user")
        if not user.is_superuser and not user.groups.filter(name="Nutricionista").exists():
            qs = qs.filter(paciente__user=user)
        paciente_id = self.request.query_params.get("paciente")
        if paciente_id:
            qs = qs.filter(paciente_id=paciente_id)
        return qs.order_by("-fecha")


def generar_alertas_nutricionista(user):
    """Genera alertas automáticas para nutricionistas"""
    if not user.groups.filter(name="Nutricionista").exists():
        return

    # Obtener pacientes activos
    pacientes = Paciente.objects.all()
    ahora = timezone.now()

    for paciente in pacientes:
        # 1. Sin progreso (>14 días)
        ultimo_registro = RegistroProgreso.objects.filter(paciente=paciente).first()
        if ultimo_registro:
            dias_sin_registro = (ahora.date() - ultimo_registro.fecha).days
            if dias_sin_registro > 14:
                # Verificar si ya existe una notificación no leída del mismo tipo para este paciente
                existe = Notificacion.objects.filter(
                    destinatario=user,
                    tipo="sin_progreso",
                    paciente=paciente,
                    leida=False,
                ).exists()

                if not existe:
                    Notificacion.objects.create(
                        destinatario=user,
                        tipo="sin_progreso",
                        titulo="Paciente sin progreso",
                        mensaje=f"{paciente} lleva {dias_sin_registro} días sin registrar su peso",
                        paciente=paciente,
                    )

        # 2. Sin plan activo
        tiene_plan_activo = PlanAlimenticio.objects.filter(
            paciente=paciente, activo=True
        ).exists()

        if not tiene_plan_activo:
            existe = Notificacion.objects.filter(
                destinatario=user, tipo="sin_plan", paciente=paciente, leida=False
            ).exists()

            if not existe:
                Notificacion.objects.create(
                    destinatario=user,
                    tipo="sin_plan",
                    titulo="Sin plan activo",
                    mensaje=f"{paciente} no tiene un plan alimenticio activo",
                    paciente=paciente,
                )

        # 3. Sin examen en 3 meses
        ultimo_examen = ExamenBioquimico.objects.filter(paciente=paciente).first()
        if ultimo_examen:
            dias_sin_examen = (ahora.date() - ultimo_examen.fecha).days
            if dias_sin_examen > 90:
                existe = Notificacion.objects.filter(
                    destinatario=user,
                    tipo="examen_pendiente",
                    paciente=paciente,
                    leida=False,
                ).exists()

                if not existe:
                    Notificacion.objects.create(
                        destinatario=user,
                        tipo="examen_pendiente",
                        titulo="Examen bioquímico pendiente",
                        mensaje=f"{paciente} no tiene examen bioquímico en los últimos 3 meses",
                        paciente=paciente,
                    )
        elif RegistroProgreso.objects.filter(paciente=paciente).exists():
            # Si tiene registros pero nunca tuvo examen
            existe = Notificacion.objects.filter(
                destinatario=user,
                tipo="examen_pendiente",
                paciente=paciente,
                leida=False,
            ).exists()

            if not existe:
                Notificacion.objects.create(
                    destinatario=user,
                    tipo="examen_pendiente",
                    titulo="Examen bioquímico pendiente",
                    mensaje=f"{paciente} no tiene exámenes bioquímicos registrados",
                    paciente=paciente,
                )


def generar_alertas_paciente(user):
    """Genera alertas automáticas para pacientes"""
    if not user.groups.filter(name="Paciente").exists():
        return

    try:
        paciente = user.paciente
    except:
        return

    # Sin progreso en 7 días
    ultimo_registro = RegistroProgreso.objects.filter(paciente=paciente).first()
    ahora = timezone.now()

    if ultimo_registro:
        dias_sin_registro = (ahora.date() - ultimo_registro.fecha).days
        if dias_sin_registro > 7:
            existe = Notificacion.objects.filter(
                destinatario=user, tipo="sin_progreso", leida=False
            ).exists()

            if not existe:
                Notificacion.objects.create(
                    destinatario=user,
                    tipo="sin_progreso",
                    titulo="Registra tu progreso",
                    mensaje="Recuerda registrar tu peso esta semana",
                    paciente=paciente,
                )
    else:
        # No tiene ningún registro
        existe = Notificacion.objects.filter(
            destinatario=user, tipo="sin_progreso", leida=False
        ).exists()

        if not existe:
            Notificacion.objects.create(
                destinatario=user,
                tipo="sin_progreso",
                titulo="Registra tu progreso",
                mensaje="Recuerda registrar tu peso esta semana",
                paciente=paciente,
            )


class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notificacion.objects.filter(destinatario=user).select_related(
            "paciente__user"
        )

    def list(self, request, *args, **kwargs):
        # Generar alertas automáticas antes de listar
        if request.user.groups.filter(name="Nutricionista").exists():
            generar_alertas_nutricionista(request.user)
        elif request.user.groups.filter(name="Paciente").exists():
            generar_alertas_paciente(request.user)

        # Filtrar solo no leídas si se solicita
        queryset = self.get_queryset()
        no_leidas = request.query_params.get("no_leidas", "").lower() == "true"

        if no_leidas:
            queryset = queryset.filter(leida=False)

        serializer = self.get_serializer(queryset, many=True)
        total_no_leidas = self.get_queryset().filter(leida=False).count()

        return Response(
            {"total_no_leidas": total_no_leidas, "notificaciones": serializer.data}
        )

    @action(detail=True, methods=["patch"])
    def leer(self, request, pk=None):
        """Marca una notificación como leída"""
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save()
        serializer = self.get_serializer(notificacion)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def marcar_todas_leidas(self, request):
        """Marca todas las notificaciones del usuario como leídas"""
        updated = Notificacion.objects.filter(
            destinatario=request.user, leida=False
        ).update(leida=True)

        return Response(
            {
                "mensaje": f"{updated} notificaciones marcadas como leídas",
                "actualizadas": updated,
            }
        )
