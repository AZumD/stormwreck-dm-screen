# VALIDATE-SOURCE-CATALOGUE.md

## Purpose
Static checks for the Source Catalogue type, chapter UI, and player browse wiring.

## Run
```bash
node test/validate-source-catalogue.js
```

Included in `npm test`.

## Coverage
- `source` in `CATALOGUE_TYPES` / `CatalogueTypes` / configs
- Source Kind select (Adventures / Rulebooks / Others) + `groupBy: category`
- `CatalogueApp` chapters field + `SourceUi`
- `source-katalog` page + DM landing link
- Player browse allowlist + library chip; Adventures visibility helpers
- Location not in player library browse
- `normalizeChapters` / wiki render / `playerSafeMarkup`
