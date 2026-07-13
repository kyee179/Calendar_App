# API Contract

Base URL in development: `http://127.0.0.1:4010`

All request and response bodies are JSON unless otherwise noted.

## Health

### `GET /health`

Response `200`:

```json
{
  "ok": true,
  "service": "study-calendar-api"
}
```

## Time

### `GET /api/time`

Returns server-local time information.

Response `200`:

```json
{
  "now": "2026-07-08T19:30:00.000Z",
  "localTime": "8:30:00 PM",
  "localDate": "7/8/2026",
  "timezone": "Europe/London"
}
```

## Settings

### `GET /api/settings`

Response `200`:

```json
{
  "timezone": "Europe/London",
  "locale": "en-US",
  "weekStartsOn": 0,
  "defaultNotifyMinutesBefore": 15
}
```

### `PUT /api/settings`

Request body may include:

```json
{
  "timezone": "Europe/London",
  "locale": "en-US",
  "weekStartsOn": 1,
  "defaultNotifyMinutesBefore": 10
}
```

Response `200`: updated settings object.

## Events / Reminders

### Event Object

```json
{
  "id": "uuid",
  "title": "Read React docs",
  "startsAt": "2026-07-08T09:00:00.000Z",
  "endsAt": "2026-07-08T10:00:00.000Z",
  "calendarType": "study",
  "location": "Library",
  "notes": "Focus on hooks and state.",
  "color": "#16a34a",
  "notifyMinutesBefore": 15,
  "notificationFormat": "Desktop notification",
  "repeat": "none",
  "createdAt": "2026-07-08T08:00:00.000Z",
  "updatedAt": "2026-07-08T08:00:00.000Z"
}
```

Allowed `calendarType` values:

- `personal`
- `study`
- `vacation`
- `holiday`
- `birthday`
- `other`

Allowed `repeat` values:

- `none`
- `daily`
- `weekly`
- `monthly`
- `yearly`

### `GET /api/events?from={iso}&to={iso}`

Returns events overlapping the requested date range.

Response `200`:

```json
[
  {
    "id": "uuid",
    "title": "Read React docs",
    "startsAt": "2026-07-08T09:00:00.000Z",
    "endsAt": "2026-07-08T10:00:00.000Z",
    "calendarType": "study",
    "notificationFormat": "Desktop notification"
  }
]
```

### `POST /api/events`

Request body:

```json
{
  "title": "Read React docs",
  "startsAt": "2026-07-08T09:00:00.000Z",
  "endsAt": "2026-07-08T10:00:00.000Z",
  "calendarType": "study",
  "location": "Library",
  "notes": "Focus on hooks and state.",
  "color": "#16a34a",
  "notifyMinutesBefore": 15,
  "notificationFormat": "Desktop notification",
  "repeat": "none"
}
```

Response `201`: created event object.

Validation error `400`:

```json
{
  "errors": ["title is required"]
}
```

### `PUT /api/events/{id}`

Request body: any editable event fields.

Response `200`: updated event object.

Response `404`:

```json
{
  "error": "Event not found"
}
```

### `DELETE /api/events/{id}`

Response `204`: no body.

## Journals

### Journal Object

```json
{
  "id": "uuid",
  "type": "daily",
  "journalDate": "2026-07-13",
  "title": "Journal 2026-07-13",
  "content": "I finished one assessment and should work on the dissertation experiment.",
  "bookmarked": true,
  "tags": [],
  "createdAt": "2026-07-13T12:00:00.000Z",
  "updatedAt": "2026-07-13T12:00:00.000Z"
}
```

Allowed `type` values are `daily` and `weekly`.

### `GET /api/journals?type=daily&bookmarked=true`

Returns journals sorted by most recently updated.

### `POST /api/journals`

Creates a journal. Required fields: `type`, `journalDate`, `title`, and `content`.

### `PUT /api/journals/{id}`

Updates editable journal fields, including `bookmarked`.

### `DELETE /api/journals/{id}`

Deletes a journal and its saved analysis.

### `POST /api/journals/{id}/analyze`

Analyzes a journal with the configured AI provider. If the provider is missing an API key or fails, the server falls back to the local rule-based analyzer.

Request body may include availability windows:

```json
{
  "availability": [
    { "label": "Evening", "startsAt": "20:00", "endsAt": "24:00" }
  ]
}
```

Response `201`:

```json
{
  "id": "uuid",
  "journalId": "uuid",
  "provider": "local",
  "model": "rule-based-v1",
  "summary": "Found 3 planning signals across the journal text.",
  "weeklySummary": "This week mainly involved job search and dissertation.",
  "tasks": [
    {
      "title": "Finish remaining job assessment",
      "priority": "high",
      "urgency": "high",
      "estimatedMinutes": 90,
      "confidence": "medium",
      "reason": "Detected from journal wording and planning keywords."
    }
  ],
  "scheduleDrafts": [
    {
      "title": "Work on project",
      "startsAt": "2026-07-13T19:00:00.000Z",
      "endsAt": "2026-07-13T21:00:00.000Z",
      "calendarType": "study",
      "notifyMinutesBefore": 15,
      "notificationFormat": "Desktop notification",
      "source": "journal analysis",
      "rationale": "Detected from journal wording and planning keywords.",
      "confidence": "medium"
    }
  ],
  "cautions": []
}
```

### AI Provider Environment Variables

- `AI_PROVIDER`: `local`, `openai`, `gemini`, or `groq`.
- `OPENAI_API_KEY` / `OPENAI_MODEL`
- `GEMINI_API_KEY` / `GEMINI_MODEL`
- `GROQ_API_KEY` / `GROQ_MODEL`

The frontend always shows AI output as a draft. Calendar events are created only after the user clicks `Apply Drafts`.