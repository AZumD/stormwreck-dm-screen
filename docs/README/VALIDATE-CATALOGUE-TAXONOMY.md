# VALIDATE-CATALOGUE-TAXONOMY.js

## Purpose
Regression checks for the catalogue taxonomy architecture (item categories, class/subclass, race/subspecies, locations, monsters, seed files, declarative facets, flat storage).

## File
`test/validate-catalogue-taxonomy.js`

## Run
```bash
node test/validate-catalogue-taxonomy.js
```

Included in `npm test` alongside `validate-catalogues.js`.

## Checks
- Item config exposes controlled `category` select + category/rarity facets and `groupBy: "category"`
- Class/race configs group/filter by `entryKind` with Classes/Subclasses and Species/Subspecies labels
- Feature/location/monster/spell/skill declare facets; location lists use `refType`
- `CatalogueApp` supports `showWhen`, facets (collapsible Filters panel), grouping, declarative `searchFields` (no item-only facet hardcoding)
- `mergeSeeds` backfills taxonomy fields including `legendaryActionRefs`
- Server storage stays flat (`data/catalogues/<type>/<id>.json`); no category subfolders
- Browse helpers: search + facets combine; missing category → Uncategorized; `showWhen` equals/notEquals
- Legacy items without category remain searchable; plain-text refs stay readable
- Seed items keep expected categories; missing category on other files remains valid (Uncategorized)
- Required subclass/subspecies JSON files exist with `@class:` / `@race:` parent refs
- Parent class/race files expose `subclassRefs` / `subspeciesRefs`
- Elf parent traits no longer embed High/Wood/Drow rules inline
- Locations have `locationType` + `tags`; monsters have `source` + `tags`
- `core-rules.js` and `stormwreck-isle.js` include taxonomy fields and forbid `@species:`
- Catalogue HTML pages still call `CatalogueApp.init`
