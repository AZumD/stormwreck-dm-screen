# VALIDATE-CATALOGUE-REF-PICKER.js

## Purpose
Checks that PC / NPC / monster catalogue forms can search and link entries from related catalogues (items, skills, features, spells), with equipment and inventory kept separate.

## File
`test/validate-catalogue-ref-picker.js`

## Run
```bash
node test/validate-catalogue-ref-picker.js
```

Included in `npm test`.

## Checks
- PC/NPC declare `equipment` + `inventory` item ref lists
- PC/NPC declare separate `skillRefs`, `featureRefs`, `spellRefs`
- Monster declares `spellRefs` plus existing feature/skill ref lists
- `CatalogueApp` implements catalogue search picker UI (`cat-ref-picker`)
- Related catalogue types are derived from field `refType`s
- Entity registry surfaces inventory / spell links
- Catalogue HTML pages load skill/feature/spell/item seeds
