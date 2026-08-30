# PLAYER-SCHEDULING.js

## Purpose
Player companion UI for global availability, campaign schedule, events/RSVPs, and the campaign message board.

## File
`js/player-scheduling.js` (loaded by `/player/`)

## Home (global)
- **Schedule** is the first home section (above My campaigns / My characters).
- Renders the personal month calendar inline plus upcoming sessions across memberships.
- Tap a day → availability day editor dialog (status / window / note).
- Tap an upcoming session → opens that campaign’s Schedule section.

## Campaign workspace
- Sticky **Play | Schedule | Board** nav (not on character workspace).
- Schedule: campaign month calendar with member availability aggregates, event list, DM create/edit.
- Board: plain-text posts, replies, pin (DM).

## Related
- `docs/README/SCHEDULING.md` — server model + API
- `docs/README/CAMPAIGN-BOARD.md` — board API
- `docs/README/PLAYER.md` — player surfaces
