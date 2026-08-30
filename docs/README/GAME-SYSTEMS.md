# GAME-SYSTEMS.md

## Purpose
Modest game-system registry (not a plugin framework). Core code asks which catalogue types and character sections a system exposes.

## Files
| Path | Role |
|------|------|
| `server/lib/game-systems.js` | In-memory registry; seeded `dnd5e` definition |
| `db/migrations/0004_phase6_platform.sql` | `game_systems` table + seed row |

## API (module)
| Export | Role |
|--------|------|
| `getGameSystem(id)` | Lookup by id |
| `listGameSystems()` | All registered systems |
| `assertGameSystem(id)` | 400 if unknown |
| `assertCompatibleGameSystems(campaignId, characterId)` | Rejects cross-system campaign participation |

## dnd5e definition
- Catalogue types: pc, npc, item, monster, location, race, class, spell, skill, feature, music, source
- Player library browse: skill, feature, spell, race, class, source
- Character sections: identity, abilities, combat, skills, features, spells, inventory, notes

## Commands
```bash
node test/validate-platform-refactor.js
```

## Tests
`test/validate-platform-refactor.js` — registry contains `dnd5e`, incompatible association rejected.
