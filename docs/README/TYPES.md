# TYPES.js

## Purpose
Declarative list of catalogue entity types used by EntityRegistry, ContentParser, and docs/tests.

## File
`js/core/catalogue/types.js` → `window.CatalogueTypes`

## API
| Method | Role |
|--------|------|
| `all()` / `ids()` | Every catalogue type |
| `linkable()` / `linkableIds()` | Types allowed in `@type:id` / `[[type:id]]` |
| `linkAlternation()` | Regex alternation string |
| `typeMap()` | `{ type: type }` for registry |
| `get(id)` | Single type definition |

## Adding a future type
1. Append to `TYPES` in this file (`linkable: true` if adventure links should work)
2. Add schema in `configs.js`
3. Add converter via `EntityRegistry.register(type, fn)` or in `entity-registry.js`
4. Optional: seeds + `{type}-katalog/index.html` + landing link

Parser and campaign search pick up linkable types automatically — no hardcoded four-type regex.
