# IMAGES.js

## Purpose
Persists catalogue portrait / map images **on disk under `/data/assets`**, the same file-backed library as catalogue JSON. IndexedDB is only a legacy/offline bridge.

## File
`js/core/catalogue/images.js` → `window.CatalogueImages`

## Model
| Piece | Storage (server running) | Offline fallback |
|-------|--------------------------|------------------|
| Entry metadata | `data/catalogues/<type>/<id>.json` | `localStorage` `catalogue-{type}` |
| Portrait bytes | `data/assets/portraits/<type>/<id>.<ext>` | IndexedDB |
| **Map token** bytes | `data/assets/tokens/<type>/<id>.<ext>` | IndexedDB |
| Map image bytes | `data/assets/maps/<type>/<id>.<ext>` | IndexedDB |
| Pointer in entry | `/api/assets/…` URL (upload returns `?v=<mtimeMs>` for CDN cache busting) | `"__idb__"` marker |

Fields: `portrait`, `tokenImage` (PC/NPC/monster map tokens), `mapImage` (locations).

## API
| Method | Role |
|--------|------|
| `preload(types)` | Load legacy IDB rows into memory only (does **not** HTTP-fetch every `/api/assets/…` image) |
| `hydrate` / `hydrateAll` | Resolve markers / cache for UI |
| `persistEntryImages` | Upload data URLs to `/api/catalogue-assets/…`; **empty fields do not delete files** |
| `clear` / `persistEntryImages(..., { clearFields })` | Explicit remove only |
| `migrateType` / `migrateAll` | Move IDB / inline data URLs into `/data/assets` + update JSON |
| `exportAllIdb` | Browser → file import |

## Safety
Ordinary text autosave must not wipe portraits. Blank form image fields preserve existing `/api/assets/…` (or migrate legacy markers). Only the **Remove** control clears an asset.

Uploads return versioned URLs (`?v=<mtimeMs>`) so Railway CDN can use immutable caching; unversioned URLs remain valid with short revalidation. See `docs/README/HTTP-CACHE.md`.

## Load order
`store.js` → `images.js` → catalogue `app.js` (or campaign scripts).
