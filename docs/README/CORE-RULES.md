# CORE-RULES.js

## Purpose
Campaign-agnostic starter seeds for the **Race** and **Class** catalogues (5e-style core reference).

## File
`js/catalogue-seeds/core-rules.js`

## Contents
| Type | Count | IDs |
|------|-------|-----|
| `race` | 9 | `race-dwarf` … `race-tiefling` |
| `class` | 12 | `class-barbarian` … `class-wizard` |

Merges into `window.CatalogueSeeds` without wiping Stormwreck (or other) seeds. Missing IDs only are written on catalogue open via `CatalogueStore.mergeSeeds` (also fills empty `featureRefs` / `skillRefs`).

Classes/races reference Feature and Skill entries via `featureRefs`, `skillRefs`, and `@feature:` / `@skill:` links in progression text.

## Loaded by
`race-katalog/index.html`, `class-katalog/index.html`, campaign page (with skill/feature seeds)
