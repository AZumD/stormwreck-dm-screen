# DM Library

Personal local DM screen — no server, no login.

## Quick start

1. Open **`index.html`**
2. Choose **Dragons of Stormwreck Isle**
3. Scroll the adventure — sidebar jumps to sections

## Inline editing

1. Click **Edit mode** in the toolbar
2. **Edit** any passage title/content, then **Save**
3. **Delete** removes a passage (booklet passages can be restored later)
4. **+ Add passage** under a section inserts a new one in that chapter
5. **Insert YouTube** adds `{{youtube:url|Label}}` music chips (plays in the bottom media bar)

Edits, custom passages, and removals persist in your browser (localStorage). **Reset to default** restores booklet text from `adventure.js` (custom passages have no reset).

### Maps & pins

1. Upload a map in the **Location catalogue** for that place
2. On the campaign page, the map panel uses the upload (placeholder SVG otherwise)
3. **Drag pins** to reposition them — positions save locally
4. **Zoom** with +/− / reset, or the mouse wheel; pan the map when zoomed

### Portraits

Upload a portrait/image in the **PC**, **NPC**, **Monster**, or **Item** catalogues. They show in catalogue lists and on the campaign screen (tooltips, modals, reference cards).

### Formatting cheat sheet

| Syntax | Result |
|--------|--------|
| `@npc:runara\|Elder Runara` | Linked NPC (hover + click modal) |
| `@monster:zombie` | Linked monster |
| `@location:dragons-rest` | Linked location |
| `{{youtube:url\|Cloister theme}}` | Music chip → bottom media bar |
| `<b>bold</b>` | **Bold** |
| `{{read-aloud}}…{{/read-aloud}}` | Read-aloud box |
| `{{dm-note}}…{{/dm-note}}` | DM note box |
| `<p>`, `<ul>`, `<li>`, `<h3>` | HTML structure |

Legacy `[[npc:id|Name]]` links still work.

## Catalogues

From the landing page, open any global catalogue. Entries auto-save to localStorage.

| Catalogue | Contents |
|-----------|----------|
| **PC** | Character sheet (abilities, combat, skills), equipment, active campaign, location, backstory & notes |
| **NPC** | Stats, personality, equipment, campaign placement, backstory & notes |
| **Race** | Size, speed, ASI, traits, languages, senses |
| **Class** | Hit die, proficiencies, features, spellcasting, subclasses |
| **Spells** | Level, school, casting details, components, effects |
| **Items** | Type, rarity, value, attunement, properties |
| **Monsters** | Full stat block fields, traits, actions, legendary actions |
| **Locations** | Map upload, description, NPCs/monsters/items of interest, featured campaigns |

**Stormwreck Isle seeds:** NPC, Monster, Item, and Location catalogues auto-import booklet entries on first open. Existing entries are kept; only missing IDs are added.

**Core rules seeds:** Race and Class catalogues auto-import 9 ancestries and 12 classes on first open (`js/catalogue-seeds/core-rules.js`). Spell catalogue imports a starter set of common spells (`js/catalogue-seeds/core-spells.js`).

Location maps are stored in your browser (max ~2 MB per image).

## Structure

```
index.html                              Landing page
campaigns/stormwreck-isle/index.html    Campaign DM screen
pc-katalog/ … class-katalog/ … location-katalog/   Global catalogues
js/core/entity-registry.js              Builds ENTITIES from catalogues on campaign page
js/core/catalogue/                        Shared catalogue engine
js/campaigns/stormwreck-isle/adventure.js   Default section text
js/campaigns/stormwreck-isle/maps.js        Map pins (entityId → catalogue linkId)
source/                                 Booklet PDF for reference
```

**Entity links:** `@npc:runara` and map pins use **link IDs** (e.g. `runara`, `dragons-rest`) that map to catalogue entries (`sw-runara`, etc.). Edit stats and details in the catalogues — the campaign page picks them up on load (refresh after editing).

## Booklet

PDF is in `source/`. Copy text from there into sections via Edit mode, or edit `adventure.js` directly for defaults.
