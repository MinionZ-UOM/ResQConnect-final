# APPENDIX A: DETAILED TEST REPORT (BACKEND, FRONTEND, MOBILE)

## A.1 Purpose
This appendix presents a detailed testing report for ResQConnect with emphasis on:
- key test implementations,
- important code snippets,
- and why each test matters to system reliability in disaster-response usage.

This is written as research evidence, not as a setup guide.

## A.2 Verified Test Outcomes

| Layer | Framework | Test Files | Test Cases | Result |
|---|---|---:|---:|---|
| Backend | Pytest + FastAPI TestClient | 3 | 35 | 35/35 passed |
| Frontend | Vitest + Testing Library | 7 | 25 | 25/25 passed |
| Mobile | flutter_test | 7 | 11 | 11/11 passed |
| **Total** | - | **17** | **71** | **71/71 passed** |

---

## A.3 Backend Testing (FastAPI + Pytest)

### A.3.1 Backend test goals
Backend tests validate five high-risk areas:
1. Authentication and current-user resolution.
2. Role and permission enforcement.
3. Endpoint contract correctness (status codes + response bodies).
4. Request-to-workflow asynchronous orchestration.
5. Parsing/normalization of agent-generated workflow output.

### A.3.2 Snippet 1: Router-level integration harness via dependency override
Source: `backend/tests/test_api_main_functionalities.py`

```python
def make_client(router, user: User) -> TestClient:
    app = FastAPI()
    app.include_router(router)

    async def _override_current_user() -> User:
        return user

    app.dependency_overrides[deps.get_current_user] = _override_current_user
    return TestClient(app)
```

Detailed explanation:
- This pattern mounts real API routers into a test app.
- Instead of calling external Firebase auth every time, tests inject a deterministic `current_user`.
- That gives integration-style coverage of route logic while keeping external dependencies controlled.
- Research relevance: it strengthens causal interpretation of failures (route logic issues vs cloud auth issues).

### A.3.3 Snippet 2: Role boundary enforcement (negative authorization path)
Source: `backend/tests/test_api_main_functionalities.py`

```python
response = client.patch("/users/me/availability", json={"availability": True})

assert response.status_code == 403
assert response.json()["detail"] == "Only volunteers may update availability"
```

Detailed explanation:
- This verifies that unauthorized role mutation is blocked.
- The test checks both HTTP semantics (`403`) and domain-specific reason text.
- Why both checks matter: status-only assertions can pass even when user-facing error semantics regress.
- In emergency operations, role leakage is a critical safety risk; this test protects that boundary.

### A.3.4 Snippet 3: Positive authorization path with argument integrity
Source: `backend/tests/test_api_main_functionalities.py`

```python
def fake_update_user_availability(uid: str, availability: bool, location):
    captured["uid"] = uid
    captured["availability"] = availability
    captured["location"] = location

...
response = client.patch(
    "/users/me/availability",
    json={"availability": True, "location": {"lat": 6.9, "lng": 79.85}},
)

assert response.status_code == 200
assert captured["uid"] == "vol-1"
assert captured["availability"] is True
assert captured["location"].latitude == 6.9
assert captured["location"].longitude == 79.85
```

Detailed explanation:
- This is not only a response test; it also validates argument-level correctness passed into the update layer.
- It catches silent mapping bugs between JSON payload and internal model (`lat/lng` to typed coordinates).
- Research relevance: ensures location-aware volunteer availability updates remain trustworthy.

### A.3.5 Snippet 4: Request creation must enqueue workflow task
Source: `backend/tests/test_api_main_functionalities.py`

```python
class DummyTask:
    def apply_async(self, args, connection):
        captured["args"] = args
        captured["connection"] = connection

...
response = client.post("/requests", json=payload)

assert response.status_code == 201
task_payload = captured["args"][0]
assert task_payload["request_id"] == "req-1"
assert task_payload["metadata"]["type_of_need"] == "food"
assert captured["connection"] == "conn-1"
```

Detailed explanation:
- This verifies the most important cross-component contract in backend behavior:
  - request persistence,
  - correct workflow payload construction,
  - broker enqueue invocation.
- If this path breaks, help requests can be accepted but never planned, which is operationally severe.
- This test is core evidence for end-to-end automation reliability claims.

### A.3.6 Snippet 5: Queue failure behavior is explicit and safe
Source: `backend/tests/test_api_main_functionalities.py`

```python
class BrokenConnCtx:
    def __enter__(self):
        raise RuntimeError("redis unavailable")

...
response = client.post("/requests", json=payload)

assert response.status_code == 500
assert "Failed to enqueue agentic task" in response.json()["detail"]
```

Detailed explanation:
- Simulates infrastructure failure at queue connection acquisition.
- Verifies controlled failure reporting instead of silent acceptance.
- This is a resilience test: failure transparency is essential in incident response systems.

### A.3.7 Snippet 6: Permission framework behavior (wildcard and deny)
Source: `backend/tests/test_backend_additional_aspects.py`

```python
user = make_user(permissions_list=["task:*"])
dep = permissions.require_perms("task:assign")
guard = dep.dependency

allowed_user = guard(user)
assert allowed_user.uid == user.uid
```

and

```python
user = make_user(permissions_list=["request:read_own"])
dep = permissions.require_perms("task:assign")
guard = dep.dependency

with pytest.raises(HTTPException) as exc:
    guard(user)

assert exc.value.status_code == 403
assert "Missing permission(s): task:assign" in str(exc.value.detail)
```

Detailed explanation:
- First snippet verifies wildcard permission behavior (`task:*`).
- Second verifies strict denial when required permission is absent.
- Together, they validate least-privilege enforcement and wildcard compatibility.

### A.3.8 Snippet 7: Agent output parser corrects inconsistent totals
Source: `backend/tests/test_workflow_output_parser.py`

```python
payload = _build_payload(
    """
    requirements:
      manpower:
        total_volunteers: 1
        breakdown:
          - task_id: TaskX
            volunteers: 3
    """
)

assert payload.manpower is not None
assert payload.manpower.total_volunteers == 3
```

Detailed explanation:
- Agent-generated YAML can be inconsistent.
- This test confirms parser normalization recomputes totals from structured breakdowns.
- Research relevance: protects downstream planning quality from malformed agent outputs.

### A.3.9 Backend conclusion
The backend suite gives strong evidence for:
- access-control correctness,
- contract-level API reliability,
- resilient orchestration behavior,
- and robust normalization of machine-generated workflow data.

---

## A.4 Frontend Testing (Vitest + Testing Library)

### A.4.1 Frontend test goals
Frontend tests validate:
1. component interaction correctness,
2. API-to-UI transformation robustness,
3. task suggestion semantic mapping,
4. and error message normalization.

### A.4.2 Snippet 1: deterministic browser-like runtime setup
Source: `frontend/vitest.config.ts` and `frontend/vitest.setup.ts`

```ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

```ts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
```

Detailed explanation:
- `jsdom` enables React component tests without a real browser.
- `ResizeObserver` mocking prevents false negatives in components that inspect layout overflow.
- This keeps results stable and improves reproducibility of UI behavior tests.

### A.4.3 Snippet 2: action callback correctness + anti-duplicate delete behavior
Source: `frontend/src/app/dashboard/individual/components/__tests__/request-card.test.tsx`

```tsx
await user.click(screen.getByRole('button', { name: 'Delete' }))
expect(onDelete).toHaveBeenCalledWith('req-100')
```

and

```tsx
const button = screen.getByRole('button', { name: 'Deleting...' })
expect(button).toBeDisabled()
```

Detailed explanation:
- First snippet verifies correct event payload wiring.
- Second verifies UI mutation safety by disabling repeated delete actions during in-flight state.
- This prevents duplicate operations and inconsistent request states.

### A.4.4 Snippet 3: defensive mapping under null/partial workflow payloads
Source: `frontend/src/lib/utils/__tests__/mapping-utils.test.ts`

```ts
const result = mapWorkflowOutput({
  workflow_run_id: 'wf-2',
  request_id: 'req-2',
  tasks: null,
  resource_suggestions: null,
  manpower: null,
} as any)

expect(result.tasks).toEqual([])
expect(result.resourceSuggestions).toEqual([])
expect(result.manpower).toBeUndefined()
```

Detailed explanation:
- This validates null-tolerant behavior for asynchronous or partial backend responses.
- Ensures components receive stable structures and avoid runtime crashes.
- Critical for operational dashboards where data may arrive incrementally.

### A.4.5 Snippet 4: semantic conversion between workflow and task models
Source: `frontend/src/lib/utils/__tests__/task-suggestion-mapping.test.ts`

```ts
expect(mapApprovalStatusToTaskStatus('pending')).toBe('Pending')
expect(mapTaskStatusToApprovalStatus('Approved')).toBe('approved')
expect(mapPriorityToTaskPriority('HIGH')).toBe('High')
expect(mapPriorityToTaskPriority('unknown-priority')).toBe('Medium')
```

Detailed explanation:
- Verifies status translation and fallback priority behavior.
- Prevents semantic drift between backend planner outputs and UI decision views.
- The fallback case is especially important for resilience to unrecognized values.

### A.4.6 Snippet 5: normalized user-facing error semantics
Source: `frontend/src/lib/__tests__/response-utils.test.ts`

```ts
const axiosLikeError = {
  isAxiosError: true,
  response: {
    status: 500,
    data: { detail: 'Internal API failure' },
  },
}

const result = normalizeApiError(axiosLikeError)

expect(result.message).toBe('Internal API failure')
expect(result.status).toBe(500)
expect(result.data).toEqual({ detail: 'Internal API failure' })
```

Detailed explanation:
- This test ensures backend fault details are preserved for user feedback.
- Prevents generic/unhelpful error text in critical workflows.
- Supports fast operator diagnosis during service interruptions.

### A.4.7 Frontend conclusion
Frontend testing demonstrates:
- reliable interaction contracts,
- robust mapping of imperfect backend data,
- and stable error communication behavior in critical screens.

---

## A.5 Mobile Testing (Flutter + flutter_test)

### A.5.1 Mobile test goals
Mobile tests validate:
1. emergency navigation behavior,
2. help request form guardrails,
3. chat behavior with model-state contingencies,
4. and research-metric persistence/export correctness.

### A.5.2 Snippet 1: controlled platform-channel behavior in tests
Source: `mobile/test/widget/chat_screen_test.dart`, `mobile/test/widget/start_screen_test.dart`

```dart
const MethodChannel llmChannel = MethodChannel('llm_inference');

setUp(() {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(llmChannel, (MethodCall call) async {
    if (call.method == 'isModelDownloaded') {
      return false;
    }
    if (call.method == 'generateResponse') {
      return 'mocked response';
    }
    return null;
  });
});
```

Detailed explanation:
- Mobile screens depend on native channel calls; tests mock them for deterministic results.
- This isolates Flutter logic from device/plugin variability.
- Prevents flaky outcomes in CI and local executions.

### A.5.3 Snippet 2: metrics serialization and derived-field correctness
Source: `mobile/test/unit/metric_entry_test.dart`

```dart
final json = entry.toJson();
final restored = MetricEntry.fromJson(json);

expect(json['memoryDeltaBytes'], equals(1024 * 1024));
expect(restored.latencyMs, equals(850));
expect(restored.promptWordCount, equals(7));
expect(restored.responseWordsPerSecond, closeTo(17.65, 0.0001));
```

Detailed explanation:
- Confirms no loss/corruption of metric values during JSON round-trip.
- Validates both raw and derived indicators.
- This is essential because metrics are used as research evidence in evaluation sections.

### A.5.4 Snippet 3: persistence to JSON store
Source: `mobile/test/unit/metrics_recorder_test.dart`

```dart
await recorder.recordEntry(entry);

final jsonFile = File('${tempDir.path}${Platform.pathSeparator}llm_metrics.json');
final raw = await jsonFile.readAsString();
final decoded = jsonDecode(raw) as List<dynamic>;

expect(recorder.entries, hasLength(1));
expect(await jsonFile.exists(), isTrue);
expect(decoded, hasLength(1));
```

Detailed explanation:
- Tests in-memory and filesystem persistence together.
- Ensures data durability, not just runtime state mutation.
- Supports reproducibility claims for exported performance metrics.

### A.5.5 Snippet 4: CSV export schema and escaping correctness
Source: `mobile/test/unit/metrics_recorder_test.dart`

```dart
expect(csv, contains('timestamp,latency_ms,memory_before_bytes,memory_after_bytes'));
expect(csv, contains('"Network ""timeout"", retry'));
expect(csv, contains('needed"'));
```

Detailed explanation:
- Verifies CSV header integrity and special-character escaping.
- Prevents malformed CSV rows when error messages contain quotes or line breaks.
- Protects downstream analysis validity in spreadsheet/statistical tooling.

### A.5.6 Snippet 5: help-request validation under missing required fields
Source: `mobile/test/widget/help_request_screen_test.dart`

```dart
await tester.tap(find.text('Send Request'));
await tester.pump();

expect(find.text('Please select a disaster type'), findsOneWidget);
expect(find.text('Please provide some details'), findsOneWidget);
```

and

```dart
await tester.tap(find.text('Send Request'));
await tester.pump();

expect(find.text('Please add your location.'), findsOneWidget);
```

Detailed explanation:
- These tests enforce completeness constraints for emergency requests.
- They reduce invalid submissions and improve triage input quality.
- In disaster contexts, poor input quality directly degrades decision effectiveness.

### A.5.7 Snippet 6: chat fallback behavior with model unavailable
Source: `mobile/test/widget/chat_screen_test.dart`

```dart
await tester.enterText(find.byType(TextField), 'Give me evacuation steps');
await tester.tap(find.byIcon(Icons.arrow_upward_rounded));
await tester.pump();
await tester.pump(const Duration(milliseconds: 200));

expect(find.text('Model not downloaded. Please download the model first.'), findsOneWidget);
```

Detailed explanation:
- Validates explicit fallback behavior when local model resources are missing.
- Avoids silent failures and directs users toward recovery action.
- Important for edge/offline deployment reliability.

### A.5.8 Mobile conclusion
Mobile tests provide evidence for:
- critical route/validation behavior,
- robust chat behavior under constrained model state,
- and reliable metrics collection/export used in research analysis.

---

## A.6 Coverage Evidence

### A.6.1 Backend coverage
Measured with `coverage.py`:
- Statements: 1753
- Missed: 589
- Total line coverage: **66%**

Interpretation:
- Strong coverage for API contracts, permissions, and parser logic.
- Lower coverage concentrated in persistence adapters (`app/crud/*`).

### A.6.2 Mobile coverage
Measured from `flutter test --coverage` (`lcov.info`):
- LH: 416
- LF: 783
- Total line coverage: **53.13%**

Interpretation:
- High coverage in critical interactive screens and metrics recorder.
- Lower coverage in theme/presentation and platform-channel internals.

### A.6.3 Frontend coverage instrumentation status
Frontend behavior tests pass completely (25/25), but line instrumentation is not currently enabled due missing `@vitest/coverage-v8`.

---

## A.7 Final Research Interpretation
The current automated evidence supports the following claims:
1. **Backend reliability**: role safety, API semantics, and workflow orchestration are validated through integration-focused tests.
2. **Frontend reliability**: UI operations and data transformation logic are resilient to incomplete or inconsistent backend payloads.
3. **Mobile reliability**: field workflows, fallback behavior, and research metric integrity are validated by unit and widget tests.

Therefore, the implemented test corpus substantiates cross-layer reliability claims for ResQConnect in both operational and analytical contexts.
