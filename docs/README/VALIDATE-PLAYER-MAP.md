# VALIDATE-PLAYER-MAP.js

## Purpose
Checks player map tab, fog, single-map PC placement, and player map API wiring.

## File
`test/validate-player-map.js`

## Run
```
node test/validate-player-map.js
```

## What it checks
- `player-map.js` `findPcLocation` resolution
- `map-pc-placement.js` / `map-fog.js` modules
- Player map API routes
- Player Map tab UI wiring
- DM fog + placement hooks in `map-spatial.js`
- Docs present
