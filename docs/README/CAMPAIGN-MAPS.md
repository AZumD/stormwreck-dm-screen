# CAMPAIGN-MAPS

## Purpose
Library for **legacy** campaign-scoped calibrated/UVTT maps (`maps.json` + `assets/maps/campaign-map/`). Live campaigns use **location catalogue** UVTT (`docs/README/UVTT.md`); this module remains for older files and tests.

## File
`server/lib/campaign-maps.js`

## Image serving
| Helper | Role |
|--------|------|
| `resolveMapImage(campaignId, mapId)` | Path + MIME + size/mtime — **no full-file read** |
| `readMapImage(...)` | Buffer read for tools/tests only |

HTTP: `GET /api/campaigns/:campaignId/maps/:mapId/image` streams via `sendFileStream` with immutable CDN caching (each import gets a new `mapId`; images are not replaced in place).

## Related
`docs/README/UVTT.md`, `docs/README/HTTP-CACHE.md`, `test/validate-uvtt-maps.js`
