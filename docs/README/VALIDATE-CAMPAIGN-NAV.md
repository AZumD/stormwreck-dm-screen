# VALIDATE-CAMPAIGN-NAV.js

## Purpose
Checks campaign sidebar Tools (Reference / Session), Document scrollspy, and Run|Prep workspace wiring.

## File
`test/validate-campaign-nav.js`

## Run
```
node test/validate-campaign-nav.js
```

## What it checks
- Document scrollspy gates on `activeView.type === "document"` (not obsolete `"scroll"`)
- Scrollspy syncs focused scene + URL hash
- `resolvePanelRequest` / workspace tabs / `setWorkspace` exist in `campaign-app.js`
- Stormwreck + sandbox HTML expose Tools → Reference / Session and Run|Prep (no Edit / Play-Document primary toggles)
- `CampaignPrefs` stores `referenceTab` / `sessionTab` / `workspace`
- Sticky panel workspace tab CSS + `.workspace-switch` styles
