# PLAYER-MAP

## Purpose
Player-facing map tab — a **passive tactical aid**: show where the PC is and what is immediately around them. Not a miniature VTT or an archive for browsing explored areas.

## Camera (player only)
| Behavior | Detail |
|----------|--------|
| Anchor | Own PC token is always centered |
| Pan | Disabled (no drag / keyboard pan) |
| Zoom | Limited tactical range via `PLAYER_MAP_MIN_ZOOM` / `PLAYER_MAP_MAX_ZOOM` / `PLAYER_MAP_DEFAULT_ZOOM` |
| Zoom center | Always the PC (wheel, pinch, +/−) |
| Persistence | Session zoom only; no stored x/y viewport offsets |
| Follow | Poll (~1.5s) recenters when the DM moves the PC or switches maps |
| Layout | Map world stays in-flow (top-left); map tab shell uses `100dvh` flex so the viewport keeps height |

Fog still controls what map information is visible. Camera restriction does not replace fog.

A separate in-world static map (if the party finds one) is out of scope for this module.

## Flow
```
characterId → catalogue_pc_id → partyPositions[pc:id] → mapId → player-safe payload
```

Token arrays are **not** scanned to pick the map. A synced token on the canonical map may supply world coords for calibrated maps.

No manual map picker. If the PC has no `partyPositions` entry → **No map available.**

## Client
| File | Role |
|------|------|
| `js/core/player-map-camera.js` | Zoom constants + PC-centering pan math |
| `js/core/player-map-view.js` | Full-bleed map, PC-centered limited zoom (−/+ / wheel / pinch), fog, visible tokens; grid-aligned sizing like DM; polls every ~1.5s; session zoom; subtle stale indicator when polls fail |
| `js/player-app.js` | Map tab (reuses map host across tab switches) |
| `player/index.html` | Tab + scripts |

## Server
| File | Role |
|------|------|
| `server/lib/player-map.js` | Player-safe map view API, token + pin assembly |
| `server/lib/map-token-size.js` | D&D size → grid footprint + catalogue image resolution (mirrors client) |
| `server/lib/campaign-static-maps.js` | Loads static pins from `js/campaigns/{id}/maps.js` |
| `server/lib/entity-link-aliases.js` | Map pin `entityId` → catalogue id |

## API (session auth)
| Method | Path |
|--------|------|
| GET | `/api/player/campaigns/:id/map-view?characterId=` |
| GET | `/api/player/campaigns/:id/maps/:mapId/image?characterId=` |

Implemented in `server/lib/player-map.js`.

## Player-safe payload
`mapId`, map name, image URL, grid/size when calibrated, fog revision/strokes, and **visible tokens** on that map:

- Combat tokens from `map-state.tokens[mapId]` (`pc` / `npc` / `monster`) — **PC positions always taken from `partyPositions`**, never stale token coords
- Static + custom **map pins** of those types (same as DM `#map-pins` layer on calibrated maps)
- Party PCs from `partyPositions` when not already present

Each token includes label, fresh catalogue-resolved art (`imageUrl` + optional `fallbackUrl`), position, `gridCells`, and `spanW` / `spanH` (% footprint). Own token is flagged with `isSelf: true`.

Token art is resolved server-side like the DM client (`tokenImage` → race-bound monster art → portrait → `/api/assets/…`), not stale stored `imageUrl` alone.

Does **not** include POI/item pins, initiative, HP/AC, hidden (`visible: false`) tokens, or tokens whose center is under unrevealed fog (own PC always included). Fog strokes include brush points and rectangle (`shape: "rect"`) selects via `playerFogDto`.

## Token sizing (player)
On calibrated maps, tokens use the same grid footprint rules as DM `MapTokenSize.gridTokenStyle` — 1-cell tokens are round; Large+ are square multi-cell footprints sized as % of the map. Tokens **with art** render frameless (transparent PNG over the map, `object-fit: contain`); label-only placeholders keep the colored type ring.

## Future
Location catalogue may add `playerMapImage` (player-safe art separate from DM `mapImage`).
