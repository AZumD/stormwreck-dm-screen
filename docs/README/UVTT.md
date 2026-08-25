# UVTT.md

## Purpose
Universal VTT (`.dd2vtt` / `.uvtt`) import → calibrated maps for **location catalogue** entries. Campaigns pick which locations appear on the map panel.

## Canonical path (live)
| Module | Role |
|--------|------|
| `server/lib/uvtt.js` | Parse/normalize UVTT JSON (incl. `objects_line_of_sight`) |
| `server/lib/catalogue-location-maps.js` | Location UVTT sidecar + raster via assets |
| `server/lib/map-distance.js` | World-space distance (pluggable modes) |

| Data | Path |
|------|------|
| Geometry + grid | `{DM_DATA_ROOT}/assets/uvtt/location/{id}.json` |
| Extracted image | `{DM_DATA_ROOT}/assets/maps/location/{id}.{ext}` |
| Summary on entry | catalogue `mapCalibration` (+ `mapImage` URL) |
| Campaign membership | `locations.json` → map picker |
| Tokens / pin positions | `map-state.json` keyed by **location link id** |

## APIs (DM)
| Method | Path |
|--------|------|
| POST | `/api/catalogue-assets/location/:id/uvtt` `{ text, filename? }` (body limit **64MB**) |
| GET | `/api/catalogue-assets/location/:id/uvtt` |
| PATCH | `/api/catalogue-assets/location/:id/uvtt` `{ display?, scale? }` |
| DELETE | `/api/catalogue-assets/location/:id/uvtt` |

Upload UVTT in the **Location catalogue**. On the campaign screen: **Map → + Add location…** (or Locations panel). Map settings link to the catalogue — there is no campaign-level UVTT file upload.

## Client
| File | Role |
|------|------|
| `js/core/map-distance.js` | Client distance / coord helpers |
| `js/core/map-spatial.js` | Grid, measure, tokens; display prefs via location PATCH |
| `js/core/map-panel.js` | Builds maps from campaign locations + catalogue |
| `js/core/campaign-locations.js` | Which locations belong to the campaign |

## Legacy (campaign `maps.json`)
`server/lib/campaign-maps.js` remains as a library helper for older data/tests. **HTTP routes under `/api/campaigns/:id/maps` were removed** — the live map panel uses location catalogue UVTT only.

## Geometry
Walls normalize from both `line_of_sight` and `objects_line_of_sight` with `source` retained for later lighting/LOS work. Portals and lights are stored but not simulated yet.

## Out of scope (later)
Fog of war, dynamic lighting, player map views, combat movement enforcement.
