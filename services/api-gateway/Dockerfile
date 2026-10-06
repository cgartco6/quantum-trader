# services/api-gateway/Dockerfile
FROM python:3.11-slim as base

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python requirements
COPY services/api-gateway/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and test suite
COPY services/api-gateway/src ./services/api_gateway/src
COPY services/api-gateway/tests ./services/api_gateway/tests

EXPOSE 8000

CMD ["uvicorn", "services.api_gateway.src.server:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
