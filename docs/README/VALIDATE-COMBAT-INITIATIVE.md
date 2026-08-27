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
- Combat sheet initiative input + canonical `initiativeTracker` sync (single write target)
- PC death saves / spell slots on combat sheet
- Map panel `#map-initiative` list + `refreshInitiative`
- Player sheet death saves / spell slots sections
- No new writes of `combat_initiative` / `combatInitiative` / token `initiative` from the combat sheet
