# PARSER.js

## Purpose
Turns adventure markup into HTML: entity links, read-aloud / DM notes, YouTube chips, light markdown.

## File
`js/core/parser.js` → `window.ContentParser`

## Supported markup
| Syntax | Result |
|--------|--------|
| `@npc:id\|Name` | Entity link button |
| `[[monster:id\|Name]]` | Legacy entity link |
| `{{youtube:url\|Label}}` | Media chip → MediaBar |
| `{{read-aloud}}…{{/read-aloud}}` | Read-aloud box |
| `{{dm-note}}…{{/dm-note}}` | DM note box |
| `**bold**` / `<b>` | Strong text |

## API
`parseContent`, `markdownLite`, `stripTags`, `escapeHtml`, `replaceYouTube`, `extractYouTubeId`
