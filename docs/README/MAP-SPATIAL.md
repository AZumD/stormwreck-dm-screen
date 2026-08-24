# MAP-SPATIAL.js

## Purpose
Calibrated / UVTT helpers for MapPanel: measure, grid overlay, DM tokens, UVTT import. Not a full VTT combat UI.

## File
`js/core/map-spatial.js` → `window.MapSpatial`

## Chrome
Prefers static campaign markup:
- Primary actions: `#map-measure-btn`, `#map-add-token-btn` (shown when map is calibrated)
- Settings body: UVTT import, kind badge, meta (grid dims / px/grid / LOS·portals·lights), grid toggle, snap, ft/grid

Falls back to injecting chrome if older pages lack the slots.

## API
`loadCalibratedMaps(campaignId)`, `summaryToMapDef(summary)`, `bind(ctx)`, `attachChrome(panelBody)`, `ensureLayers(mapWorld)`

See `docs/README/UVTT.md` and `docs/README/MAP-PANEL.md`.
