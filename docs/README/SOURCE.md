# SOURCE.md

## Purpose
**Source Catalogue** — paste adventure / rulebook prose into the DM library. Entries use the same markup as campaign scenes (`**bold**`, `@type:id|Label`, `{{read-aloud}}`, `{{collapse:Title}}`, `{{dm-note}}`) and organize text into collapsible chapters and subchapters.

## Files
| Path | Role |
|------|------|
| `js/core/source-ui.js` | Normalize / render / edit chapters |
| `js/core/catalogue/configs.js` → `source` | Form schema (`chapters` field type) |
| `js/core/catalogue/types.js` | Type `source` (linkable) |
| `server/lib/ids.js` | `CATALOGUE_TYPES` includes `source` |
| `source-katalog/index.html` | DM catalogue page |
| `data/catalogues/source/` | Stored JSON entries |

## Entry shape
```json
{
  "id": "src-example",
  "name": "Adventure Title",
  "abbreviation": "AT",
  "publisher": "Publisher",
  "summary": "Short blurb",
  "chapters": [
    {
      "id": "ch-1",
      "title": "Chapter 1",
      "content": "{{read-aloud}}…{{/read-aloud}}",
      "subchapters": [
        { "id": "sub-1", "title": "Section", "content": "…" }
      ]
    }
  ],
  "tags": ["adventure"],
  "notes": ""
}
```

## Where to paste text (DM)
1. Open **DM Library → Source Catalogue** (`/source-katalog/`)
2. **New source** (or pick an existing entry → **Edit**)
3. Fill **Identity** (title, abbreviation…) as usual
4. Scroll to **Chapters & subchapters**
5. Paste into the large chapter textarea (or **+ Chapter** / **+ Subchapter** for more sections)
6. Use the markup hint under the box (`**bold**`, `@npc:…`, `{{read-aloud}}…`, etc.)
7. **Done** saves; wiki view shows collapsible chapters

New entries start with one empty “Chapter 1” so the paste field is visible immediately.
- Browseable under Library → **source**
- Item / monster catalogue browse removed from the player Library (inventory item detail still works)
- Player view strips `{{dm-note}}` blocks

## Related
`docs/README/PARSER.md`, `docs/README/CATALOGUE.md`, `docs/README/PLAYER.md`
