from .base import *  # noqa: F403, F401

DEBUG = True
SECRET_KEY = "django-insecure-dev-key-cambiar-en-produccion-12345678901234567890"
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
    }
}

STATIC_ROOT = BASE_DIR / "staticfiles"  # noqa: F405

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
]
