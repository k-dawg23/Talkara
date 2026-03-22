# Railway deployment — Talkara

This guide assumes you have a [Railway](https://railway.app) account and the **Talkara** repo (e.g. `k-dawg23/Talkara`) available to deploy.

## What Talkara needs on Railway

| Piece | Purpose |
|--------|---------|
| **PostgreSQL** | Persistent rooms and messages |
| **Web service** | Node app (`Dockerfile` build, `npm start` runtime) |
| **`DATABASE_URL`** | On the **web** service, pointing at Postgres (internal URL recommended) |

The app uses **Astro** with `@astrojs/node` (standalone). Production builds use the repo **`Dockerfile`** (`node:22-bookworm-slim`) so the Node version matches Astro 6’s engine requirements. **`npm start`** runs **`drizzle-kit migrate`** then **`node ./dist/server/entry.mjs`**. Railway sets **`PORT`**; the server listens on **0.0.0.0** when built with `server.host: true` in `astro.config.mjs`.

## 1. Install the Railway CLI

Pick one:

- **Project (after `npm install`):** `npx @railway/cli login`
- **Global:** `npm i -g @railway/cli` then `railway login`
- **Install script:** [Railway CLI docs](https://docs.railway.com/guides/cli) (e.g. `bash <(curl -fsSL cli.new)`)

If `railway login` exits immediately, try a normal system terminal, `unset CI`, or `railway login --browserless`. Use a [Railway token](https://docs.railway.com/guides/cli) (`RAILWAY_API_TOKEN`) if interactive login is not possible.

## 2. Optional: Railway MCP (Cursor)

The repo includes **`.cursor/mcp.json`** for the official **`@railway/mcp-server`**. You still need the CLI authenticated for MCP tools to work.

## 3. Create the project and database

1. **New project** in the Railway dashboard (or `railway init` from an empty folder — see below).
2. Add **PostgreSQL** and wait until it is running.
3. Add a **second service** for the web app if you only see Postgres:
   - **Dashboard:** **New** → **GitHub Repo** → select **Talkara**, or **Empty service** and connect the repo / deploy with CLI.
   - **CLI** from the **`Talkara/`** directory (after `railway link` to this project):  
     `railway add --service web` then `railway up`  
     or  
     `railway add --repo your-org/Talkara`

Ensure **`railway status`** shows **`Service: web`** (or your app service name), **not** only Postgres, before deploying.

## 4. Link `DATABASE_URL` to the web service

On the **web** service → **Variables**:

- **`DATABASE_URL`** should reference the Postgres plugin, e.g.  
  `DATABASE_URL=${{ Postgres.DATABASE_URL }}`  
  (use the **exact** Postgres service name from your canvas).

If **`DATABASE_URL`** is already present with a value like `postgresql://...@postgres.railway.internal:5432/...`, you are set.

## 5. Build and start commands

The repo ships **`railway.toml`**:

- **Build:** Docker (`Dockerfile`) — do **not** set a custom Nixpacks command that runs `npm ci && npm run build` (that caused **`EBUSY`** on `node_modules/.cache` in the past).
- **Start:** `npm start`

If the dashboard has a **Custom Build Command**, clear it or align it with the Dockerfile-based build so Railway does not override **`railway.toml`**.

## 6. Public URL

Web service → **Settings** → **Networking** → **Generate domain**, or:

```bash
railway domain --service web
```

## 7. Postgres TLS and cookies

- Non-localhost **`DATABASE_URL`** values use TLS in **`src/db/client.ts`** (with `rejectUnauthorized: false` for managed DBs). Override with **`PGSSLMODE=disable`** or **`DATABASE_SSL=0`** if needed (see **`.env.example`**).
- Session cookies use **`secure: true`** in production (HTTPS).

## 8. SSE (live chat) behind the proxy

The room stream sets **`Cache-Control: no-cache, no-transform`**, **`Connection: keep-alive`**, and **`X-Accel-Buffering: no`**. The server sends **ping** events periodically to help keep long-lived connections alive; edge proxies may still impose limits.

## 9. Troubleshooting

| Symptom | What to check |
|---------|----------------|
| **502** | No web service, or app crashed on boot. Check **web** service logs (not only Postgres). |
| **Build: Node 18 / 22.11 / Astro engine error** | Use the repo **`Dockerfile`**; ensure **`railway.toml`** uses **`builder = "DOCKERFILE"`**. |
| **Build: EBUSY on `node_modules/.cache`** | Remove duplicate **`npm ci`** from custom build steps; install runs once, then **`npm run build`**. |
| **DB connection errors** | **`DATABASE_URL`** on the **web** service; migrations need DB reachable at **start** time. |

## 10. Related files

| File | Role |
|------|------|
| `Dockerfile` | Node 22 image, `npm ci`, `npm run build`, `CMD npm start` |
| `.dockerignore` | Keeps context small |
| `railway.toml` | Dockerfile builder + `npm start` |
| `nixpacks.toml` | Optional; only if you deploy **without** Dockerfile |

For local development (Docker Postgres, `.env`), see **`README.md`**.
