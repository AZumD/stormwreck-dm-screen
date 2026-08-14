# ENTITY-UI.js

## Purpose
Shared entity tooltips and the catalogue/campaign entity modal.

## File
`js/core/entity-ui.js` → `window.EntityUI`

## Tooltips
| Source | Content |
|--------|---------|
| Map pin with `entityId` | **Compact**: name, type, AC·HP — no summary |
| Catalogue / text entity hover | Full tooltip including summary when present |
| Party pin | Name, kind/class, HP·AC |
| Freeform pin | Label, pin type, optional pin summary |

Click still opens the full entity modal.

## Modal navigation
Single `<dialog>` — no nested dialogs.

| Action | Behavior |
|--------|----------|
| Open from campaign / wiki / search | Fresh stack |
| Click `.entity-link` while modal is open | Push current id, open target |
| **Back** (`#modal-back`) | Pop stack, re-open previous |
| Close (X / backdrop) | Clear stack |

Details HTML uses `ContentParser.markdownLite` (and `@` links in stats when present).

## Related
`EntityRegistry`, `ContentParser`, catalogue wiki `renderEntityRefHtml`
