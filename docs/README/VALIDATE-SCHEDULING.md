# VALIDATE-SCHEDULING.md

## Purpose
Validates platform scheduling + campaign board (schema, auth, overlap, UI wiring).

## File
`test/validate-scheduling.js`

## Run
```
node test/validate-scheduling.js
```

## What it checks
- Migration `0007` tables
- No `campaign_characters` / D&D dependency in scheduling libs
- API routes + player client methods
- Campaign section nav (Play | Schedule | Board)
- Player home order: Schedule → My campaigns → My characters
- Home renders inline availability calendar (no gate button)
- Live: availability CRUD, overlap, events, RSVP, board, auth boundaries, Stormwreck intact
