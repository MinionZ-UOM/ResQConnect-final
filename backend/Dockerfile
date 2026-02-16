FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/opt/venv \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN python -m venv "$VIRTUAL_ENV"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

# Install CPU-only torch wheels first so the smaller binaries are cached for the
# subsequent dependency installation and keep the final image size low.
# Use pip without cache to save space
RUN pip install --upgrade pip \
    && pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu --no-deps torch==2.8.0 \
    && pip install --no-cache-dir -r requirements.txt \
    && pip check \
    && find "$VIRTUAL_ENV" -name "__pycache__" -type d -exec rm -rf '{}' + \
    && find "$VIRTUAL_ENV" -name "*.pyc" -delete

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
