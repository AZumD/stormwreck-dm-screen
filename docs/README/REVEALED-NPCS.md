# REVEALED-NPCS.md

## Purpose
Phase 5D: DM reveals catalogue NPCs to players. Players see only revealed rows under the People tab.

## Files
| Path | Role |
|------|------|
| `db/migrations/0003_phase5_npc_reveal.sql` | `campaign_revealed_npcs` table |
| `server/lib/revealed-npcs.js` | Reveal / list / hydrate DTOs |
| `js/core/campaign-state-ui.js` | “Reveal to players” toggle on NPC entity modal |
| `js/player-app.js` | People tab |

## Table
`campaign_revealed_npcs (campaign_id text, npc_id text, revealed_by, revealed_at, note)` PK `(campaign_id, npc_id)`.

## APIs
| Who | Method | Path |
|-----|--------|------|
| DM | GET | `/api/campaigns/:id/revealed-npcs` |
| DM | PUT | `/api/campaigns/:id/revealed-npcs/:npcId` |
| DM | DELETE | `/api/campaigns/:id/revealed-npcs/:npcId` |
| Player | GET | `/api/player/campaigns/:id/npcs` |
| Player | GET | `/api/player/campaigns/:id/npcs/:npcId` |

Unrevealed NPCs stay blocked on `/api/player/.../catalogues/npc`.
