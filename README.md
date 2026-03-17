## Talkara

Multi-room live chat using **Astro SSR + HTMX + SSE + Postgres + Drizzle**, styled with **Tailwind CSS**.

## Requirements
- Node.js (see `package.json` engines)
- Docker + Docker Compose (recommended for Postgres)

## Setup
From the `Talkara/` directory:

1. Start Postgres:
   - `docker compose up -d`

2. Configure environment:
   - `cp .env.example .env`

3. Install dependencies:
   - `npm install`

4. Run DB migrations:
   - `npm run db:migrate`

5. Run the app:
   - `npm run dev`

Astro dev server runs at `http://localhost:4321` by default.

## Useful scripts
- `npm run db:generate` — generate SQL migrations from `src/db/schema.ts`
- `npm run db:migrate` — apply migrations to the configured `DATABASE_URL`

## Project log
See `PROJECT_HISTORY.md` for a phase-by-phase record of what was built and why.
