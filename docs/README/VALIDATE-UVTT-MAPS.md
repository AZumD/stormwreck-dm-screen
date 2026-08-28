# VALIDATE-UVTT-MAPS.md

## Purpose
Phase M1–M3-lite checks for Universal VTT import, campaign-scoped map images, distance math, and token persistence shape.

## Run
```bash
node test/validate-uvtt-maps.js
```

Included in `npm test`.

## Coverage
- Malformed UVTT JSON rejection
- Missing embedded image rejection
- Grid / resolution / size × pixels_per_grid normalization
- `line_of_sight` + `objects_line_of_sight` walls (source preserved)
- Portal and light import
- `.uvtt` and `.dd2vtt` import paths
- Extracted image under `{DM_DATA_ROOT}/assets/maps/campaign-map/{campaignId}/{mapId}.png`
- Campaign-scoped `GET …/maps/:mapId/image` (streamed + ETag/304 + immutable Cache-Control)
- `resolveMapImage` does not buffer the full file for HTTP
- Distance uses `scale.distancePerGrid` (not hard-coded 5 ft)
- `snapWorldToCellCenter` snaps tokens to grid cell centers (not intersections)
- Token coordinates in `map-state.tokens`
- Legacy location `mapImage` PNG upload still works
- Map panel / MapSpatial UVTT UI wiring
- Campaign and catalogue UVTT import routes use `UVTT_BODY_LIMIT` (64MB) so large `.dd2vtt` files do not hit the default 25MB cap
- HTTP check: 26MB POST to catalogue UVTT route must not return 413
