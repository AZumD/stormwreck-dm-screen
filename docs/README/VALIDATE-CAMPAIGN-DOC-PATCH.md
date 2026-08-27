# VALIDATE-CAMPAIGN-DOC-PATCH.js

## Purpose
Tests for campaign document `PATCH` (authorization shape, deep merge, array replace, prototype key blocking) and browser `CampaignMapState` / initiative tracker wiring.

## File
`test/validate-campaign-doc-patch.js`

## Run
```bash
node test/validate-campaign-doc-patch.js
```

Included in `npm test`.

## Checks
- `PATCH` route uses same DM auth gate as `GET`/`PUT`
- Recursive object merge; arrays replace; unrelated keys survive
- Unsafe prototype keys cannot be merged
- `null` deletes keys
- `CampaignMapState` uses `patchCampaignDocument` (not full PUT) when API is available
- `initiativeTracker` included in local fallback empty/load/save
- Combat sheet writes initiative only to the canonical tracker
