# Sequence Diagrams

## 1. Create Help Request Workflow

This diagram illustrates the flow when a user submits a new help request. The request is stored in Firestore, and an asynchronous task is triggered via Celery to process the request (e.g., matching it with available resources).

```mermaid
sequenceDiagram
    participant U as User
    participant API as FastAPI Backend
    participant DB as Firestore
    participant Q as Redis Queue
    participant W as Celery Worker

    U->>API: POST /requests (payload)
    API->>API: Validate Token (Auth)
    API->>DB: Save Request (status="open")
    DB-->>API: Request ID
    API->>Q: Enqueue Agent Task (request_id)
    API-->>U: Return Created Request

    Q->>W: Process Task
    W->>W: Analyze Request (AI/Logic)
    W->>DB: Update Request (e.g., assign resource)
```

## 2. Resource Assignment Workflow (Simplifed)

This diagram shows how a resource is assigned to a request.

```mermaid
sequenceDiagram
    participant W as Celery Worker (Agent)
    participant DB as Firestore
    participant N as Notification Service

    Note over W: Triggered by new Request or Resource availability
    W->>DB: Query Open Requests & Available Resources
    W->>W: Match Logic (Location, Type, etc.)
    
    alt Match Found
        W->>DB: Update Request (status="assigned")
        W->>DB: Update Resource (status="busy")
        W->>N: Notify User & Responder
    else No Match
        W->>DB: Log "No match found" (Retry later)
    end
```
