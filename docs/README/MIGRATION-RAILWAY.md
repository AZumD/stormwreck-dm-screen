# Railway / PostgreSQL migration

Incremental plan to evolve the local DM Library into a multi-user, multi-campaign companion without rebuilding the vanilla UI.

## Phase 0 — Current architecture (audit)

### Stack
- **Vanilla HTML/CSS/JS MPA** (no React, no bundler)
- **Zero-dependency Node HTTP server** (`server/index.js`) — static files + `/api`
- Node `>=18`; `npm start` → `127.0.0.1:3000`

### Persistence today
| Layer | Mechanism |
|-------|-----------|
| Authoritative | JSON + binaries under `data/` via `LocalApiClient` → `/api` |
| Offline fallback | `localStorage` + IndexedDB (images) |
| Catalogues | `data/catalogues/<type>/<id>.json` (global wiki) |
| Campaigns | `data/campaigns/<id>/<kind>.json` + registry `index.json` |

### Campaign doc kinds
`campaign-state`, `scene-meta`, `chronicle`, `section-structure`, `section-edits`, `notes`, `checklist`, `map-state`, `prefs`

### Multi-campaign already
Built-in `stormwreck-isle` + sandbox shells (`campaigns/sandbox/?id=`) via `CampaignRegistry`. Catalogues are **global**; campaigns **reference** them by id.

### Auth / Railway
**None.** Loopback bind by default. No Dockerfile. Not cloud-safe without `HOST=0.0.0.0`, durable DB, and auth.

### Characters / inventory today
- PCs are catalogue rows (`data/catalogues/pc/…`), not campaign-owned
- Party = refs in `campaign-state.party`
- Equipment/inventory = string arrays (`@item:id|Label`) — no quantity model
- Althariel = `pc-mswdvrcy-u6nnt` (only PC)

### Adventure content
Live prose in `section-structure.json`; markup via `ContentParser` (`@npc:`, `{{collapse}}`, YouTube, etc.). Keep this system.

---

## What stays largely unchanged (for now)

- Vanilla campaign UI (`campaign-app.js`, parser, media bar, scene editor, map panel)
- File-backed `/api` routes while `DATABASE_URL` is unset (local DM workflow)
- Adventure markup / section-structure model
- Global catalogue **files** as seed source + temporary dual-write source of truth for non-migrated types

## What migrates first (Phase 1)

Postgres tables for identity, campaigns, characters, items, inventory, player notes — additive; UI still uses files until Phase 2–3.

---

## Proposed schema (Phase 1)

```text
users
campaigns
campaign_memberships   (role: dm | player)
characters             (campaign-scoped; type: player | sidekick | npc)
character_controllers  (user ↔ character)
character_state        (mutable jsonb + core HP columns)
items                  (catalogue; preserve ids like sw-herb-black-rose)
inventory_entries      (character ↔ item, quantity, equipped, notes)
player_notes           (private to userId; optional characterId)
```

Campaign isolation: every campaign-scoped row includes `campaign_id`.  
Visibility: enforced in API later (Phase 3) — never client-only hiding.

Generic world flags later: `campaign_flags (campaign_id, key, value jsonb)` — not in Phase 1.

---

## Routing / UI (later phases)

| Phase | Change |
|-------|--------|
| 1 | No player UI yet; optional `/api/db/health` |
| 3 | Player shell: My Character(s) / Party / Notes |
| 4 | DM uses shared character/inventory components against authorized APIs |

---

## Railway

```text
Git → Railway
  ├─ Web service (Node, HOST=0.0.0.0)
  └─ PostgreSQL (DATABASE_URL)
```

Migrations on release. No secrets in git. See `.env.example`.

---

## Phased plan

| Phase | Goal |
|-------|------|
| **0** | Audit (this doc) |
| **1** | Postgres + Drizzle schema/migrations + item seed + db health (files still work) |
| **2** | Characters + state in DB; DM can switch PCs |
| **3** | Player view + auth-ready membership checks |
| **4** | DM inventory/party wired to DB; reduce file dual-write |

### Risks
- Dual ID space (`sw-runara` vs `@npc:runara`) — keep aliases
- Global catalogues vs campaign-owned characters — split deliberately
- Inventory string refs → `inventory_entries` needs import mapping
- Assets still files until object storage
- Auth must land before public Railway bind

### Migrate first
1. Schema + migrations  
2. Items seed from JSON  
3. Campaigns/users/memberships shell  
4. Characters + inventory_entries (empty, ready for Phase 2 import)
