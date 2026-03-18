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

## Phase 1 — Core rooms + persisted messaging (completed 2026-03-17)

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

## Phase 5 — Polish + robustness (completed 2026-03-17)

### Steps taken (so far)
- Improved chat composer UX (Enter to send, Shift+Enter for newline).
- Ensured SSE message swaps append to the message list and presence/typing updates apply via out-of-band swaps.

## Phase 6 — GitHub repo creation + linking (completed 2026-03-17)

### Steps taken
- Initialized a new git repository in `Talkara/`.
- Created a public GitHub repository and pushed `main`.

### Repo
- `https://github.com/k-dawg23/Talkara`

## talkara_classic theme & responsive layout (completed 2026-03-18)

### Theme
- Derived a full **talkara_classic** color palette from the logo SVG gradient (`#1f9be3` blue → `#f3fc41` yellow-green) and text fills (`#0e5278`, `#0d2736`).
- Registered the palette as a Tailwind v4 `@theme` in `src/styles/global.css` — 11-stop scale (`tc-50` through `tc-950`) plus `accent`, `accent-dim`, and `accent-bright`.
- Replaced all `zinc-*` / `bg-white` utility classes with `tc-*` tokens across pages, server-rendered HTML fragments (messages, room list, history sentinel, presence, typing), and the shared layout.
- Added `import "../styles/global.css"` to `Layout.astro` so the theme and grid styles are actually loaded.

### Logo usage
- **Login pages** (`index.astro`, `nick.astro`): full-size logo (`h-24 w-24`) centered above the form, with a subtle shadow glow and gradient orb background.
- **Room page** (`rooms/[slug].astro`): small logo (`h-8 w-8`) in the header bar, linking back to the lobby.

### Responsive layout (based on Layout_Ideas.odt)
- **Desktop (≥ 1024 px)**: 3-column CSS Grid — rooms sidebar (260 px) | chat (fluid) | online sidebar (220 px).
- **Tablet (768–1023 px)**: 2-column CSS Grid — rooms + online stacked in left column (240 px) | chat (fluid).
- **Mobile (< 768 px)**: single-view with a **bottom tab bar** (Chat / Rooms / Online) for panel switching; active tab highlighted with the `accent` color.
- Grid rules live in `global.css` using `.chat-grid` / `.grid-rooms` / `.grid-chat` / `.grid-online` classes with `@media` breakpoints.

### Presence panel enhancements
- Each online user now shows a green dot status indicator.
- Online count displayed next to the "Online" heading.

### PR
- Merged via [PR #1](https://github.com/k-dawg23/Talkara/pull/1) (`feature/talkara-classic-theme` → `main`).

### Files changed (9)
| File | Change |
|------|--------|
| `src/styles/global.css` | `@theme` tokens + responsive `.chat-grid` CSS |
| `src/layouts/Layout.astro` | CSS import, `tc-*` body colors, favicon link |
| `src/pages/index.astro` | Full-size logo, gradient orbs, themed button |
| `src/pages/nick.astro` | Full-size logo, themed form/inputs |
| `src/pages/rooms/[slug].astro` | 3-col grid layout, mobile tabs, small header logo |
| `src/server/render.ts` | `zinc-*` → `tc-*` in message HTML |
| `src/server/presence.ts` | Green dots, online count, `tc-*` classes |
| `src/pages/rooms/list.ts` | `tc-*` active/inactive room styles |
| `src/pages/rooms/[slug]/history.ts` | `tc-*` sentinel classes |

## talkara_light theme & theme switching (completed 2026-03-18)

### Light palette
- Created **talkara_light** by adding a `[data-theme="light"]` rule in `global.css` that overrides every `--color-tc-*` and `--color-accent*` custom property.
- Backgrounds inverted: `tc-950` → `#f0f6fb` (page bg), `tc-900` → `#ffffff` (panels), `tc-800` → `#c4d9e8` (borders).
- Text inverted: `tc-50` → `#0d2736` (primary text), `tc-100` → `#1a3a50` (headings), `tc-200` → `#3d6a82` (secondary).
- Primary blue (`tc-500`) stays at `#1f9be3`; hover darkens (`tc-400` → `#1684c7`) instead of lightening for better contrast on white.
- Accent changed from bright yellow-green to a contrast-safe dark gold (`#8a7d00`) so active tab indicators and highlights remain legible on light backgrounds.

### Theme switching mechanism
- **Blocking `<head>` script** in `Layout.astro` reads the saved theme from `localStorage` (or falls back to `prefers-color-scheme`) and sets `data-theme` on `<html>` before first paint — no flash of wrong theme.
- **`toggleTheme()` global function** flips between `classic` and `light`, updates `data-theme`, persists to `localStorage`, and swaps the toggle icon.
- **Toggle button** placed in the room page header (between room name and "Change nick") and in the top-right corner of both login pages. Uses Lucide-style inline SVG: sun icon in classic mode, moon icon in light mode.

### How it works (CSS only, no server changes)
- The `@theme` block defines classic (dark) values as defaults on `:root`.
- The `[data-theme="light"]` selector overrides those same CSS custom properties with light values.
- All Tailwind utility classes (`bg-tc-950`, `text-tc-50`, `border-tc-800`, etc.) reference `var(--color-tc-*)`, so they automatically reflect the active theme — zero changes needed in server-rendered HTML fragments.

### Files changed (5)
| File | Change |
|------|--------|
| `src/styles/global.css` | `[data-theme="light"]` overrides for all `tc-*` and `accent` tokens |
| `src/layouts/Layout.astro` | Blocking theme-init script in `<head>`, `toggleTheme()` + icon logic at end of `<body>` |
| `src/pages/index.astro` | Theme toggle button (top-right) |
| `src/pages/nick.astro` | Theme toggle button (top-right) |
| `src/pages/rooms/[slug].astro` | Theme toggle button in header |

## Notes / future improvements
- (none currently tracked here)

## Post-plan fixes & enhancements (completed 2026-03-17)

### Reliability / correctness fixes
- Fixed `/nick` submission by moving POST handling to a dedicated endpoint (`POST /api/nick`) and updating the form `action` accordingly.
- Fixed a Lobby auto-create bug that could cause infinite redirects when the Lobby row was missing.
- Improved local dev startup:
  - `DATABASE_URL` now defaults to the docker-compose Postgres URL in non-production when unset (still required in production).

### Realtime delivery fixes
- Stabilized in-memory realtime state in dev by storing hub/presence/typing maps on `globalThis` so POST handlers and SSE handlers share the same broadcasters.
- Switched SSE delivery to use `hx-swap-oob` fragments for messages/presence/typing, routed through a hidden SSE sink element to avoid swap-target ambiguity.
- Fixed HTMX loading failures by bundling vendor scripts locally:
  - Added `public/vendor/htmx.min.js` and `public/vendor/htmx-sse.min.js`
  - Updated the layout to load them from `/vendor/...` and marked them `is:inline` to avoid Astro/Vite dev bundling errors.

### UX improvements
- Composer clear behavior fixed so the message submits first, then the textarea clears (delayed clear).

### Live room list updates (implemented)
- Implemented **room list broadcasting**:
  - On room creation, server broadcasts an SSE `roomsUpdated` event to all connected tabs.
  - Tabs refresh the rooms list via `GET /rooms/list?current=<slug>` with `hx-trigger="sse:roomsUpdated"` (no refresh needed).

