# CAMPAIGN-BOARD.js

## Purpose
Small asynchronous campaign message board (not chat).

## File
`server/lib/campaign-board.js`

## Model
**`campaign_posts`**: top-level posts + optional replies via `parent_post_id`. Plain text only. `pinned` for DM highlights.

## Authorization
| Action | Gate |
|--------|------|
| Read / create / reply | campaign member |
| Edit / delete own post | author or DM |
| Pin / unpin | DM only |

## API
- `GET/POST /api/player/campaigns/:id/posts`
- `GET .../posts/:postId/replies`
- `PATCH/DELETE .../posts/:postId`
- `PUT .../posts/:postId/pin`

Content is stored and returned as plain text; UI must escape on render.
