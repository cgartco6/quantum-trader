FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY services/engine/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services/engine/src ./services/engine/src
COPY services/engine/tests ./services/engine/tests

ENV PYTHONPATH=/app

CMD ["python", "services/engine/src/main.py"]
