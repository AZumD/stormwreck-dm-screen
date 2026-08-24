# DB — Postgres foundation (Phase 1–3A)

## Purpose
Additive PostgreSQL layer for multi-user campaigns. When `DATABASE_URL` is unset, the app keeps using file-backed `/data` only.

## Files
| Path | Role |
|------|------|
| `db/schema.js` | Drizzle schema (ESM) |
| `db/migrations/0001_phase1.sql` | Initial tables |
| `db/migrations/0002_phase3_auth.sql` | `password_hash`, `sessions`, case-insensitive email |
| `db/migrate.mjs` | Apply SQL migrations |
| `db/seed-items.mjs` | Import `data/catalogues/item/*.json` → `items` |
| `db/seed-characters.mjs` | Import campaign PC catalogue → `characters` + state + inventory |
| `db/bootstrap-auth.mjs` | DM/player users + memberships + controllers (env passwords) |
| `drizzle.config.js` | drizzle-kit config |
| `server/lib/db.js` | Optional `pg` pool |
| `server/lib/characters.js` | Campaign-scoped character CRUD (Phase 2) |
| `server/lib/auth.js` | Sessions, passwords, cookies (Phase 3A) |
| `server/lib/authorize.js` | Membership / controller / DM gates (Phase 3A) |
| `server/lib/player.js` | Player companion queries + DTOs (Phase 3B) |
| `server/lib/entity-ref.js` | Parse `@type:id\|Label` refs for inventory import |
| `.env.example` | Env var names |

## Commands
```bash
cp .env.example .env   # set DATABASE_URL (+ SESSION_SECRET for auth)
npm install
npm run db:migrate
npm run db:seed:items
npm run db:seed:characters
npm run db:bootstrap:auth   # optional local accounts
npm start
```

`GET /api/health` includes a `database` object and `authRequired`. `GET /api/db/health` is a dedicated probe.

See `docs/README/AUTH.md` for authentication details.

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

All routes scope by campaign id. When `AUTH_REQUIRED=1` or `NODE_ENV=production`, these require a DM membership for that campaign.

| Method | Path |
|--------|------|
| GET | `/api/campaigns/:campaignId/characters` |
| GET | `/api/campaigns/:campaignId/characters/:characterId` |
| GET | `/api/campaigns/:campaignId/characters/:characterId/state` |
| PUT | `/api/campaigns/:campaignId/characters/:characterId/state` |
| GET | `/api/campaigns/:campaignId/characters/:characterId/inventory` |

## Auth API (Phase 3A)

| Method | Path |
|--------|------|
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |
| GET | `/api/auth/me` |

## Player API (Phase 3B)

See `docs/README/PLAYER.md`. Session-authenticated routes under `/api/player/…` for bootstrap, controlled characters, whitelisted state patches, party cards (`type=player` only), restricted catalogue resolve, private notes, and player-safe portraits.

## Tables
`users` (+ `password_hash`), `sessions`, `campaigns`, `campaign_memberships`, `characters`, `character_controllers`, `character_state`, `items`, `inventory_entries`, `player_notes`

See `docs/README/MIGRATION-RAILWAY.md` for the full plan.
