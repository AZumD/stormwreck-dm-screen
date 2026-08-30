# VALIDATE-LIVE-SESSION.js

## Purpose
Static checks for UX Phase 11 live-session readiness: Run shell invariants, focus restore, command-palette abbreviations, entity modal hierarchy, and short-viewport CSS.

## File
`test/validate-live-session.js`

## Run
```
node test/validate-live-session.js
```

## What it checks
- Run shell IDs on Stormwreck and Sandbox (workspace switch, search, Current Scene, campaign time)
- No obsolete Edit/Play/Map sidebar controls
- Command palette focus restore + abbreviation keywords (`curr`, `chron`, `mus`)
- Entity modal focus restore + Compendium missing-entry copy
- NPC Role stat + monster Actions-before-Traits detail order
- Scene status `aria-pressed` and mark tooltips
- Reference panel focus restore on close
- Campaign time `openPopover` focuses a control
- `jumpToCurrentScene` vs `currentSceneButton` i18n split
- Short-viewport toolbar CSS (`max-height: 820px`)
