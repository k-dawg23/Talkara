# Project history — Talkara

Chronological record of how the app was built. **Initial development phases** cover the original phased plan; **Post-plan fixes & enhancements** cover everything after that, ordered by date.

---

## Initial development phases

### 2026-03-17 — Phase 0: Repository and scaffolding

- Astro project scaffold; Tailwind CSS v4 (`@theme` in `src/styles/global.css`).
- HTMX + htmx-ext-sse packages; SSR with `@astrojs/node`.
- Shared layout `src/layouts/Layout.astro` loading HTMX and SSE extension.
- Docker Compose for local Postgres; `.env.example` with `DATABASE_URL`.
- Drizzle: `drizzle.config.ts`, `src/db/schema.ts` (rooms + messages), `src/db/client.ts`, initial migration under `drizzle/`.

### 2026-03-17 — Phase 1: Core rooms and persisted messaging

- Nickname page `/nick` (HTTP-only cookies); room routes and list + create-room form.
- `POST /rooms/:slug/messages` persists to Postgres and broadcasts HTML via in-memory hub.
- `GET /rooms/:slug/stream` — SSE per room; room page SSR latest messages then live updates.

### 2026-03-17 — Phase 2: Scrollback / older messages

- `GET /rooms/:slug/history?before=&limit=` returns older rows as HTML.
- Top-of-list sentinel with `hx-trigger="revealed"` to prepend history.

### 2026-03-17 — Phase 3: Presence and join/leave

- In-memory presence keyed by room + `clientId` cookie.
- On SSE connect/disconnect: presence updates, online list broadcast, persisted system join/leave (live).

### 2026-03-17 — Phase 4: Typing indicators

- Typing TTL store and `POST /rooms/:slug/typing`; composer sends throttled updates; SSE updates typing line.

### 2026-03-17 — Phase 5: Polish and robustness

- Composer UX (Enter to send, Shift+Enter newline).
- Chat fragments target `#messages`; presence/typing use OOB swaps into their panels.

### 2026-03-17 — Phase 6: GitHub repository

- Public repo: `https://github.com/k-dawg23/Talkara` (`main`).

---

## Post-plan fixes & enhancements

### 2026-03-17 — Reliability, realtime, and room list

- **`/nick` POST** moved to **`POST /api/nick`** with form `action` update.
- **Lobby** auto-create when missing (avoid redirect loops).
- **`DATABASE_URL`** defaults to Docker Compose URL in non-production when unset.
- **Hub / presence / typing** stored on `globalThis` in dev so POST and SSE share state.
- **Chat rows** append to `#messages` (`beforeend`); vendor **HTMX** + **htmx-sse** under `public/vendor/` (layout loads from `/vendor/…`, `is:inline`).
- **Composer** clears after successful send (delayed clear so POST completes first).
- **Room list:** SSE event **`roomsUpdated`** on new room; list refreshes via `GET /rooms/list`.

### 2026-03-18 — Brand theme, responsive layout, and PR #1

- **talkara_classic** palette from logo; `tc-*` tokens; `global.css` grid (`.chat-grid`): 3 columns (≥1024px), 2 columns (768px), mobile bottom tabs (&lt;768px).
- Logo on landing / nick / room header; presence panel green dots + online count.
- Merged: [PR #1](https://github.com/k-dawg23/Talkara/pull/1) (`feature/talkara-classic-theme`).

### 2026-03-18 — Light theme and toggle

- **talkara_light** via `[data-theme="light"]` overrides on CSS variables.
- Blocking `<head>` script + `toggleTheme()` + sun/moon control on login pages and room header.

### 2026-03-18 — Logout, presence hardening, history UX, delete room

- **`POST /api/logout`** clears cookies; **Logout** in header.
- Presence **dedupe** and **stale cleanup** (~30s); duplicate nickname handling.
- **Message dates** (relative day + time); **system messages** filtered out of initial/history queries (live join/leave still via SSE).
- **Auto-focus** composer in room; **delete room** (non-Lobby) with confirm + **`roomsUpdated`** broadcast.

### 2026-03-20 — @mentions and notifications

- Composer **`@`** dropdown (online users, `@everyone`); keyboard navigation; server **`renderBodyWithMentions`**; **`GET /rooms/:slug/online-names`** JSON.
- Optional **Notification** API — bell in header.
- **`presenceTouch`** on SSE keepalive so autocomplete stays in sync with presence TTL.
- **`excludeClientId`** on SSE message events so posters don’t see duplicate lines (POST + SSE).

### 2026-03-20 — Message grouping and HTMX targets

- Consecutive **user** messages grouped (`.message-continue` / `.message-start`); **regroupMessages()** debounced on DOM / HTMX swaps.
- Chat uses **`sse-swap` / `hx-target="#messages"`** on `#messages` (no OOB for chat lines); presence/typing remain OOB.

### 2026-03-20 — Avatar colours

- **`avatar-colors.ts`**: session palette + hash fallback; **`getAvatarColorForDisplay`** aligns SSR/history/post with presence dots.

### 2026-03-21 — Railway and production hardening

- **`astro.config.mjs`**: `server.host: true` for **0.0.0.0**; **`package.json` `start`**: migrate + **`node ./dist/server/entry.mjs`**.
- **`src/db/client.ts`**: TLS for non-localhost Postgres; **`stream.ts`**: **`X-Accel-Buffering: no`**; **`cookies`**: **`secure`** in production.
- **`railway.toml`**, **`.cursor/mcp.json`**, **`@railway/cli`** devDependency; deploy docs in README (later split to **RAILWAY_SETUP.md**).

### 2026-03-21 — Docker image on Railway

- **Nixpacks** often picked wrong Node (18 / 22.11) or **`EBUSY`** on double **`npm ci`**. Added root **`Dockerfile`** (`node:22-bookworm-slim`), **`.dockerignore`**, **`builder = "DOCKERFILE"`** in **`railway.toml`**; **`nixpacks.toml`** optional for non-Docker builds.

### 2026-03-21 — Room page UX (mobile header + scroll)

- Header stacks on **narrow viewports (≤480px)**: row 1 logo + title, row 2 actions.
- On room enter: scroll message list to **latest**; keep focus in composer — [PR #5](https://github.com/k-dawg23/Talkara/pull/5).

### 2026-03-22 — Landing copy

- Home page tagline simplified to **“Multi-room chat.”** (removed internal stack list) — [PR #6](https://github.com/k-dawg23/Talkara/pull/6).

### 2026-03-22 — Documentation pass

- **`README.md`**: overview, tech stack table, screenshots from **`public/Screenprints/`**, feature list, local build/run, link to **`RAILWAY_SETUP.md`**.
- **`RAILWAY_SETUP.md`**: Railway-only steps (CLI, Postgres + web service, `DATABASE_URL`, Dockerfile, troubleshooting).
- **`PROJECT_HISTORY.md`**: this chronological rewrite.
