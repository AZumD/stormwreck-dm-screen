# CAMPAIGN-APP.js

## Purpose
Main controller for a campaign DM screen: nav, continuous scroll document, panels, search, edit mode.

## File
`js/campaign-app.js`

## Depends on
`ContentParser`, `SectionEditor`, `EntityUI`, `EntityRegistry`, `MapPanel`, `LayoutPanels`, campaign `ADVENTURE` / `MAPS` / `PARTY`, `I18N`

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
