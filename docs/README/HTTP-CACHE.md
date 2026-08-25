# HTTP-CACHE

## Purpose
Stream files to HTTP clients with conditional caching (`ETag`, `Last-Modified`, `304`) without hashing or buffering whole files.

## File
`server/lib/http-cache.js`

## API
| Export | Role |
|--------|------|
| `weakEtagFromStat(stat)` | `W/"size-mtime"` from filesystem metadata |
| `notModified(req, etag, mtime)` | Honours `If-None-Match` / `If-Modified-Since` |
| `cacheControlForStatic(path)` | HTML + JS/CSS/JSON → `max-age=0, must-revalidate`; other static (images) → `max-age=86400` |
| `cacheControlForAssetUrl(url)` | `?v=` → immutable year; else short revalidate |
| `CACHE_CONTROL_IMMUTABLE` | Shared `public, max-age=31536000, immutable` (versioned assets + campaign-map UVTT extracts) |
| `sendFileStream(req, res, path, opts)` | Pipe `fs.createReadStream` with `Content-Length` |

## Related
`server/index.js`, `server/routes/api.js`, `docs/README/IMAGES.md`, `test/validate-http-cache.js`
