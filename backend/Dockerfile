FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

CMD python manage.py migrate && gunicorn --bind 0.0.0.0:8000 config.wsgi:application


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
