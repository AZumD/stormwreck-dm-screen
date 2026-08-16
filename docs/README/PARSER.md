# PARSER.js

## Purpose
Turns adventure markup into HTML: entity links, read-aloud / DM notes, YouTube chips, light markdown.

## File
`js/core/parser.js` → `window.ContentParser`

## Supported markup
| Syntax | Result |
|--------|--------|
| `@type:id\|Name` | Entity link button for any **linkable** catalogue type |
| `[[type:id\|Name]]` | Legacy entity link (same types) |
| `{{youtube:url\|Label}}` | Media chip → MediaBar |
| `{{read-aloud}}…{{/read-aloud}}` | Read-aloud box |
| `{{dm-note}}…{{/dm-note}}` | DM note box |
| `{{collapse:Title}}…{{/collapse}}` | Collapsed block (also `{{collapse Title}}`). Nested collapses are supported via balanced open/close matching; nested `{{read-aloud}}`, `{{dm-note}}`, and links work inside bodies. |
| `**bold**` / `<b>` | Strong text |
| Line breaks | Preserved as `<br>` (no special markup needed) |

Linkable types come from `CatalogueTypes.linkAlternation()` (npc, monster, location, item, pc, race, class, spell, skill, feature, …).

Examples: `@skill:nature|Nature`, `@feature:wild-shape|Wild Shape`, `@class:druid|Druid`, `@race:elf|Elf`.

Whitespace that only exists between HTML tags (template indentation) is collapsed so booklet `<p>` / list markup stays tight.

## API
`parseContent`, `markdownLite`, `stripTags`, `escapeHtml`, `replaceYouTube`, `extractYouTubeId`, `preserveLineBreaks`, `linkAlternation`
