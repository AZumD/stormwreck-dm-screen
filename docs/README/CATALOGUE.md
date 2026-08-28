# CATALOGUE

## Purpose
Shared catalogue engine for PC / NPC / Race / Class / Skill / Feature / Spell / Item / Monster / Location / **Music** entries.

## Files
- `js/core/catalogue/types.js` — declarative type list (linkable types for `@` links)
- `js/core/catalogue/store.js` — file-backed CRUD (`/data/catalogues`, localStorage offline)
- `js/core/catalogue/images.js` — file-backed portraits/maps (`/data/assets`, IndexedDB legacy)
- `js/core/catalogue/configs.js` — field schemas
- `js/core/catalogue/app.js` — list + wiki view + form editor (map tokens compress to PNG with alpha)

## Browse vs edit
Selecting a list entry opens a **wiki-style read view** (title, summary, sections, portrait/map).
- **Edit** switches to the existing form (autosave unchanged)
- **Done** returns to the wiki view
- **New …** creates an entry and opens edit mode immediately

Empty fields are omitted from the wiki body so pages stay readable.

### Declarative browsing (`configs.js`)
Catalogue configs may declare:
- `facets` — sidebar filter selects (derived options + optional fixed `options`)
- `groupBy` / `groupOrder` / `groupLabels` — compact list headings (`""` → Uncategorized)
- `searchFields` — haystack for search (falls back to common fields)
- `listMeta` — sidebar meta line
- `showWhen: { field, equals | notEquals | in }` — hide fields/sections in form + wiki without discarding stored values

`CatalogueApp` reads these generically (no per-type filter hardcoding). Search and facets combine; filtering does not mutate stored data.

List fields with `refType` (e.g. `feature`, `skill`, `item`, `spell`) render as clickable entity links in the wiki view.
In edit mode they also get a **catalogue search picker**: type to search the related catalogue and add a linked `@type:id|Label` chip, or use **Add custom** for plain text. Unresolved / legacy plain strings stay readable (no broken links).

### PC / NPC gear & abilities
- **Equipment** — worn / ready-to-hand gear (item links)
- **Inventory** — carried / stored goods (item links)
- **Skills**, **Features**, and **Spells** are separate linked lists (not one combined textarea)
- Optional freeform note fields remain for non-catalogue text

Textarea wiki fields run through `ContentParser.markdownLite`, so `@feature:id|Label` and friends work in freeform prose.

## Skills & Features
| Type | Role |
|------|------|
| **Skill** | Ability checks, typical uses, source/page, tags |
| **Feature** | Reusable abilities (class / subclass / species / background / feat / **monster trait/action/…** / other) |

Classes and races store **references** (`featureRefs`, `skillRefs`, and `@feature:` / `@skill:` text) rather than duplicating full rules.

Monsters can store **catalogue links** (`skillRefs`, `traitRefs`, `actionRefs`, …) plus optional freeform notes for creature-specific attack lines. Shared rules live in Feature entries (e.g. Undead Fortitude, Slam).

## Entity modal navigation
`EntityUI` uses a single dialog with a small Back stack: click a link inside the modal → open that entity; Back returns; close clears history.
## Image fields
| Field | Catalogues | Notes |
|-------|------------|-------|
| `portrait` | PC, NPC, Item, Monster, Race, Class, Spell | Auto-resized; shown in campaign tooltips/modals / wiki hero |
| `mapImage` | Location | Auto-resized; drives campaign map panel |
| `audio` | Music | MP3 via `audio-storage` (see `docs/README/MUSIC.md`); preview only in catalogue |

Uploads go to **`/data/assets`** via the local server (same library as catalogue JSON). Entry fields store `/api/assets/…` URLs (images) or `audio.key` metadata (music). IndexedDB is only used offline / for Import browser data.

## Seeds
| File | Types |
|------|-------|
| `js/catalogue-seeds/stormwreck-isle.js` | npc, monster, item, location |
| `js/catalogue-seeds/core-rules.js` | race (species + subspecies), class (class + subclass) |
| `js/catalogue-seeds/core-spells.js` | spell |
| `js/catalogue-seeds/core-skills.js` | skill |
| `js/catalogue-seeds/core-features.js` | feature |

### Taxonomy notes
- **Items** group by controlled `category` (Weapon, Tool & Kit, …); `itemType` remains freeform subtype; `tags` hold campaign/quest/magic facets
- **Locations** use `locationType` + optional `parentLocationRef` (`@location:…`)
- **Race catalogue** stores species and subspecies flat under `data/catalogues/race/` with `@race:` links (`entryKind`)
- **Class catalogue** stores classes and subclasses flat under `data/catalogues/class/` with `@class:` links (`entryKind`)
- Never use `@species:` — subspecies still live in the race catalogue type

Source files up to 25 MB are accepted and lightly JPEG-compressed (portraits ≤1800px, maps ≤3200px). Legacy browser images migrate into `/data/assets` on catalogue/campaign open when the server is running.

### Reliability
- Image bytes are written to disk **before** the form re-renders (avoids wiping uploads)
- Blank image fields on text autosave **preserve** existing `/api/assets/…` URLs (only **Remove** deletes)
- Quota / size failures show an alert instead of failing silently
- Search no longer stringifies whole entries (including huge images)
- `mergeSeeds` adds missing ids and fills empty taxonomy/ref fields (`category`, `entryKind`, `subclassRefs`, `featureRefs`, `tags`, …) from seeds without overwriting filled user data
