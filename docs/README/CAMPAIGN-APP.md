# CAMPAIGN-APP.js

## Purpose
Main controller for a campaign DM screen: scene Play view, Document reference scroll, panels, search, edit mode.

## File
`js/campaign-app.js`

## Depends on
`ContentParser`, `SectionEditor`, `EntityUI`, `EntityRegistry`, `CampaignState`, `CampaignStateUI`, `SceneMeta`, `SceneUI`, `PartyRoster`, `MapPanel`, `LayoutPanels`, campaign `ADVENTURE` / `MAPS`, `I18N`

## Views
| Mode | Behavior |
|------|----------|
| **Play** (default) | One focused scene: content, status/notes, At this scene, connections |
| **Document** | Continuous chapter/section scroll (prep/reference) |
| **Panels** | NPCs / monsters / locations / notes / history / checklist |

View mode persists in `{campaignId}-view-mode`.

## Campaign play state
- Scene status/notes via `CampaignStateUI` chrome on each section
- **Current scene** toolbar jumps to the saved current section
- On load: URL hash wins; otherwise restores current scene; else first scene
- Session → **History** panel for timeline entries
- NPC modals gain campaign memory through `EntityUI.addModalEnricher`

## Edit mode
- Toggle persists via `SectionEditor.setEditMode`
- Passages come from `SectionEditor.getSections` (not raw `ADVENTURE.sections`)
- Add / delete / restore controls only render while edit mode is on

## Key helpers
| Function | Role |
|----------|------|
| `getSections` | Effective passage list |
| `renderPlayScene` | Focused scene runtime |
| `renderScrollDocument` | Document HTML + scene extras |
| `jumpToSection` | Play focus or document scroll |
| `addPassage` / `deletePassage` | Create / remove passages |
| `openSectionEditor` | Inline title/content editor |
| `bindCatalogueSearch` | Live catalogue dropdown → entity modal |
