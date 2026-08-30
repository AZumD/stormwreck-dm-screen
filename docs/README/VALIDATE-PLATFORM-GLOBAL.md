# VALIDATE-PLATFORM-GLOBAL.md

## Purpose
Validates global platform events/board and campaign mobile nav cleanup.

## File
`test/validate-platform-global.js`

## Run
```
node test/validate-platform-global.js
```

## What it checks
- Migration `0008` tables
- No campaign/character/D&D coupling in platform libs
- API + client methods
- Home IA (Schedule → Board → campaigns)
- Hamburger nav, no Playing-as banner, equal-width Play tabs
- Live auth boundaries for events/posts
