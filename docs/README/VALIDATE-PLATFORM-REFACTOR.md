# VALIDATE-PLATFORM-REFACTOR.md

## Purpose
Validates Phase 6 platform seams: game systems, `campaign_characters`, generic character state, neutral player home, character-level APIs.

## File
`test/validate-platform-refactor.js`

## Run
```bash
node test/validate-platform-refactor.js
```

## Static checks
- Migration files `0004_phase6_platform.sql`, `0005_phase6_platform_cleanup.sql`
- `game-systems.js`, `dnd5e-character.js`, drizzle schema exports
- Character-level `/api/player/characters` routes
- Player home UI (`view-home`, character list, character workspace shell)
- Root gate links (`href="/dm/"`, `href="/player/"`)
- No auto-open single campaign after login
- `dnd5e` registry; incompatible game-system rejection
- D&D system_state → player DTO mapping

## Live checks (when `DATABASE_URL` set)
- Stormwreck campaign has `game_system_id = dnd5e`
- Character without campaign; `campaign_characters` join; cleanup test row

## Related
- `docs/README/GAME-SYSTEMS.md`
- `docs/README/DND5E-CHARACTER.md`
- `docs/README/PLAYER.md`
