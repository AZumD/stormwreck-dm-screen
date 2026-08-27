# SERVER

## Purpose
Local Node server that serves the vanilla DM Library frontend and persists user data under `/data` (or `DM_DATA_ROOT`). Optional Postgres when `DATABASE_URL` is set (Phase 1–4B: items, campaign characters, auth sessions, player companion API, Railway hardening).

## Start
**Windows:** double-click `start-dm-screen.bat` (finds Node, starts the server, opens the browser).

```bash
npm install   # once — pg / drizzle / dotenv / bcryptjs
npm start
```
Open `http://127.0.0.1:3000`

Without `DATABASE_URL`, behaviour matches the original file-backed library. Locally `AUTH_REQUIRED` defaults to `0` so DM APIs stay open. In production (`NODE_ENV=production`), auth is always required and the process exits if `SESSION_SECRET`, `DATABASE_URL`, or `DM_DATA_ROOT` are missing.

`npm start` never runs migrations, seeds, auth bootstrap, or `data:init`.

## Files
| Path | Role |
|------|------|
| `server/index.js` | Native Node HTTP entry; startup validation; graceful SIGTERM/SIGINT |
| `server/lib/startup-config.js` | `HOST` resolution + production env checks |
| `server/lib/shutdown.js` | Once-only HTTP + Postgres pool shutdown |
| `server/routes/api.js` | `/api` JSON routes (+ auth, db health, characters, player) |
| `server/lib/auth.js` | Passwords, sessions, cookies |
| `server/lib/authorize.js` | DM / membership / controller gates + mutation CSRF checks |
| `server/lib/characters.js` | Campaign-scoped character/state/inventory (Postgres) |
| `server/lib/player.js` | Player companion DTOs + membership/controller-scoped queries |
| `player/` + `js/player-app.js` | Mobile-first player companion UI |
| `server/lib/db.js` | Optional Postgres pool |
| `server/lib/http-util.js` | Body parsing / JSON responses |
| `server/lib/http-cache.js` | Streamed file responses + ETag / 304 / Cache-Control |
| `server/lib/static-guard.js` | Block static access to `/data`, `/server`, `/.git`, … |
| `favicon.png` | Site tab icon; `/favicon.ico` aliases to this PNG |
| `server/lib/atomic-fs.js` | Atomic JSON/binary writes + `.bak`; `DM_DATA_ROOT` |
| `server/lib/ids.js` | Safe id / type validation |
| `server/lib/catalogues.js` | One JSON file per catalogue entry |
| `server/lib/campaigns.js` | Campaign registry + documents (+ Postgres sync on auth create); `PATCH` deep-merge |
| `server/lib/scene-blocks.js` | Scene markup → TUI-neutral blocks; scene list/detail helpers |
| `server/lib/deep-merge.js` | Recursive document merge for partial updates |
| `server/lib/assets.js` | Portrait / map image files under `{dataRoot}/assets` |
| `scripts/data-init.mjs` | One-shot empty-volume seed (`npm run data:init`) |
| `db/` | Schema, migrations, seeds, auth bootstrap (see `docs/README/DB.md`, `AUTH.md`, `DEPLOY.md`) |

## Env
| Variable | Default | Meaning |
|----------|---------|---------|
| `HOST` | `127.0.0.1` local / `0.0.0.0` production | Bind address |
| `PORT` | `3000` | Port (Railway injects `PORT`) |
| `DM_DATA_ROOT` | `<repo>/data` | Data directory; **required in production** (persistent volume) |
| `DATABASE_URL` | unset | Postgres connection; required when auth is required |
| `AUTH_REQUIRED` | `0` | Local only; ignored when `NODE_ENV=production` (always on) |
| `SESSION_SECRET` | unset | ≥32 chars; required when auth is required |
| `SESSION_TTL_DAYS` | `14` | Session lifetime |
| `COOKIE_SECURE` | auto | Force Secure cookies; auto on production / `TRUST_PROXY=1` |
| `TRUST_PROXY` | unset | Set `1` behind Railway HTTPS |

Startup logs the **resolved** data directory (honors `DM_DATA_ROOT`).

## Scene read API (DM)
- `GET /api/campaigns/:id/scenes` — list + `currentSceneId` from `campaign-state` (DM-gated)
- `GET /api/campaigns/:id/scenes/:sceneId` — structured blocks from `section-structure` markup (`server/lib/scene-blocks.js`)
See `docs/README/SCENE-BLOCKS.md`, `docs/README/VALIDATE-SCENES-API.md`.

## Health
- `GET /api/health` — Railway healthcheck; **503** in auth-required mode if Postgres is down (no secrets in body); includes `catalogueTypes`
- `GET /api/db/health` — dedicated DB probe

## Privacy
Committing `/data` versions personal library content. Intended for a private repo. Never commit `.env`.

## Deploy
See `docs/README/DEPLOY.md`.
