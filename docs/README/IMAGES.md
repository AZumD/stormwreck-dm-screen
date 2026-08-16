# IMAGES.js

## Purpose
Persists catalogue portrait / map images **on disk under `/data/assets`**, the same file-backed library as catalogue JSON. IndexedDB is only a legacy/offline bridge.

## File
`js/core/catalogue/images.js` → `window.CatalogueImages`

## Model
| Piece | Storage (server running) | Offline fallback |
|-------|--------------------------|------------------|
| Entry metadata | `data/catalogues/<type>/<id>.json` | `localStorage` `catalogue-{type}` |
| Image bytes | `data/assets/{portraits\|maps}/<type>/<id>.<ext>` | IndexedDB `stormwreck-catalogue-images` |
| Pointer in entry | `/api/assets/…` URL | `"__idb__"` marker |

## API
| Method | Role |
|--------|------|
| `preload(types)` | Load legacy IDB rows into memory (always — enables migrate when API is up) |
| `hydrate` / `hydrateAll` | Resolve markers / cache for UI |
| `persistEntryImages` | Upload data URLs to `/api/catalogue-assets/…`; **empty fields do not delete files** |
| `clear` / `persistEntryImages(..., { clearFields })` | Explicit remove only |
| `migrateType` / `migrateAll` | Move IDB / inline data URLs into `/data/assets` + update JSON |
| `exportAllIdb` | Browser → file import |

## Safety
Ordinary text autosave must not wipe portraits. Blank form image fields preserve existing `/api/assets/…` (or migrate legacy markers). Only the **Remove** control clears an asset.

## Load order
`store.js` → `images.js` → catalogue `app.js` (or campaign scripts).
