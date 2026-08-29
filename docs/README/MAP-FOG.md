# MAP-FOG.js

## Purpose
Manual fog of war — normalized brush strokes persisted in `map-state.fog[mapId]`.

## File
`js/core/map-fog.js` → `window.MapFog`

## Storage (`CampaignMapState.fog`)
```json
{
  "dragons-rest": {
    "enabled": true,
    "revision": 3,
    "revealedAll": false,
    "strokes": {
      "fog-abc": {
        "id": "fog-abc",
        "seq": 1,
        "mode": "reveal",
        "radius": 0.025,
        "points": [[0.31, 0.44], [0.32, 0.45]]
      }
    }
  }
}
```

Strokes are **object-keyed** so PATCH merge appends without replacing the whole array.

Coordinates are **0–1 normalized** to map image space (pan/zoom independent).

## DM UI
Map panel → **Fog** tool (Reveal / Hide brushes, Undo, Hide all, Reveal all). Layer `#map-fog-layer` inside `#map-world` (semi-transparent fog).

## Player
Same stroke data rendered **opaque** on the player Map tab via `PlayerMapView` + `MapFog.render`.

## Non-goals
No LOS, walls, lighting, or vision radius — paint only.
