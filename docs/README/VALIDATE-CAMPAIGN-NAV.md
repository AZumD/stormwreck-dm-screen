# VALIDATE-CAMPAIGN-NAV.js

## Purpose
Checks campaign sidebar Tools (Reference only), Session workspace host, Document scrollspy, and Run|Prep|Map|Session workspace wiring.

## File
`test/validate-campaign-nav.js`

## Run
```
node test/validate-campaign-nav.js
```

## What it checks
- Document scrollspy gates on `activeView.type === "document"`
- Scrollspy syncs focused scene + URL hash
- `resolvePanelRequest` / session workspace helpers / `setWorkspace` exist
- Stormwreck + sandbox: Tools → Reference only (no sidebar Session); Run|Prep|Map|Session switcher + `#session-view`
- `CampaignPrefs` stores tabs + `workspace` including Map and Session
- Session + panel workspace tab CSS
