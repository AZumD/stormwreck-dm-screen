# VALIDATE-MAP-TOKEN-IMAGE-FALLBACK.js

## Purpose
Regression checks for map combat-token art: when a token image 404s or fails to load, initials must appear instead of an invisible frameless token.

## Script
`test/validate-map-token-image-fallback.js`

## Run
```bash
node test/validate-map-token-image-fallback.js
```

## Covers
- `MapTokenSize.tokenLabelHtml` / `tokenImageErrorAttr`
- `map-spatial.js` hidden fallback label in `renderGridToken`
- `map-panel.js` initials on calibrated pins without art
- `catalogue/app.js` `refreshMapTokenArt` after `tokenImage` upload/clear
- Spore Servant Octopus catalogue size is **Medium** (1×1)

## See also
`docs/README/MAP-TOKEN-SIZE.md`, `docs/README/VALIDATE-MAP-TOKEN-SIZE.md`
