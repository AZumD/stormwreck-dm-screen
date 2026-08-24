# VALIDATE-LAYOUT.js

## Purpose
Static checks for sidebar / map rail layout wiring (`layout-panels.js`, campaign HTML, CSS).

## File
`test/validate-layout.js`

## Run
```bash
node test/validate-layout.js
```

Included in `npm test`.

## Covers
- `layout-panels.js` included and owns collapse / expand
- `--nav-col` / expanded map width
- Map modes API (`sidebar` | `expanded` | `combat`)
- Expand control + Party tab present in campaign HTML
- CSS grid column variables + collapse data-attribute fallbacks
- Map stage `--map-aspect` (no expanded `aspect-ratio: auto` stretch)
