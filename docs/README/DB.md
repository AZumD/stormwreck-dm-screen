# DB — Postgres foundation (Phase 1–2)

## Purpose
Additive PostgreSQL layer for multi-user campaigns. When `DATABASE_URL` is unset, the app keeps using file-backed `/data` only.

## Files
| Path | Role |
|------|------|
| `db/schema.js` | Drizzle schema (ESM) |
| `db/migrations/0001_phase1.sql` | Initial tables |
| `db/migrate.mjs` | Apply SQL migrations |
| `db/seed-items.mjs` | Import `data/catalogues/item/*.json` → `items` |
| `db/seed-characters.mjs` | Import campaign PC catalogue → `characters` + state + inventory |
| `drizzle.config.js` | drizzle-kit config |
| `server/lib/db.js` | Optional `pg` pool |
| `server/lib/characters.js` | Campaign-scoped character CRUD (Phase 2) |
| `server/lib/entity-ref.js` | Parse `@type:id\|Label` refs for inventory import |
| `.env.example` | Env var names |

## Commands
```bash
cp .env.example .env   # set DATABASE_URL
npm install
npm run db:migrate
npm run db:seed:items
npm run db:seed:characters   # stormwreck-isle party PCs from campaign-state + pc/*.json
npm start
```

`GET /api/health` includes a `database` object. `GET /api/db/health` is a dedicated probe.

## Phase 2 authority (migration in progress)

| Concern | Authoritative source | Notes |
|---------|---------------------|--------|
| Party roster refs (`type` + catalogue id) | File `campaign-state.json` | DM UI / `CampaignState` unchanged |
| Scene status, NPC memory, timeline, clock | File `campaign-state.json` | Unchanged |
| Global PC catalogue JSON | File `data/catalogues/pc/*.json` | Import **source**; not auto-synced after import |
| Campaign character row + sheet | Postgres `characters` | Scoped by `campaign_id`; `id` preserves legacy PC id |
| Character display name | Postgres `characters.name` | Trimmed from catalogue `name`; raw import string kept in `sheet.sourceName` |
| HP, conditions, resources | Postgres `character_state` | Updated via character state API |
| Equipment / inventory rows | Postgres `inventory_entries` | Resolved `item_id` when item exists; unresolved refs kept in `custom_item` |

Re-run `npm run db:seed:characters` to reconcile imports idempotently (upsert, inventory replaced per character).

Imported HP values come from the PC catalogue JSON as-is (e.g. Althariel `1/1` in `pc-mswdvrcy-u6nnt.json` is source-derived and likely a placeholder until an authoritative sheet is available).

## Character API (DATABASE_URL required)

All routes scope by campaign id.

| Method | Path |
|--------|------|
| GET | `/api/campaigns/:campaignId/characters` |
| GET | `/api/campaigns/:campaignId/characters/:characterId` |
| GET | `/api/campaigns/:campaignId/characters/:characterId/state` |
| PUT | `/api/campaigns/:campaignId/characters/:characterId/state` |
| GET | `/api/campaigns/:campaignId/characters/:characterId/inventory` |

No authentication in Phase 2; routes are structured for Phase 3 membership checks.

## Tables
`users`, `campaigns`, `campaign_memberships`, `characters`, `character_controllers`, `character_state`, `items`, `inventory_entries`, `player_notes`

See `docs/README/MIGRATION-RAILWAY.md` for the full plan.
