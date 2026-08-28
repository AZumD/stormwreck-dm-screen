# EDITOR.js

## Purpose
Free-form campaign scene list: ordered passages with title/content, persisted under `/data` (localStorage offline). Optional one-level **nav groups** for the sidebar (folders of scenes).

## File
`js/core/editor.js` → global `window.SectionEditor`

## Storage
| Key / doc | Contents |
|-----------|----------|
| `dm-edit-mode` | `"1"` when Edit mode is on |
| `{campaignId}-section-structure` / `section-structure.json` | `{ groups, scenes }` |
| `{campaignId}-section-edits` | Legacy only — folded into `scenes` on migrate, then cleared |

```json
{
  "groups": [{ "id": "grp-tarak", "title": "Tarak" }],
  "scenes": [
    { "id": "welcome", "title": "…", "content": "…" },
    { "id": "scene-…", "title": "…", "content": "…", "groupId": "grp-tarak" }
  ]
}
```

- `groupId` is optional; omit / `null` = root (ungrouped)
- Unknown `groupId` values are stripped on save/load
- Play / Document still use the flat ordered `scenes[]`; groups are sidebar chrome only

Booklet `ADVENTURE.sections` is **reference only**. On first bootstrap with a legacy `{ deleted, custom }` structure, scenes are materialized once (booklet − deleted + customs + edits), then the campaign owns the list.

## API
| Method | Role |
|--------|------|
| `bootstrap(campaignId, baseSections?)` | Load + one-shot legacy migrate |
| `getSections(campaignId)` | Ordered scene list (includes `groupId`) |
| `getGroups(campaignId)` | Ordered nav groups |
| `getSection` / `saveSection` | Read / update one scene (preserves `groupId`) |
| `addSection({ afterId?, groupId?, title, content })` | Insert or append (inherits neighbor group when afterId set) |
| `deleteSection(campaignId, id)` | Remove from list |
| `reorderScenes(campaignId, orderedIds)` | Persist flat drag order |
| `moveScene(campaignId, id, { beforeId?, groupId? })` | Reorder + assign/clear group |
| `setSceneGroup(campaignId, id, groupId\|null)` | Assign group without reordering |
| `addGroup` / `renameGroup` / `deleteGroup` | Group CRUD (`deleteGroup` ungroups scenes) |
| `reorderGroups(campaignId, orderedIds)` | Reorder `groups[]` (and group blocks in `scenes[]`) |
| `isEditMode` / `setEditMode` | Edit mode flag |

## UI (campaign-app)
- Sidebar **+ Add scene** is always visible (not gated on Edit mode); clicking it enables Edit mode, prompts for a title, appends via `addSection`, and opens the passage editor
- In **Edit mode**:
  - **Edit** / **Link scene** / **Delete** on each passage
  - **+ New group** in sidebar (plus drag reorder/regroup)
  - **Drag** scenes onto groups / other scenes to reorder and regroup
  - **Drag** group headers to reorder groups
  - Rename / delete group from the group summary (delete keeps scenes)
  - Collapse open/closed state: `{campaignId}-nav-group-collapsed`
  - Group **drag handle** (grip on the left of the header) reorders groups; drop onto another group or the bottom add rows
  - Passage editor toolbar: Read aloud / DM note / Collapse / Bold / entity links / YouTube
  - Document-view **+ Add passage** rows between scenes (same `addPassage` path)

No custom vs booklet badges, Reset, or restore-deleted UI.
