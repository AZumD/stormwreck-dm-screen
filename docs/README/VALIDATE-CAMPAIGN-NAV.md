# VALIDATE-CAMPAIGN-NAV.js

## Purpose
Checks campaign sidebar Tools collapse (Reference / Session workspaces) and Document scrollspy wiring.

## File
`test/validate-campaign-nav.js`

## Run
```
node test/validate-campaign-nav.js
```

## What it checks
- Document scrollspy gates on `activeView.type === "document"` (not obsolete `"scroll"`)
- Scrollspy syncs focused scene + URL hash
- `resolvePanelRequest` / workspace tabs exist in `campaign-app.js`
- Stormwreck + sandbox HTML expose Tools → Reference / Session only (no leaf `data-view` entries)
- `CampaignPrefs` stores `referenceTab` / `sessionTab`
- Sticky panel workspace tab CSS
