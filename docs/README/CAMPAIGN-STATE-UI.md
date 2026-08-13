# CAMPAIGN-STATE-UI.js

## Purpose
UI for scene chrome, NPC campaign memory, log-interaction dialog, and History panel.

## File
`js/core/campaign-state-ui.js` → `window.CampaignStateUI`

## Depends on
`CampaignState`, `EntityUI`, `EntityRegistry`, `ContentParser`, campaign-app callbacks

## Hooks
| Surface | Behavior |
|---------|----------|
| Adventure sections | Status buttons + autosaving scene notes |
| Sidebar nav | Subtle current / completed / skipped classes |
| Toolbar **Current scene** | Jump + hash update via `jumpToSection` |
| NPC modal | Campaign memory block via `EntityUI.addModalEnricher` |
| Session → History | Timeline list, filters, manual entry (entity picker: NPC/monster/item/location) |

Campaign-specific story facts never live here — only generic campaign-state UX.
