# MAP-PANEL.js

## Purpose
Campaign map rail: map selector, catalogue image override, filterable pins, drag-to-reposition, party roster.

## File
`js/core/map-panel.js` → `window.MapPanel`

## Image resolution
1. Look up `map.locationId` (or `map.id`) in Location catalogue
2. If `entry.mapImage` (`/api/assets/…` or hydrated legacy value) exists → use it
3. Else use `map.image` placeholder path
4. Locations with an upload but no `MAPS` entry are added to the dropdown automatically

## Pin persistence
| Key | Contents |
|-----|----------|
| `{campaignId}-pin-positions` | `{ [mapId]: { [pinId]: { x, y } } }` |
| `{campaignId}-party-positions` | `{ [partyId]: { mapId, x, y } }` |

Drag moves pins; click (without drag) opens the entity/party modal.

## Party
Roster UI is owned by `PartyRoster` (`js/core/party.js`). Map panel calls it to render/refresh. PC map pins come from party members with type `pc` that have saved positions.

## Zoom
- Mouse wheel over the map zooms toward the cursor (no on-map chrome)
- When zoomed in, drag empty map area to pan
- Pins counter-scale so they grow slower than the map
- Zoom resets when switching maps

## Add pins
- **+** under the map opens a dialog: choose NPC / Monster / Item / PC, then pick an entry
- Custom pins save in `{campaignId}-custom-pins`
- Click a custom pin → details → **Remove from map**
- PCs are placed via party position overrides

## API
`init(campaignId)`, `refresh()`, helpers `resolveMapImage`, `getEffectiveMaps`
