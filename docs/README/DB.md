# DB — Phase 1 Postgres foundation

## Purpose
Additive PostgreSQL layer for Railway multi-user campaigns. When `DATABASE_URL` is unset, the app keeps using file-backed `/data` only.

## Files
| Path | Role |
|------|------|
| `db/schema.js` | Drizzle schema (ESM) |
| `db/migrations/0001_phase1.sql` | Initial tables |
| `db/migrate.mjs` | Apply SQL migrations |
| `db/seed-items.mjs` | Import `data/catalogues/item/*.json` → `items` |
| `drizzle.config.js` | drizzle-kit config |
| `server/lib/db.js` | Optional `pg` pool |
| `.env.example` | Env var names |

## Commands
```bash
cp .env.example .env   # set DATABASE_URL
npm install
npm run db:migrate
npm run db:seed:items
npm start
```

`GET /api/health` includes a `database` object. `GET /api/db/health` is a dedicated probe.

## Tables (Phase 1)
`users`, `campaigns`, `campaign_memberships`, `characters`, `character_controllers`, `character_state`, `items`, `inventory_entries`, `player_notes`

See `docs/README/MIGRATION-RAILWAY.md` for the full plan.
