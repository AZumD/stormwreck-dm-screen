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
- Passage editor **toolbar**: wrap selection as Read aloud / DM note / Collapse / Bold; insert NPC·Monster·Location·Item links; YouTube

Select text first, then click a wrap button so the selection stays inside the tags. Link buttons use the selection as the display name and prompt for the catalogue link id.

**Collapse tag:** `{{collapse:If the players lose}}…{{/collapse}}` — title stays visible; body expands on click.