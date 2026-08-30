# CAMPAIGN-MAP-STATE.js

## Purpose
Map panel persistence (active map, filters, pin/party positions, custom pins, tokens, initiative tracker) as one campaign document.

## File
`js/core/campaign-map-state.js` → `window.CampaignMapState`

Document: `map-state.json`

## Shape
| Field | Role |
|-------|------|
| `activeMap` | Selected map id |
| `filters` | Pin type visibility |
| `pinPositions` | Dragged % pin overrides |
| `partyPositions` | **Canonical** PC map location — `{ [pc:catalogueId]: { mapId, x, y } }` |
| `customPins` | DM-added pins |
| `removedPins` | Static pin ids hidden per map |
| `tokens` | `{ [mapId]: Token[] }` combat instances (PC world coords synced from partyPositions) |
| `fog` | `{ [mapId]: { enabled, revision, revealedAll, strokes: { [id]: Stroke } } }` manual fog |
| `initiativeTracker` | Canonical combatant initiative map (shared table state) |

**PC placement rule:** `partyPositions` is the only authoritative source for which map a PC is on and their percent position. `tokens[]` is a synchronized combat/render copy and must not override canonical placement (see `docs/README/MAP-PC-PLACEMENT.md`).

## Persistence
- **API available:** `patch(campaignId, partial)` sends **only** the partial body via `LocalApiClient.patchCampaignDocument` (`PATCH`), optimistically deep-merges locally, then reconciles with the returned canonical document.
- **API unavailable:** same fields (including `initiativeTracker`) round-trip through `localStorage`.
- `persist()` still does a full-document `PUT` for rare full replaces.

Merge semantics match `server/lib/deep-merge.js` (objects merge, arrays replace, `null` deletes).

Calibrated map definitions live in sibling `maps.json` (see `docs/README/UVTT.md`).

## Related
`docs/CLIENT-ARCHITECTURE.md`, `docs/README/COMBAT-SHEET-MODAL.md`, `docs/README/DEEP-MERGE.md`
