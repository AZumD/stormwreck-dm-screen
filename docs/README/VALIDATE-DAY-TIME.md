# VALIDATE-DAY-TIME.js

## Purpose
Static + behavioral checks for the campaign tenday/time tracker.

## Run
```bash
node test/validate-day-time.js
```

Included in `npm test`.

## Covers
- `CampaignState` clock API (`getClock` / `setClock` / `normalizeClock` / `formatClockTime`)
- `DayTimeUI` module + `campaign-app` init
- Campaign HTML markup (tenday 1–10, minutes 0–1439) and script include
- CSS for night→noon→night time track
- Persistence under `{campaignId}-campaign-state` and campaign isolation
