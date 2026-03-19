# Backend Setup Improvements 

This plan focuses on fixing the worst issues in the current setup without introducing a full enterprise platform.

## 1) Critical fixes first 

1. Remove hardcoded secrets from code:
- `app/celery_config.py` currently contains Redis host/user/password.
- `app/rag/utils.py` currently has a fallback Tavily API key.

2. Remove tracked secret files from git:
- `app/secrets/firebase_cred.json` is currently tracked.
- Ensure `.env` remains untracked.

3. Rotate exposed credentials:
- Redis password/user credentials.
- Groq, Langfuse, Tavily keys.
- Firebase service account key.

## 2) Docker improvements 

1. Keep one image for both API and worker, but optimize the build:
- Keep multi-stage build.
- Copy only necessary files into runtime image (`app`, `requirements.txt`, needed docs/assets), not entire repo.
- Run as non-root user.

2. Add healthcheck for API:
- Example endpoint: `/` or `/health`.
- Use Docker healthcheck so deploy can detect broken containers quickly.

3. Keep `docker-compose.yml`, but add local Redis service for development only:
- `redis` service with named volume.
- API/worker point to `redis://redis:6379/0` locally.
- In production, use managed Redis via env var.

## 3) Celery + Redis fixes 

1. Move broker URL to env var:
- Use `CELERY_BROKER_URL` only (no hardcoded values).
- Support `rediss://` for managed Redis with TLS.

2. Replace worker `--pool=solo` in production:
- Start with default prefork or set explicit concurrency.
- Make concurrency configurable with env var, e.g. `CELERY_WORKER_CONCURRENCY=2`.

3. Keep safe defaults:
- `task_acks_late=True`
- `worker_prefetch_multiplier=1`
- Add `task_soft_time_limit` and `task_time_limit` to avoid stuck tasks.

## 4) CI/CD improvements 

1. Stop deploying only `latest`:
- Push both `latest` and immutable tag (`sha-<commit>`).
- Deploy with immutable tag to avoid “what is actually running?” confusion.

2. Add a basic CI gate before deploy:
- Run at least: `pytest` (or selected tests), and one static check.
- If checks fail, block image push/deploy.

3. Add post-deploy health check:
- After `docker-compose up -d`, call API health endpoint.
- If health check fails, fail the workflow immediately.

4. Keep current EC2 + Compose approach:
- No need to move to ECS/Kubernetes yet.
- Just make current pipeline deterministic and safer.

## 5) Environment variable handling 

1. Introduce `.env.example`:
- Include variable names only, no real secrets.

2. Centralize config reads:
- Add one settings module (for example `app/core/settings.py`) to load/validate required env vars once.
- Fail fast at startup if required env vars are missing.

3. Avoid secret fallbacks in code:
- If a required API key is missing, raise clear startup error instead of using baked-in defaults.

## 6) Quick action checklist 

1. Remove hardcoded secrets from code and rotate all leaked keys.
2. Untrack `app/secrets/firebase_cred.json` and keep secrets out of git.
3. Move Celery Redis config to env (`CELERY_BROKER_URL`), remove `--pool=solo`.
4. Add immutable image tagging (`sha-<commit>`) in CI/CD.
5. Add healthcheck after deploy.
6. Add `.env.example` and startup config validation.

## 7) Definition of done for this improvement pass

1. No secrets in repository-tracked files.
2. No hardcoded credentials in Python source.
3. Deployments reference immutable image tag.
4. Worker runs with configurable concurrency (not forced `solo`).
5. Missing env vars fail fast with clear error message.
