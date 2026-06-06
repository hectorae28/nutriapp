import os
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import serializers

from .models import ConfiguracionSistema, Paciente

User = get_user_model()
SITE_URL = os.environ.get('SITE_URL', 'http://localhost:8000')


def _enviar_email_bienvenida(paciente):
    """Envía email de bienvenida con link de activación."""
    user = paciente.user
    if not user.email or '@nutriapp.com' in user.email:
        # No enviar a emails internos/ficticios
        return
    
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    activation_url = f"{SITE_URL}/reset-password/{uid}/{token}/"
    nombre = user.get_full_name() or user.username
    
    try:
        send_mail(
            subject='Bienvenido a NutriApp — Activa tu cuenta',
            message=f"""Hola {nombre},

Tu cuenta en NutriApp ha sido creada. Para activarla y crear tu contraseña, haz clic en el siguiente enlace:

{activation_url}

Este enlace expira en 3 días.

Saludos,
Equipo NutriApp""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,  # no romper si falla email
        )
    except Exception as e:
        # Log pero no romper el flujo
        print(f"Error enviando email de bienvenida: {e}")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "is_superuser", "is_active"]
        read_only_fields = ["id"]


class PacienteSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

    def get_nombre_completo(self, obj):
        return str(obj)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_null=True, default=None)

    class Meta:
        model = User
        fields = ["username", "password", "first_name", "last_name", "email"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User.objects.create_user(**validated_data, password=password)
        if not password:
            user.set_unusable_password()
            user.save()
        return user


class PacienteCreateSerializer(serializers.ModelSerializer):
    user = UserCreateSerializer()

    class Meta:
        model = Paciente
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

    @staticmethod
    def _atomic_create(user_data, validated_data):
        from django.contrib.auth.models import Group
        from django.db import transaction

        with transaction.atomic():
            user = UserCreateSerializer().create(user_data)
            group = Group.objects.filter(name="Paciente").first()
            if group:
                user.groups.add(group)
            paciente = Paciente.objects.create(user=user, **validated_data)
            
            # Enviar email de bienvenida
            _enviar_email_bienvenida(paciente)
            
            return paciente

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        return self._atomic_create(user_data, validated_data)


class ConfiguracionSistemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionSistema
        fields = ['id', 'clave', 'valor', 'descripcion']
        read_only_fields = ['id']
