# PHASE5-PLAYER-SHEET.md

## Purpose
Evolve the player companion into a trusted, fully editable fantasy character sheet. DM app is unchanged. Railway infra is out of scope.

## Phases
| Phase | Scope |
|-------|--------|
| **5A** (this) | Fantasy visual/UX, sticky vitals, collapsible sections, theme background |
| **5B** (done) | Full sheet edit APIs + UI (identity, abilities, lists, inventory, portrait, currency, hp_max) |
| **5C** | Player catalogue browser (all types except NPC/PC) + attach to sheet |
| **5D** | DM-controlled NPC reveal table + player Contacts directory |

## Authority model
Campaign character in Postgres is authoritative (`characters`, `character_state`, `inventory_entries`). Catalogue PC JSON remains import source only — sheet edits do not auto-write catalogue files.

## Player edit permissions (5B+)
Controllers (or campaign DM) may write whitelisted identity, sheet scalars/lists, state (incl. `hp_max`), inventory, portrait. Cannot write catalogues, other players’ notes, or unrevealed NPCs.

## Catalogue browser (5C)
Allowlist: item, spell, skill, feature, race, class, monster, location. Exclude: npc, pc.

## NPC reveal (5D)
Table `campaign_revealed_npcs (campaign_id, npc_id, …)`. Players list/get revealed only. Minimal DM toggle later.

## Currency
Optional `sheet.currency { cp, sp, ep, gp, pp }` in 5B (no field exists today).

## 5A surfaces
| Path | Role |
|------|------|
| `assets/player/fairy-forest-bg.jpg` | Forest wallpaper (static; deploys with app image) |
| `css/player.css` | Fairy-forest theme |
| `js/player-app.js` | Sticky vitals + collapsible sections + inspiration toggle |
