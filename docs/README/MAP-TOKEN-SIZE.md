# MAP-TOKEN-SIZE.js

## Purpose
Maps D&D creature **Size** categories to grid-cell footprints on calibrated / UVTT maps.

## File
`js/core/map-token-size.js` → `window.MapTokenSize`

Server mirror: `server/lib/map-token-size.js` — same size chart and image resolution chain for the player map API (`server/lib/player-map.js`).

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

Map art: catalogue **`tokenImage`**, then **race-bound monster** `tokenImage` (NPC/PC `race` → monster catalogue name match), then **`portrait`** (own, then race monster). An uploaded NPC/PC map token always overrides the bound monster token.

Image URLs are resolved via `resolvePinImageUrls` (checks catalogue row, party member, entity registry, memory cache, and `/api/assets/…` paths). If a primary image 404s, the `<img>` tries the next URL in the chain.

Tokens **with** uploaded art render **without** the colored type frame (transparent over the map). Empty placeholders keep the colored ring. Map-token uploads are stored as **PNG** so alpha is preserved — re-upload older tokens that were saved as JPEG with a dark matte.

### PC pin
1. Race catalogue by PC `race`
2. Built-in defaults
3. Fallback **Medium**

Map art: same override chain as NPC (`tokenImage` → race-bound monster token → portraits).

On **calibrated maps**, party PCs render as **combat tokens** (not percentage pins). Existing party positions auto-spawn PC tokens when the map loads; use **+ → PC** to place manually. After uploading a token in the PC catalogue, refocus the campaign tab to reload art.

## Zoom
Grid tokens scale with the map (they stay one cell wide/tall). Legacy **map-pin** dots on non-calibrated maps still counter-scale for readability.

## Consumers
| Module | Use |
|--------|-----|
| `map-spatial.js` | Renders monster/NPC/PC combat tokens as `.map-grid-token`; snap drag when **Snap measure** is on |
| `map-panel.js` | Add-to-map spawns combat tokens on calibrated maps; pins on image maps |
| `combat-sheet-modal.js` | `buildCombatToken` / `buildNpcToken` / `buildPcToken` / `buildMonsterToken` |

## API
| Function | Role |
|----------|------|
| `dndSizeToGridCells(size)` | Size label → cell span (1–4) |
| `cellSpanPercent(cells, map)` | Cell span → `{ w, h }` % of map |
| `resolveNpcSize(entry)` | NPC catalogue row → size label |
| `resolvePcSize(entry)` | PC catalogue row → size label |
| `lookupMonsterEntryByRace(race)` | Race text → monster catalogue row (size + art binding) |
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
