# OVERVIEW

Personal local DM Library with **campaign content** (e.g. Dragons of Stormwreck Isle on D&D 5e) and custom sandbox campaigns.

## Surfaces
- Root gate (`index.html`) — DM login / Player login entry links (see `docs/README/HOME.md`); favicon at `/favicon.png`
- DM Library (`/dm/`) — home base: Continue, campaigns, Tools (Compendium, Schedule, Player App), utilities; see `docs/README/LIBRARY-HOME.md`
- Campaign screen (`campaigns/stormwreck-isle/`) — booklet Play / Document runtime (campaign content, not platform branding)
- Sandbox campaigns (`campaigns/sandbox/?id=`) — blank shells for user-created campaigns
- **Compendium** (`/dm/compendium/`) — unified catalogue shell for all types (`docs/README/COMPENDIUM.md`)
- Campaign maps — location catalogue images + UVTT; campaign picks which locations appear (see `docs/README/CAMPAIGN-LOCATIONS.md`)
- Campaign screen uses static panel textures under `/assets/campaign/` (nav, main, map rail)
- Player companion (`/player/`) — responsive home (mobile stacked / desktop grid); **DM Library** switcher when user is a campaign DM; Map tab is a PC-centered tactical aid (limited zoom, no free pan — see `PLAYER-MAP.md`); see `docs/README/PLAYER.md`, `PLAYER-SCHEDULING.md`, `PLATFORM-EVENTS.md`, `PLATFORM-BOARD.md`, `SCHEDULING.md`, `GAME-SYSTEMS.md`
- Terminal DM client (`tui/`) — Go + Bubble Tea **scene-first** tracker over the same HTTPS API (Home → Library/Campaigns → Scene|Notes|Party|Map|Music; see `tui/README.md`, `docs/CLIENT-ARCHITECTURE.md`)

## Persistence (authoritative)
**Windows:** double-click `start-dm-screen.bat` (or `npm start`) → `http://127.0.0.1:3000`. User data is stored under `/data` (JSON + asset files), not only in the browser.

**Optional Postgres (Phase 1–4B):** set `DATABASE_URL` (see `.env.example`). File API remains the live app path for scenes/party/clock; Postgres holds campaign characters, mutable state, inventory, items, users, sessions, and private player notes. Phase 3A adds email/password auth and membership gates (see `docs/README/AUTH.md`). Phase 3B adds the player companion API and `/player/` shell (see `docs/README/PLAYER.md`). Phase 4B hardens Railway hybrid deploy: `DM_DATA_ROOT` volume, graceful shutdown, `data:init`, production env checks (see `docs/README/DEPLOY.md`).

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
- **History** — structured timeline entries under Session → Log; Session Notes remain freeform
- **Chronicle** — authored Story So Far, session prose, and curated Key Events (`chronicle.json`) — separate from History
- **Party** — add/remove PCs and companion NPCs from catalogues (no hardcoded placeholders)
- **Music mixer** — map-rail Music tab; campaign-persisted catalogue tracks with play/volume/loop/reorder (`docs/README/MUSIC-MIXER-UI.md`)
- **Dual-store backup** — optional `npm run backup:dual` for Postgres + volume (`docs/README/BACKUP-DUAL-STORE.md`)

## Scene runtime
- Default **Run** workspace focuses one Play scene (content, notes, At this scene, connections)
- **Prep** workspace shows the continuous Document scroll (authoring)
- **Map** workspace promotes the existing MapPanel to a full canvas (Party \| Music remain on the utility rail in Run/Prep)
- **Session** workspace hosts Notes \| Log \| Chronicle \| Progress (tab state in `sessionTab`)
- Toolbar **Run | Prep | Map | Session**; Reference opens as an overlay without leaving the active workspace
- Toolbar search is a universal command palette (**Ctrl+K**): entities, scenes, workspaces, session/reference tabs, Party/Music/Current Scene
- **Escape** closes the topmost transient layer (entity modal → command palette → campaign time → Reference)
- Scene cast + connections editable in Prep; stored in `scene-meta.json`

## Campaign editing
- **Prep** enables edit mode (no Edit toggle on the Run toolbar); **drag** sidebar scenes to reorder or into groups
- **+ Add scene** / **New group** appear in Prep; Document view also has **Add passage** rows while editing
- **New group** — one-level sidebar folders (Prep)
- **Delete** removes a scene from the list (same for every scene); deleting a group only ungroups
- Booklet `adventure.js` is reference only — not merged as live seed content after migrate
- **YouTube** chips via `{{youtube:url|Label}}` layer in the sticky media bar (multi-track)
- Entity links (`@npc:…`, `@skill:…`, `@feature:…`, `@class:…`, `@race:…`, …) resolve through catalogues via `entity-registry.js`
- Toolbar **Search catalogues** dropdown opens any built entity modal

## Maps
- **Location catalogue** holds place metadata, raster `mapImage`, and optional **UVTT** (`mapCalibration`)
- Each campaign stores which locations are active (`locations.json`) — map picker lists only those
- Upload maps / UVTT in Location catalogue; add/remove locations in campaign **Locations** panel
- Static pin definitions remain in `js/campaigns/*/maps.js` keyed by `locationId`
- Drag pins to save custom positions in `map-state.json`
- **Grid token sizes** on calibrated maps follow D&D Size (Tiny/S/M = 1 cell, Large = 2×2, etc.); NPC race resolves via monster catalogue name match
- Mouse-wheel zoom / pan when zoomed (default cursor until dragging; measure shows a live tape line)
- **Expand** widens the map inside the campaign page; **Fullscreen** opens the map in a new tab (`docs/README/MAP-FULLSCREEN.md`)
- **+** under the map adds NPC / PC / monster **combat tokens** on calibrated maps (item / non-calibrated still use pins); NPC/PC **Map token** overrides race-bound monster art
- Party cards and PC/NPC map pins open the shared **combat sheet** (`CombatSheetModal`) — PCs via Postgres, NPCs via catalogue, monsters via map tokens only
- **Initiative** is temporary shared table state in `map-state.initiativeTracker` (not PC extras / NPC catalogue / token fields)
- Multi-client: campaign documents support `PATCH` deep-merge so concurrent DM clients do not full-document overwrite each other (see `docs/CLIENT-ARCHITECTURE.md`)

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
| `js/core/media-bar.js` | Compact multi-track YouTube strip + mixer + dock |
| `js/core/command-palette.js` | Universal search/command palette (Ctrl+K) |
| `js/core/reference-ui.js` | Reference quick-reference overlay (overview, pins, recents) |
| `js/core/layout-panels.js` | Nav/map collapse + map modes (sidebar / expanded / combat / workspace) |
| `js/core/entity-ui.js` | Tooltips + modals (map pins use compact tooltips) |
| `js/core/entity-registry.js` | Catalogue → `ENTITIES` (+ `register()` for new types) |
| `js/core/campaign-registry.js` | User campaigns on the landing page |
| `js/landing.js` | Create / list custom campaigns + import |
| `js/core/campaign-state.js` | Scene / NPC memory / timeline / party / clock persistence |
| `js/core/campaign-state-ui.js` | Scene chrome, memory modal, history panel |
| `js/core/day-time-ui.js` | Compact campaign-time trigger + popover (tenday / time / presets) |
| `js/core/chronicle-store.js` | Story So Far, session prose, Key Events |
| `js/core/chronicle-ui.js` | Chronicle panel + key-event dialog |
| `js/core/scene-meta.js` | Scene cast + connections (design data) |
| `js/core/scene-ui.js` | At this scene tray + connection UI (edit-mode Link scene) |
| `js/core/party.js` | Party roster UI from catalogue refs |
| `js/core/campaign-music-mixer.js` | Campaign music mixer document state |
| `js/core/music-mixer-ui.js` | Map-rail Music tab (play / volume / reorder) |
| `js/core/campaign-locations.js` | Which location catalogue entries belong to a campaign |
| `js/core/campaign-locations-ui.js` | Locations panel add/remove UI |
| `js/core/campaign-map-state.js` | Map rail persistence + partial `PATCH` to `map-state` |
| `js/core/map-panel.js` | Map rail tabs, pins, expand mode, Layers popover |
| `js/core/map-token-size.js` | D&D size → grid token footprint; NPC race → creature lookup |
| `js/core/map-spatial.js` | UVTT/calibrated measure, grid, tokens, import chrome |
| `js/core/combat-sheet-modal.js` | Live HP/AC/conditions; initiative → `initiativeTracker` |
| `docs/CLIENT-ARCHITECTURE.md` | Server-canonical multi-client contract (browser DM/player + native TUI) |
| `tui/` | Native Bubble Tea DM tracker (scene edit/switch/clock/adjust, `Ctrl+K` lookup); see `docs/README/TUI.md` |
| `server/lib/scene-mutate.js` | Narrow `PATCH …/scenes/:id` for content + live status |
| `js/core/catalogue/*` | Shared catalogue CRUD UI |
| `js/core/catalogue/images.js` | Asset upload / hydrate (file-backed; IndexedDB legacy) |
| `js/core/catalogue/music-ui.js` | Music upload dialog + single-track preview |
| `server/lib/audio-storage.js` + `music-catalogue.js` | Music MP3 storage abstraction + catalogue helpers |
| `js/campaign-app.js` | Campaign screen controller |
| `db/` + `server/lib/db.js` + `server/lib/characters.js` | Optional Postgres foundation + Phase 2 characters |
| `server/lib/auth.js` + `authorize.js` | Phase 3A sessions + membership/DM authorization |
| `server/lib/player.js` + `/player/` | Phase 3B player companion API + mobile shell |
| `scripts/data-init.mjs` + `docs/README/DEPLOY.md` | Phase 4B volume init + Railway hybrid runbook |

## Catalogues
- **Compendium** (`/dm/compendium/`) — unified catalogue shell for all types (`docs/README/COMPENDIUM.md`)
- Flat JSON per type under `data/catalogues/<type>/` (no category subfolders)
- Items use controlled `category` + freeform `itemType` / `tags`
- **Source** catalogue uses Kind: Adventures (DM-only for players), Rulebooks, Others
- Race catalogue holds species + subspecies (`@race:`); class catalogue holds class + subclass (`@class:`)
- Locations may nest via `parentLocationRef`; monsters carry `source` / `tags`
- **Music** catalogue (`music-katalog`) — DM-only track metadata; MP3s under `assets/audio/` or S3 (`docs/README/MUSIC.md`)
- Campaign **Music** tab mixes those tracks per campaign (`music-mixer.json`)

## Tests
```bash
npm test
```
Live Postgres suites use dedicated test ids and must leave imported Stormwreck character data unchanged. Also: `test/validate-*.js` Node validators (`validate-compendium`, `validate-dm-ui`, `validate-layout`, …); browser smoke HTML under `test/`.

