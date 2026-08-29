# VALIDATE-MAP-FULLSCREEN.js

## Purpose
Checks fullscreen map page shell, corner tools drawer, campaign Fullscreen button, and URL builder wiring.

## File
`test/validate-map-fullscreen.js`

## Run
```
node test/validate-map-fullscreen.js
```

## What it checks
- `campaigns/map-fullscreen/index.html` has required map DOM ids + drawer
- `js/core/map-fullscreen.js` exports open/URL builder + drawer persistence
- `js/map-fullscreen-app.js` bootstraps MapPanel
- `map-panel.js` reads `?map=` on fullscreen + exposes `getActiveMapId`
- CSS fullscreen layout rules
- Stormwreck + sandbox campaign pages include `#map-fullscreen-btn` and script
