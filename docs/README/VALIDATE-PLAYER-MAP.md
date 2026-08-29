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
- `normalizePcMapState` removes non-canonical tokens
- PC A move does not affect PC B
- Removed PC has no canonical location
- Legacy token-only state migrates to `partyPositions`
- Player map API uses `findCanonicalPcLocation`
- Player map API exposes visible combat tokens via `buildPlayerMapTokens`
- Normalize is idempotent (reload-safe)
- Player Map tab + fog wiring + docs
