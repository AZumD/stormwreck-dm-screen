# CAMPAIGN-APP.js

## Purpose
Main controller for a campaign DM screen: nav, continuous scroll document, panels, search, edit mode.

## File
`js/campaign-app.js`

## Depends on
`ContentParser`, `SectionEditor`, `EntityUI`, `EntityRegistry`, `CampaignState`, `CampaignStateUI`, `MapPanel`, `LayoutPanels`, campaign `ADVENTURE` / `MAPS` / `PARTY`, `I18N`

## Campaign play state
- Scene status/notes via `CampaignStateUI` chrome on each section
- **Current scene** toolbar jumps to the saved current section
- On load: URL hash wins; otherwise restores current scene
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
| `renderScrollDocument` | Adventure HTML + edit controls |
| `addPassage` / `deletePassage` | Create / remove passages |
| `openSectionEditor` | Inline title/content editor |
| `runSearch` | Sections + entities |
