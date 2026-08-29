# LAYOUT-PANELS.js

## Purpose
Nav sidebar + map rail collapse, and map display modes (sidebar / expanded / future combat). Independent of `campaign-app` init.

## File
`js/core/layout-panels.js` → `window.LayoutPanels`

## Modes (`mapPanel.mode`)
| Mode | Behaviour |
|------|-----------|
| `sidebar` | Default right column (~300px; wider when nav collapsed) |
| `expanded` | Map fills ~90–100% of the content area; main column collapsed; same MapPanel DOM/state |
| `combat` | Reserved — same shell as expanded for now; Combat Mode builds on this later |

**Fullscreen (new tab)** is separate — see `docs/README/MAP-FULLSCREEN.md` (`#map-fullscreen-btn` → `campaigns/map-fullscreen/`).

Persisted: nav collapsed + map rail collapsed (localStorage). Expanded/combat are session UI only.

## API
`init()`, `setNavCollapsed(bool)`, `setMapCollapsed(bool)`, `setMapMode("sidebar"|"expanded"|"combat")`, `getMapMode()`, `toggleMapExpanded()`

Expand control: `#map-expand-btn`. Collapse from expanded returns to `sidebar` without destroying map zoom/pan/tokens.

On mode sync (`syncExpandChrome`), notifies `MediaBar.onLayoutChange` and `MapPanel.onLayoutChange` so ambience dock and map aspect/overlays refresh after resize.
