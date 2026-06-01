from rest_framework import permissions, viewsets

from .models import Alimento, GrupoAlimento
from .serializers import AlimentoSerializer, GrupoAlimentoSerializer


class GrupoAlimentoViewSet(viewsets.ModelViewSet):
    queryset = GrupoAlimento.objects.prefetch_related("alimentos").all()
    serializer_class = GrupoAlimentoSerializer
    permission_classes = [permissions.IsAuthenticated]


class AlimentoViewSet(viewsets.ModelViewSet):
    queryset = Alimento.objects.select_related("grupo").filter(activo=True)
    serializer_class = AlimentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        grupo = self.request.query_params.get("grupo")
        if grupo:
            qs = qs.filter(grupo_id=grupo)
        return qs
