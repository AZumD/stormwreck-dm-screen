# MAP-PC-PLACEMENT.js

## Purpose
Enforces **one map per PC** — canonical mutation for placing, moving, or removing party PC tokens/pins.

## File
`js/core/map-pc-placement.js` → `window.MapPcPlacement`

## Identity
Stable key: catalogue PC id (`pc-mswdvrcy-u6nnt`). Party id format: `pc:{catalogueId}`.

## API
| Function | Role |
|----------|------|
| `findPcLocation(mapState, catalogueId)` | Derive map from tokens (preferred) or `partyPositions` |
| `placePcOnMap(campaignId, opts)` | Single PATCH: update target map + remove PC from all other maps |
| `syncTokenDrag(campaignId, mapId, token, map)` | After combat-token drag, sync `partyPositions` |
| `removePcToken(campaignId, mapId, token, map)` | Clear PC from map entirely |
| `normalizeDuplicates(campaignId)` | Migration: dedupe legacy multi-map PC tokens on bootstrap |

## Duplicates
When several maps contain the same PC token, normalization keeps the placement on `partyPositions.mapId` if set, else the newest `tok-pc-{timestamp}-*` id.

## Used by
`map-panel.js` (pin drag, Add PC), `map-spatial.js` (spawn/drag/remove), `campaign-map-state.js` (bootstrap normalize).
