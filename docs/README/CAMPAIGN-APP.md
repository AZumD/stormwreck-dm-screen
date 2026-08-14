# CAMPAIGN-APP.js

## Purpose
Main controller for a campaign DM screen: scene Play view, Document reference scroll, panels, search, edit mode.

## File
`js/campaign-app.js`

## Depends on
`ContentParser`, `SectionEditor`, `EntityUI`, `EntityRegistry`, `CampaignState`, `CampaignStateUI`, `ChronicleStore`, `ChronicleUI`, `SceneMeta`, `SceneUI`, `PartyRoster`, `MapPanel`, `LayoutPanels`, campaign `ADVENTURE` / `MAPS`, `I18N`

## Views
| Mode | Behavior |
|------|----------|
| **Play** (default) | One focused scene: content, status/notes, At this scene, connections |
| **Document** | Continuous scene scroll (prep/reference) |
| **Panels** | NPCs / monsters / locations / notes / history / **chronicle** / checklist |

View mode persists in `{campaignId}-view-mode`.

Toolbar uses compact icon buttons for navigation, edit mode, and Play/Document (labels via `aria-label` / `title`).

Chapter ids still group passages internally; chapter titles are **not** auto-injected into the sidebar, Play view, or Document scroll (sandbox-authored content only).

On boot, `syncCampaignChrome` sets the sidebar title / subtitle / document title from `ADVENTURE.meta` (used by booklet and sandbox campaigns).

## Campaign play state
- Scene status/notes via `CampaignStateUI` chrome on each section
- **Current scene** toolbar jumps to the saved current section
- On load: URL hash wins; otherwise restores current scene; else first scene
- Session → **History** panel for timeline entries; **Chronicle** for authored story + key events
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
