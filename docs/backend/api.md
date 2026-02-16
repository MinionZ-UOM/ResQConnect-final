# API Reference

## Base URL

By default, the API is accessible at `http://localhost:8000`.

## Authentication

All secured endpoints require a valid Firebase ID Token passed in the `Authorization` header.

Header Format: `Authorization: Bearer <firebase_id_token>`

## Requests

### `POST /requests`

Create a new help request.

**Payload**:

```json
{
  "search_text": "I need help with food",
  "name": "John Doe",
  "contact": "+1234567890",
  "location": {
    "lat": 12.34,
    "lng": 56.78
  },
  "type": "food",
  "urgency": "high"
}
```

**Response**:

- `201 Created`: Returns the created Request object.

### `GET /requests`

List all requests (requires admin/responder role).

**Response**:

- `200 OK`: Returns a list of Request objects.

### `GET /requests/{req_id}`

Get details of a specific request.

**Response**:

- `200 OK`: Returns the Request object.
- `404 Not Found`: If the request does not exist.

## Disasters

### `POST /disasters`

Create a new disaster event (Admin only).

**Payload**:

```json
{
  "name": "Flood in City X",
  "description": "Severe flooding...",
  "location": {
    "lat": 12.34,
    "lng": 56.78
  }
}
```

**Response**:

- `201 Created`: Returns the created Disaster object.

### `GET /disasters`

List all active disasters.

**Response**:

- `200 OK`: Returns a list of Disaster objects.
