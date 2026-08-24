# VALIDATE-COMBAT-SHEETS.js

## Purpose
Static checks for DM combat sheet modal wiring (PC Postgres state, NPC catalogue, monster instance tokens).

## File
`test/validate-combat-sheets.js`

## Run
```
node test/validate-combat-sheets.js
```

## What it checks
- `CombatSheetModal` open/save paths for pc / npc / monster-token
- `LocalApiClient` character helpers + DM sheet PATCH
- Party + MapPanel + MapSpatial wiring
- Monster edits do not upsert the monster catalogue
- NPC `combatConditions` field + campaign HTML script include
- Docs present
