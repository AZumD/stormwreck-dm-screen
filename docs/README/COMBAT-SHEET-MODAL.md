# COMBAT-SHEET-MODAL.js

## Purpose
Shared DM combat sheet for live HP / AC / conditions / initiative during play. Opens from party cards, map pins (PC/NPC), and monster combat tokens.

## File
`js/core/combat-sheet-modal.js` → `window.CombatSheetModal`

## Backing store

| Kind | Open from | Save target |
|------|-----------|-------------|
| **PC** | Party / map pin | Postgres `character_state` (HP, temp HP, conditions, inspiration, `death_saves`, `spell_slots`, `class_resources`, `extras.combat_initiative`) + sheet `ac`; remirrors to PC catalogue |
| **NPC** | Party / map pin | Sitewide NPC catalogue (`hp`, `ac`, `combatConditions`, `combatInitiative`); NPC memory enricher still attaches |
| **Monster token** | Map combat token click | That token only in `CampaignMapState.tokens` (incl. `initiative`) — never writes the monster catalogue |

## Initiative
- Number input on every combat sheet (default `0`)
- Values other than `0` sync into `map-state.initiativeTracker` and appear under the map (`#map-initiative`), highest first
- Clearing to `0` removes the combatant from the list

## UI
- Name, type badge, portrait
- HP current / max with ±1, AC, initiative, conditions (freeform)
- PC: temp HP, inspiration, death saves (3/3), spell slots L1–L9 (max / used), class resources (current / max)
- **Combat reference** — resolved catalogue stat block (speed, saves, actions, spells, equipment, etc.; HP/AC omitted because they are editable above)
- Autosave on blur / short debounce; Save button; last-saved hint
- Monster token sheet: **Remove from map** button (also right-click the dot)
- Optional “Open full catalogue” for wiki read view
- NPC: campaign memory enricher still attaches below combat reference

## Monster spawn
`MapPanel` “Add monster” spawns a compact **map pin dot** (same size as PC/NPC pins) on calibrated maps via `MapSpatial.spawnMonsterToken` and `CombatSheetModal.buildMonsterToken` (one-time HP/AC copy). Generic **+ Token** markers stay as larger labelled tokens.

`EntityRegistry.byType` dedupes alias keys so add-monster / add-NPC pickers list each catalogue entry once.

## Related
`LocalApiClient` character helpers, `CatalogueStore` NPC upsert, `MapSpatial`, `MapPanel.refreshInitiative`, `PartyRoster`, `CampaignStateUI.enrichEntityModal`
