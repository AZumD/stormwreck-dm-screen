# MIGRATE-CATALOGUE-TAXONOMY.js

## Purpose
One-shot (re-runnable) migration that fills catalogue taxonomy fields on disk and regenerates core race/class seeds.

## File
`test/migrate-catalogue-taxonomy.js`

## Run
```bash
node test/migrate-catalogue-taxonomy.js
```

## What it does
| Area | Action |
|------|--------|
| Items | Sets `category` + `tags` when empty (keeps existing `category`) |
| Locations | Sets `locationType`, `parentLocationRef` (when clear), `tags` |
| Monsters | Sets `source` + empty `tags` when missing |
| Classes | Sets `entryKind: "class"`, writes `subclassRefs`, removes legacy `subclasses` |
| Subclasses | Creates flat `subclass-*.json` under `data/catalogues/class/` |
| Races | Sets `entryKind: "species"`, `subspeciesRefs`; moves subrace rules to children |
| Subspecies | Creates flat `subspecies-*.json` under `data/catalogues/race/` |
| Seeds | Rewrites `js/catalogue-seeds/core-rules.js`; patches Stormwreck item/location/monster seeds |
| Spells | Optionally adds empty `classRefs: []` on disk JSON |

Does **not** create category subfolders. Does **not** rename IDs. Uses `@race:` / `@class:` only.
