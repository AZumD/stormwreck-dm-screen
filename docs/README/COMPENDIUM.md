# COMPENDIUM

## Purpose
Unified DM Library catalogue experience — one shell with a category rail and a single `CatalogueApp` host. Replaces twelve separate catalogue mini-pages for day-to-day navigation.

## Route
- **Primary:** `/dm/compendium/`
- **Catalogue type:** `?type=npc` (defaults to last-used type in `localStorage`, else NPCs)
- **Entry deep link:** `?type=npc&id=sw-runara` (optional)

Legacy `{type}-katalog/` URLs redirect into Compendium via `js/core/catalogue/legacy-redirect.js`.

## Files
| File | Role |
|------|------|
| `dm/compendium/index.html` | Shell markup + script bundle |
| `js/core/catalogue/compendium.js` | Category rail, URL/history, last-type prefs |
| `js/core/catalogue/legacy-redirect.js` | Thin legacy page redirect helper |
| `css/compendium.css` | Rail layout, active state, responsive drawer |
| `js/core/catalogue/app.js` | Shared catalogue engine (`open` / `dispose` / `setType`) |

## Navigation hierarchy
```
Characters   PCs · NPCs
Creatures    Monsters
World        Locations · Items
Rules        Species · Classes · Skills · Features · Spells · Sources
Media        Music
```

User-facing **Species** maps to internal type `race`.

## Lifecycle
Switching catalogues calls `CatalogueApp.setType(type)` which:
1. Flushes any pending autosave on the open editor
2. Disposes listeners via `AbortController`
3. Bootstraps only the selected type (+ related ref types)
4. Mounts list/search/editor into the single `#cat-list` / `#cat-editor` host

Do not mount multiple catalogue instances.

## DM Library
The landing sidebar exposes **Compendium** as the primary catalogue destination. Individual `{type}-katalog/` folders remain as compatibility redirects only.

## Campaign integration
Campaign entity modals (`EntityUI`) are unchanged. Map/location helpers link to `/dm/compendium/?type=location`.

## Tests
`node test/validate-compendium.js`
