# CORE-FEATURES.js

## Purpose
Starter Feature catalogue seeds — reusable class / species / monster / other abilities.

## File
`js/catalogue-seeds/core-features.js` → `CatalogueSeeds.feature`

## Notes
- One Feature type covers class, subclass, species, background, feats, **monster traits/actions**, and other abilities
- Feature type is an organizational label only (not a separate catalogue)
- Stable ids: `feature-wild-shape` with `linkId: "wild-shape"` → `@feature:wild-shape|Wild Shape`
- Monster examples: `undead-fortitude` (Monster trait), `slam` (Monster action)
- `grantedBy` stores entity refs such as `@class:druid|Druid`
- Race/class/monster seeds reference features via `featureRefs` / `traitRefs` / `actionRefs` and `@feature:` links
