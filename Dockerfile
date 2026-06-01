# Backend Django
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código del backend
COPY server/ .

# Frontend build (para servir SPA)
COPY client/dist /client/dist

# Entrypoint
RUN chmod +x /app/entrypoint.sh /app/migrations.sh

EXPOSE 8000

ENTRYPOINT ["/app/migrations.sh"]
CMD ["gunicorn", "nutriapi.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]
