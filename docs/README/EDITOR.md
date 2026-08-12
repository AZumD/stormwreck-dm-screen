# EDITOR.js

## Purpose
Inline adventure passage editing for campaign screens. Persists edits, custom passages, and soft-deletes in `localStorage`.

## File
`js/core/editor.js` → global `window.SectionEditor`

## Storage keys
| Key | Contents |
|-----|----------|
| `dm-edit-mode` | `"1"` when Edit mode is on |
| `{campaignId}-section-edits` | Title/content overrides for booklet passages |
| `{campaignId}-section-structure` | `{ deleted: string[], custom: Section[] }` |

## API
| Method | Role |
|--------|------|
| `getSections(campaignId, baseSections)` | Booklet sections − deleted + custom inserts |
| `getSection(campaignId, id, defaults)` | Resolved title/content for one passage |
| `saveSection` / `resetSection` | Edit booklet text (or update custom body) |
| `addSection({ chapter, afterId, title, content })` | Create a custom passage |
| `deleteSection(campaignId, id, baseSections)` | Soft-delete booklet / hard-delete custom |
| `restoreAllDeleted` / `getDeletedIds` | Restore removed booklet passages |
| `isCustomSection` / `isEditMode` / `setEditMode` | Helpers |

## Custom section shape
```js
{ id, chapter, title, content, afterId, createdAt }
```

## UI (campaign-app)
In **Edit mode**:
- **Edit** / **Delete** on each passage
- **+ Add passage** under each passage (and empty chapters)
- **Restore removed booklet passages** when any soft-deletes exist
