# PLATFORM-EVENTS.js

## Purpose
Global / platform-level events shared by all authenticated users (board-game night, social tabletop evenings, etc.). Separate from `campaign_events`.

## File
`server/lib/platform-events.js`

## Model
`platform_events` — no `campaign_id`. Status: `scheduled` | `cancelled` | `completed`.

## Authorization
| Action | Gate |
|--------|------|
| List / read | authenticated user |
| Create | authenticated user |
| Edit / delete | creator only |

DM campaign role is irrelevant. No RSVP in MVP.

## API
- `GET /api/player/platform-events?from=&to=&after=&limit=`
- `POST /api/player/platform-events`
- `GET/PATCH/DELETE /api/player/platform-events/:eventId`

`GET /api/player/upcoming-events` merges campaign + platform events with `kind` / `scopeLabel`.
