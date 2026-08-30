# VALIDATE-PLAYER-HOME.js

## Purpose
Static checks for Player Home visual polish: compact next session, schedule subview, character hierarchy, background layer.

## File
`test/validate-player-home.js`

## Run
```
node test/validate-player-home.js
```

## What it checks
- `#player-view-home` / `#player-view-schedule` subviews
- `#home-next-session` summary (no embedded full calendar on home)
- `.player-atmosphere` fixed backdrop
- Section order: Next session → Character → Board → Campaigns
- `setPlayerHomeView` / `?view=schedule` navigation in `player-app.js`
- `renderNextSessionSummary` in `player-scheduling.js`
- Home surface CSS in `player-platform.css`
