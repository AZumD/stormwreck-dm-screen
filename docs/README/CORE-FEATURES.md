# CORE-FEATURES.js

## Purpose
Starter Feature catalogue seeds — reusable class / species / other abilities.

## File
`js/catalogue-seeds/core-features.js` → `CatalogueSeeds.feature`

## Notes
- One Feature type covers class, subclass, species, background, feats, and other abilities
- Stable ids: `feature-wild-shape` with `linkId: "wild-shape"` → `@feature:wild-shape|Wild Shape`
- `grantedBy` stores entity refs such as `@class:druid|Druid`
- Race/class seeds reference features via `featureRefs` and `@feature:` links in progression text
