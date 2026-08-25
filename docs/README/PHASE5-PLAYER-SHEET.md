# PHASE5-PLAYER-SHEET.md

## Purpose
Evolve the player companion into a trusted, fully editable fantasy character sheet. DM app is unchanged. Railway infra is out of scope.

## Phases
| Phase | Scope |
|-------|--------|
| **5A** (this) | Fantasy visual/UX, sticky vitals, collapsible sections, theme background |
| **5B** (done) | Full sheet edit APIs + UI (identity, abilities, lists, inventory, portrait, currency, hp_max) |
| **5C** (done) | Player catalogue browser (all types except NPC/PC) + attach to sheet |
| **5D** (done) | DM-controlled NPC reveal table + player People directory |

## Authority model
Campaign character in Postgres is authoritative for play (`characters`, `character_state`, `inventory_entries`). Linked PC catalogue JSON (`catalogue_pc_id`) is the DM-facing projection/editor: player create and sheet edits remirror into the catalogue; DM catalogue saves for linked PCs write back into Postgres. See `docs/README/PC-CATALOGUE-MIRROR.md`.

## Player edit permissions (5B+)
Controllers (or campaign DM) may write whitelisted identity, sheet scalars/lists, state (incl. `hp_max`), inventory, portrait. Cannot write catalogues, other players’ notes, or unrevealed NPCs.

## Catalogue browser (5C)
Allowlist: item, spell, skill, feature, race, class, monster, location. Exclude: npc, pc.

Player-only routes (membership for browse/detail; character control for attach):
- `GET /api/player/campaigns/:id/catalogues/:type?q=&limit=&offset=`
- `GET /api/player/campaigns/:id/catalogues/:type/:entryId`
- `POST /api/player/campaigns/:id/characters/:characterId/library-attach` `{ action, type, id }`

UI: Library tab with type chips, debounced search, detail dialog, attach buttons. Custom freeform refs remain via sheet editor.

## NPC reveal (5D)
Table `campaign_revealed_npcs (campaign_id, npc_id, revealed_by, revealed_at, note)`.

| Who | Routes |
|-----|--------|
| DM | `GET/PUT/DELETE /api/campaigns/:id/revealed-npcs[/:npcId]` |
| Player | `GET /api/player/campaigns/:id/npcs[/:npcId]` |

DM UI: “Reveal to players” checkbox on the NPC entity modal (`CampaignStateUI`). Player UI: **People** tab lists revealed contacts only. See `docs/README/REVEALED-NPCS.md`.

## Currency
Optional `sheet.currency { cp, sp, ep, gp, pp }` — implemented in 5B (player sheet + APIs).

## 5A surfaces
| Path | Role |
|------|------|
| `assets/player/fairy-forest-bg.jpg` | Forest wallpaper (static; deploys with app image) |
| `css/player.css` | Fairy-forest theme |
| `js/player-app.js` | Sticky vitals + collapsible sections + inspiration toggle |
