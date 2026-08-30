# VALIDATE-CAMPAIGN-COHERENCE.js

## Purpose
Post-refactor UX coherence checks: unified Reference routing, Escape stack, terminology, campaign shell parity.

## File
`test/validate-campaign-coherence.js`

## Run
```
node test/validate-campaign-coherence.js
```

## What it checks
- `closeReferencePanel` / `bindGlobalEscape` / `isReferenceOpen` in campaign-app
- All Reference opens via `showReferencePanel`
- `CommandPalette.isOpen` / `DayTimeUI.isOpen`
- Session **Log** user-facing label (`headings.history`)
- Stormwreck + sandbox share required toolbar/workspace IDs
- No obsolete Edit/Play/Map-toggle/Session sidebar controls
