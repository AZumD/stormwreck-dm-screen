# OVERVIEW

Personal local DM Library for **Dragons of Stormwreck Isle**.

## Surfaces
- Landing page (`index.html`) — campaign + catalogue entry points
- Campaign screen (`campaigns/stormwreck-isle/`) — continuous adventure scroll, map rail, session tools
- Catalogues — PC / NPC / Item / Monster / Location (metadata in localStorage; images in IndexedDB)

## Campaign editing
- **Edit mode** edits passage title/body
- **Add passage** inserts custom sections under a chapter
- **Delete** removes custom passages permanently; booklet passages are soft-deleted and restorable
- **YouTube** chips via `{{youtube:url|Label}}` play in the sticky media bar
- Entity links (`@npc:…`) resolve through catalogues via `entity-registry.js`

## Maps
- Upload images in the **Location catalogue** (`mapImage`)
- Campaign map panel prefers catalogue uploads over placeholder SVGs
- Drag pins to save custom positions in localStorage
- Mouse-wheel zoom / pan when zoomed (no on-map zoom chrome)
- **+** under the map adds NPC / monster / item / PC pins

## Portraits
PC, NPC, Monster, and Item catalogues support a **portrait** image upload (IndexedDB; multi‑MB photos OK). Campaign tooltips, modals, and reference cards show them when present.

## Core scripts
| Script | Role |
|--------|------|
| `js/core/editor.js` | Passage edit / add / delete |
| `js/core/parser.js` | `@` links, YouTube chips, read-aloud / DM-note |
| `js/core/media-bar.js` | Sticky YouTube ambience bar |
| `js/core/entity-ui.js` | Tooltips + modals |
| `js/core/entity-registry.js` | Catalogue → `ENTITIES` |
| `js/core/map-panel.js` | Map images, pins, drag positions |
| `js/core/catalogue/*` | Shared catalogue CRUD UI |
| `js/core/catalogue/images.js` | IndexedDB image blobs |
| `js/campaign-app.js` | Campaign screen controller |

## Tests
Run with Node when available:
- `test/validate-data.js`
- `test/validate-section-editor.js`
- `test/validate-entity-registry.js`
- `test/validate-catalogues.js`
- `test/validate-catalogue-images.js`
- `test/validate-layout.js`
- `test/validate-maps.js`
- `test/validate-maps-media.js`

Browser smoke: `test/entity-links-test.html`, `test/section-editor-test.html`
