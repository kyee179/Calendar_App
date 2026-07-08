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
