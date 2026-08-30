# PLAYER-MAP-CAMERA.js

## Purpose
Shared camera math and zoom constants for the player Map tab (PC-centered tactical view).

## File
`js/core/player-map-camera.js`

## Exports
| Name | Role |
|------|------|
| `PLAYER_MAP_MIN_ZOOM` | Widest tactical zoom (above 1 — full-map fit unreachable) |
| `PLAYER_MAP_MAX_ZOOM` | Closest tactical zoom |
| `PLAYER_MAP_DEFAULT_ZOOM` | Session / first-open default |
| `PLAYER_MAP_ZOOM_STEP` | Wheel / button / pinch step factor |
| `clampZoom(z)` | Clamp into min/max |
| `computeCenterPan(pos, worldW, worldH, viewportW, viewportH, z)` | Pan offsets that place PC percent position at viewport center |

Loaded before `player-map-view.js` in `/player/`. Also `require`-able from Node tests.
