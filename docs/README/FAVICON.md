# FAVICON

## Purpose
Site icon for browser tabs and bookmarks.

## Files
| Path | Role |
|------|------|
| `favicon.png` | Source icon at repo root (PNG) |
| `server/index.js` | Serves `/favicon.png`; aliases `/favicon.ico` → same file |

## HTML
User-facing pages include:

```html
<link rel="icon" href="/favicon.png" type="image/png">
```

## Related
`docs/README/VALIDATE-FAVICON.md`, `docs/README/HOME.md`
