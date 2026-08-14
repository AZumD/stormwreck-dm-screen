# CAMPAIGN-STATE-UI.js

## Purpose
UI for scene chrome, NPC campaign memory, log-interaction dialog, and History panel.

## File
`js/core/campaign-state-ui.js` → `window.CampaignStateUI`

## Depends on
`CampaignState`, `EntityUI`, `EntityRegistry`, `SceneMeta`, `ContentParser`, campaign-app callbacks

## Location inference
`inferLocationId(explicitSceneId?)` default priority:

1. SceneMeta `locationId` for the referenced / focused / current scene
2. Active map `locationId`
3. Empty

Used only as a default for interaction / history forms — never overwrites a user choice after they pick one, and never switches maps.
## Hooks
| Surface | Behavior |
|---------|----------|
| Adventure sections | Status buttons + autosaving scene notes |
| Sidebar nav | Subtle current / completed / skipped classes |
| Toolbar **Current scene** | Jump + hash update via `jumpToSection` |
| NPC modal | Campaign memory block via `EntityUI.addModalEnricher` |
| Session → History | Timeline list, filters, manual entry (entity picker: NPC/monster/item/location) |

Campaign-specific story facts never live here — only generic campaign-state UX.
