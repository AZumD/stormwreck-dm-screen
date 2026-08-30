# VALIDATE-DAY-TIME.js

## Purpose
Static + behavioral checks for the compact campaign-time control and tenday/time persistence.

## Run
```bash
node test/validate-day-time.js
```

Included in `npm test`.

## Covers
- `CampaignState` clock API (`getClock` / `setClock` / `normalizeClock` / `formatClockTime`)
- `DayTimeUI` compact trigger + popover + presets + dismiss handlers
- Campaign HTML (no persistent `day-time-bar`; `#campaign-time` with tenday 1–10 / minutes 0–1439)
- CSS for popover + night→noon→night time track; obsolete `.day-time-bar` removed
- Persistence under `{campaignId}-campaign-state` and campaign isolation
