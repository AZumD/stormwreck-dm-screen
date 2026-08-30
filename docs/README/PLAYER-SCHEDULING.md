# PLAYER-SCHEDULING.js

## Purpose
Player companion UI for global availability, platform + campaign schedule, events, and boards.

## File
`js/player-scheduling.js` (loaded by `/player/`)

## Home (global)
- **Next session** compact summary (campaign, when, title, RSVP state, **View schedule**).
- **My character(s)** promoted beside next session; single character gets spotlight card.
- **Board** full width below primary row; compact empty state.
- **My campaigns** secondary at bottom.
- **Schedule subview** (`?view=schedule`): full month calendar, day dialog, Upcoming list; reuses `renderHomeSchedule`.

## Campaign workspace
- Compact **hamburger** menu: Play / Schedule / Board / Home (no permanent segmented row).
- Account **user name** next to Log out (not character “Playing as” banner).
- Schedule / Board hide bottom Play tabs; Play shows equal-width Map \| Party \| Library \| Notes.

## Related
- `docs/README/PLATFORM-EVENTS.md`
- `docs/README/PLATFORM-BOARD.md`
- `docs/README/SCHEDULING.md`
- `docs/README/CAMPAIGN-BOARD.md`
- `docs/README/PLAYER.md`
