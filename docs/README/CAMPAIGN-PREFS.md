# CAMPAIGN-PREFS.js

## Purpose
Campaign UI preferences + notes/checklist session chrome, persisted as campaign documents.

## File
`js/core/campaign-prefs.js` → `window.CampaignPrefs`

Documents: `prefs.json`, also mirrors `notes.json` / `checklist.json` for readability.

Also stores UI chrome: **workspace** (`run` \| `prep`), legacy **viewMode** (`play` \| `document`, kept in sync with workspace), sidebar/map collapse, chronicle session order, and last **Reference** / **Session** workspace tabs (`referenceTab`, `sessionTab`).

Missing `workspace` migrates from `viewMode` (`document` → `prep`, else `run`).
