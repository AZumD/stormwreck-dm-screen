# SOURCE-UI.js

## Purpose
Chapter / subchapter helpers for the Source Catalogue: normalize stored JSON, render collapsible wiki prose via `ContentParser.parseContent`, and drive the DM edit UI.

## File
`js/core/source-ui.js` → `window.SourceUi`

## API
| Method | Role |
|--------|------|
| `normalizeChapters(raw)` | Sanitize chapter tree |
| `renderChaptersWiki(chapters, { player })` | Collapsible `<details>` with scene markup; player mode uses `--reader` layout (first chapter open) |
| `renderChapterEditor(chapters)` | DM edit HTML |
| `bindChapterEditor(host)` | Wire add/remove chapter & subchapter |
| `readChaptersFromEditor(host)` | Collect form values on save |
| `playerSafeMarkup(raw)` | Strip `{{dm-note}}` for players |

## Player reading
Player Library opens sources in `#detail-dialog.dialog-source` — wider parchment surface, no nested chapter cards, normal whitespace (avoids the large gap from `pre-wrap`).

## Wiring
`CatalogueApp` field type `chapters` delegates here. Player companion loads this module for Library source detail.
