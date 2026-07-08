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
