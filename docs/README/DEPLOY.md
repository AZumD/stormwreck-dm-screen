# DEPLOY — Railway hybrid (Phase 4B)

## Purpose
Concise runbook for deploying this **hybrid** app: Postgres for auth/characters/notes + a **persistent volume** for file-backed catalogues, campaigns, and assets.

Do **not** put seeds or `data:init` in the web start command.

## Architecture
| Layer | Backing store |
|-------|----------------|
| Users, sessions, memberships, characters, inventory, player notes | Railway Postgres (`DATABASE_URL`) |
| Catalogues, campaign docs, uploaded portraits/maps, `.backup` | Volume at `DM_DATA_ROOT` (e.g. `/data`) |
| Repo `assets/*.svg` placeholders | Image only (never mutated at runtime) |

## One-time Railway setup
1. Create a Railway project
2. Add a **Postgres** plugin/service
3. Add a **persistent volume** mounted at `/data` on the web service
4. Create the web service from this repo (Nixpacks / Node — `npm install` + `npm start` is enough; no Dockerfile required)

## Environment variables (web service)
| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `HOST` | optional — defaults to `0.0.0.0` in production |
| `PORT` | Railway-provided (do not hardcode) |
| `DATABASE_URL` | from Postgres service |
| `SESSION_SECRET` | ≥32 random characters |
| `TRUST_PROXY` | `1` |
| `DM_DATA_ROOT` | `/data` (must match volume mount) |

Optional one-shot bootstrap vars: see `.env.example` (`BOOTSTRAP_*`).

Production **refuses to start** without `DATABASE_URL`, `SESSION_SECRET`, and `DM_DATA_ROOT`.

## First deploy sequence
1. Deploy the web service (start command = `npm start` only)
2. **Once**, with the empty volume attached:
   ```bash
   DM_DATA_ROOT=/data npm run data:init
   ```
3. `npm run db:migrate`
4. `npm run db:seed:items`
5. `npm run db:seed:characters` — **once** for initial PC import
6. `npm run db:bootstrap:auth` — initial DM/player + memberships/controllers
7. Restart / smoke-test:
   - `GET /api/health` → `ok: true` (Railway healthcheck)
   - DM login; write a campaign doc; confirm it persists after restart
   - Player login; character HP/notes from Postgres

## Hard warnings
- **Never** re-run `data:init` over a live volume (it refuses when `.initialized` or data exists — do not force)
- **Never** put `db:seed:characters` (or any seed / `data:init`) in automatic deploy or `npm start`
- Re-running `db:seed:characters` **upserts `character_state` and can overwrite live HP/conditions**

## Healthcheck
Use `GET /api/health`. In production (auth required) it returns **503** if Postgres is unreachable. Response does not include secrets.

## Backups (manual)
Treat the campaign system as **two parts** restored together when possible:

1. **PostgreSQL** — Railway snapshot or `pg_dump`
2. **`DM_DATA_ROOT` volume** — tar/archive of `/data` (catalogues, campaigns, assets, `.backup`)

Automated backup infrastructure is out of scope for Phase 4B.

## Related docs
- `docs/README/DATA-INIT.md` — volume seed script
- `docs/README/SERVER.md` — process / env
- `docs/README/DB.md` — migrate / seed commands
- `docs/README/AUTH.md` — auth bootstrap
