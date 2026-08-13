# IMAGES.js

## Purpose
Stores catalogue portrait / map image bytes in **IndexedDB** so photos are not limited by localStorage’s ~5 MB cap. Used for PC/NPC/Item/Monster/Race/Class/Spell portraits and Location maps.

## File
`js/core/catalogue/images.js` → `window.CatalogueImages`

## Why
A ~1.8 MB photo becomes a much larger base64 data URL. Putting that in `catalogue-{type}` localStorage often hits quota and used to surface as a false “too large” error.

## Model
| Piece | Storage |
|-------|---------|
| Entry metadata (name, stats, …) | `localStorage` key `catalogue-{type}` |
| Image bytes (`portrait`, `mapImage`) | IndexedDB `stormwreck-catalogue-images` |
| Placeholder in entry JSON | `"__idb__"` marker |

## API
| Method | Role |
|--------|------|
| `preload(types)` | Load images into memory cache |
| `hydrate` / `hydrateAll` | Replace markers with data URLs for UI |
| `persistEntryImages` | Write data URLs to IDB; leave markers in the entry |
| `migrateType` / `migrateAll` | Move legacy localStorage data URLs into IDB |

## Load order
`store.js` → `images.js` → catalogue `app.js` (or campaign scripts).
