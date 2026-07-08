# Study Calendar

Study Calendar is a learning-focused desktop calendar built with React, Node.js, and Electron. It displays the current date and time, shows a month calendar and agenda, stores reminders locally, and lets users create, edit, delete, and preview notifications in this format:

```text
time: a to b; title; notification format
```

The project is intentionally small enough to understand while still using a realistic software-development pipeline: API contracts, validation, linting, automated tests, GitHub Actions, and Electron release packaging.

## Features

- Month and agenda views
- Current date, current time, and local timezone display
- Reminder CRUD: create, edit, delete, and list reminders
- Reminder fields: start/end time, title, notification format, notes, category, repeat, location, color, and notify-before time
- Basic calendar categories: personal, study, vacation, holiday, birthday, and other
- Desktop notifications when the app is open and notification permission is granted
- Local JSON storage through a Node.js API
- Electron shell for a desktop app
- GitHub Actions CI and release workflow

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Desktop: Electron
- Tests: Vitest
- Linting: ESLint
- Packaging: electron-builder

## Local Development

Prerequisites:

- Node.js 20 or newer
- pnpm 9 or newer
- Git
- Optional for publishing: GitHub CLI (`gh`)

Install dependencies:

```bash
pnpm install
```

Run the API, React app, and Electron together:

```bash
pnpm dev
```

Run only the backend:

```bash
pnpm start:api
```

Run validation:

```bash
pnpm lint
pnpm test
pnpm build
```

Build desktop installers:

```bash
pnpm build:desktop
```

The packaged desktop app is written to `release/`.

## API Contract

See [docs/API.md](docs/API.md).

## Data Schema

See [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md).

## Project Structure

```text
.
├── electron/              # Electron main process and preload script
├── server/                # Express API and JSON storage
├── src/                   # React frontend
├── docs/                  # API and data documentation
├── .github/               # CI, release workflow, issue templates
├── package.json
└── README.md
```

## Roadmap

- Add recurring-event expansion in the UI
- Add drag-and-drop event movement
- Add import/export for `.ics` calendar files
- Add SQLite storage
- Add AI planning features after the core calendar is stable

## License

MIT
