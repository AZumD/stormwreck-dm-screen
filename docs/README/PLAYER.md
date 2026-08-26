# PLAYER.md

## Purpose
Authenticated, mobile-first player companion: character sheet, party cards, private notes, catalogue library, and revealed People. Phase 5A–5D complete (see `PHASE5-PLAYER-SHEET.md`).

## Surfaces
| Path | Role |
|------|------|
| `/player/` | Login + companion UI |
| `js/player-app.js` | Player shell logic |
| `js/core/player-api-client.js` | Cookie-authenticated fetch helper |
| `css/player.css` | Mobile-first fairy-forest styles |
| `assets/player/fairy-forest-bg.jpg` | Static theme wallpaper (deploys with app) |
| `assets/grunge-stained-old-paper-texture-130-752543118.png` | Stained paper — player notes + campaign read-aloud |
| `server/lib/player.js` | Player DTOs + authorization-scoped queries |
| `server/lib/pc-catalogue-mirror.js` | Bidirectional PC catalogue ↔ campaign character sync |
| `server/lib/revealed-npcs.js` | Phase 5D revealed NPC queries |

## Player API (session required)
| Method | Path |
|--------|------|
| GET | `/api/player/bootstrap` |
| GET | `/api/player/campaigns/:id/characters/mine` |
| POST | `/api/player/campaigns/:id/characters` | create PC (mirrors into DM PC catalogue) |
| GET | `/api/player/campaigns/:id/characters/:characterId` |
| PATCH | `/api/player/campaigns/:id/characters/:characterId` | sheet / identity (5B) |
| PATCH | `/api/player/campaigns/:id/characters/:characterId/state` | play state incl. `hp_max` |
| POST/PATCH/DELETE | `/api/player/campaigns/:id/characters/:characterId/inventory[/:entryId]` |
| PUT | `/api/player/campaigns/:id/portraits/characters/:characterId` | portrait `dataUrl` |
| GET | `/api/player/campaigns/:id/party` |
| GET | `/api/player/campaigns/:id/catalogues/:type` | library browse (`q`, `limit`, `offset`) |
| GET | `/api/player/campaigns/:id/catalogues/:type/:entryId` | entry detail |
| POST | `/api/player/campaigns/:id/characters/:characterId/library-attach` | attach entry to sheet |
| GET | `/api/player/campaigns/:id/npcs` | revealed NPCs only (5D) |
| GET | `/api/player/campaigns/:id/npcs/:npcId` | revealed NPC detail (5D) |
| GET/POST | `/api/player/campaigns/:id/notes` |
| PUT/DELETE | `/api/player/notes/:noteId` |
| GET | `/api/player/campaigns/:id/portraits/characters/:characterId` |
| GET | `/api/player/campaigns/:id/portraits/catalogues/:type/:entryId` |

## Sheet UI (Phase 5A–5B)
- Empty campaign: **Create character** opens an in-app dialog (no `prompt`)
- Created PCs are written to Postgres and mirrored into the DM PC catalogue (see `PC-CATALOGUE-MIRROR.md`)
- Sticky vitals bar: portrait, name, race/class/subclass/level (pretty-prints `@race:` / `@class:` refs), HP ±
- Combat chips + currency row
- Collapsible sections; **Edit sheet** dialog for identity, abilities, combat, HP, currency, ref lists, portrait upload
- Inline **+** opens add modal with catalogue search (skills/features/spells/items); custom text still available; conditions use a short text modal
- Inspiration toggle; death saves; spell slots; **class resources** (rage/ki/channel…)
- Inventory: equip checkbox + quantity via `PATCH` inventory
- Soft refresh of sheet/party/people when the tab regains focus
- Layered forest wallpaper (`assets/player/fairy-forest-bg.jpg`); no horizontal overflow; ≥44px taps
- **Notes** tab cards and note editor use stained-paper texture; campaign **read-aloud** blocks use the same asset

## Library UI (Phase 5C)
- Fourth tab: browse/search spell, skill, feature, race, class, **source**
- Debounced search; horizontal type chips; detail dialog with rules text
- **Load more** uses server `offset` / `total` (pages of 40)
- Source is lookup-only (no sheet attach); **Adventures** kind is DM-only
- Source detail uses a wider parchment **reader** dialog (not the narrow nested card stack)
- Item, monster, and **location** catalogues are **not** listed in the player Library (inventory still opens owned item details; locations stay DM-side to avoid spoilers)
- Attach actions (controlled character): inventory (via + / edit) / spell / skill / feature / set race / set class
- Custom freeform sheet lines still work via Edit sheet / inline add
- NPC, PC, music, monster, location catalogues blocked for browse; DM `/api/catalogues/*` still unavailable to players

## People UI (Phase 5D)
- Tab lists NPCs the DM has revealed for the campaign (portrait + optional DM note)
- Detail dialog shows portrait, role, player-facing note, summary / description
- Unrevealed NPCs are never listed (catalogue `/npc` remains blocked)

## Party UI
- Cards show name, race/class (pretty-printed), level, and shared vitals (`hpCurrent` / `hpMax` / `conditions`) for fellow player PCs

## Notes UI
- Sidebar: search, character filter, `#tag` chips (from body hashtags), note title list
- Main pane shows the **full** note body (no truncation)
- Create/edit/delete use an in-app dialog (`#note-dialog`): title, body, optional character, Save, Cancel, and Delete with confirmation. No `prompt()` / `confirm()`

## Sheet whitelist (trusted player)
`name`, `level`, `race`, `class`, `subclass`, `background`, `alignment`, `abilities`, `ac`, `speed`, `initiative`, `proficiencyBonus`, `hitDice`, `savingThrows`, `languages`, `skills`, `skillRefs`, `featureRefs`, `spellRefs`, `currency`

## State whitelist
`hp_current`, `hp_max`, `hp_temp`, `conditions`, `class_resources`, `spell_slots`, `inspiration`, `death_saves`

## Mobile layout
- `.view-shell` bottom padding and `scroll-padding-bottom` clear the fixed tab bar (including `safe-area-inset-bottom`).
- Missing portraits are removed (`no-portrait`); they do not keep an empty slot.
- Skill/item pills are at least 44px tall.

## Authorization
- Membership required for campaign-scoped player routes.
- Full mechanical DTO only for characters in `character_controllers`.
- Party returns `type='player'` cards only (name/race/class/level/portrait + shared HP/conditions)
- Notes are private to `user_id` (DM does not auto-read).
- Catalogue browse/detail allowlist: skill, feature, spell, race, class, source (+ item detail for inventory). Blocked: npc, pc, music, monster, location, item list. Source **Adventures** filtered from list/detail.
- Library attach requires character control; action must match entry type.
- Mutable state whitelist: `hp_current`, `hp_max`, `hp_temp`, `conditions`, `class_resources`, `spell_slots`, `inspiration`, `death_saves`.
- Player sheet UI includes **Death saves**, **Spell slots**, and **Class resources**. DM combat sheet mirrors the same for PCs.
- Sheet whitelist: see Sheet whitelist section above.
- Live tests use isolated fixtures; they must not mutate imported Althariel. See `docs/README/VALIDATE-PLAYER.md`.

## Local login
```bash
npm run db:bootstrap:auth
# open http://127.0.0.1:3000/player/
```
