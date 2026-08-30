# DND5E-CHARACTER.md

## Purpose
D&D 5e compatibility layer between generic Postgres character rows and existing player/DM DTOs. Canonical play-state lives in `character_state.system_state` (jsonb).

## Files
| Path | Role |
|------|------|
| `server/lib/dnd5e-character.js` | Read/write helpers, patch key mapping, level-in-sheet |
| `db/migrations/0004_phase6_platform.sql` | Migrates legacy HP/conditions columns → `system_state` |
| `db/migrations/0005_phase6_platform_cleanup.sql` | Drops legacy D&D SQL columns after migration |

## system_state shape (dnd5e)
```json
{
  "hp": { "current": 10, "max": 12, "temp": 0 },
  "conditions": [],
  "deathSaves": {},
  "spellSlots": {},
  "classResources": {},
  "inspiration": false
}
```

## Key exports
| Function | Role |
|----------|------|
| `readSystemState(row)` | Parse DB row → normalized object |
| `systemStateToPlayerDto(state)` | Flat camelCase for player UI (`hpCurrent`, …) |
| `stateRowToApiDto(row)` | Flat snake_case for DM APIs (`hp_current`, …) |
| `applyStatePatch(row, patch, whitelist)` | Player/DM state PATCH |
| `getCharacterLevel(row)` | Level from `sheet.level` (legacy column fallback during transition) |
| `setCharacterLevel(sheet, n)` | Write level into sheet jsonb |

Player API still accepts snake_case patch keys (`hp_current`, `death_saves`, …) for compatibility.

## Commands
```bash
npm run db:migrate
node test/validate-platform-refactor.js
node test/validate-player.js
```

## Tests
`test/validate-platform-refactor.js` — DTO mapping; live HP round-trip when `DATABASE_URL` set.
