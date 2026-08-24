# HTTP-UTIL.js

## Purpose
Small helpers for the zero-dependency Node HTTP API (JSON body, responses, errors).

## File
`server/lib/http-util.js`

## Body limits
| Constant | Default | Use |
|----------|---------|-----|
| `DEFAULT_BODY_LIMIT` | 25MB | Normal JSON routes |
| `UVTT_BODY_LIMIT` | 64MB | `POST …/maps/import-uvtt` and `POST …/catalogue-assets/…/uvtt` (embedded base64 map images) |

`readJsonBody(req, { limit })` accepts an optional limit (a bare number is also accepted as shorthand). Oversized bodies reject with **413** and drain the socket so a JSON error can still be returned (avoids browser “Failed to fetch”).
