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
- `partyPositions` is canonical; stale token on map B ignored when canonical is map A
- Player token assembly uses canonical PC x/y even when a stale combat token exists on the same map
- `normalizePcMapState` removes non-canonical tokens; `syncPcTokenWorldCoords` repairs stale world coords on calibrated maps (percent ↔ world)
- PC A move does not affect PC B
- Removed PC has no canonical location
- Legacy token-only state migrates to `partyPositions`
- Player map API uses `findCanonicalPcLocation`
- Player map tokens include visible pcs/npcs/monsters with grid span via `buildPlayerMapTokens`
- Static NPC map pins from `js/campaigns/*/maps.js` appear on player map
- Normalize is idempotent (reload-safe)
- Player Map tab + fog wiring + **Center on me**, viewport persistence, stale poll indicator + docs
