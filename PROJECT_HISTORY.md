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

## Recent fixes & features (2026-03-18)

### Logout feature
- Added `POST /api/logout` endpoint that clears `nickname` and `clientId` cookies and redirects to `/nick`
- Added **Logout** button to room page header (next to "Change nick")

### Presence deduplication fix
- Fixed duplicate usernames appearing in online list after logout/reconnect
- Added stale entry cleanup (30-second threshold) to remove ghost entries
- On `presenceJoin`, remove existing entries with same nickname before adding new entry
- Deduplicate nicknames when rendering presence list to ensure each user appears only once

### Message dates and history filtering (completed 2026-03-18)
- Added visible dates to all messages showing relative date (Today/Yesterday/Date) + time
- Filtered out system join/leave messages from **initial load** and **history** (`GET …/history`) queries — old join/leave are not shown when loading or scrolling; the presence panel shows who’s online. **Live** join/leave for connected users still appears via SSE.

### Auto-focus and room deletion (completed 2026-03-18)
- Chat input automatically focused when joining a room (via inline script)
- Added room deletion feature:
  - `deleteRoomBySlug()` function in `src/server/rooms.ts` (Lobby protected from deletion)
  - `POST /rooms/:slug/delete` endpoint in `src/pages/rooms/[slug]/delete.ts`
  - Delete button in room header (only shown for non-Lobby rooms)
  - Confirmation dialog before deletion
  - Broadcasts `roomsUpdated` event after deletion to refresh all clients
- Files changed: `src/server/rooms.ts`, `src/pages/rooms/[slug]/delete.ts`, `src/pages/rooms/[slug].astro`

## @mentions (completed 2026-03-20)

### Behaviour
- Composer: type `@` then letters to filter **online** users in the current room (prefix match, case-insensitive). `@everyone` appears as **@everyone (all)** and inserts `@everyone `.
- Keyboard: **↑/↓** to move selection, **Enter** or **Tab** to insert, **Esc** to close. **Shift+Enter** still inserts a newline; **Enter** sends when the dropdown is closed.
- The dropdown excludes your own nickname from the list (you can still type `@YourName` manually).
- Messages: server wraps `@everyone` (word boundary) and `@non-whitespace tokens` in `<span class="mention">`; client adds `mention-self` when the token is you or `@everyone`.
- Notifications: optional **Notification** API — bell button in the header requests permission; alerts fire for incoming messages from other users whose text matches `@<your nickname>` (case-insensitive) or `@everyone`.

### Files
| File | Change |
|------|--------|
| `src/server/render.ts` | `renderBodyWithMentions`, `message-user` / `msg-body` markup, `data-author` |
| `src/server/presence.ts` | `listOnlineNicknames()` |
| `src/pages/rooms/[slug]/online-names.ts` | `GET` JSON for mention autocomplete |
| `src/pages/rooms/[slug].astro` | Dropdown UI, composer wrapper, mention + notification scripts, bell button |
| `src/styles/global.css` | `.mention` / `.mention-self` |

### Presence TTL + mention list (fix 2026-03-20)
- **Bug**: Online nicknames for `@` autocomplete come from `listOnlineNicknames`, which runs `cleanupStale` (30s). `lastSeenMs` was only set on SSE connect, so after ~30s connected users were dropped from the map while the presence panel DOM could still look full until the next broadcast — autocomplete showed only `@everyone`.
- **Fix**: Call `presenceTouch(roomId, clientId)` on each SSE keepalive ping (`stream.ts`, same interval as `ping`).

### Duplicate message for sender (fix 2026-03-20)
- **Bug**: The sender saw each new line twice: `POST /messages` returned the same fragment that was broadcast over SSE — duplicate append to `#messages`.
- **Fix**: `RoomEvent` message payloads may include `excludeClientId`; the SSE subscriber in `stream.ts` skips those events when `excludeClientId === clientId`. `messages.ts` passes the poster’s `clientId` from cookies.

## Message grouping (completed 2026-03-20)

### Behaviour
- Consecutive **user** messages from the **same nickname** render as a group: the **first** message shows a circular **avatar** (first letter of nickname), **name**, **timestamp**, and body; **continuations** hide the avatar (keeps column width) and meta row via `.message-continue` and CSS in `global.css`.
- A **system** message (join/leave, etc.) or a **different** user breaks the group **when that line is present in the DOM** (see below).
- **Initial load** and **history** queries **exclude** persisted system messages (same policy as pre-grouping): scrollback is user-only; old join/leave stay hidden. Grouping uses consecutive **user** rows in those result sets.
- **Live** join/leave still inserted via SSE and appears between messages; they break groups and `regroupMessages()` keeps classes correct.
- **New message** (`POST /messages`): continuation uses the previous **persisted** row in the room (`id` &lt; new message), including system rows in the DB — so a join/leave stored between two chats from the same user still prevents a false continuation on the server.
- `regroupMessages()` in the room page script (debounced on `#messages` child-list mutations + `htmx:afterSwap` for history) keeps grouping correct when older user messages are prepended.

### Note (2026-03-20)
- Restored filtering system messages from initial/history after a brief period of showing them for grouping-only reasons — presence panel + live SSE cover join/leave relevance.

### Realtime grouping (fix 2026-03-20)
- **Issue**: `regroupMessages()` ran synchronously from `MutationObserver` / `htmx:afterSettle` before HTMX finished applying **out-of-band** swaps into `#messages` from SSE (`htmx:sseMessage` / swap on `#sseSink`) and POST responses, so continuation classes were wrong until full reload.
- **Fix (first pass)**: Coalesced `scheduleRegroup()` via `setTimeout(0)` + `requestAnimationFrame`, plus listeners on `htmx:afterSwap`, `htmx:sseMessage`, and `htmx:afterSettle` — still raced the OOB pipeline.
- **Fix (second pass)**: Run `regroupMessages()` **only** on **`htmx:oobAfterSwap`** when `evt.detail.target.id === 'messages'` — still wrong for live inserts because chat rows were not reliably going through that path.
- **Fix (third pass)**: Stop using `hx-swap-oob` on chat `<li>` in `renderMessageLi`. Put `sse-swap="message"` + `hx-swap="beforeend"` on `#messages` and `hx-target="#messages"` on the composer so POST and SSE append the same plain fragment as SSR. Presence/typing still use OOB to their panels. Client: debounced `regroupMessages()` on direct children of `#messages` and `htmx:afterSwap` when target is `#messages` or `#historySentinel`. Trim nicknames when comparing authors (server + client).

## Per-user avatar colours (completed 2026-03-20)

### Behaviour
- **`src/server/avatar-colors.ts`**: Curated saturated palette (white initials, readable on both themes). **`getOrAssignSessionAvatarColor(clientId)`** picks a random palette entry on first use per connection; **`releaseSessionAvatarColor`** clears it on disconnect or when a duplicate nickname evicts another tab. **`getAvatarColorForNickname(nickname)`** is a stable hash into the same palette when no live session is available (offline / not in presence).
- **Presence** (`presenceJoin` / `presenceLeave`, duplicate-nick eviction): assigns or releases session colours so they stay consistent across rooms until the session ends.
- **Message avatars** (`renderMessageLi`): optional `avatarBg`; inline `background-color` plus **`global.css`** rules on `.message-avatar` — dark outer border + light inset edge so circles stay visible on light and dark chat backgrounds.
- **Online panel**: Replaced generic green dots with **`.avatar-color-dot`** using the same session colour as that user’s `clientId` (dedupe-by-nickname logic unchanged).

### Aligning online list with message bubbles (fix 2026-03-20)
- **Issue**: The sidebar used **session** colours from presence, while SSR and history used only the **nickname hash**, so colours often **did not match** for people who were online.
- **Fix**: **`getAvatarColorForDisplay(roomId, nickname, opts?)`** in `presence.ts`:
  - If the message author matches the **viewer’s nickname** and **`viewerClientId`** is set, use **`getOrAssignSessionAvatarColor`** so the viewer’s own rows match **before** SSE connects (SSR/history).
  - Else if that nickname appears in the room **presence** map, use that **`clientId`**’s session colour (same as the online dot).
  - Else fall back to **`getAvatarColorForNickname`**.
- **Call sites**: `rooms/[slug].astro` (initial messages), `history.ts` (prepend), and `messages.ts` (POST/broadcast) all use **`getAvatarColorForDisplay`** so resolution is single-sourced.

### Files
| File | Change |
|------|--------|
| `src/server/avatar-colors.ts` | New — palette, session map on `globalThis`, hash fallback |
| `src/server/presence.ts` | Join/leave/eviction hooks; `getAvatarColorForDisplay`; coloured presence OOB |
| `src/server/render.ts` | `avatarBg` on user messages; white initials |
| `src/pages/rooms/[slug].astro` | Pass `viewerClientId` / `viewerNickname` into display helper |
| `src/pages/rooms/[slug]/history.ts` | Same for prepended history rows |
| `src/pages/rooms/[slug]/messages.ts` | Uses `getAvatarColorForDisplay` for POST HTML |
| `src/styles/global.css` | `.message-avatar` + `.avatar-color-dot` borders |
| `README.md` | Feature note |

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
- Message HTML appends directly into `#messages` (`beforeend`); presence/typing SSE payloads still use `hx-swap-oob` into `#presence` / `#typing`. (Earlier experiments used a hidden SSE sink + OOB for chat rows; that was replaced for reliable grouping.)
- Fixed HTMX loading failures by bundling vendor scripts locally:
  - Added `public/vendor/htmx.min.js` and `public/vendor/htmx-sse.min.js`
  - Updated the layout to load them from `/vendor/...` and marked them `is:inline` to avoid Astro/Vite dev bundling errors.

### UX improvements
- Composer clear behavior fixed so the message submits first, then the textarea clears (delayed clear).

### Live room list updates (implemented)
- Implemented **room list broadcasting**:
  - On room creation, server broadcasts an SSE `roomsUpdated` event to all connected tabs.
  - Tabs refresh the rooms list via `GET /rooms/list?current=<slug>` with `hx-trigger="sse:roomsUpdated"` (no refresh needed).

## Railway deployment (completed 2026-03-21)

### What changed
- **`astro.config.mjs`:** `server.host: true` so standalone Node listens on **0.0.0.0**; **`PORT`** still comes from the environment (Railway injects it).
- **`package.json`:** `start` runs **`npm run db:migrate`** then **`node ./dist/server/entry.mjs`**.
- **`src/db/client.ts`:** TLS for non-localhost Postgres URLs (Railway/managed DB).
- **`src/pages/rooms/[slug]/stream.ts`:** **`X-Accel-Buffering: no`** for SSE through reverse proxies.
- **`src/server/cookies.ts`:** **`secure` cookies** in production (HTTPS on Railway).
- **`railway.toml`:** build (`npm ci && npm run build`) + deploy (`npm start`).
- **`.cursor/mcp.json`:** Railway MCP (`npx -y @railway/mcp-server`); **`@railway/cli`** in devDependencies for `npx railway`.
- **`README.md`:** Deploy steps (Postgres plugin, `DATABASE_URL` reference, SSE notes).

### Operator notes
- From `Talkara/`: `npx railway login`, `railway init` or `railway link`, add Postgres, reference **`DATABASE_URL`**, then **`npx railway up`** or GitHub-triggered deploys.

### Dockerfile on Railway (follow-up)
- Nixpacks kept picking **Node 18** or **22.11** despite `NIXPACKS_NODE_VERSION`; Astro 6 requires **`^20.19.1 || >=22.12.0`**.
- Added root **`Dockerfile`** (`node:22-bookworm-slim`), **`.dockerignore`**, and **`railway.toml`** `builder = "DOCKERFILE"` so builds use a pinned Node image.

