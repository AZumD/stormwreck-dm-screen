# CATALOGUE-LOCATION-MAPS.js

## Purpose
Server-side UVTT import, geometry storage, and display/scale patches for **location catalogue** entries.

## File
`server/lib/catalogue-location-maps.js`

## Storage
| Asset | Path |
|-------|------|
| Raster (map image) | `data/assets/maps/location/{id}.*` (via `assets.putFieldFromBuffer`) |
| UVTT geometry + grid | `data/assets/uvtt/location/{id}.json` |

## API
- `POST /api/catalogue-assets/location/{id}/uvtt` — body `{ text, filename }` → `{ mapImage, mapCalibration }`
- `GET /api/catalogue-assets/location/{id}/uvtt` — full map model for spatial tools
- `PATCH /api/catalogue-assets/location/{id}/uvtt` — `{ display?, scale? }` → updates sidecar + entry `mapCalibration`
- `DELETE /api/catalogue-assets/location/{id}/uvtt` — remove geometry sidecar

Entry JSON stores `mapCalibration` summary (no geometry blob). Import also writes `mapImage` / `mapCalibration` onto the catalogue entry when it exists.

## Related
`server/lib/uvtt.js`, `js/core/catalogue/app.js`, `js/core/map-spatial.js`, `docs/README/CAMPAIGN-LOCATIONS.md`, `docs/README/UVTT.md`
