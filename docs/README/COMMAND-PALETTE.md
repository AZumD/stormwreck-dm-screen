# COMMAND-PALETTE.js

## Purpose
Universal campaign command palette: search catalogue entities, campaign scenes, workspaces, session/reference destinations, and live DM commands from the toolbar search field.

## File
`js/core/command-palette.js` → `window.CommandPalette`

## Depends on
`ContentParser`, campaign-app API callbacks (`setWorkspace`, `jumpToSection`, `EntityUI`, `MapPanel`, `LayoutPanels`, `DayTimeUI`)

## UI
- Reuses `#catalogue-search` / `#search` / `#catalogue-search-results` in the campaign toolbar
- **Ctrl+K** / **Cmd+K** focuses the field and opens results
- Placeholder: “Search or jump…” with compact **Ctrl K** hint
- Empty query shows defaults: Current Scene, Map, Session, Reference, Party, Music

## Result types
| Type | Example | Action |
|------|---------|--------|
| `entity` | Tarak · NPC | `EntityUI.openModal` |
| `scene` | Breakfast · Scene | Run workspace + scene |
| `workspace` | Map | `setWorkspace` |
| `session` | Chronicle | Session workspace + tab |
| `reference` | Reference: NPCs | Reference overlay + tab |
| `command` | Current Scene, Party, Music, Campaign Time | Live DM utility |

## Init
`CommandPalette.init({ root, input, results, labels, api })` from `campaign-app.js` → `bindCommandPalette()`.

`CommandPalette.refreshSceneIndex()` runs after sidebar nav rebuilds.

## Run
```
node test/validate-command-palette.js
```
