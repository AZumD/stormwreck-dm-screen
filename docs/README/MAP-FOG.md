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
1. Check **Fog enabled** (or click **Reveal** / **Hide** — both turn fog on and enter paint mode).
2. The map cursor becomes a crosshair when paint mode is active (also toggled via the **Fog** button in the primary toolbar).
3. **Click and drag** on the map to paint reveal (erase fog) or hide (add fog back) strokes.
4. **Undo**, **Hide all** (reset to fully hidden), **Reveal all** (clear fog overlay).

Layer `#map-fog-layer` inside `#map-world` (semi-transparent fog on DM view).

## Player
Same stroke data rendered **opaque** on the player Map tab via `PlayerMapView` + `MapFog.render`.

## Non-goals
No LOS, walls, lighting, or vision radius — paint only.
