# DAY-TIME-UI.js

## Purpose
Compact campaign tenday + time-of-day control in the main toolbar. A trigger shows the current clock (e.g. `Day 2 · 14:35`); a popover holds the day/time sliders and Morning/Noon/Evening/Night presets.

## File
`js/core/day-time-ui.js` → `window.DayTimeUI`

## UI
- **Trigger** — `#campaign-time-trigger` / `#campaign-time-label` (`Day N · HH:MM`)
- **Popover** — `#campaign-time-popover` (click outside or Escape closes; listeners detached when closed)
- **Day** — snapping range `1–10` (tenday)
- **Time** — continuous range `0–1439` minutes (`00:00`–`23:59`) with night→noon→night track gradient
- **Presets** — Morning `08:00`, Noon `12:00`, Evening `18:00`, Night `22:00` (same minute model as the slider)

## Persistence
Reads/writes `CampaignState.clock`:

```json
{ "day": 1, "minute": 480 }
```

Stored inside the existing `campaign-state` document / `{campaignId}-campaign-state` localStorage blob.

## Init
`DayTimeUI.init()` after `CampaignState.init(campaignId)` from `campaign-app.js`. Markup lives in both campaign `index.html` toolbars (`#campaign-time`).

`DayTimeUI.openPopover()` opens the popover programmatically (used by the command palette).
