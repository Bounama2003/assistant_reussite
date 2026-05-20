FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM ghcr.io/astral-sh/uv:latest AS uv

FROM python:3.12-slim AS backend-builder
COPY --from=uv /uv /uvx /bin/
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc build-essential && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 curl && rm -rf /var/lib/apt/lists/*
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin
ENV PATH=/usr/local/bin:$PATH \
    PYTHONPATH=/app/backend \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./frontend/dist
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 7860
CMD ["bash", "/app/start.sh"]
