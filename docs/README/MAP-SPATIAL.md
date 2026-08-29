# MAP-SPATIAL.js

## Purpose
Calibrated / UVTT helpers for MapPanel: measure, grid overlay, DM tokens. Not a full VTT combat UI.

## File
`js/core/map-spatial.js` → `window.MapSpatial`

## Chrome
Prefers static campaign markup:
- Primary actions: `#map-measure-btn`, `#map-fog-btn`, `#map-add-token-btn` (shown when map is calibrated)
- Settings body: link to **Location catalogue** for UVTT, kind badge, meta (grid dims / px/grid / LOS·portals·lights), grid toggle, snap, ft/grid, **fog tools**

`attachChrome()` injects any missing slots incrementally (including fog on pages that already have measure/grid markup, and the fullscreen drawer).

Display/scale toggles persist via `PATCH /api/catalogue-assets/location/:id/uvtt` (`LocalApiClient.patchLocationUvtt`).

## Measure
1. Toggle **Measure** (aria-pressed).
2. First click sets the start point (dot + “Click end point…”).
3. Move the pointer: a live **tape** line follows the cursor with a live distance readout (`…` while previewing).
4. Second click locks the line and final distance label.
5. Toggle Measure off (or change map) clears the graphics.

Snap measure (Map settings) applies to both preview and final distance when checked. Token and pin drag with snap on aligns to **grid cell centers** (not line intersections) via `MapDistance.snapWorldToCellCenter`.

## Combat tokens (monster / NPC / PC)
`bind()` returns `spawnMonsterToken(entry)` and `spawnCombatToken(kind, entry)` — builds tokens via `CombatSheetModal.buildCombatToken` / `buildNpcToken` / `buildPcToken`. Tokens render as **grid-aligned** footprints from D&D **Size** (`MapTokenSize`).

- **Monster** — instance HP/AC; click opens monster-token combat sheet (**Remove from map**)
- **NPC / PC** — click opens catalogue-backed combat sheet; art prefers own `tokenImage`, else race-bound monster token
- Shift-click selects for distance; right-click removes; drag snaps to **cell center** when **Snap measure** is on

## Manual fog
**Fog** tool (primary row) + settings: enable fog, Reveal/Hide brushes, Undo, Hide all, Reveal all. Strokes persist in `CampaignMapState.fog` — see `docs/README/MAP-FOG.md`.

## PC / NPC pins (non-calibrated or legacy)
Wiki pins still exist for image maps. On calibrated maps, **Add** places combat tokens instead. Size still resolves from monster catalogue name match on `race`, then race catalogue, then defaults. See `docs/README/MAP-TOKEN-SIZE.md`.

## API
`loadCalibratedMaps(campaignId)` (legacy campaign-maps list), `summaryToMapDef(summary)`, `bind(ctx)`, `attachChrome(panelBody)`, `ensureLayers(mapWorld)`

Live maps come from `MapPanel.getEffectiveMaps` (campaign locations + catalogue), not from `loadCalibratedMaps`.

See `docs/README/UVTT.md`, `docs/README/MAP-PANEL.md`, and `docs/README/COMBAT-SHEET-MODAL.md`.
