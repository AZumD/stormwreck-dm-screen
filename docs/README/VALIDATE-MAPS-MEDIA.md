# VALIDATE-MAPS-MEDIA.js

## Purpose
Checks map panel ↔ location catalogue wiring and YouTube media bar/parser plumbing.

## Run
```bash
node test/validate-maps-media.js
```

Included in `npm test`.

## Covers
- Map panel image resolve + pin drag storage
- Media bar multi-track via YouTube IFrame API + sibling resume
- Compact strip + mixer + separate visible dock (`#media-dock`, adaptive `--media-player-size`)
- Per-track volume / pauseAll (mounted) / stopTrack / getTracks / onLayoutChange
- Parser `{{youtube}}` chips keep `data-media-url`
- Campaign HTML multi-track media bar + dock markup
