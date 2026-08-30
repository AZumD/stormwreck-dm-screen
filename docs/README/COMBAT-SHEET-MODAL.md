# COMBAT-SHEET-MODAL.js

## Purpose
Shared DM combat sheet for live HP / AC / conditions / initiative during play. Opens from party cards, map pins (PC/NPC), and monster combat tokens.

## File
`js/core/combat-sheet-modal.js` → `window.CombatSheetModal`

## Backing store

| Kind | Open from | Save target |
|------|-----------|-------------|
| **PC** | Party / map pin | Postgres `character_state` (HP, temp HP, conditions, inspiration, `death_saves`, `spell_slots`, `class_resources`, other `extras`) + sheet `ac`; remirrors to PC catalogue. **Not** `extras.combat_initiative`. |
| **NPC** | Party / map pin / combat token | Sitewide NPC catalogue (`hp`, `ac`, `combatConditions`); NPC memory enricher still attaches. **Not** `combatInitiative`. Map placement: **Remove from map** drops the token or pin (static pins → `removedPins` in map-state). |
| **Monster token** | Map combat token click | That token only in `CampaignMapState.tokens` (HP/AC/conditions) — never writes the monster catalogue. **Not** token `initiative`. |

## Initiative (canonical)
- Stored only in `map-state.initiativeTracker` via `CampaignMapState.patch`
- Keys: `pc:<characterId>`, `npc:<catalogueId>`, `tok:<tokenId>`
- Values: `{ name, initiative, kind: "pc"|"npc"|"monster" }`
- Number input on every combat sheet (default `0`); `0` / blank removes the combatant (`null` delete in the patch)
- List under the map (`#map-initiative`), highest first
- Legacy `extras.combat_initiative` / `combatInitiative` / token `initiative` may still be **read** as fallback when no tracker entry exists; new saves do not write those fields

## UI
- Name, type badge, portrait
- HP current / max with ±1, AC, initiative, conditions (freeform)
- PC: temp HP, inspiration, death saves (3/3), spell slots L1–L9 (max / used), class resources (current / max)
- **Combat reference** — resolved catalogue stat block (speed, saves, actions, spells, equipment, etc.; HP/AC omitted because they are editable above)
- Autosave on blur / short debounce; Save button; last-saved hint
- Monster token sheet: **Remove from map** button (also right-click the dot)
- NPC on the map (combat token or catalogue pin): **Remove from map** in the combat sheet footer
- Optional “Open full catalogue” for wiki read view
- NPC: campaign memory enricher still attaches below combat reference

## Monster / NPC / PC spawn
`MapPanel` **Add** on calibrated maps spawns grid combat tokens via `MapSpatial.spawnCombatToken` and `CombatSheetModal.buildCombatToken` (also `buildMonsterToken` / `buildNpcToken` / `buildPcToken`).

| Kind | Art priority | Combat sheet |
|------|--------------|--------------|
| Monster | Monster `tokenImage` → `portrait` | Instance token (no catalogue write-back) |
| NPC / PC | Own `tokenImage` → race-bound monster `tokenImage` → own `portrait` → race monster `portrait` | Catalogue / Postgres (same as pin open) |

Generic **+ Token** markers stay labelled unless given `gridCells`.

`EntityRegistry.byType` dedupes alias keys so add-monster / add-NPC pickers list each catalogue entry once.

## Related
`LocalApiClient` character helpers, `CatalogueStore` NPC upsert, `MapSpatial`, `MapPanel.refreshInitiative`, `PartyRoster`, `CampaignStateUI.enrichEntityModal`, `docs/CLIENT-ARCHITECTURE.md`
