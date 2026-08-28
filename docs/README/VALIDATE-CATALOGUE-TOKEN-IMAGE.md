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
- `MapTokenSize.resolveTokenUrl` + `buildMonsterToken` using `tokenImage`

## See also
`docs/README/IMAGES.md`, `docs/README/MAP-TOKEN-SIZE.md`
