# OVERVIEW

Personal local DM Library for **Dragons of Stormwreck Isle**.

## Surfaces
- Landing page (`index.html`) — campaigns in the main column; catalogues in a sticky sidebar
- Campaign screen (`campaigns/stormwreck-isle/`) — **Play** (scene navigator) + **Document** (continuous reference) views, map rail, session tools
- Catalogues — PC / NPC / Race / Class / Skill / Feature / Spell / Item / Monster / Location (metadata in localStorage; images in IndexedDB). Clicking an entry opens a **wiki read view**; Edit mode is opt-in.

## Global wiki vs campaign play
- **Global catalogues** hold canonical rules text and personal wiki notes (Skills, Features, Classes, …)
- **Campaigns** reference those entries by stable id (`@skill:nature`, `@feature:wild-shape`) and store play state separately (scenes, NPC memory, timeline, party)
- **Scenes** (= adventure sections) can list relevant catalogue entities and connections; design data in SceneMeta, play status/notes in CampaignState

## Campaign play state
- **Scene state** — unseen / current / completed / skipped + per-scene notes (`{campaignId}-campaign-state`)
- **NPC memory** — attitude, mood, last seen, notes, flags (separate from catalogue)
- **History** — structured timeline entries; Session Notes remain freeform
- **Party** — add/remove PCs and companion NPCs from catalogues (no hardcoded placeholders)

## Scene runtime
- Default **Play** view focuses one scene (content, notes, At this scene, connections)
- **Document** view keeps the continuous chapter scroll for prep/reading
- Scene cast + connections editable in UI; stored in `{campaignId}-scene-meta`

## Campaign editing
- **Edit mode** edits passage title/body
- **Add passage** inserts custom sections under a chapter
- **Delete** removes custom passages permanently; booklet passages are soft-deleted and restorable
- **YouTube** chips via `{{youtube:url|Label}}` play in the sticky media bar
- Entity links (`@npc:…`, `@skill:…`, `@feature:…`, `@class:…`, `@race:…`, …) resolve through catalogues via `entity-registry.js`
- Toolbar **Search catalogues** dropdown opens any built entity modal

## Maps
- Upload images in the **Location catalogue** (`mapImage`)
- Campaign map panel prefers catalogue uploads over placeholder SVGs
- Drag pins to save custom positions in localStorage
- Mouse-wheel zoom / pan when zoomed (no on-map zoom chrome)
- **+** under the map adds NPC / monster / item / PC pins

## Portraits
PC, NPC, Monster, Item, Race, Class, and Spell catalogues support a **portrait** (or illustration) upload (IndexedDB; multi‑MB photos OK). Campaign tooltips, modals, and reference cards show them when present.

## Core scripts
| Script | Role |
|--------|------|
| `js/core/catalogue/types.js` | Declarative catalogue type list |
| `js/core/editor.js` | Passage edit / add / delete |
| `js/core/parser.js` | `@` links (all linkable types), YouTube chips, read-aloud / DM-note |
| `js/core/media-bar.js` | Sticky YouTube ambience bar |
| `js/core/entity-ui.js` | Tooltips + modals |
| `js/core/entity-registry.js` | Catalogue → `ENTITIES` (+ `register()` for new types) |
| `js/core/campaign-state.js` | Scene / NPC memory / timeline / party persistence |
| `js/core/campaign-state-ui.js` | Scene chrome, memory modal, history panel |
| `js/core/scene-meta.js` | Scene cast + connections (design data) |
| `js/core/scene-ui.js` | At this scene tray + connection UI |
| `js/core/party.js` | Party roster UI from catalogue refs |
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
- `test/validate-catalogue-wiki.js`
- `test/validate-campaign-state.js`
- `test/validate-party.js`
- `test/validate-landing.js`
- `test/validate-skills-features.js`
- `test/validate-scene-meta.js`
- `test/validate-scene-meta-runtime.js`
- `test/validate-toolbar-icons.js`
- `test/validate-layout.js`
- `test/validate-maps.js`
- `test/validate-maps-media.js`
- `test/validate-parser.js`

Browser smoke: `test/entity-links-test.html`, `test/section-editor-test.html`, `test/campaign-state-test.html`, `test/parser-test.html`
