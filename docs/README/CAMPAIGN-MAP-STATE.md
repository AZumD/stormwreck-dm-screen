# CAMPAIGN-MAP-STATE.js

## Purpose
Map panel persistence (active map, filters, pin/party positions, custom pins) as one campaign document.

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

Calibrated map definitions live in sibling `maps.json` (see `docs/README/UVTT.md`).
