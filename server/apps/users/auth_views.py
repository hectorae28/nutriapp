from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .permissions import IsNutricionista
from .serializers import (
    PacienteCreateSerializer,
    PacienteSerializer,
    UserSerializer,
)


@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({"detail": "CSRF cookie set"})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {"detail": "Credenciales inválidas."}, status=status.HTTP_401_UNAUTHORIZED
        )
    login(request, user)
    grupos = list(user.groups.values_list("name", flat=True))
    return Response(
        {
            "user": UserSerializer(user).data,
            "groups": grupos,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"detail": "Sesión cerrada."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    grupos = list(request.user.groups.values_list("name", flat=True))
    return Response(
        {
            "user": UserSerializer(request.user).data,
            "groups": grupos,
        }
    )


@api_view(["POST"])
@permission_classes([IsNutricionista])
def register_paciente_view(request):
    import re
    data = request.data.copy()

    cedula = str(data.get("cedula", "") or "")[:20]
    telefono = str(data.get("telefono", "") or "")[:20]
    historia_nro = str(data.get("historia_nro", "") or "")[:50]
    email = str(data.get("email", "") or "").strip()
    first_name = str(data.get("first_name", "") or "").strip()

    # username: solo letras, números y @/./+/-/_  — máx 150 chars
    # Si ya existe, agrega sufijo numérico hasta encontrar uno libre
    from django.contrib.auth import get_user_model as _get_user_model
    _User = _get_user_model()

    base = f"pac_{cedula}" if cedula else f"pac_{re.sub(r'[^a-zA-Z0-9]', '', first_name).lower()}"
    base = re.sub(r'[^a-zA-Z0-9@.+\-_]', '', base)[:145] or f"pac_{id(data)}"

    username = base
    counter = 1
    while _User.objects.filter(username=username).exists():
        username = f"{base}_{counter}"
        counter += 1

    if not email:
        email = f"{username}@nutriapp.com"

    nested = {
        "user": {
            "username": username,
            "email": email,
            "first_name": first_name,
            "last_name": str(data.get("last_name", "") or "").strip(),
            "password": data.get("password") or None,
        },
        "cedula": cedula,
        "consultorio": str(data.get("consultorio", "") or ""),
        "historia_nro": historia_nro,
        "fecha_consulta": data.get("fecha_consulta") or None,
        "telefono": telefono,
        "fecha_nacimiento": data.get("fecha_nacimiento") or None,
        "lugar_nacimiento": str(data.get("lugar_nacimiento", "") or ""),
        "sexo": str(data.get("sexo", "") or ""),
        "estado_civil": str(data.get("estado_civil", "") or ""),
        "direccion": str(data.get("direccion", "") or ""),
        "religion": str(data.get("religion", "") or ""),
        "grado_instruccion": str(data.get("grado_instruccion", "") or ""),
        "ocupacion": str(data.get("ocupacion", "") or ""),
        "referido_por": str(data.get("referido_por", "") or ""),
    }

    serializer = PacienteCreateSerializer(data=nested)
    if serializer.is_valid():
        paciente = serializer.save()
        return Response(
            PacienteSerializer(paciente).data, status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
