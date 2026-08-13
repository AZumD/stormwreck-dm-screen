# SCENE-META.js

## Purpose
Campaign-design metadata for scenes (same IDs as adventure sections): location, entity cast, and connections.
Separate from **CampaignState** (play status/notes) and **SectionEditor** (prose title/content).

## File
`js/core/scene-meta.js` → `window.SceneMeta`

## Storage
| Key | Contents |
|-----|----------|
| `{campaignId}-scene-meta` | `{ [sceneId]: { locationId, entities[], connections[], updatedAt } }` |
| `{campaignId}-scene-tray-collapsed` | `"1"` / `"0"` global tray open preference |

Local overrides merge over booklet defaults. Defaults are never mutated.

## Booklet defaults
Prefer nested `section.scene` on `ADVENTURE.sections`:

```js
{
  id: "drowned-sailors",
  title: "Drowned Sailors",
  content: "...",
  scene: {
    locationId: "dragons-rest",
    entities: [
      { id: "zombie", quantity: 2, note: "Both begin in the surf." },
      { id: "undead-fortitude" }
    ],
    connections: [
      { sceneId: "inhabitants", label: "Climb toward Dragon's Rest" }
    ]
  }
}
```

Legacy top-level `locationId` / `entities` / `connections` still read if `scene` is absent.

## Entity ref shape
```json
{ "id": "zombie", "quantity": 2, "note": "Both begin in the surf." }
```

- `id` — catalogue link id (EntityRegistry resolves type/name/stats)
- `quantity` — optional scene count
- `note` — optional scene-specific note
- Do **not** store `type`; infer via `EntityRegistry.resolve(id)`

## Connection shape
```json
{ "sceneId": "inhabitants", "label": "Climb toward Dragon's Rest" }
```

Stored on the source scene only (no redundant `from`). Destination is a stable section/scene id.

## locationId
First-class field for “where is this scene happening?” — independent of the entity cast list.
Used later by maps, timeline defaults, NPC memory, etc.

## API
| Method | Role |
|--------|------|
| `get(campaignId, sceneId, section?)` | Merged defaults + overrides |
| `patch` / `setEntities` / `setLocationId` | Write overrides |
| `addEntity` / `removeEntity` | Cast edits (never touches global catalogue) |
| `addConnection` / `removeConnection` | Graph edges |
| `isTrayCollapsed` / `setTrayCollapsed` | UI preference |

## Related
`js/core/scene-ui.js` — Play/Document “At this scene” + connections UI
