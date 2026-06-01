from rest_framework import permissions

class IsNutricionista(permissions.BasePermission):
    """
    Permite acceso a usuarios del grupo 'Nutricionista' o superusuarios.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.groups.filter(name='Nutricionista').exists()

class IsNutricionistaOrPaciente(permissions.BasePermission):
    """
    Permite acceso a usuarios del grupo 'Nutricionista', 'Paciente' o superusuarios.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.groups.filter(name__in=['Nutricionista', 'Paciente']).exists()
