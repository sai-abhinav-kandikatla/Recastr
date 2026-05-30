# API specification

All API responses should use JSON unless returning a file or SSE stream.

Error shape:

```json
{
  "error": "Human readable error",
  "code": "machine_code",
  "status": 400
}
```

## Ingestion

### POST `/api/ingest/url`

Purpose: Ingest YouTube or blog URL.

Request:

```json
{ "url": "https://example.com/source" }
```

Validation:
- `url` must be a valid URL.

Response:

```json
{
  "projectId": "project-id",
  "title": "Source title",
  "duration": 0,
  "wordCount": 1200,
  "project": {}
}
```

Errors:
- `validation_error`
- `ingest_failed`
- `extraction_failed`
- `video_processing_unavailable`

### POST `/api/ingest/text`

Purpose: Create a project from raw text or uploaded text file.

Request:

```json
{ "title": "My source", "text": "Long source text..." }
```

Validation:
- `title` optional, min 3 if present.
- `text` min 20.
- HTML is stripped.
- Text is truncated to 16,000 words.

## Generation

### GET `/api/generate`

Purpose: Legacy SSE route for platform output cards.

Query:
- `projectId`
- `platforms`
- `tone`

Response:
- `text/event-stream`
- Emits JSON events with `platform`, `outputType`, `content`, `done`.

### POST `/api/generate`

Purpose: Stream generated text tokens for advanced generation surface.

Request:

```json
{
  "projectId": "project-id",
  "platforms": ["TWITTER", "LINKEDIN"],
  "contentTypes": ["tweet", "linkedin"],
  "tone": "casual",
  "hookId": "optional-hook-id"
}
```

Response:
- `text/event-stream`
- Emits `data: {"token":"..."}` and ends with `data: [DONE]`.

Rate limit:
- 10 requests per minute per user.

## Tone

### POST `/api/tone`

Purpose: Rewrite content in a selected tone.

Request:

```json
{
  "contentId": "content-id",
  "tone": "educational",
  "content": "Draft content"
}
```

Response:

```json
{ "rewritten": "New content", "content": "New content" }
```

## Projects

### GET `/api/projects`

Purpose: List authenticated user's projects.

Response:

```json
[]
```

### POST `/api/projects`

Purpose: Create a basic project.

Request:

```json
{
  "title": "Project title",
  "sourceType": "TEXT",
  "transcript": "Optional transcript"
}
```

### GET `/api/projects/[id]`

Purpose: Fetch one project by id.

Authorization:
- User must own the project unless it is a demo/stored local project.

## Schedule

### GET `/api/schedule`

Purpose: Return scheduled posts grouped by date.

### POST `/api/schedule`

Request:

```json
{
  "contentId": "content-id",
  "scheduledAt": "2026-06-01T09:00:00.000Z",
  "platform": "LINKEDIN"
}
```

Validation:
- Content id or output id required.
- Scheduled date must be in the future.
- Platform must be supported.

Authorization:
- Content must belong to the authenticated user.

## Jobs

### GET `/api/jobs/[id]/status`

Purpose: Return async job status.

Response:

```json
{
  "status": "processing",
  "progress": 42,
  "result": null
}
```

## Export

### POST `/api/export/pdf`

Returns:
- `application/pdf`

### POST `/api/export/csv`

Returns:
- `text/csv`

### POST `/api/export/json`

Returns:
- `application/json`

## Billing

### POST `/api/razorpay/checkout`

Purpose: Create Razorpay order.

Request:

```json
{ "plan": "PRO", "interval": "monthly" }
```

Response:

```json
{
  "orderId": "order_x",
  "amount": 99900,
  "currency": "INR",
  "key": "rzp_key_id"
}
```

### POST `/api/razorpay/webhook`

Purpose: Verify Razorpay webhook and update plan.

Security:
- Requires `x-razorpay-signature`.
- Uses HMAC SHA-256 timing-safe comparison.

## Monitoring requirements

Every mutating endpoint should record:
- User id
- Action
- Entity type/id
- Request id
- Error code if failed

Implemented audit logging:
- Project creation
- Scheduling
- Checkout order creation
