# PLAYER-MAP

## Purpose
Player-facing map tab — shows the map containing the player's PC, fog, and visible combat tokens on that map.

## Flow
```
characterId → catalogue_pc_id → partyPositions[pc:id] → mapId → player-safe payload
```

Token arrays are **not** scanned to pick the map. A synced token on the canonical map may supply world coords for calibrated maps.

No manual map picker. If the PC has no `partyPositions` entry → **No map available.**

## Client
| File | Role |
|------|------|
| `js/core/player-map-view.js` | Full-bleed map, pan/zoom (+/−/Fit, wheel, pinch), fog, all visible tokens; polls every ~1.5s |
| `js/player-app.js` | Map tab |
| `player/index.html` | Tab + scripts |

## API (session auth)
| Method | Path |
|--------|------|
| GET | `/api/player/campaigns/:id/map-view?characterId=` |
| GET | `/api/player/campaigns/:id/maps/:mapId/image?characterId=` |

Implemented in `server/lib/player-map.js`.

## Player-safe payload
`mapId`, map name, image URL, grid/size when calibrated, fog revision/strokes, and **visible combat tokens** on that map (`pc` / `npc` / `monster` — label, art, position, grid footprint). Own token is flagged with `isSelf: true`.

Does **not** include DM pins, initiative, HP/AC, or hidden (`visible: false`) tokens.

## Future
Location catalogue may add `playerMapImage` (player-safe art separate from DM `mapImage`).
