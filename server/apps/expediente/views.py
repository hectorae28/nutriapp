from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.planes.models import PlanAlimenticio
from apps.users.models import Paciente
from apps.users.permissions import IsNutricionista, IsNutricionistaOrPaciente, IsNutricionistaOrPacienteOrSecretario

from .models import (
    DocumentoMedico,
    ExamenBioquimico,
    ExpedienteClinico,
    RecordatorioAlimentario,
    RegistroProgreso,
)
from .serializers import (
    DocumentoMedicoSerializer,
    ExamenBioquimicoSerializer,
    ExpedienteClinicoSerializer,
    RecordatorioAlimentarioSerializer,
    RegistroProgresoSerializer,
)
from .pdf_generator import generar_pdf_documento


class ExpedienteClinicoViewSet(viewsets.ModelViewSet):
    serializer_class = ExpedienteClinicoSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPacienteOrSecretario]

    def get_queryset(self):
        user = self.request.user
        qs = ExpedienteClinico.objects.select_related("paciente__user")

        # Superusuario, Nutricionista o Secretario: acceso completo con filtro opcional por paciente
        if user.is_superuser or user.groups.filter(name__in=["Nutricionista", "Secretario"]).exists():
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


class DocumentoMedicoViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentoMedicoSerializer
    permission_classes = [permissions.IsAuthenticated, IsNutricionistaOrPaciente]

    def get_queryset(self):
        user = self.request.user
        qs = DocumentoMedico.objects.select_related('paciente__user', 'creado_por')
        if not user.is_superuser and not user.groups.filter(name='Nutricionista').exists():
            qs = qs.filter(paciente__user=user)
        paciente_id = self.request.query_params.get('paciente')
        if paciente_id:
            qs = qs.filter(paciente_id=paciente_id)
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsNutricionista()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        documento = serializer.save(creado_por=request.user)
        # Generar PDF y retornarlo directamente
        pdf_bytes = generar_pdf_documento(documento)
        tipo_safe = documento.tipo.replace('_', '-')
        paciente_safe = (documento.paciente.user.get_full_name() or 'paciente').replace(' ', '_')
        filename = f"{tipo_safe}_{paciente_safe}_{documento.fecha_emision}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['X-Documento-Id'] = str(documento.id)
        response['X-Documento-UUID'] = str(documento.uuid_validacion)
        return response

    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        documento = self.get_object()
        pdf_bytes = generar_pdf_documento(documento)
        filename = f"{documento.tipo}_{documento.paciente}_{documento.fecha_emision}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'], url_path='verificar/(?P<uuid>[^/.]+)',
            permission_classes=[permissions.AllowAny])
    def verificar(self, request, uuid=None):
        try:
            doc = DocumentoMedico.objects.select_related(
                'paciente__user', 'creado_por'
            ).get(uuid_validacion=uuid)
            return Response({
                'valido': True,
                'tipo': doc.get_tipo_display(),
                'paciente': doc.paciente.user.get_full_name(),
                'fecha_emision': doc.fecha_emision,
                'emitido_por': doc.creado_por.get_full_name() if doc.creado_por else 'Dr. Domingo Porras',
            })
        except (DocumentoMedico.DoesNotExist, Exception):
            return Response({'valido': False, 'mensaje': 'Documento no encontrado o UUID inválido.'}, status=404)
