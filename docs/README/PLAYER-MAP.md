# PLAYER-MAP

## Purpose
Player-facing map tab — shows the map containing the player's PC token only.

## Flow
```
characterId → catalogue_pc_id → partyPositions[pc:id] → mapId → player-safe payload
```

Token arrays are **not** scanned to pick the map. A synced token on the canonical map may supply world coords for calibrated maps.

No manual map picker. If the PC has no `partyPositions` entry → **No map available.**

## Client
| File | Role |
|------|------|
| `js/core/player-map-view.js` | Full-bleed map, pan/zoom, fog, token; polls every ~1.5s |
| `js/player-app.js` | Map tab |
| `player/index.html` | Tab + scripts |

## API (session auth)
| Method | Path |
|--------|------|
| GET | `/api/player/campaigns/:id/map-view?characterId=` |
| GET | `/api/player/campaigns/:id/maps/:mapId/image?characterId=` |

Implemented in `server/lib/player-map.js`.

## Player-safe payload
Only: `mapId`, map name, image URL, grid/size when calibrated, **own** token position/art, fog revision/strokes.

Does **not** include DM pins, other tokens, initiative, or full `map-state`.

## Future
Location catalogue may add `playerMapImage` (player-safe art separate from DM `mapImage`).
