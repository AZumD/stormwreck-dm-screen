# VALIDATE-MAP-FOG.js

## Purpose
Checks fog paint pointer wiring — capture-phase handlers and no self-blocking listener in map-spatial.

## File
`test/validate-map-fog.js`

## Run
```
node test/validate-map-fog.js
```

## What it checks
- `MapFog.bindDm` registers pointer handlers in capture phase
- Painting calls `stopPropagation` so pan/measure do not steal the gesture
- `map-spatial.js` does not blanket `stopPropagation` when fog mode is on
- Brush/select fog instruments and **F** / **X** hotkeys are wired
- Rectangle (`shape: "rect"`) strokes resolve visibility on the server helper
