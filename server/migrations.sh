#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "
import os, psycopg2, sys
try:
    psycopg2.connect(
        host=os.environ.get('POSTGRES_HOST', 'db'),
        port=os.environ.get('POSTGRES_PORT', '5432'),
        dbname=os.environ.get('POSTGRES_DB', 'nutriapp'),
        user=os.environ.get('POSTGRES_USER', 'nutriapp'),
        password=os.environ.get('POSTGRES_PASSWORD', ''),
    ).close()
    print('DB ready.')
except Exception as e:
    print(f'DB not ready: {e}', file=sys.stderr)
    sys.exit(1)
"; do
    echo "Retrying in 2s..."
    sleep 2
done

echo "Running migrations..."
python manage.py migrate --noinput

echo "Loading fixtures..."
python manage.py loaddata apps/users/fixtures/grupos_django.json 2>/dev/null || echo "Fixtures ya cargadas, continuando..."

echo "Seeding catálogo inicial (grupos alimenticios y alimentos)..."
python manage.py shell -c "
from apps.catalogo.models import GrupoAlimento, Alimento
import subprocess, sys

grupos_ok = GrupoAlimento.objects.exists()
alimentos_ok = Alimento.objects.exists()

if not grupos_ok or not alimentos_ok:
    print('Tablas vacías detectadas, cargando catalogo_inicial.json...')
    result = subprocess.run(
        [sys.executable, 'manage.py', 'loaddata', 'apps/catalogo/fixtures/catalogo_inicial.json'],
        capture_output=True, text=True
    )
    print(result.stdout or result.stderr)
else:
    print(f'Catálogo ya presente: {GrupoAlimento.objects.count()} grupos, {Alimento.objects.count()} alimentos.')
"

echo "Creating superuser if not exists..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
import os
User = get_user_model()
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@nutriapp.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin1234')
if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(username=email, email=email, password=password)
    print(f'Superuser creado: {email}')
else:
    print(f'Superuser ya existe: {email}')
"

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"
