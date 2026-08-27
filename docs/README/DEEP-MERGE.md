# DEEP-MERGE.js

## Purpose
Server-side recursive JSON merge used by `PATCH /api/campaigns/:id/documents/:kind`.

## File
`server/lib/deep-merge.js`

## Semantics
| Case | Behavior |
|------|----------|
| Nested plain objects | Merge recursively |
| Arrays | Replace (not concatenate) |
| Primitives | Replace |
| `null` in patch | Delete that key (RFC 7396-style) |
| `__proto__` / `prototype` / `constructor` | Ignored (no prototype pollution) |

## Related
`server/lib/campaigns.js` → `patchDocument`, `docs/CLIENT-ARCHITECTURE.md`
