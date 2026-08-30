# CAMPAIGN-APP.js

## Purpose
Main controller for a campaign DM screen: **Run** (live play) and **Prep** (document authoring) workspaces, plus Reference/Session panels, search, and map chrome.

## File
`js/campaign-app.js`

## Depends on
`ContentParser`, `SectionEditor`, `EntityUI`, `EntityRegistry`, `CampaignState`, `CampaignStateUI`, `DayTimeUI`, `ChronicleStore`, `ChronicleUI`, `SceneMeta`, `SceneUI`, `PartyRoster`, `MapPanel`, `LayoutPanels`, campaign `ADVENTURE` / `MAPS`, `I18N`

## Workspaces
| Workspace | Behavior |
|-----------|----------|
| **Run** (default) | Live DM: focused Play scene, prev/next, status/notes, Reference/Session, Party/Music utility rail, catalogue search. No authoring chrome. |
| **Prep** | Document scroll + authoring (edit mode, groups, DnD, add scene/group). Scrollspy tracks the visible section. |
| **Map** | Same MapPanel instance promoted to a full canvas workspace; left nav becomes map browser; Current Scene returns to Run. |

Toolbar **Run | Prep | Map** (`#workspace-run` / `#workspace-prep` / `#workspace-map`). Persisted as `workspace` in campaign prefs.

`activeWorkspace` is separate from `activeView` (`play` | `document` | `panel` | `map`). Reference/Session from Map use `workspace-map--panel` without wiping map persistence.

## Content views
| Mode | Behavior |
|------|----------|
| **Play** | One focused scene (used in Run) |
| **Document** | Continuous scene scroll (used in Prep) |
| **Panels** | Sidebar **Tools** → **Reference** / **Session** |

Deep links may use leaf ids (`npcs`, `history`, …) or `reference:…` / `session:…`. Last Reference/Session tab remembered in prefs.

Scenes come from `SectionEditor.getSections` as one flat ordered list. The sidebar may nest scenes under one-level collapsible **groups**.

On boot, `syncCampaignChrome` sets the sidebar title from `ADVENTURE.meta`. Workspace + edit mode are applied before `restoreInitialScene` (hash → current scene → first scene).

## Campaign play state
- Scene status/notes via `CampaignStateUI`
- **Campaign time** compact toolbar control (`DayTimeUI`) — popover for tenday + time + presets; persists in `CampaignState.clock`
- **Current scene** toolbar jumps to the saved current section (disabled when none is marked current)
- Session → **Session** workspace; Chronicle remains separate
- NPC modals gain campaign memory through `EntityUI.addModalEnricher`

## Prep / edit mode
- Entering **Prep** turns edit mode on; **Run** turns it off (no separate Edit toggle on the Run toolbar)
- Delete / Link / inline Edit controls only while edit mode is on
- **+ Add scene** / **New group** / drag-reorder appear in Prep only; `ensureEditMode` switches to Prep if needed
- **Link scene** opens the SceneUI connection picker
- Passage editor draft is preserved across window `focus`, scene-meta refreshes, and soft re-renders

## Key helpers
| Function | Role |
|----------|------|
| `loadWorkspace` / `saveWorkspace` / `setWorkspace` | Run \| Prep state |
| `getSections` | Effective passage list |
| `renderPlayScene` | Focused scene runtime |
| `renderScrollDocument` | Document HTML + scene extras |
| `jumpToSection` | Play focus or document scroll by workspace |
| `addPassage` / `deletePassage` | Create / remove passages |
| `ensureEditMode` | Ensure Prep + edit mode when authoring |
| `buildNav` / `bindNavDragReorder` | Sidebar list, Prep-only authoring chrome |
| `openSectionEditor` | Inline title/content editor |
| `bindCatalogueSearch` | Live catalogue dropdown → entity modal |
