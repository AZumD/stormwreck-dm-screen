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

Persisted: nav collapsed + map rail collapsed (localStorage). Expanded/combat are session UI only.

## API
`init()`, `setNavCollapsed(bool)`, `setMapCollapsed(bool)`, `setMapMode("sidebar"|"expanded"|"combat")`, `getMapMode()`, `toggleMapExpanded()`

Expand control: `#map-expand-btn`. Collapse from expanded returns to `sidebar` without destroying map zoom/pan/tokens.
