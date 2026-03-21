<p align="center">
  <img src="public/logo.svg" alt="Talkara" width="120" height="120" />
</p>

<h1 align="center">Talkara</h1>

<p align="center">
  Multi-room live chat using <strong>Astro SSR + HTMX + SSE + Postgres + Drizzle</strong>, styled with <strong>Tailwind CSS</strong>.
</p>

## Themes

Talkara ships with two switchable themes derived from the logo colour palette:

| Theme | Description |
|-------|-------------|
| **talkara_classic** | Dark navy backgrounds with bright blue accents and yellow-green highlights — the default. |
| **talkara_light** | Light, airy backgrounds with the same brand blue and a contrast-safe dark gold accent. |

Toggle between them using the sun/moon button in the page header (or top-right on login screens). The choice is saved to `localStorage` and respected on reload. First-time visitors get the theme matching their OS `prefers-color-scheme` setting.

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
- `npm run build` — production SSR build (`dist/`)
- `npm start` — run migrations, then start the Astro Node standalone server (`PORT` / `HOST` from env; see below)

## Deploy on Railway (Postgres + Node)

Talkara uses **Astro `@astrojs/node` in standalone mode**: the server reads **`PORT`** (Railway sets this automatically) and **`HOST`** (defaults to **0.0.0.0** when `server.host` is `true` in `astro.config.mjs`). **`npm start`** runs **`drizzle-kit migrate`** then **`node ./dist/server/entry.mjs`**.

### Railway CLI

Install and log in (pick one):

- **npm (project-local):** `npx @railway/cli login` (after `npm install`, the CLI is in `devDependencies`)
- **Global:** `npm i -g @railway/cli` then `railway login`
- **Other installers:** [Railway CLI docs](https://docs.railway.com/guides/cli)

### Railway MCP (Cursor)

This repo includes **`.cursor/mcp.json`** so Cursor can run the official **`@railway/mcp-server`** via `npx`. You still need the CLI installed and authenticated (`railway login`) for MCP tools to work.

### One-time project setup

1. In the [Railway dashboard](https://railway.app) (or CLI): **New project** → add **PostgreSQL**. Wait until the database is running.
2. **New service** → **GitHub repo** → select **Talkara** (or **Empty service** and connect the repo / use `railway up` from this directory).
3. **Link Postgres to the app service:** open the web service → **Variables** → **Add reference** → choose the Postgres plugin’s **`DATABASE_URL`** (use the **internal** URL for traffic that stays inside Railway).
4. Ensure **build** runs `npm run build` after Nixpacks’ install (`npm ci`) and **start** runs `npm start` (see `railway.toml` and `nixpacks.toml`). **Redeploy** after variables are set.

   **Node version:** Astro 6 needs `^20.19.1` or `>=22.12.0`. Nixpacks’ default Node **22** is often **22.11**, which fails — `nixpacks.toml` sets **`NIXPACKS_NODE_VERSION = "23"`**. To use **Node 20 LTS** instead, set that variable to **`20`** in Railway or in `nixpacks.toml`.

   **If builds still show `RUN npm ci && npm run build` and fail with `EBUSY` on `node_modules/.cache`:**
   - **Push the latest commit** from this repo (so `package.json` engines and `railway.toml` / `nixpacks.toml` are on GitHub).
   - In Railway: open the **web** service → **Settings** → **Build** → **Custom Build Command**. It must be **empty** (use repo config) or **exactly** `npm run build` — **not** `npm ci && npm run build`. A value saved here overrides `railway.toml`.
5. **Generate a public URL:** service → **Settings** → **Networking** → **Generate domain**.

Migrations run on each deploy when the container starts (`npm start`). If you need migrations during build instead, change the Railway **Build** command in the dashboard (and keep `DATABASE_URL` available to the build — Railway can expose plugin variables to builds).

### SSE (live chat) behind Railway’s proxy

The chat stream (`/rooms/:slug/stream`) sets **`Cache-Control: no-cache, no-transform`**, **`Connection: keep-alive`**, and **`X-Accel-Buffering: no`**. Long-lived connections may still be subject to **idle timeouts** at the edge; the app sends **ping events every 15s** to help keep the stream alive.

### Local env vs Railway

- **Local Postgres (Docker):** keep `DATABASE_URL` pointing at `localhost`; `src/db/client.ts` does **not** enable TLS for typical localhost URLs.
- **Railway Postgres:** use the provided **`DATABASE_URL`**; non-localhost URLs use **`ssl: { rejectUnauthorized: false }`** unless you set **`PGSSLMODE=disable`** or **`DATABASE_SSL=0`** (see `.env.example`).

## Features

- **Multi-room chat** — Create rooms, join any room, and chat in real-time
- **Live presence** — See who's online in each room with green status indicators
- **Typing indicators** — Know when someone is typing
- **@mentions** — Type `@` in the composer to pick from online users (prefix match), or choose `@everyone` to ping the room. Arrow keys move the selection; **Enter** or **Tab** inserts. Mentions render with accent color; mentions that include you (including `@everyone`) are underlined. **Browser notifications** for mentions are optional: click the bell (🔔) in the room header to grant permission, then you get a desktop notification when someone else’s message mentions you.
- **Avatar colours** — Each connection gets a random saturated avatar colour when they join (SSE/presence); it stays the same in every room until they disconnect. Message bubbles and the online list use the **same** resolution (session colour when that user is in the room’s presence map, or your own cookie on first paint). Users who are **offline** still get a stable hash-based colour in the transcript. Avatars use the same fill in light and dark theme, with a dark outline and light inset edge so circles stay visible on both chat backgrounds.
- **Grouped messages** — Consecutive messages from the same user are grouped: only the first line shows the circular initial **avatar**, display name, and timestamp; later lines are indented under that block with message text only. A different user’s message or a **system** line (e.g. join/leave) ends the group. **Persisted history** (initial load + scroll-up) shows **user messages only** — old join/leave lines are hidden because the presence panel shows who’s online; **live** join/leave for active sessions still arrives via SSE. Chat `<li>` fragments append directly into `#messages` (POST and SSE use the same `beforeend` target as SSR). The client debounces `regroupMessages()` on `#messages` child-list changes and after history swaps so grouping stays correct live.
- **Theme switching** — Toggle between talkara_classic (dark) and talkara_light themes
- **Logout** — Click Logout in the header to return to the nickname picker
- **Delete rooms** — Delete any room (except Lobby) from the room header
- **Auto-focus input** — Chat input is automatically focused when joining a room
- **Responsive layout** — Works on desktop, tablet, and mobile with adaptive sidebars

### Mention API (for developers)

- `GET /rooms/:slug/online-names` — JSON `{ "names": string[] }` of deduplicated online nicknames for that room (same source as the presence panel). Requires a valid session cookie.

Server-rendered message bodies wrap `@token` and `@everyone` in `<span class="mention">` (see `src/server/render.ts` — `renderBodyWithMentions`).

## Project log

See `PROJECT_HISTORY.md` for a phase-by-phase record of what was built and why.
