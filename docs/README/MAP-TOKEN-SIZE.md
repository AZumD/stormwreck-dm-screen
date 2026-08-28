# MAP-TOKEN-SIZE.js

## Purpose
Maps D&D creature **Size** categories to grid-cell footprints on calibrated / UVTT maps.

## File
`js/core/map-token-size.js` → `window.MapTokenSize`

## Size chart (5e)
| Size | Grid footprint |
|------|----------------|
| Tiny, Small, Medium | 1×1 |
| Large | 2×2 |
| Huge | 3×3 |
| Gargantuan | 4×4 |

Footprint is expressed as a percentage of the map image (`cellSpanPercent`) so tokens stay aligned with the grid overlay at any zoom.

## Resolution order

### Monster / combat token
Uses the monster catalogue entry `size` field (`buildMonsterToken` stores `dndSize` + `gridCells` on the token). Map art: **`tokenImage`**, then **`portrait`** fallback.

### NPC pin
1. **Monster catalogue** — match NPC `race` text to a creature name (e.g. `"Kobold"` → monster named Kobold)
2. **Race catalogue** — player species (Halfling → Small)
3. **Built-in defaults** — common creature names when no catalogue row exists (kobold → Small)
4. Fallback **Medium**

Map art: catalogue **`tokenImage`**, then **`portrait`** fallback when set; otherwise colored grid square at resolved size.

Image URLs are resolved via `resolvePinImageUrls` (checks catalogue row, party member, entity registry, memory cache, and `/api/assets/…` paths). If a token image 404s, the `<img>` automatically tries the portrait URL.

Tokens **with** uploaded art render **without** the colored type frame (transparent over the map). Empty placeholders keep the colored ring. Map-token uploads are stored as **PNG** so alpha is preserved — re-upload older tokens that were saved as JPEG with a dark matte.

### PC pin
1. Race catalogue by PC `race`
2. Built-in defaults
3. Fallback **Medium**

Map art: catalogue **`tokenImage`**, then **`portrait`** fallback when set.

## Zoom
Grid tokens scale with the map (they stay one cell wide/tall). Legacy **map-pin** dots on non-calibrated maps still counter-scale for readability.

## Consumers
| Module | Use |
|--------|-----|
| `map-spatial.js` | Renders combat tokens as `.map-grid-token` sized to `gridCells`; snap drag when **Snap measure** is on |
| `map-panel.js` | Renders PC/NPC/item pins as grid tokens on calibrated maps |
| `combat-sheet-modal.js` | Sets `gridCells` when spawning monster tokens |

## API
| Function | Role |
|----------|------|
| `dndSizeToGridCells(size)` | Size label → cell span (1–4) |
| `cellSpanPercent(cells, map)` | Cell span → `{ w, h }` % of map |
| `resolveNpcSize(entry)` | NPC catalogue row → size label |
| `resolvePcSize(entry)` | PC catalogue row → size label |
| `resolvePinSize(pin, { map })` | Map pin → `{ dndSize, gridCells, span, tokenUrl, fallbackUrl }` |
| `resolvePinImageUrls(kind, entry, pin)` | `{ url, fallbackUrl }` for map / combat tokens |
| `resolveImageUrl(kind, entry, pin)` | Primary image URL (shorthand) |
| `tokenImageHtml(url, label, fallbackUrl)` | `<img>` markup with portrait fallback on error |
| `gridTokenStyle(pos, span)` | Inline CSS for centered grid token |
| `isCalibratedMap(map)` | Whether grid sizing applies |

## Test
```bash
node test/validate-map-token-size.js
```

Included in `npm test`.

## See also
`docs/README/MAP-SPATIAL.md`, `docs/README/MAP-PANEL.md`, `docs/README/COMBAT-SHEET-MODAL.md`
