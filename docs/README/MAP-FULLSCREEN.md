# MAP-FULLSCREEN

## Purpose
Third map display mode: **fullscreen in a new browser tab** — map fills the viewport; tools live in a collapsible corner drawer.

Distinct from in-page **Expand** (`LayoutPanels.setMapMode("expanded")`), which widens the map rail inside the campaign shell.

## Surfaces
| File | Role |
|------|------|
| `campaigns/map-fullscreen/index.html` | Fullscreen page shell |
| `js/map-fullscreen-app.js` | Minimal bootstrap (catalogue + map only) |
| `js/core/map-fullscreen.js` | Open URL builder, drawer toggle, campaign **Fullscreen** button |
| `js/core/map-panel.js` | Same MapPanel instance logic; reads `?map=` on fullscreen load |

## Opening
Campaign map tab → **Fullscreen** (`#map-fullscreen-btn`) → new tab:

```
/campaigns/map-fullscreen/index.html?campaign=stormwreck-isle&map={activeMapId}
/campaigns/map-fullscreen/index.html?campaign=sandbox&id={sandboxId}&map={activeMapId}
```

`MapFullscreen.buildFullscreenUrl(campaignId, activeMapId)` builds the URL.  
`MapFullscreen.openInNewTab()` is wired from the campaign page.

## Fullscreen UI
- Map stage: edge-to-edge (aspect preserved from map art)
- **Tools drawer** (top-right): map selector, primary actions (measure, layers, +, fit, settings), map settings / fog / grid
- Toggle collapses drawer; state persisted in `localStorage` (`{campaignId}-map-fullscreen-drawer-collapsed`)
- **Fog** button appears in primary actions (same as in-page map); brush/mode controls live under **Map settings**
- **Back to campaign** link returns to the originating campaign shell
- Initiative list overlays the bottom of the viewport when active

## State
Same persisted map state as the in-page map (`CampaignMapState`, tokens, fog, pins). Two tabs can stay in sync via API PATCH + focus refresh.

## API
`window.MapFullscreen` — `init()`, `openInNewTab()`, `buildFullscreenUrl(campaignId, activeMapId)`, `initDrawer()`, `initBackLink()`

`MapPanel.getActiveMapId()` — current map id for URL building.

## Test
`node test/validate-map-fullscreen.js`
