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
- Campaign-scoped `GET …/maps/:mapId/image`
- Distance uses `scale.distancePerGrid` (not hard-coded 5 ft)
- Token coordinates in `map-state.tokens`
- Legacy location `mapImage` PNG upload still works
- Map panel / MapSpatial UVTT UI wiring
