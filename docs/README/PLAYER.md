# PLAYER.md

## Purpose
Authenticated, mobile-first player companion: character sheet, party cards, private notes, and restricted catalogue lookups. Phase 5A adds a fantasy forest visual overhaul and compact collapsible sheet layout (full edit / catalogue browser / NPC reveal land in 5B–5D — see `PHASE5-PLAYER-SHEET.md`).

## Surfaces
| Path | Role |
|------|------|
| `/player/` | Login + companion UI |
| `js/player-app.js` | Player shell logic |
| `js/core/player-api-client.js` | Cookie-authenticated fetch helper |
| `css/player.css` | Mobile-first fairy-forest styles |
| `assets/player/fairy-forest-bg.jpg` | Static theme wallpaper (deploys with app) |
| `server/lib/player.js` | Player DTOs + authorization-scoped queries |

## Player API (session required)
| Method | Path |
|--------|------|
| GET | `/api/player/bootstrap` |
| GET | `/api/player/campaigns/:id/characters/mine` |
| GET | `/api/player/campaigns/:id/characters/:characterId` |
| PATCH | `/api/player/campaigns/:id/characters/:characterId` | sheet / identity (5B) |
| PATCH | `/api/player/campaigns/:id/characters/:characterId/state` | play state incl. `hp_max` |
| POST/PATCH/DELETE | `/api/player/campaigns/:id/characters/:characterId/inventory[/:entryId]` |
| PUT | `/api/player/campaigns/:id/portraits/characters/:characterId` | portrait `dataUrl` |
| GET | `/api/player/campaigns/:id/party` |
| GET | `/api/player/campaigns/:id/catalogues/:type/:entryId` |
| GET/POST | `/api/player/campaigns/:id/notes` |
| PUT/DELETE | `/api/player/notes/:noteId` |
| GET | `/api/player/campaigns/:id/portraits/characters/:characterId` |
| GET | `/api/player/campaigns/:id/portraits/catalogues/:type/:entryId` |

## Sheet UI (Phase 5A–5B)
- Sticky vitals bar: portrait, name, race/class/subclass/level, HP ±
- Combat chips + currency row
- Collapsible sections; **Edit sheet** dialog for identity, abilities, combat, HP, currency, ref lists, portrait upload
- Inline add for skills/features/spells/inventory; remove inventory rows
- Inspiration toggle
- Layered forest wallpaper (`assets/player/fairy-forest-bg.jpg`); no horizontal overflow; ≥44px taps

## Sheet whitelist (trusted player)
`name`, `level`, `race`, `class`, `subclass`, `background`, `alignment`, `abilities`, `ac`, `speed`, `initiative`, `proficiencyBonus`, `hitDice`, `savingThrows`, `languages`, `skills`, `skillRefs`, `featureRefs`, `spellRefs`, `currency`

## State whitelist
`hp_current`, `hp_max`, `hp_temp`, `conditions`, `class_resources`, `spell_slots`, `inspiration`, `death_saves`
## Notes UI
Create/edit/delete use an in-app dialog (`#note-dialog`): title, body, optional character, Save, Cancel, and Delete with an in-sheet confirmation. No `prompt()` / `confirm()`. List and editor show created/updated timestamps.

## Mobile layout
- `.view-shell` bottom padding and `scroll-padding-bottom` clear the fixed tab bar (including `safe-area-inset-bottom`).
- Missing portraits are removed (`no-portrait`); they do not keep an empty slot.
- Skill/item pills are at least 44px tall.

## Authorization
- Membership required for campaign-scoped player routes.
- Full mechanical DTO only for characters in `character_controllers`.
- Party returns `type='player'` cards only (name/race/class/level/portrait).
- Notes are private to `user_id` (DM does not auto-read).
- Catalogue resolve allowlist: item, skill, feature, spell, race, class — and only when linked to a controlled character.
- Mutable state whitelist: `hp_current`, `hp_max`, `hp_temp`, `conditions`, `class_resources`, `spell_slots`, `inspiration`, `death_saves`.
- Sheet whitelist: see Sheet whitelist section above.
- Live tests use isolated fixtures; they must not mutate imported Althariel. See `docs/README/VALIDATE-PLAYER.md`.

## Local login
```bash
npm run db:bootstrap:auth
# open http://127.0.0.1:3000/player/
```
