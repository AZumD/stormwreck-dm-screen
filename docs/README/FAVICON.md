# FAVICON

## Purpose
Site icon for browser tabs and bookmarks.

## Files
| Path | Role |
|------|------|
| `favicon.png` | Site icon at repo root (~64×64 PNG; keep small for browsers) |
| `assets/favicon-source.png` | Full-resolution source artwork |
| `assets/favicon-32.png` / `favicon-48.png` | Optional smaller variants |
| `server/index.js` | Serves `/favicon.png`; aliases `/favicon.ico` → same file |

## HTML
User-facing pages include:

```html
<link rel="icon" href="/favicon.png?v=…" type="image/png">
```

Use a cache-busting `?v=` query when replacing the file.
## Related
`docs/README/VALIDATE-FAVICON.md`, `docs/README/HOME.md`
