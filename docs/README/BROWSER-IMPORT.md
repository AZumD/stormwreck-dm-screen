# BROWSER-IMPORT.js

## Purpose
Non-destructive one-click migration from legacy browser `localStorage` + IndexedDB into `/data`.

## File
`js/core/browser-import.js` → `window.BrowserDataImport`

## Behavior
- Does **not** clear browser storage
- Skips writes when file-backed data already exists / is newer (`updatedAt`)
- Imports catalogues, custom campaigns, campaign documents, and images
- Landing button: **Import browser data**

## Related
`LocalApiClient`, landing page, `CatalogueImages.exportAllIdb`
