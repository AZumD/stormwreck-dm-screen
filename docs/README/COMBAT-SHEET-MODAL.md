# COMBAT-SHEET-MODAL.js

## Purpose
Shared DM combat sheet for live HP / AC / conditions during play. Opens from party cards, map pins (PC/NPC), and monster combat tokens.

## File
`js/core/combat-sheet-modal.js` → `window.CombatSheetModal`

## Backing store

| Kind | Open from | Save target |
|------|-----------|-------------|
| **PC** | Party / map pin | Postgres `character_state` (HP, temp HP, conditions, inspiration) + sheet `ac`; remirrors to PC catalogue |
| **NPC** | Party / map pin | Sitewide NPC catalogue (`hp`, `ac`, `combatConditions`); NPC memory enricher still attaches |
| **Monster token** | Map combat token click | That token only in `CampaignMapState.tokens` — never writes the monster catalogue |

## UI
- Name, type badge, portrait
- HP current / max with ±1, AC, conditions (freeform)
- PC: temp HP + inspiration
- Autosave on blur / short debounce; Save button; last-saved hint
- Optional “Open full catalogue” for wiki read view

## Monster spawn
`MapPanel` “Add monster” calls `MapSpatial.spawnMonsterToken`, which uses `CombatSheetModal.buildMonsterToken` to copy HP/AC once from the catalogue template.

## Related
`LocalApiClient` character helpers, `CatalogueStore` NPC upsert, `MapSpatial`, `PartyRoster`, `CampaignStateUI.enrichEntityModal`
