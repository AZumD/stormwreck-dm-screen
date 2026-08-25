# VALIDATE-COMBAT-INITIATIVE.js

## Purpose
Static checks for combat initiative tracking and PC death saves / spell slots UI.

## File
`test/validate-combat-initiative.js`

## Run
```bash
node test/validate-combat-initiative.js
```

Included in `npm test`.

## Checks
- Combat sheet initiative input + `initiativeTracker` sync
- PC death saves / spell slots on combat sheet
- Map panel `#map-initiative` list + `refreshInitiative`
- Player sheet death saves / spell slots sections
