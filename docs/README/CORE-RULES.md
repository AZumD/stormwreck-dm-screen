# CORE-RULES.js

## Purpose
Campaign-agnostic starter seeds for the **Race** (species/subspecies) and **Class** (class/subclass) catalogues (5e-style core reference).

## File
`js/catalogue-seeds/core-rules.js`

## Contents
| Type | Count | Notes |
|------|-------|-------|
| `race` | 18 | 9 species (`race-dwarf` … `race-tiefling`) + 9 subspecies (`subspecies-dwarf-hill`, …) |
| `class` | 52 | 12 PHB classes + 40 PHB subclasses (`subclass-barbarian-berserker`, …) |

### Taxonomy
- Species use `entryKind: "species"` and `subspeciesRefs` with `@race:…` links
- Subspecies use `entryKind: "subspecies"` and `parentSpeciesRef` like `@race:race-elf|Elf` (never `@species:`)
- Classes use `entryKind: "class"` and `subclassRefs` with `@class:…` links
- Subclasses use `entryKind: "subclass"` and `parentClassRef` like `@class:class-barbarian|Barbarian`

Merges into `window.CatalogueSeeds` without wiping Stormwreck (or other) seeds. Missing IDs only are written on catalogue open via `CatalogueStore.mergeSeeds` (also fills empty `featureRefs` / `skillRefs`).

Classes/races reference Feature and Skill entries via `featureRefs`, `skillRefs`, and `@feature:` / `@skill:` links in progression text.

Artificer subclasses live as flat JSON under `data/catalogues/class/` but are **not** duplicated in this seed file (campaign/disk only).

## Loaded by
`race-katalog/index.html`, `class-katalog/index.html`, campaign page (with skill/feature seeds)
