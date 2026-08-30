# PLATFORM-BOARD.js

## Purpose
Global asynchronous message board for all authenticated users. Separate from `campaign_posts`.

## File
`server/lib/platform-board.js`

## Model
`platform_posts` — plain text, one-level replies via `parent_post_id`. No pin/moderation in MVP (no platform-admin role).

## Authorization
| Action | Gate |
|--------|------|
| Read / post / reply | authenticated user |
| Edit / delete | author only |

## API
- `GET/POST /api/player/platform-posts`
- `GET /api/player/platform-posts/:postId/replies`
- `PATCH/DELETE /api/player/platform-posts/:postId`
