# SERVER

## Purpose
Local Node server that serves the vanilla DM Library frontend and persists user data under `/data`. Optional Postgres when `DATABASE_URL` is set (Phase 1–2: items + campaign characters).

## Start
**Windows:** double-click `start-dm-screen.bat` (finds Node, starts the server, opens the browser).

```bash
npm install   # once — pg / drizzle / dotenv for optional DB
npm start
```
Open `http://127.0.0.1:3000`

Without `DATABASE_URL`, behaviour matches the original file-backed library.

## Files
| Path | Role |
|------|------|
| `server/index.js` | Native Node HTTP entry (binds `127.0.0.1` by default) |
| `server/routes/api.js` | `/api` JSON routes (+ `/api/db/health`, campaign characters when DB configured) |
| `server/lib/characters.js` | Campaign-scoped character/state/inventory (Postgres) |
| `server/lib/db.js` | Optional Postgres pool |
| `server/lib/http-util.js` | Body parsing / JSON responses |
| `server/lib/static-guard.js` | Block static access to `/data`, `/server`, `/.git`, … |
| `server/lib/atomic-fs.js` | Atomic JSON/binary writes + `.bak` |
| `server/lib/ids.js` | Safe id / type validation |
| `server/lib/catalogues.js` | One JSON file per catalogue entry |
| `server/lib/campaigns.js` | Campaign registry + documents |
| `server/lib/assets.js` | Portrait / map image files |
| `db/` | Schema, migrations, item + character seed (see `docs/README/DB.md`) |

## Env
| Variable | Default | Meaning |
|----------|---------|---------|
| `HOST` | `127.0.0.1` | Bind address (`0.0.0.0` on Railway) |
| `PORT` | `3000` | Port |
| `DM_DATA_ROOT` | `<repo>/data` | Override data directory (tests) |
| `DATABASE_URL` | unset | Postgres connection; enables DB health + migrations |

## Privacy
Committing `/data` versions personal library content. Intended for a private repo. Never commit `.env`.
