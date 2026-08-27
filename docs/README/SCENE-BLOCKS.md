# SCENE-BLOCKS.js

## Purpose
Parse campaign section content markup into client-neutral blocks for the TUI (and any non-HTML consumer). Mirrors `js/core/parser.js` markers without emitting HTML.

## File
`server/lib/scene-blocks.js`

## Exports
| Export | Role |
|--------|------|
| `parseBlocks(content)` | Markup → nested `{ type, text?, title?, refs?, blocks? }` |
| `extractRefs(text)` | Unique `@type:id\|label` refs |
| `buildSceneList({ structure, campaignState, sceneMeta })` | List payload + `currentSceneId` |
| `buildSceneDetail({ scene, campaignState, sceneMeta })` | Detail with `blocks`, play `notes`, meta |
| `stripHtml(text)` | Light HTML → plain text |

## Block types
| Type | Source markup |
|------|----------------|
| `text` | Prose (YouTube chips stripped) |
| `read-aloud` | `{{read-aloud}}…{{/read-aloud}}` |
| `dm-note` | `{{dm-note}}…{{/dm-note}}` |
| `collapse` | `{{collapse:Title}}…{{/collapse}}` |

## API consumers
- `GET /api/campaigns/:id/scenes` — list
- `GET /api/campaigns/:id/scenes/:sceneId` — detail with blocks (DM-gated)

## Related
`docs/README/PARSER.md`, `docs/README/VALIDATE-SCENES-API.md`, `tui/internal/scene`
