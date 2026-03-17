# PROJECT HISTORY — Talkara

This file is updated at the end of each phase to record what changed, how to run it, and what to look at later.

## Phase 0 — Repo + scaffolding (completed 2026-03-17)

### Steps taken
- Created Astro project scaffold (minimal template).
- Added Tailwind CSS integration.
- Added HTMX + HTMX SSE extension packages.
- Enabled Astro SSR with Node adapter (`@astrojs/node`).
- Added a shared layout (`src/layouts/Layout.astro`) that loads HTMX and the SSE extension.
- Added local development database via Docker Compose (`docker-compose.yml`).
- Added environment template (`.env.example`) with `DATABASE_URL`.
- Added Drizzle ORM setup:
  - `drizzle.config.ts`
  - Schema in `src/db/schema.ts` (rooms + messages + enum)
  - DB client in `src/db/client.ts`
  - Generated initial migration in `drizzle/`

### Tech stack
- **Astro** (SSR)
- **@astrojs/node** (standalone adapter)
- **HTMX** + **htmx-ext-sse**
- **Tailwind CSS**
- **PostgreSQL** (Docker)
- **Drizzle ORM** + **drizzle-kit**

### Features delivered
- SSR-capable Astro app baseline (landing page wired through shared layout).
- Database schema + migration generated for rooms/messages.

### How to run (Phase 0)
1. From `Talkara/`:
   - `docker compose up -d`
   - `cp .env.example .env`
   - `npm install`
   - `npm run dev`

### Notes
- Next phases will add real chat UI, room routes, SSE stream endpoints, persistence, history pagination, presence, typing, and GitHub repo linking.

## Phase 1 — Core rooms + persisted messaging (in progress)

### Steps taken (so far)
- Started Postgres via Docker Compose and applied Drizzle migrations.
- Implemented nickname picker page at `/nick` (cookie-based).
- Implemented room page `/rooms/:slug` with rooms list + create-room form.
- Implemented message send flow: `POST /rooms/:slug/messages` saves to Postgres and broadcasts HTML to connected clients.
- Implemented SSE stream per room at `/rooms/:slug/stream` that pushes HTML fragments via in-memory room hub.
- Room page now server-renders the latest persisted messages on initial load, then continues live via SSE.

### Tech stack (unchanged)
- Astro SSR + Node adapter, HTMX + SSE extension, Tailwind, Postgres, Drizzle ORM.

## Phase 2 — Scrollback / older messages (in progress)

### Steps taken (so far)
- Added `GET /rooms/:slug/history?before=<iso>&limit=50` to return older persisted messages as HTML.
- Implemented top-of-list sentinel with `hx-trigger="revealed"` to load and prepend older messages.

## Phase 3 — Presence + join/leave system messages (in progress)

### Steps taken (so far)
- Added in-memory presence store keyed by room + `clientId` cookie.
- On SSE connect/disconnect: update presence, broadcast live online list, and persist/broadcast system join/leave messages.

## Phase 4 — Typing indicators (in progress)

### Steps taken (so far)
- Added in-memory typing TTL store and `POST /rooms/:slug/typing` endpoint.
- Client pings typing status from the composer; server broadcasts a live “is typing…” indicator via SSE.

## Phase 5 — Polish + robustness (in progress)

### Steps taken (so far)
- Improved chat composer UX (Enter to send, Shift+Enter for newline).
- Ensured SSE message swaps append to the message list and presence/typing updates apply via out-of-band swaps.

