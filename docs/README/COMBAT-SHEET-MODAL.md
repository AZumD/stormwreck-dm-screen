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
- **Combat reference** — resolved catalogue stat block (speed, saves, actions, spells, equipment, etc.; HP/AC omitted because they are editable above)
- Autosave on blur / short debounce; Save button; last-saved hint
- Monster token sheet: **Remove from map** button (also right-click the dot)
- Optional “Open full catalogue” for wiki read view
- NPC: campaign memory enricher still attaches below combat reference

## Monster spawn
`MapPanel` “Add monster” spawns a compact **map pin dot** (same size as PC/NPC pins) on calibrated maps via `MapSpatial.spawnMonsterToken` and `CombatSheetModal.buildMonsterToken` (one-time HP/AC copy). Generic **+ Token** markers stay as larger labelled tokens.

`EntityRegistry.byType` dedupes alias keys so add-monster / add-NPC pickers list each catalogue entry once.

## Related
`LocalApiClient` character helpers, `CatalogueStore` NPC upsert, `MapSpatial`, `PartyRoster`, `CampaignStateUI.enrichEntityModal`
