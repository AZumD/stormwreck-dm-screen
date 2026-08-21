# DAY-TIME-UI.js

## Purpose
Compact campaign tenday + time-of-day tracker in the sticky top chrome (below the main toolbar).

## File
`js/core/day-time-ui.js` → `window.DayTimeUI`

## UI
- **Day** — snapping range `1–10` (tenday)
- **Time** — continuous range `0–1439` minutes (`00:00`–`23:59`) with a night→noon→night track gradient

## Persistence
Reads/writes `CampaignState.clock`:

```json
{ "day": 1, "minute": 480 }
```

Stored inside the existing `campaign-state` document / `{campaignId}-campaign-state` localStorage blob.

## Init
`DayTimeUI.init()` after `CampaignState.init(campaignId)` from `campaign-app.js`.
