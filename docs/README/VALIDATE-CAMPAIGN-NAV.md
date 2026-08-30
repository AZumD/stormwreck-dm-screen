# VALIDATE-CAMPAIGN-NAV.js

## Purpose
Checks campaign sidebar Tools (Reference / Session), Document scrollspy, and Run|Prep|Map workspace wiring.

## File
`test/validate-campaign-nav.js`

## Run
```
node test/validate-campaign-nav.js
```

## What it checks
- Document scrollspy gates on `activeView.type === "document"`
- Scrollspy syncs focused scene + URL hash
- `resolvePanelRequest` / workspace tabs / `setWorkspace` exist
- Stormwreck + sandbox: Tools → Reference / Session and Run|Prep|Map (no Edit / Play-Document / map-panel-toggle)
- `CampaignPrefs` stores tabs + `workspace` including Map
- Sticky panel + workspace-switch CSS
