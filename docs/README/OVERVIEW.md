# OVERVIEW

Personal local DM Library for **Dragons of Stormwreck Isle** (and custom sandbox campaigns).

## Surfaces
- Landing page (`index.html`) — Stormwreck + **Create new campaign** + **Import browser data**
- Campaign screen (`campaigns/stormwreck-isle/`) — booklet Play / Document runtime
- Sandbox campaigns (`campaigns/sandbox/?id=`) — blank shells for user-created campaigns
- Catalogues — PC / NPC / Race / Class / Skill / Feature / Spell / Item / Monster / Location
- Player companion (`/player/`) — mobile-first My Characters / Party / Notes (Phase 3B)

## Persistence (authoritative)
**Windows:** double-click `start-dm-screen.bat` (or `npm start`) → `http://127.0.0.1:3000`. User data is stored under `/data` (JSON + asset files), not only in the browser.

**Optional Postgres (Phase 1–3B):** set `DATABASE_URL` (see `.env.example`). File API remains the live app path for scenes/party/clock; Postgres holds campaign characters, mutable state, inventory, items, users, sessions, and private player notes. Phase 3A adds email/password auth and membership gates (see `docs/README/AUTH.md`). Phase 3B adds the player companion API and `/player/` shell (see `docs/README/PLAYER.md`).

| Area | Path |
|------|------|
| Catalogues | `data/catalogues/<type>/<id>.json` |
| Campaign docs | `data/campaigns/<id>/*.json` |
| Campaign registry | `data/campaigns/index.json` |
| Images | `data/assets/portraits|maps/<type>/<id>.<ext>` |
| Postgres (optional) | `DATABASE_URL` → tables in `db/migrations/` |

Legacy browser `localStorage` / IndexedDB remain as a **fallback** when the API is offline, and as the source for **Import browser data**.

## Global wiki vs campaign play
- **Global catalogues** hold canonical rules text and personal wiki notes (Skills, Features, Classes, …)
- **Campaigns** reference those entries by stable id (`@skill:nature`, `@feature:wild-shape`) and store play state separately (scenes, NPC memory, timeline, party)
- **Scenes** (= adventure sections) can list relevant catalogue entities and connections; design data in SceneMeta, play status/notes in CampaignState

## Campaign play state
- **Scene state** — unseen / current / completed / skipped + per-scene notes (`campaign-state.json`)
- **Day / time** — tenday (1–10) + time of day in the sticky top chrome; persists in `CampaignState.clock`
- **NPC memory** — attitude, mood, last seen, notes, flags (separate from catalogue)
- **History** — structured timeline entries; Session Notes remain freeform
- **Chronicle** — authored Story So Far, session prose, and curated Key Events (`chronicle.json`) — separate from History
- **Party** — add/remove PCs and companion NPCs from catalogues (no hardcoded placeholders)

## Scene runtime
- Default **Play** view focuses one scene (content, notes, At this scene, connections)
- **Document** view keeps a continuous scroll of the ordered scene list
- Scene cast + connections editable in UI; stored in `scene-meta.json`

## Campaign editing
- **Edit mode** edits passage title/body; **drag** sidebar scenes to reorder or into groups
- **Add passage** / **New group** — free-form ordered scenes + one-level sidebar folders
- **Delete** removes a scene from the list (same for every scene); deleting a group only ungroups
- Booklet `adventure.js` is reference only — not merged as live seed content after migrate
- **YouTube** chips via `{{youtube:url|Label}}` layer in the sticky media bar (multi-track)
- Entity links (`@npc:…`, `@skill:…`, `@feature:…`, `@class:…`, `@race:…`, …) resolve through catalogues via `entity-registry.js`
- Toolbar **Search catalogues** dropdown opens any built entity modal

## Maps
- Upload images in the **Location catalogue** (`mapImage` → `/data/assets/maps/…`)
- Campaign map panel prefers catalogue uploads over placeholder SVGs
- Drag pins to save custom positions in `map-state.json`
- Mouse-wheel zoom / pan when zoomed (no on-map zoom chrome)
- **+** under the map adds NPC / monster / item / PC pins

## Portraits
PC, NPC, Monster, Item, Race, Class, and Spell catalogues support a **portrait** (or illustration) upload (files under `/data/assets/portraits`). Campaign tooltips, modals, and reference cards show them when present.

## Core scripts
| Script | Role |
|--------|------|
| `start-dm-screen.bat` | Windows double-click launcher (Node + browser) |
| `server/` | Local Node static + `/api` file persistence |
| `js/core/local-api-client.js` | Browser → `/api` |
| `js/core/browser-import.js` | Import legacy browser data |
| `js/core/catalogue/types.js` | Declarative catalogue type list |
| `js/core/editor.js` | Free-form ordered scenes, nav groups, edit-mode reorder |
| `js/core/parser.js` | `@` links (all linkable types), YouTube chips, read-aloud / DM-note |
| `js/core/media-bar.js` | Sticky multi-track YouTube ambience bar |
| `js/core/entity-ui.js` | Tooltips + modals (map pins use compact tooltips) |
| `js/core/entity-registry.js` | Catalogue → `ENTITIES` (+ `register()` for new types) |
| `js/core/campaign-registry.js` | User campaigns on the landing page |
| `js/landing.js` | Create / list custom campaigns + import |
| `js/core/campaign-state.js` | Scene / NPC memory / timeline / party / clock persistence |
| `js/core/campaign-state-ui.js` | Scene chrome, memory modal, history panel |
| `js/core/day-time-ui.js` | Tenday + time-of-day sliders in top chrome |
| `js/core/chronicle-store.js` | Story So Far, session prose, Key Events |
| `js/core/chronicle-ui.js` | Chronicle panel + key-event dialog |
| `js/core/scene-meta.js` | Scene cast + connections (design data) |
| `js/core/scene-ui.js` | At this scene tray + connection UI (edit-mode Link scene) |
| `js/core/party.js` | Party roster UI from catalogue refs |
| `js/core/map-panel.js` | Map images, pins, drag positions |
| `js/core/catalogue/*` | Shared catalogue CRUD UI |
| `js/core/catalogue/images.js` | Asset upload / hydrate (file-backed; IndexedDB legacy) |
| `js/campaign-app.js` | Campaign screen controller |
| `db/` + `server/lib/db.js` + `server/lib/characters.js` | Optional Postgres foundation + Phase 2 characters |
| `server/lib/auth.js` + `authorize.js` | Phase 3A sessions + membership/DM authorization |
| `server/lib/player.js` + `/player/` | Phase 3B player companion API + mobile shell |

## Catalogues
- Flat JSON per type under `data/catalogues/<type>/` (no category subfolders)
- Items use controlled `category` + freeform `itemType` / `tags`
- Race catalogue holds species + subspecies (`@race:`); class catalogue holds class + subclass (`@class:`)
- Locations may nest via `parentLocationRef`; monsters carry `source` / `tags`

## Tests
```bash
npm test
```
Live Postgres suites use dedicated test ids and must leave imported Stormwreck character data unchanged. Also: `test/validate-*.js` Node validators (`validate-catalogue-taxonomy`, `validate-catalogue-ref-picker`, `validate-write-queue`, `validate-static-guard`, …); browser smoke HTML under `test/`.

