# Backend Setup Guide

## Prerequisites

### Manual setup
- Python 3.10+ installed
- Virtual environment support (`venv`)

### Docker setup
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Environment Variables

Create a `.env` file in the `backend` directory.

### Required

```env
# Firebase service account JSON path
# Manual run:
GOOGLE_APPLICATION_CREDENTIALS=app/secrets/firebase_cred.json

# Docker run (inside container path):
# GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/firebase_cred.json

# LLM provider key used by current flow
OPENAI_API_KEY=your_openai_api_key

# Celery broker (recommended single source of truth)
# Manual + local Redis container:
CELERY_BROKER_URL=redis://localhost:6379/0

# If API/worker run in Docker Compose while Redis runs on host:
# CELERY_BROKER_URL=redis://host.docker.internal:6379/0
```

### Optional

```env
# Langfuse tracing
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_HOST=

# Search tool integrations
TAVILY_API_KEY=

# Alternative model providers
GEMINI_API_KEY=
GROQ_API_KEY=

# Agent/chatbot tuning
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
CHATBOT_V2_HISTORY_LIMIT=12
CHATBOT_V2_RETRIEVAL_DECIDER=heuristic

# Legacy Redis-style fields (only needed if not using CELERY_BROKER_URL)
REDIS_HOST=
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

## Self-Hosted Redis via Docker (No Cloud Redis)

If you want Redis broker fully local/self-hosted:

1. Start Redis container:
```bash
docker run -d --name resq-redis -p 6379:6379 redis:7-alpine
```

2. Verify Redis:
```bash
docker exec -it resq-redis redis-cli ping
```
Expected output: `PONG`

3. Set broker URL in `.env`:
- Manual backend run: `CELERY_BROKER_URL=redis://localhost:6379/0`
- Backend in Docker Compose, Redis on host: `CELERY_BROKER_URL=redis://host.docker.internal:6379/0`

Optional (all in Compose network): add this service to `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: resq_redis
  ports:
    - "6379:6379"
  restart: unless-stopped
```

Then set:
`CELERY_BROKER_URL=redis://redis:6379/0`

## Docker Setup

1. Go to backend directory:
```bash
cd backend
```

2. Prepare Firebase secret:
- Create `app/secrets/`
- Add `app/secrets/firebase_cred.json`

3. In `.env`, use:
`GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/firebase_cred.json`

4. Build and run:
```bash
docker-compose up --build
```

API: `http://localhost:8000`

## Manual Setup

1. Go to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv env
```

Windows:
```bash
.\env\Scripts\activate
```

macOS/Linux:
```bash
source env/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Prepare Firebase secret:
- Create `app/secrets/`
- Add `app/secrets/firebase_cred.json`

5. In `.env`, use:
`GOOGLE_APPLICATION_CREDENTIALS=app/secrets/firebase_cred.json`

6. Start API:
```bash
python -m uvicorn app.main:app --reload
```

## Run Celery Worker

From the `backend` directory with virtual environment active:

```bash
celery -A app.celery_config.celery_app worker --loglevel=info --pool=solo
```
