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
| `pinPositions` / `partyPositions` / `customPins` | Legacy % pins |
| `tokens` | `{ [mapId]: Token[] }` world-space DM tokens |
| `initiativeTracker` | Canonical combatant initiative map (shared table state) |

## Persistence
- **API available:** `patch(campaignId, partial)` sends **only** the partial body via `LocalApiClient.patchCampaignDocument` (`PATCH`), optimistically deep-merges locally, then reconciles with the returned canonical document.
- **API unavailable:** same fields (including `initiativeTracker`) round-trip through `localStorage`.
- `persist()` still does a full-document `PUT` for rare full replaces.

Merge semantics match `server/lib/deep-merge.js` (objects merge, arrays replace, `null` deletes).

Calibrated map definitions live in sibling `maps.json` (see `docs/README/UVTT.md`).

## Related
`docs/CLIENT-ARCHITECTURE.md`, `docs/README/COMBAT-SHEET-MODAL.md`, `docs/README/DEEP-MERGE.md`
