# VALIDATE-COMPENDIUM.js

## Purpose
Static checks for the unified Compendium shell, catalogue lifecycle API, legacy redirects, and DM Library navigation.

## File
`test/validate-compendium.js`

## Run
```
node test/validate-compendium.js
```

## What it checks
- `/dm/compendium/index.html` exists with single catalogue host
- All 12 catalogue types appear in `CompendiumApp` navigation
- `CatalogueApp.open` / `dispose` / `setType` / `flushPendingSave` lifecycle
- Legacy `{type}-katalog/index.html` pages redirect (no standalone UI)
- DM Library primary Compendium link; individual catalogue grid removed
- URL history sync (`pushState` / `popstate`)
- Responsive compendium CSS (active rail + narrow drawer)
