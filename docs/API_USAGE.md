# API Usage (v1)

Base URL: `http://localhost:3000/api/v1`

## 1) Health Check

### Request

`GET /health`

### Success Response

```json
{
  "status": "ok",
  "service": "comments-summarizer-backend",
  "version": "v1",
  "timestamp": "2026-04-01T12:00:00.000Z"
}
```

## 2) Analyze Comments

### Request

`POST /analyze`

```json
{
  "source": "youtube",
  "comments": [
    "This video is very clear.",
    "Please upload the next episode.",
    "The summary is helpful."
  ],
  "language": "zh",
  "max_sentences": 3
}
```

### Request Schema

- `source`: string, default `"unknown"`, min 1, max 100
- `comments`: string[], required, min 1 item, max 200 items
- `language`: enum(`"zh" | "en"`), default `"zh"`
- `max_sentences`: int, default `3`, range 1-10

### Success Response

```json
{
  "request_id": "a2b8f0c9-cbf4-4abf-90f3-2d4ded5b8b0a",
  "summary": "This video is very clear.; Please upload the next episode.; The summary is helpful.",
  "meta": {
    "source": "youtube",
    "language": "zh",
    "comments_count": 3,
    "strategy": "basic-v1-local-summary"
  }
}
```

### Error Response (Unified)

```json
{
  "request_id": "a2b8f0c9-cbf4-4abf-90f3-2d4ded5b8b0a",
  "error_code": "INVALID_REQUEST",
  "message": "Request body validation failed.",
  "details": {}
}
```

Error fields guaranteed in v1: `error_code`, `message`, `request_id`.
