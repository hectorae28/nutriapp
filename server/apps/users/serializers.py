from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Paciente

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "is_superuser"]
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
            return Paciente.objects.create(user=user, **validated_data)

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        return self._atomic_create(user_data, validated_data)
