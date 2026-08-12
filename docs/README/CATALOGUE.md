# CATALOGUE

## Purpose
Shared catalogue engine for PC / NPC / Item / Monster / Location entries.

## Files
- `js/core/catalogue/store.js` — localStorage CRUD
- `js/core/catalogue/images.js` — IndexedDB image blobs
- `js/core/catalogue/configs.js` — field schemas
- `js/core/catalogue/app.js` — list + form UI

## Image fields
| Field | Catalogues | Notes |
|-------|------------|-------|
| `portrait` | PC, NPC, Item, Monster | Auto-resized; shown in campaign tooltips/modals |
| `mapImage` | Location | Auto-resized; drives campaign map panel |

Uploads go to **IndexedDB** (much larger than localStorage). Entry metadata stays in `catalogue-{type}` localStorage; image bytes are keyed separately.

Source files up to 25 MB are accepted and lightly JPEG-compressed (portraits ≤1800px, maps ≤3200px). Legacy images previously stuck in localStorage are migrated automatically on catalogue open.

### Reliability
- Image bytes go to IndexedDB **before** the form re-renders (avoids wiping uploads)
- Entry JSON only keeps an `__idb__` marker, so localStorage stays small
- Quota / size failures show an alert instead of failing silently
- Search no longer stringifies whole entries (including huge images)
