# CAMPAIGN-APP.js

## Purpose
Main controller for a campaign DM screen: scene Play view, Document reference scroll, panels, search, edit mode.

## File
`js/campaign-app.js`

## Depends on
`ContentParser`, `SectionEditor`, `EntityUI`, `EntityRegistry`, `CampaignState`, `CampaignStateUI`, `DayTimeUI`, `ChronicleStore`, `ChronicleUI`, `SceneMeta`, `SceneUI`, `PartyRoster`, `MapPanel`, `LayoutPanels`, campaign `ADVENTURE` / `MAPS`, `I18N`

## Views
| Mode | Behavior |
|------|----------|
| **Play** (default) | One focused scene: content, status/notes, At this scene, connections |
| **Document** | Continuous scene scroll (prep/reference) |
| **Panels** | NPCs / monsters / locations / notes / history / **chronicle** / checklist |

View mode persists in `{campaignId}-view-mode`.

Toolbar uses compact icon buttons for navigation, edit mode, and Play/Document (labels via `aria-label` / `title`).

Scenes come from `SectionEditor.getSections` as one flat ordered list for Play/Document. The sidebar may nest scenes under one-level collapsible **groups** (`SectionEditor.getGroups` + scene `groupId`). Booklet `ADVENTURE.sections` / `chapters` are not used as live content after migrate.

On boot, `syncCampaignChrome` sets the sidebar title / subtitle / document title from `ADVENTURE.meta`. `SectionEditor.bootstrap(campaignId, ADVENTURE.sections)` runs a one-shot legacy migrate when needed.

## Campaign play state
- Scene status/notes via `CampaignStateUI` chrome on each section
- **Day / time** bar under the toolbar (`DayTimeUI`) — tenday 1–10 + continuous time; persists in `CampaignState.clock`
- **Current scene** toolbar jumps to the saved current section
- On load: URL hash wins; otherwise restores current scene; else first scene
- Session → **History** panel for timeline entries; **Chronicle** for authored story + key events
- NPC modals gain campaign memory through `EntityUI.addModalEnricher`

## Edit mode
- Toggle persists via `SectionEditor.setEditMode`
- Passages come from `SectionEditor.getSections`
- Add / delete controls only while edit mode is on
- **Link scene** opens the SceneUI connection picker (persists via SceneMeta)
- Sidebar **groups**: New group, rename/delete group, drag scenes into/out of groups
- Sidebar **drag-and-drop** reorders scenes and groups (edit mode only)
- Passage editor draft is preserved across window `focus` (link-tag `prompt()`), scene-meta refreshes, and soft re-renders

## Key helpers
| Function | Role |
|----------|------|
| `getSections` | Effective passage list |
| `renderPlayScene` | Focused scene runtime |
| `renderScrollDocument` | Document HTML + scene extras |
| `jumpToSection` | Play focus or document scroll |
| `addPassage` / `deletePassage` | Create / remove passages |
| `buildNav` / `buildNavItems` / `bindNavDragReorder` | Sidebar list, groups, edit-mode DnD |
| `openSectionEditor` | Inline title/content editor |
| `bindCatalogueSearch` | Live catalogue dropdown → entity modal |
