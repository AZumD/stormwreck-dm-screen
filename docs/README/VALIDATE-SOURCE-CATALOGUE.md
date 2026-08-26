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
- `CatalogueApp` chapters field + `SourceUi`
- `source-katalog` page + DM landing link
- Player browse allowlist + library chip
- `normalizeChapters` / wiki render / `playerSafeMarkup`
