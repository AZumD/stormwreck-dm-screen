# SERVER

## Purpose
Local Node server that serves the vanilla DM Library frontend and persists user data under `/data`. Optional Postgres when `DATABASE_URL` is set (Phase 1–3A: items, campaign characters, auth sessions).

## Start
**Windows:** double-click `start-dm-screen.bat` (finds Node, starts the server, opens the browser).

```bash
npm install   # once — pg / drizzle / dotenv / bcryptjs
npm start
```
Open `http://127.0.0.1:3000`

Without `DATABASE_URL`, behaviour matches the original file-backed library. Locally `AUTH_REQUIRED` defaults to `0` so DM APIs stay open. In production (`NODE_ENV=production`), auth is always required and the process exits if `SESSION_SECRET` / `DATABASE_URL` are missing.

## Files
| Path | Role |
|------|------|
| `server/index.js` | Native Node HTTP entry (binds `127.0.0.1` by default); calls `requireAuthConfig` |
| `server/routes/api.js` | `/api` JSON routes (+ auth, db health, characters) |
| `server/lib/auth.js` | Passwords, sessions, cookies |
| `server/lib/authorize.js` | DM / membership / controller gates + mutation CSRF checks |
| `server/lib/characters.js` | Campaign-scoped character/state/inventory (Postgres) |
| `server/lib/db.js` | Optional Postgres pool |
| `server/lib/http-util.js` | Body parsing / JSON responses |
| `server/lib/static-guard.js` | Block static access to `/data`, `/server`, `/.git`, … |
| `server/lib/atomic-fs.js` | Atomic JSON/binary writes + `.bak` |
| `server/lib/ids.js` | Safe id / type validation |
| `server/lib/catalogues.js` | One JSON file per catalogue entry |
| `server/lib/campaigns.js` | Campaign registry + documents |
| `server/lib/assets.js` | Portrait / map image files |
| `db/` | Schema, migrations, seeds, auth bootstrap (see `docs/README/DB.md`, `AUTH.md`) |

## Env
| Variable | Default | Meaning |
|----------|---------|---------|
| `HOST` | `127.0.0.1` | Bind address (`0.0.0.0` on Railway) |
| `PORT` | `3000` | Port |
| `DM_DATA_ROOT` | `<repo>/data` | Override data directory (tests) |
| `DATABASE_URL` | unset | Postgres connection; required when auth is required |
| `AUTH_REQUIRED` | `0` | Local only; ignored when `NODE_ENV=production` (always on) |
| `SESSION_SECRET` | unset | ≥32 chars; required when auth is required |
| `SESSION_TTL_DAYS` | `14` | Session lifetime |
| `COOKIE_SECURE` | auto | Force Secure cookies; auto on production / `TRUST_PROXY=1` |

## Privacy
Committing `/data` versions personal library content. Intended for a private repo. Never commit `.env`.
