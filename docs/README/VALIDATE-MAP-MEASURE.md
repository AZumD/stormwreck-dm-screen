# VALIDATE-MAP-MEASURE.js

## Purpose
Static checks for map zoom cursor (no grab-when-zoomed) and live measure tape preview.

## File
`test/validate-map-measure.js`

## Run
```
node test/validate-map-measure.js
```

## What it checks
- CSS does not force `cursor: grab` on `.map-stage.is-zoomed`
- Active pan still uses `cursor: grabbing`
- `map-spatial.js` has `paintMeasure` + preview line class
- `pointermove` drives preview
- Measure preview CSS + `MAP-SPATIAL.md` tape docs present
- Snap drag uses `MapDistance.snapWorldToCellCenter` in `map-spatial.js` and `map-panel.js`
