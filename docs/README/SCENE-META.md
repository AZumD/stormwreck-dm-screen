# SCENE-META.js

## Purpose
Campaign-design metadata for scenes (same IDs as adventure sections): location, entity cast, and connections.
Separate from **CampaignState** (play status/notes) and **SectionEditor** (prose title/content).

## File
`js/core/scene-meta.js` → `window.SceneMeta`

## Storage
| Key | Contents |
|-----|----------|
| `{campaignId}-scene-meta` | `{ [sceneId]: partial overrides + updatedAt }` |
| `{campaignId}-scene-tray-collapsed` | `"1"` / `"0"` global tray open preference |

Overrides are **partial**. Only keys that were deliberately written are stored.
Missing keys fall through to booklet defaults. A present empty value (`""`, `[]`) intentionally clears that default.

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

Do **not** store `type`; infer via `EntityRegistry.resolve(id)`.

## Connection shape
```json
{ "sceneId": "inhabitants", "label": "Climb toward Dragon's Rest" }
```

No redundant `from`.

## locationId
First-class field for “where is this scene happening?”
`SceneMeta.getLocationId(campaignId, sceneId, section?)` exposes it without callers digging into storage.

Campaign location defaults (history / interactions) prefer this over the active map via `CampaignStateUI.inferLocationId`.

## API
| Method | Role |
|--------|------|
| `get` | Merged defaults + overrides |
| `getLocationId` | Effective `locationId` only |
| `patch` | Write only keys present on the partial |
| `setEntities` / `setLocationId` / `setConnections` | Single-dimension overrides |
| `addEntity` / `removeEntity` | Cast edits (never touches global catalogue) |
| `addConnection` / `removeConnection` | Graph edges |

Mutating one dimension must not erase effective values of the others.

## Related
`js/core/scene-ui.js` — Play/Document “At this scene” + connections UI  
`js/core/campaign-state-ui.js` — `inferLocationId` (scene → map → empty)
