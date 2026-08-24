# UVTT.md

## Purpose
Universal VTT (`.dd2vtt` / `.uvtt`) import → normalized campaign maps with calibrated coordinates, measurement, and DM tokens.

## Server
| Module | Role |
|--------|------|
| `server/lib/uvtt.js` | Parse/normalize UVTT JSON (incl. `objects_line_of_sight`) |
| `server/lib/campaign-maps.js` | `maps.json` + campaign-scoped image files |
| `server/lib/map-distance.js` | World-space distance (pluggable modes) |

## Persistence
| Data | Path |
|------|------|
| Map metadata + geometry | `{DM_DATA_ROOT}/campaigns/{id}/maps.json` |
| Extracted images | `{DM_DATA_ROOT}/assets/maps/campaign-map/{campaignId}/{mapId}.{ext}` |
| Tokens | `map-state.json` → `tokens[mapId][]` |

Images are **not** stored as base64 in JSON. Served via:

`GET /api/campaigns/:campaignId/maps/:mapId/image` (DM-only)

## APIs (DM)
| Method | Path |
|--------|------|
| GET | `/api/campaigns/:id/maps` |
| POST | `/api/campaigns/:id/maps/import-uvtt` `{ text, filename?, mapName? }` (body limit **64MB**) |
| GET/PATCH/DELETE | `/api/campaigns/:id/maps/:mapId` |
| GET | `/api/campaigns/:id/maps/:mapId/image` |
| POST | `/api/campaigns/:id/maps/:mapId/distance` |

Large `.dd2vtt` files (tens of MB with embedded images) need the UVTT body limit; the default API cap is 25MB and used to surface as browser **Failed to fetch**.

## Client
| File | Role |
|------|------|
| `js/core/map-distance.js` | Client distance / coord helpers |
| `js/core/map-spatial.js` | Import UI, grid, measure, tokens |
| `js/core/map-panel.js` | Integrates calibrated maps into selector |

## Geometry
Walls normalize from both `line_of_sight` and `objects_line_of_sight` with `source` retained for later lighting/LOS work. Portals and lights are stored but not simulated yet.

## Out of scope (later)
Fog of war, dynamic lighting, player map views, combat movement enforcement.
