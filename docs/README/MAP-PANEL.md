# MAP-PANEL.js

## Purpose
Campaign map rail: map selector, catalogue image override, filterable pins, drag-to-reposition, party roster (tabbed).

## File
`js/core/map-panel.js` → `window.MapPanel`

## UI structure
- Tabs: **Map** | **Party** | **Music**
- **Map workspace** (`onWorkspaceChange("map")`): Map tab + full tools + large canvas; Expand hidden
- **Run/Prep utility** (`onWorkspaceChange` other): Map tab hidden; Party | Music only
- Map tab: selector → primary actions (Measure, + Token, Layers, +, Fit, Fullscreen, Map settings) → stage → settings
- Party / Music tabs unchanged
- **Expand** is a legacy layout shim; prefer the **Map** workspace switcher
- **Fullscreen** opens `campaigns/map-fullscreen/` in a new tab

`showLocationOnMap` switches to the Map workspace when `CampaignWorkspace` is available.

## Image resolution
1. Map must be a **campaign location** (see `docs/README/CAMPAIGN-LOCATIONS.md`)
2. Location catalogue `mapImage` or UVTT `mapCalibration` (+ extracted image)
3. Else static placeholder from `js/campaigns/*/maps.js` when `locationId` matches
4. UVTT geometry served from `/api/catalogue-assets/location/{id}/uvtt`

## Spatial tools (calibrated / UVTT)
- Import `.dd2vtt` / `.uvtt` in the **Location catalogue** (not per-campaign)
- Add that location to the campaign under **Locations**
- Optional grid overlay, measure tool, editable ft/grid on calibrated maps
- DM tokens (world coordinates); select two for distance
- **Add monster / NPC / PC** on calibrated maps places a **combat token** (grid-sized). Monsters keep instance HP/AC; NPC/PC clicks open the catalogue-backed combat sheet. Uploaded **Map token** art overrides any race-bound monster token.
- On non-calibrated maps, NPC / PC / item still place as wiki pins
- PC / NPC pin clicks open the **combat sheet**; POI / item / freeform still use the wiki modal
- See `docs/README/UVTT.md`, `docs/README/MAP-SPATIAL.md`, `docs/README/MAP-TOKEN-SIZE.md`, and `docs/README/COMBAT-SHEET-MODAL.md`

## Pin persistence
All map panel state (pin positions, party positions, custom pins, removed static pins, tokens, fog, initiative) persists through **`CampaignMapState`** → `map-state.json` (or localStorage fallback when the API is offline).

| Field | Role |
|-------|------|
| `partyPositions` | **Canonical** PC map + percent position (`pc:{catalogueId}`) |
| `pinPositions` | Dragged pin overrides |
| `removedPins` | Static catalogue pins hidden from DM + player maps |
| `tokens` | Combat token instances (synced render representation for PCs) |

Drag moves pins; click (without drag) opens the combat sheet (PC/NPC) or entity modal (other).

## Party
Roster UI is owned by `PartyRoster` (`js/core/party.js`) on the **Party** tab. Map panel calls it to render/refresh. PC map pins come from party members with type `pc` that have saved positions.

## Zoom
- Mouse wheel over the map zooms toward the cursor (no on-map chrome)
- When zoomed in, drag empty map area to pan
- Cursor stays the default arrow while zoomed; grab/hand only while actively panning
- Pins counter-scale so they grow slower than the map
- **Grid tokens** on calibrated maps stay locked to grid cells at every zoom (no counter-scale)
- Zoom resets when switching maps

## Aspect / expand
- On image load (and map change), sets `--map-aspect` on `#map-stage` from `naturalWidth / naturalHeight`
- Stage CSS uses that ratio in both sidebar and expanded modes so % pins, grid, and tokens stay on the art
- `onLayoutChange()` re-syncs aspect + transform when `LayoutPanels` expands/collapses

## Add pins
- **+** in primary actions opens a dialog: choose NPC / Monster / Item / PC, then pick an entry
- Custom pins save in `{campaignId}-custom-pins`
- Click a custom pin → details → **Remove from map**
- PCs are placed via party position overrides

## API
`init(campaignId)`, `refresh()`, `onLayoutChange()`, helpers `resolveMapImage`, `getEffectiveMaps`
