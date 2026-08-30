# DB — Postgres foundation (Phase 1–4B)

## Purpose
Additive PostgreSQL layer for multi-user campaigns. When `DATABASE_URL` is unset, the app keeps using file-backed `/data` only.

## Files
| Path | Role |
|------|------|
| `db/schema.js` | Drizzle schema (ESM) |
| `db/migrations/0001_phase1.sql` | Initial tables |
| `db/migrations/0003_phase5_npc_reveal.sql` | Revealed NPCs |
| `db/migrations/0004_phase6_platform.sql` | Game systems, campaign participation, `system_state` |
| `db/migrations/0005_phase6_platform_cleanup.sql` | Drop legacy D&D character columns |
| `db/migrations/0006_drop_character_campaign_id.sql` | Drop `characters.campaign_id`; participation in `campaign_characters` only |
| `db/migrations/0007_scheduling.sql` | User availability, campaign events, RSVPs, message board |
| `db/migrate.mjs` | Apply SQL migrations |
| `db/seed-items.mjs` | Import `{DM_DATA_ROOT}/catalogues/item/*.json` → `items` |
| `db/seed-characters.mjs` | Import campaign PC catalogue → `characters` + state + inventory (**one-shot**) |
| `db/bootstrap-auth.mjs` | DM/player users + memberships + controllers (env passwords) |
| `scripts/data-init.mjs` | Empty volume seed from committed `data/` (`npm run data:init`) |
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
# Optional empty volume (Railway): DM_DATA_ROOT=/data npm run data:init
npm run db:migrate
npm run db:seed:items
npm run db:seed:characters   # WARNING: upserts character_state — once only
npm run db:bootstrap:auth    # optional local accounts
npm start                    # never auto-runs migrate/seed/init
```

### Warning: `db:seed:characters`
Re-running reconciles from catalogue / `campaign-state` and **UPSERTS `character_state` (HP, conditions, resources)**. That can overwrite live play. Never attach it to deploy/start hooks. See `docs/README/DEPLOY.md`.

`GET /api/health` includes a `database` object and `authRequired` (503 in production if DB down). `GET /api/db/health` is a dedicated probe.

See `docs/README/AUTH.md` for authentication details and `docs/README/DEPLOY.md` for Railway.

## Phase 2 authority (migration in progress)

| Concern | Authoritative source | Notes |
|---------|---------------------|--------|
| Party roster refs (`type` + catalogue id) | File `campaign-state.json` | DM UI / `CampaignState` unchanged |
| Scene status, NPC memory, timeline, clock | File `campaign-state.json` | Unchanged |
| Global PC catalogue JSON | File `data/catalogues/pc/*.json` | DM projection/editor for linked campaign PCs; mirrored both ways via `pc-catalogue-mirror` (see `PC-CATALOGUE-MIRROR.md`) |
| Campaign character row + sheet | Postgres `characters` | Standalone character rows; `id` preserves legacy PC id |
| Campaign participation | Postgres `campaign_characters` | Many-to-many; sole authority for character ↔ campaign |
| Character display name | Postgres `characters.name` | Trimmed from catalogue `name`; raw import string kept in `sheet.sourceName` |
| HP, conditions, resources | Postgres `character_state` | Updated via character state API |
| Equipment / inventory rows | Postgres `inventory_entries` | Resolved `item_id` when item exists; unresolved refs kept in `custom_item` |

Re-run `npm run db:seed:characters` only as a deliberate one-shot reconcile: it upserts characters and **replaces inventory / can overwrite `character_state` HP**. Never automate it on deploy.

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

See `docs/README/PLAYER.md`. Session-authenticated routes under `/api/player/…` for bootstrap, controlled characters, whitelisted state/sheet patches, party cards (`type=player` only), player catalogue browse/detail (not npc/pc), library-attach, revealed NPCs (5D), private notes, and player-safe portraits.

## Tables
`users` (+ `password_hash`), `sessions`, `campaigns`, `campaign_memberships`, `characters`, `character_controllers`, `character_state`, `items`, `inventory_entries`, `player_notes`, `campaign_revealed_npcs` (Phase 5D)

Migration `0003_phase5_npc_reveal.sql` adds `campaign_revealed_npcs`. See `docs/README/REVEALED-NPCS.md`.

See `docs/README/MIGRATION-RAILWAY.md` for the full plan.
