# BROWSER-IMPORT.js

## Purpose
Non-destructive one-click migration from legacy browser `localStorage` + IndexedDB into `/data`.

## File
`js/core/browser-import.js` → `window.BrowserDataImport`

## Behavior
- Does **not** clear browser storage
- Skips writes when file-backed data already exists / is newer (`updatedAt`); empty on-disk stubs can be replaced by richer browser data
- Only writes prefs/map-state when the browser has non-default content (avoids “Skipped: 2” noise from empty stubs)
- Report includes origin + localStorage scan counts (helps diagnose `file://` vs `http://127.0.0.1:3000` isolation)
- Imports catalogues, custom campaigns, campaign documents, and images
- Landing button: **Import browser data**

## Related
`LocalApiClient`, landing page, `CatalogueImages.exportAllIdb`
