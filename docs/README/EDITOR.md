# EDITOR.js

## Purpose
Free-form campaign scene list: ordered passages with title/content, persisted under `/data` (localStorage offline).

## File
`js/core/editor.js` → global `window.SectionEditor`

## Storage
| Key / doc | Contents |
|-----------|----------|
| `dm-edit-mode` | `"1"` when Edit mode is on |
| `{campaignId}-section-structure` / `section-structure.json` | `{ scenes: [{ id, title, content }, …] }` |
| `{campaignId}-section-edits` | Legacy only — folded into `scenes` on migrate, then cleared |

Booklet `ADVENTURE.sections` is **reference only**. On first bootstrap with a legacy `{ deleted, custom }` structure, scenes are materialized once (booklet − deleted + customs + edits), then the campaign owns the list.

## API
| Method | Role |
|--------|------|
| `bootstrap(campaignId, baseSections?)` | Load + one-shot legacy migrate |
| `getSections(campaignId)` | Ordered scene list |
| `getSection` / `saveSection` | Read / update one scene |
| `addSection({ afterId?, title, content })` | Insert or append |
| `deleteSection(campaignId, id)` | Remove from list |
| `reorderScenes(campaignId, orderedIds)` | Persist drag order |
| `isEditMode` / `setEditMode` | Edit mode flag |

## UI (campaign-app)
In **Edit mode**:
- **Edit** / **Link scene** / **Delete** on each passage
- **+ Add passage** in sidebar and under passages
- **Drag** sidebar scenes to reorder (disabled outside edit mode)
- Passage editor toolbar: Read aloud / DM note / Collapse / Bold / entity links / YouTube

No custom vs booklet badges, Reset, or restore-deleted UI.
