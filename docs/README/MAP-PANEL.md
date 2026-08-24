# MAP-PANEL.js

## Purpose
Campaign map rail: map selector, catalogue image override, filterable pins, drag-to-reposition, party roster (tabbed).

## File
`js/core/map-panel.js` → `window.MapPanel`

## UI structure
- Tabs: **Map** | **Party** (Party is not stacked under the map)
- Map tab: selector → compact primary actions (Measure, + Token, Layers, +, Expand, Map settings) → map stage → collapsible **Map settings** (UVTT import/meta, grid, snap, ft/grid)
- **Layers** popover replaces the permanent pin checkbox list (same filter persistence)
- Expand uses `LayoutPanels.setMapMode("expanded")` — same MapPanel instance (zoom/pan/tokens preserved)

## Image resolution
1. Calibrated / UVTT maps use campaign-scoped `imageUrl` (`/api/campaigns/…/maps/…/image`)
2. Else look up `map.locationId` (or `map.id`) in Location catalogue
3. If `entry.mapImage` exists → use that URL
4. Else use `map.image` placeholder path
5. Locations with an upload but no `MAPS` entry are added to the dropdown automatically

## Spatial tools (calibrated / UVTT)
- Import `.dd2vtt` / `.uvtt` via Map settings
- Optional grid overlay, measure tool, editable ft/grid
- DM tokens (world coordinates); select two for distance
- See `docs/README/UVTT.md` and `docs/README/MAP-SPATIAL.md`

## Pin persistence
| Key | Contents |
|-----|----------|
| `{campaignId}-pin-positions` | `{ [mapId]: { [pinId]: { x, y } } }` |
| `{campaignId}-party-positions` | `{ [partyId]: { mapId, x, y } }` |

Drag moves pins; click (without drag) opens the entity/party modal.

## Party
Roster UI is owned by `PartyRoster` (`js/core/party.js`) on the **Party** tab. Map panel calls it to render/refresh. PC map pins come from party members with type `pc` that have saved positions.

## Zoom
- Mouse wheel over the map zooms toward the cursor (no on-map chrome)
- When zoomed in, drag empty map area to pan
- Cursor stays the default arrow while zoomed; grab/hand only while actively panning
- Pins counter-scale so they grow slower than the map
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
