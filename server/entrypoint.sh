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

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"
