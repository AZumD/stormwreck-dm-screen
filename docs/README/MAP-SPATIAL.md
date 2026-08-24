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

## Measure
1. Toggle **Measure** (aria-pressed).
2. First click sets the start point (dot + “Click end point…”).
3. Move the pointer: a live **tape** line follows the cursor with a live distance readout (`…` while previewing).
4. Second click locks the line and final distance label.
5. Toggle Measure off (or change map) clears the graphics.

Snap measure (Map settings) applies to both preview and final distance when checked.

## Monster combat tokens
`bind()` returns `spawnMonsterToken(entry)` — copies HP/AC once from the monster catalogue via `CombatSheetModal.buildMonsterToken`. Click (no drag, no Shift) opens the combat sheet for that instance only. Shift-click still selects for distance.

## API
`loadCalibratedMaps(campaignId)`, `summaryToMapDef(summary)`, `bind(ctx)`, `attachChrome(panelBody)`, `ensureLayers(mapWorld)`

See `docs/README/UVTT.md`, `docs/README/MAP-PANEL.md`, and `docs/README/COMBAT-SHEET-MODAL.md`.
