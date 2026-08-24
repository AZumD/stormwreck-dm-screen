# VALIDATE-MAP-ASPECT.js

## Purpose
Static checks that the DM map stage keeps the loaded image’s aspect ratio in sidebar and expanded modes (pins/grid stay aligned with the art).

## File
`test/validate-map-aspect.js`

## Run
```bash
node test/validate-map-aspect.js
```

Included in `npm test`.

## Covers
- CSS `.map-stage` uses `aspect-ratio: var(--map-aspect, …)`
- Expanded/combat `.map-stage` does **not** use `aspect-ratio: auto` or flex-grow stretch
- `map-panel.js` sets `--map-aspect` from `naturalWidth` / `naturalHeight` (`syncMapAspect`)
- `MapPanel.onLayoutChange` + `LayoutPanels` notify on expand/collapse
