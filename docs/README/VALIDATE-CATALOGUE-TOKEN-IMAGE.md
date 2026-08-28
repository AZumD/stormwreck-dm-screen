# VALIDATE-CATALOGUE-TOKEN-IMAGE.js

## Purpose
Checks map **token image** upload wiring: catalogue fields, asset storage, and map consumers.

## File
`test/validate-catalogue-token-image.js`

## Run
```bash
node test/validate-catalogue-token-image.js
```

## Covers
- `tokenImage` field on PC / NPC / monster configs
- `CatalogueImages.IMAGE_FIELDS` + server `tokens` asset kind
- Catalogue upload UI (`kind: "token"`)
- Token compression uses PNG (`image/png`) to keep transparency
- Frameless `.map-grid-token--has-img` styling on the map
- `MapTokenSize.resolveTokenUrl` + `buildMonsterToken` using `tokenImage`

## See also
`docs/README/IMAGES.md`, `docs/README/MAP-TOKEN-SIZE.md`
