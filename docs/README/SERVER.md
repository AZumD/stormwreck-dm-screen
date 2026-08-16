# SERVER

## Purpose
Local Node server that serves the vanilla DM Library frontend and persists user data under `/data`.

## Start
**Windows:** double-click `start-dm-screen.bat` (finds Node, starts the server, opens the browser).

Or from a terminal (no `npm install` — zero dependencies):
```bash
npm start
```
Open `http://127.0.0.1:3000`

## Files
| Path | Role |
|------|------|
| `server/index.js` | Native Node HTTP entry (binds `127.0.0.1` by default; **no npm deps**) |
| `server/routes/api.js` | `/api` JSON routes |
| `server/lib/http-util.js` | Body parsing / JSON responses |
| `server/lib/static-guard.js` | Block static access to `/data`, `/server`, `/.git`, … |
| `server/lib/atomic-fs.js` | Atomic JSON/binary writes + `.bak` |
| `server/lib/ids.js` | Safe id / type validation |
| `server/lib/catalogues.js` | One JSON file per catalogue entry |
| `server/lib/campaigns.js` | Campaign registry + documents |
| `server/lib/assets.js` | Portrait / map image files |

## Env
| Variable | Default | Meaning |
|----------|---------|---------|
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `3000` | Port |
| `DM_DATA_ROOT` | `<repo>/data` | Override data directory (tests) |

## Privacy
Committing `/data` versions personal library content. Intended for a private repo.
