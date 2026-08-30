# SCHEDULING.js

## Purpose
Platform-neutral scheduling: global user availability, campaign events, RSVPs, and member availability overlap.

## Files
| Path | Role |
|------|------|
| `server/lib/scheduling.js` | Availability, events, RSVPs, overlap queries |
| `server/lib/datetime.js` | Calendar date + time parsing |
| `db/migrations/0007_scheduling.sql` | Tables |

## Model
- **`user_availability`**: one row per user + calendar date (global, not per campaign). Missing row = no response.
- **`campaign_events`**: scheduled sessions with `timestamptz` start/end.
- **`campaign_event_rsvps`**: member response per event (`going` / `maybe` / `cant`).

Availability ≠ RSVP. Availability is “I could play”; RSVP is “I am attending this session.”

## Authorization
| Action | Gate |
|--------|------|
| Own availability | authenticated user |
| Campaign events read | `campaign_memberships` |
| Event create/edit/cancel | campaign DM |
| RSVP | campaign member, self only |
| Availability overlap | campaign member |

Overlap queries join **`campaign_memberships` only** — not `campaign_characters`.

## API (summary)
- `GET/PUT/DELETE /api/player/availability`
- `GET /api/player/upcoming-events`
- `GET /api/player/campaigns/:id/events`
- `GET /api/player/campaigns/:id/availability`
- `PUT/DELETE .../events/:eventId/rsvp`
- `POST/PATCH/DELETE /api/campaigns/:id/events` (DM)

## Timezones
- Events: stored as `timestamptz` (ISO from client).
- Availability dates: PostgreSQL `date` (YYYY-MM-DD, no UTC day-shift).
- Optional windows: PostgreSQL `time` (local intent, browser entry).

## Player UI
See `docs/README/PLAYER-SCHEDULING.md`. Home shows the personal calendar inline (no separate “open calendar” step).
