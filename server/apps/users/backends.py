from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailOrUsernameBackend(ModelBackend):
    """
    Permite autenticarse con email O username.
    Si el valor contiene '@' se busca por email, si no por username.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        if not username or not password:
            return None

        # Buscar por email si parece un email, sino por username
        if '@' in username:
            try:
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                return None
            except User.MultipleObjectsReturned:
                # Si hay duplicados de email, intentar por username exacto
                try:
                    user = User.objects.get(username=username)
                except User.DoesNotExist:
                    return None
        else:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
