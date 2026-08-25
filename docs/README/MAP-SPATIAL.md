# MAP-SPATIAL.js

## Purpose
Calibrated / UVTT helpers for MapPanel: measure, grid overlay, DM tokens. Not a full VTT combat UI.

## File
`js/core/map-spatial.js` → `window.MapSpatial`

## Chrome
Prefers static campaign markup:
- Primary actions: `#map-measure-btn`, `#map-add-token-btn` (shown when map is calibrated)
- Settings body: link to **Location catalogue** for UVTT, kind badge, meta (grid dims / px/grid / LOS·portals·lights), grid toggle, snap, ft/grid

Display/scale toggles persist via `PATCH /api/catalogue-assets/location/:id/uvtt` (`LocalApiClient.patchLocationUvtt`).

Falls back to injecting chrome if older pages lack the slots.

## Measure
1. Toggle **Measure** (aria-pressed).
2. First click sets the start point (dot + “Click end point…”).
3. Move the pointer: a live **tape** line follows the cursor with a live distance readout (`…` while previewing).
4. Second click locks the line and final distance label.
5. Toggle Measure off (or change map) clears the graphics.

Snap measure (Map settings) applies to both preview and final distance when checked.

## Monster combat tokens
`bind()` returns `spawnMonsterToken(entry)` — copies HP/AC once from the monster catalogue via `CombatSheetModal.buildMonsterToken`. Monsters render as compact **map pin dots** (same footprint as PC/NPC). Click opens the combat sheet (with **Remove from map**); Shift-click selects for distance; right-click also removes.

## API
`loadCalibratedMaps(campaignId)` (legacy campaign-maps list), `summaryToMapDef(summary)`, `bind(ctx)`, `attachChrome(panelBody)`, `ensureLayers(mapWorld)`

Live maps come from `MapPanel.getEffectiveMaps` (campaign locations + catalogue), not from `loadCalibratedMaps`.

See `docs/README/UVTT.md`, `docs/README/MAP-PANEL.md`, and `docs/README/COMBAT-SHEET-MODAL.md`.
