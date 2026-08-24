# PLAYER.md

## Purpose
Phase 3B player companion: authenticated, mobile-first shell for a player's own characters, party cards, private notes, and restricted catalogue lookups.

## Surfaces
| Path | Role |
|------|------|
| `/player/` | Login + companion UI |
| `js/player-app.js` | Player shell logic |
| `js/core/player-api-client.js` | Cookie-authenticated fetch helper |
| `css/player.css` | Mobile-first styles |
| `server/lib/player.js` | Player DTOs + authorization-scoped queries |

## Player API (session required)
| Method | Path |
|--------|------|
| GET | `/api/player/bootstrap` |
| GET | `/api/player/campaigns/:id/characters/mine` |
| GET | `/api/player/campaigns/:id/characters/:characterId` |
| PATCH | `/api/player/campaigns/:id/characters/:characterId/state` |
| GET | `/api/player/campaigns/:id/party` |
| GET | `/api/player/campaigns/:id/catalogues/:type/:entryId` |
| GET/POST | `/api/player/campaigns/:id/notes` |
| PUT/DELETE | `/api/player/notes/:noteId` |
| GET | `/api/player/campaigns/:id/portraits/characters/:characterId` |
| GET | `/api/player/campaigns/:id/portraits/catalogues/:type/:entryId` |

## Notes UI
Create/edit/delete use an in-app dialog (`#note-dialog`): title, body, optional character, Save, Cancel, and Delete with an in-sheet confirmation. No `prompt()` / `confirm()`. List and editor show created/updated timestamps.

## Mobile layout
- `.view-shell` bottom padding and `scroll-padding-bottom` clear the fixed tab bar (including `safe-area-inset-bottom`).
- Missing portraits are removed (`no-portrait`); they do not keep an empty 64px slot.
- Skill/item pills are at least 44px tall.

## Authorization
- Membership required for campaign-scoped player routes.
- Full mechanical DTO only for characters in `character_controllers`.
- Party returns `type='player'` cards only (name/race/class/level/portrait).
- Notes are private to `user_id` (DM does not auto-read).
- Catalogue resolve allowlist: item, skill, feature, spell, race, class — and only when linked to a controlled character.
- Mutable state whitelist: `hp_current`, `hp_temp`, `conditions`, `class_resources`, `spell_slots`, `inspiration`, `death_saves`.
- Live tests use isolated fixtures; they must not mutate imported Althariel. See `docs/README/VALIDATE-PLAYER.md`.

## Local login
```bash
npm run db:bootstrap:auth
# open http://127.0.0.1:3000/player/
```
