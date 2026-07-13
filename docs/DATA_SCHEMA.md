# Data Schema

The proof of concept stores data in `server/data/calendar.json` during backend development. The packaged Electron app stores a separate `calendar.json` file inside Electron's `userData` directory.

## Root Document

```json
{
  "settings": {},
  "events": []
}
```

## Settings

| Field | Type | Description |
| --- | --- | --- |
| `timezone` | string | IANA timezone name, for example `Europe/London`. |
| `locale` | string | Display locale, for example `en-US`. |
| `weekStartsOn` | number | `0` for Sunday or `1` for Monday. |
| `defaultNotifyMinutesBefore` | number | Default reminder lead time. |

## Event

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique event identifier. |
| `title` | string | yes | User-facing reminder title. |
| `startsAt` | ISO string | yes | Start date/time. |
| `endsAt` | ISO string | yes | End date/time. |
| `calendarType` | enum | yes | `personal`, `study`, `vacation`, `holiday`, `birthday`, or `other`. |
| `location` | string | no | Optional place. |
| `notes` | string | no | Optional details. |
| `color` | hex string | no | UI color. |
| `notifyMinutesBefore` | number | yes | Minutes before start time. |
| `notificationFormat` | string | yes | User-facing notification style. |
| `repeat` | enum | yes | `none`, `daily`, `weekly`, `monthly`, or `yearly`. |
| `createdAt` | ISO string | yes | Creation timestamp. |
| `updatedAt` | ISO string | yes | Last update timestamp. |

## Future Upgrade Path

For a production-grade app, replace JSON storage with SQLite first. Keep the same API contract, then map the `events` collection to an `events` table and the `settings` object to a small key-value table.

## Journal

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique journal identifier. |
| `type` | enum | yes | `daily` or `weekly`. |
| `journalDate` | date string | yes | Journal day or week start date in `YYYY-MM-DD` format. |
| `title` | string | yes | User-facing journal title. |
| `content` | string | yes | Journal body text. |
| `bookmarked` | boolean | yes | Whether this is a precious/saved journal. |
| `tags` | string[] | no | Optional user tags. |
| `createdAt` | ISO string | yes | Creation timestamp. |
| `updatedAt` | ISO string | yes | Last update timestamp. |

## Journal Analysis

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Unique analysis identifier. |
| `journalId` | string | Source journal. |
| `provider` | string | `openai`, `gemini`, `groq`, `local`, or `local-fallback`. |
| `summary` | string | Short analysis summary. |
| `weeklySummary` | string | Weekly reflection generated from available journal context. |
| `tasks` | object[] | Extracted tasks with priority, urgency, duration, confidence, and reason. |
| `scheduleDrafts` | object[] | Draft calendar blocks. These do not become events until applied. |
| `cautions` | string[] | Provider or confidence warnings. |