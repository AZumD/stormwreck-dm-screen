# VALIDATE-MAP-COORDINATE-SYNC.js

## Purpose
Regression checks for fog, token, and grid coordinate alignment between DM map painting/rendering and the player map.

## Script
`test/validate-map-coordinate-sync.js`

## Run
```bash
node test/validate-map-coordinate-sync.js
```

## Covers
- `MapDistance.imageContentRect`, `clientToNormalized`, `clientToPercent`
- Fog paint uses `#map-image` coords (not letterboxed `#map-world` box)
- Grid overlay lines via `worldToPercent` + `grid.origin`
- DM `gridTokenStyle` uses `translate(-50%, -50%)` (matches player tokens)
- DM `.map-image` layout matches player (`height: auto`, no `object-fit: contain`)

## See also
`docs/README/MAP-FOG.md`, `docs/README/MAP-TOKEN-SIZE.md`, `docs/README/VALIDATE-PLAYER-MAP.md`
