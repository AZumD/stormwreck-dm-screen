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
4. **Undo**, **Hide all** (reset to fully hidden), **Reveal all** (clear fog overlay). **Ctrl+Z** / **Cmd+Z** undoes the last stroke when fog is enabled.

Layer `#map-fog-layer` inside `#map-world` (40% fog overlay on DM view — obvious at a glance, map still readable underneath).

## Opacity
| View | Alpha | Notes |
|------|-------|-------|
| DM (`render` / `refresh` with `{ dm: true }`) | `0.4` (`DM_FOG_ALPHA`) | Noticeable overlay — fog obvious at a glance, map still readable |
| Player (`PlayerMapView`, `{ dm: false }`) | `1.0` (`PLAYER_FOG_ALPHA`) | Fully opaque black fog |

Fog layer sits **above** tokens/pins on the DM map (`z-index: 4`); revealed brush strokes are transparent so tokens show through. Player map matches: fog above tokens, own PC token (`isSelf`) stays on top.

Strokes are rendered to an opaque mask first, then DM view applies a single `DM_FOG_ALPHA` pass — repainting the same spot does not stack darker.

Hidden tokens are omitted from the player API when their center lies under fog (`server/lib/map-fog.js` → `filterVisibleTokens`), except the viewer's own PC.

## Player
Same stroke data rendered **opaque** on the player Map tab via `PlayerMapView` + `MapFog.render`.

## Non-goals
No LOS, walls, lighting, or vision radius — paint only.
