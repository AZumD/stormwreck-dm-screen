# CATALOGUE-LOCATION-MAPS.js

## Purpose
Server-side UVTT import and geometry storage for **location catalogue** entries.

## File
`server/lib/catalogue-location-maps.js`

## Storage
| Asset | Path |
|-------|------|
| Raster (map image) | `data/assets/maps/location/{id}.*` (via `assets.putFieldFromDataUrl`) |
| UVTT geometry + grid | `data/assets/uvtt/location/{id}.json` |

## API
- `POST /api/catalogue-assets/location/{id}/uvtt` — body `{ text, filename }` → `{ mapImage, mapCalibration }`
- `GET /api/catalogue-assets/location/{id}/uvtt` — full map model for spatial tools
- `DELETE /api/catalogue-assets/location/{id}/uvtt` — remove geometry sidecar

Entry JSON stores `mapCalibration` summary (no geometry blob).

## Related
`server/lib/uvtt.js`, `js/core/catalogue/app.js`, `docs/README/CAMPAIGN-LOCATIONS.md`
