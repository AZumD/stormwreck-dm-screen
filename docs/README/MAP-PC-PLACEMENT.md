# MAP-PC-PLACEMENT.js

## Purpose
Enforces **one map per PC** with a single canonical location record.

## Canonical source of truth
```
partyPositions["pc:{catalogueId}"] = { mapId, x, y }   ← authoritative
tokens[mapId][]                                         ← synchronized combat representation
```

**Never** derive a PC's map from `tokens[]` alone. A stale token on another map is ignored until `normalizeDuplicates` removes it.

## Files
| File | Role |
|------|------|
| `js/core/map-pc-placement.js` | Client mutations (`placePcOnMap`, drag sync, normalize on bootstrap) |
| `server/lib/map-pc-placement.js` | Shared canonical lookup + normalize (used by player map API + tests) |

## Identity
Stable key: catalogue PC id (`pc-mswdvrcy-u6nnt`). Party id format: `pc:{catalogueId}`.

## API (client)
| Function | Role |
|----------|------|
| `findPcLocation(mapState, catalogueId)` | Read canonical `partyPositions`; attach token on that map if present |
| `placePcOnMap(campaignId, opts)` | PATCH canonical location + sync/remove tokens on all maps |
| `syncTokenDrag(...)` | After combat-token drag, update canonical `{ mapId, x, y }` |
| `removePcToken(...)` | Clear canonical location + all tokens |
| `normalizeDuplicates(campaignId)` | Repair token arrays to match `partyPositions` on bootstrap |

## Normalization
- Removes PC tokens on maps ≠ `partyPositions.mapId`
- Dedupes multiple PC tokens on the canonical map (newest `tok-pc-*` id wins)
- Legacy: token-only state (no `partyPositions`) promotes newest token → `partyPositions`

## Used by
`map-panel.js`, `map-spatial.js`, `campaign-map-state.js` (bootstrap), `server/lib/player-map.js` (player Map tab).
