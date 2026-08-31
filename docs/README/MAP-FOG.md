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
      },
      "fog-rect": {
        "id": "fog-rect",
        "seq": 2,
        "mode": "reveal",
        "shape": "rect",
        "rect": [0.2, 0.3, 0.45, 0.55]
      }
    }
  }
}
```

Strokes are **object-keyed** so PATCH merge appends without replacing the whole array.

Coordinates are **0–1 normalized** to map **image** space (pan/zoom independent). Fog painting uses the visible `#map-image` bounds (letterboxing trimmed via `MapDistance.imageContentRect`) so strokes align with tokens and the UVTT grid.

## DM UI
1. Check **Fog enabled** (or click **Reveal** / **Hide** — both turn fog on and enter paint mode).
2. The map cursor becomes a crosshair when paint mode is active (also toggled via the **Fog** button in the primary toolbar).
3. **Brush** — click and drag on the map to paint reveal (erase fog) or hide (add fog back) strokes.
4. **Select** — drag a rectangle to reveal/hide a whole area at once. On calibrated maps with **Grid** shown, the rectangle snaps to whole grid cells.
5. **Undo**, **Hide all** (reset to fully hidden), **Reveal all** (clear fog overlay).

### Hotkeys
| Key | Action |
|-----|--------|
| **F** | Toggle fog edit (paint) mode on/off |
| **X** | Switch Reveal ↔ Hide mode |
| **Ctrl+Z** / **Cmd+Z** | Undo last stroke (when fog is enabled) |

Layer `#map-fog-layer` inside `#map-surface` (shared with image, tokens, grid). Fog painting and rendering use the same surface box so strokes align with map art on DM and player views.

## Opacity
| View | Alpha | Notes |
|------|-------|-------|
| DM (`render` / `refresh` with `{ dm: true }`) | `0.4` (`DM_FOG_ALPHA`) | Noticeable overlay — fog obvious at a glance, map still readable |
| Player (`PlayerMapView`, `{ dm: false }`) | `1.0` (`PLAYER_FOG_ALPHA`) | Fully opaque black fog |

Fog layer sits **above** tokens/pins on the DM map (`z-index: 4`); revealed brush strokes are transparent so tokens show through. Player map matches: fog above tokens, own PC token (`isSelf`) stays on top.

Strokes are rendered to an opaque mask first, then DM view applies a single `DM_FOG_ALPHA` pass — repainting the same spot does not stack darker.

Hidden tokens are omitted from the player API when their center lies under fog (`server/lib/map-fog.js` → `filterVisibleTokens`), except the viewer's own PC.

## Player
Same stroke data (brush **and** rectangle select) is sent via `playerFogDto` and rendered opaque on the player Map tab (`PlayerMapView` + `MapFog.render`). Rectangle strokes keep `shape: "rect"` + `rect: [x0,y0,x1,y1]`.

## Non-goals
No LOS, walls, lighting, or vision radius — paint only.
