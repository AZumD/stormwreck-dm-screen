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
- Side-by-side visible 200×200 player dock (not stacked/covered)
- Track pills, `stopTrack`, `getTracks`
- Parser `{{youtube}}` chips keep `data-media-url`
- Campaign HTML multi-track media bar markup
