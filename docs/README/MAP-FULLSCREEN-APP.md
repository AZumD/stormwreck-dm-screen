# MAP-FULLSCREEN-APP.js

## Purpose
Bootstrap script for the fullscreen map tab — loads campaign bundle, catalogue, and MapPanel without the scene shell.

## File
`js/map-fullscreen-app.js`

## Query params
| Param | Meaning |
|-------|---------|
| `campaign` | Route key: `stormwreck-isle` or `sandbox` |
| `id` | Sandbox campaign id (required when `campaign=sandbox`) |
| `map` | Optional initial map id (passed through to MapPanel) |

## Flow
1. Read query params; set `body[data-campaign-id]`
2. Dynamically load campaign scripts (seeds + `adventure.js` / `maps.js` / `party.js`)
3. `LocalApiClient.ready()` → `CatalogueStore.bootstrap()` → `CampaignMapState.bootstrap()`
4. `EntityRegistry.build()` → `EntityUI.init()` → `PartyRoster.init()` → `MapPanel.init()`
5. `MapFullscreen.initDrawer()` + back link; remove `is-booting`

## Related
See `docs/README/MAP-FULLSCREEN.md`.
