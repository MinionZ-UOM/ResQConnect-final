# Backend Load Testing Methodology

This backend uses `Locust` to simulate realistic API traffic without changing application code. The load-test assets live in:

- `loadtests/locustfile.py`: executable Locust scenarios.
- `requirements-loadtest.txt`: Locust dependency.
- `.gitignore`: excludes generated reports and CSV output.

The test design is intentionally safe by default. It runs read-only traffic unless explicit environment flags enable authenticated, mutating, or LLM-backed routes.

## Goals

The load tests validate the backend areas that matter most for a disaster-response system:

- Public discovery: health checks, active disasters, disaster locations, observations, disaster-specific requests, and disaster chat history.
- Authenticated user flows: current user profile, user-owned requests, user-owned tasks, disaster membership state, request details, and task details.
- Operational dashboards: privileged task and workflow-output reads used by admins/responders.
- Controlled write paths: request creation/deletion, location updates, and disaster chat messages.
- Expensive AI paths: chatbot/RAG requests, isolated behind a separate opt-in flag.

## Safety Rules

Use a staging or disposable Firebase project for load tests. Do not run write or chatbot scenarios against production data.

Default behavior:

- No database writes.
- No deletes.
- No chatbot/LLM calls.
- No privileged dashboard reads unless explicitly enabled.

Mutating behavior is opt-in:

- `LOADTEST_ENABLE_WRITES=1` enables request creation and user location updates.
- `LOADTEST_ENABLE_CHAT_WRITES=1` enables disaster chat message creation.
- `LOADTEST_ENABLE_CHATBOT=1` enables `/chatbot/ask`, which can call external model providers and consume credits.
- `LOADTEST_DELETE_CREATED_REQUESTS=1` deletes load-created requests after each create call. This is the default, but request creation still triggers the backend's Celery workflow enqueue path.

## Install

From `backend/`:

```bash
pip install -r requirements-loadtest.txt
```

## Start the Backend

Start the API normally:

```bash
python -m uvicorn app.main:app --reload
```

If testing request creation, also start Redis and the Celery worker because `POST /requests` enqueues the agentic workflow:

```bash
celery -A app.celery_config.celery_app worker --loglevel=info --pool=solo
```

Default target used below:

```text
http://localhost:8000
```

## Run With Live UI

```bash
locust -f loadtests/locustfile.py --host=http://localhost:8000
```

Open:

```text
http://localhost:8089
```

Start with a small smoke run before increasing traffic.

## Run Headless

Smoke test:

```bash
locust -f loadtests/locustfile.py `
  --host=http://localhost:8000 `
  --users 10 `
  --spawn-rate 2 `
  --run-time 2m `
  --headless `
  --html loadtest-report-smoke.html `
  --csv loadtest-results-smoke
```

Baseline test:

```bash
locust -f loadtests/locustfile.py `
  --host=http://localhost:8000 `
  --users 50 `
  --spawn-rate 5 `
  --run-time 10m `
  --headless `
  --html loadtest-report-baseline.html `
  --csv loadtest-results-baseline
```

Stress test:

```bash
locust -f loadtests/locustfile.py `
  --host=http://localhost:8000 `
  --users 150 `
  --spawn-rate 10 `
  --run-time 15m `
  --headless `
  --html loadtest-report-stress.html `
  --csv loadtest-results-stress
```

## Environment Variables

Common variables:

```powershell
$env:LOADTEST_WAIT_MIN_SEC="0.5"
$env:LOADTEST_WAIT_MAX_SEC="2.0"
$env:LOADTEST_DISASTER_ID="known-disaster-id"
$env:LOADTEST_REQUEST_ID="known-request-id"
$env:LOADTEST_OBSERVATION_ID="known-observation-id"
$env:LOADTEST_TASK_ID="known-task-id"
```

Authentication:

```powershell
$env:LOADTEST_BEARER_TOKEN="firebase-id-token"
```

Privileged dashboard reads:

```powershell
$env:LOADTEST_ENABLE_PRIVILEGED_READS="1"
```

Safe write test against staging:

```powershell
$env:LOADTEST_BEARER_TOKEN="firebase-id-token"
$env:LOADTEST_ENABLE_WRITES="1"
$env:LOADTEST_DELETE_CREATED_REQUESTS="1"
```

Chat write test against staging:

```powershell
$env:LOADTEST_BEARER_TOKEN="firebase-id-token"
$env:LOADTEST_ENABLE_CHAT_WRITES="1"
```

Chatbot/RAG test:

```powershell
$env:LOADTEST_ENABLE_CHATBOT="1"
```

## Scenarios Implemented

### PublicReadUser

This profile represents unauthenticated users, mobile clients, dashboards, or frontend pages reading public emergency information.

Endpoints covered:

- `GET /`
- `GET /disasters`
- `GET /disasters/location`
- `GET /disasters/agent-suggested`
- `GET /disasters/{id}`
- `GET /observations`
- `GET /observations/{id}`
- `GET /requests/disaster/{id}`
- `GET /disasters/{id}/chat/messages`

What this validates:

- API availability under public traffic.
- Firestore/list query performance for core emergency data.
- Disaster map marker retrieval.
- Observation feed behavior.
- Chat history read scalability.
- Response JSON shape for list/detail endpoints.

### AuthenticatedReadUser

This profile represents logged-in users such as affected individuals, volunteers, responders, and admins.

Endpoints covered:

- `GET /users/me`
- `GET /requests/me`
- `GET /tasks/me`
- `GET /disasters/{id}/joined`
- `GET /requests/{id}`
- `GET /tasks/{id}`

Optional privileged endpoints:

- `GET /tasks`
- `GET /workflow-outputs/`
- `GET /workflow-outputs/{request_id}`
- `GET /workflow-outputs/{request_id}/tasks`
- `GET /workflow-outputs/{request_id}/resources`

What this validates:

- Firebase auth dependency overhead.
- Role/permission checks.
- User-specific request and task list queries.
- Responder/admin dashboard read paths.
- Workflow review data retrieval used after agent processing.

### SafeWriteUser

This profile is disabled by default and should only run against staging.

Endpoints covered when enabled:

- `POST /requests`
- `DELETE /requests/{id}`
- `PATCH /users/me/location`
- `POST /disasters/{id}/chat/messages`

What this validates:

- Firestore write throughput.
- Request creation validation.
- Celery broker enqueue behavior from `POST /requests`.
- Cleanup path for load-created requests.
- Repeated location updates for mobile users/responders.
- Chat write path under concurrent responders/users.

Important caveat:

`POST /requests` can enqueue asynchronous workflow processing. If the worker is running and external LLM keys are configured, downstream agent/LLM load may also occur. Keep this scenario isolated and monitor Redis, Celery, and provider usage.

### ChatbotUser

This profile is disabled by default and should be run separately.

Endpoint covered:

- `POST /chatbot/ask`

What this validates:

- Chatbot API latency.
- RAG retrieval overhead.
- External model-provider behavior.
- Timeout and failure behavior for AI-assisted advice.

Important caveat:

This scenario can consume paid API credits and is affected by external provider latency/rate limits, so results are not purely backend performance numbers.

## Recommended Test Progression

1. Smoke: 10 users, 2 minutes, read-only.
2. Baseline: 50 users, 10 minutes, read-only plus authenticated reads if a token is available.
3. Capacity: 100-200 users, 15 minutes, read-only/authenticated reads.
4. Write-path staging run: 10-25 users, 5-10 minutes, `LOADTEST_ENABLE_WRITES=1`.
5. Chatbot run: 1-10 users, 5 minutes, `LOADTEST_ENABLE_CHATBOT=1`.
6. Stress: increase users until p95 latency, error rate, database quota, Redis, or CPU/memory becomes unacceptable.

Do not combine write-path and chatbot stress testing in the same first run. Isolate them so bottlenecks are attributable.

## Metrics To Capture

From Locust:

- Requests per second.
- Average latency.
- Median latency.
- p95 and p99 latency.
- Failure rate.
- Failures by endpoint.
- Exceptions.

From backend/infra:

- API CPU and memory.
- Uvicorn worker count and saturation.
- Firestore read/write counts and quota errors.
- Redis memory/connections if Celery is used.
- Celery queue depth and task failures.
- External LLM rate-limit or timeout responses when chatbot/workflow paths are enabled.

## Suggested Acceptance Thresholds

Adjust these for your deployment size, but use them consistently across runs:

- Public read endpoints: p95 below 500 ms, failure rate below 1%.
- Authenticated read endpoints: p95 below 800 ms, failure rate below 1%.
- Dashboard/workflow reads: p95 below 1000 ms, failure rate below 1%.
- Write endpoints: p95 below 1500 ms, failure rate below 2%.
- Chatbot endpoint: p95 depends on provider latency; track separately and set a larger threshold such as 10-20 seconds.

Any sustained 5xx response is a backend issue unless caused by intentionally unavailable staging dependencies.

## Interpreting Failures

Common causes:

- `401`: missing or expired `LOADTEST_BEARER_TOKEN`.
- `403`: token role does not have permission for the enabled endpoint group.
- `404`: fixed ID environment variable points to missing staging data.
- `500` on `POST /requests`: Celery/Redis unavailable or workflow enqueue failed.
- Slow chatbot responses: external provider latency, rate limiting, or retrieval overhead.

For stable results, seed known staging data and pass fixed IDs through:

```powershell
$env:LOADTEST_DISASTER_ID="known-disaster-id"
$env:LOADTEST_REQUEST_ID="known-request-id"
$env:LOADTEST_OBSERVATION_ID="known-observation-id"
$env:LOADTEST_TASK_ID="known-task-id"
```

## Reporting Template

For each run, record:

- Date/time and environment.
- Git commit or deployment version.
- Locust command used.
- Environment variables enabled.
- User count, spawn rate, and duration.
- Overall RPS.
- p50, p95, and p99 latency.
- Failure rate and top failing endpoints.
- API CPU/memory.
- Firestore quota or error events.
- Redis/Celery health if write paths were enabled.
- Conclusion: pass/fail and next bottleneck to investigate.

## Notes For Production Safety

Run production load tests only after staging baselines are understood. If production testing is required, use read-only traffic first, small user counts, short duration, and a maintenance-approved window. Keep `LOADTEST_ENABLE_WRITES`, `LOADTEST_ENABLE_CHAT_WRITES`, and `LOADTEST_ENABLE_CHATBOT` disabled unless there is explicit approval.
