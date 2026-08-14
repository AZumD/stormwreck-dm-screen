# CHRONICLE-UI.js

## Purpose
Chronicle campaign panel: Story So Far, visual Key Event timeline, session prose.

## File
`js/core/chronicle-ui.js` → `window.ChronicleUI`

## Surfaces
- Session nav → Chronicle panel (`data-view="chronicle"`)
- Read/edit for Story So Far and session prose (`ContentParser.markdownLite` in read mode)
- Key Event dialog (`#key-event-dialog`)
- History **Make Key Event** via `promoteHistoryEntry`

## Init
Called from `campaign-app.js` with `jumpToSection`, `getSessionNumber`, `getSections`, `getSectionTitle`, `refreshChroniclePanel`.
