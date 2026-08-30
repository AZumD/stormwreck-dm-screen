# LAYOUT-PANELS.js

## Purpose
Nav sidebar + map rail collapse, and map display modes. Independent of `campaign-app` init. Syncs with campaign **Run | Prep | Map** via `setCampaignWorkspace`.

## File
`js/core/layout-panels.js` → `window.LayoutPanels`

## Modes (`mapPanel.mode`)
| Mode | Behaviour |
|------|-----------|
| `sidebar` | Default right column (~300px; wider when nav collapsed). Run/Prep utility rail (Party \| Music). |
| `expanded` | Legacy widen — map fills content area; main collapsed. Prefer **Map workspace**. |
| `combat` | Reserved — same shell as expanded for now |
| `workspace` | First-class Map workspace (`activeWorkspace === "map"`): main hidden, map canvas dominates |

**Fullscreen (new tab)** is separate — see `docs/README/MAP-FULLSCREEN.md`.

Persisted: nav collapsed + map rail collapsed (localStorage). Expanded/combat/workspace session layout; workspace also via `CampaignPrefs.workspace`.

## API
`init()`, `setNavCollapsed(bool)`, `setMapCollapsed(bool)`, `setMapMode(...)`, `getMapMode()`, `toggleMapExpanded()`, `setCampaignWorkspace("run"|"prep"|"map", { panelOpen? })`, `applyChromeFromPrefs`

`#map-expand-btn` remains a legacy shim (hidden in Map workspace and in Run/Prep utility mode). Collapse from Map workspace returns to **Run**.

On mode sync (`syncExpandChrome`), notifies `MediaBar.onLayoutChange` and `MapPanel.onLayoutChange`.
