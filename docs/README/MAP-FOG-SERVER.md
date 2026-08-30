# MAP-FOG.js (server)

## Purpose
Fog visibility helpers for the player map API — mirrors stroke semantics from `js/core/map-fog.js`.

## File
`server/lib/map-fog.js`

## Functions
| Function | Role |
|----------|------|
| `isPointHidden(fog, x, y)` | Normalized 0–1 coords; true when fog covers the point |
| `isPercentHidden(fog, percent)` | Token position (0–100 %) |
| `filterVisibleTokens(tokens, fog)` | Drops fogged tokens; keeps `isSelf` |

Used by `server/lib/player-map.js` so hidden monster/NPC positions are not sent to players.

## Run tests
```
node test/validate-map-fog.js
node test/validate-player-map.js
```
