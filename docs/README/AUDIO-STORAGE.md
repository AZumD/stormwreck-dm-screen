# AUDIO-STORAGE

## Purpose
Backend abstraction for Music catalogue MP3 objects: local disk under `DM_DATA_ROOT`, or S3-compatible bucket when configured.

## File
`server/lib/audio-storage.js`

## API
| Method | Role |
|--------|------|
| `put({ key, buffer, contentType })` | Store object |
| `getStream(key)` | Read bytes |
| `getPlaybackUrl(key, { ttlSec })` | Proxy hint (local) or signed GET (S3) |
| `delete(key)` | Remove object |
| `generateObjectKey(entryId, ext)` | Safe key `music/<id>/<uuid>.mp3` |

## Env
See `.env.example` / `docs/README/DEPLOY.md` (`AUDIO_S3_*`). Unset bucket → local `{DM_DATA_ROOT}/assets/audio/`.

## Related
`docs/README/MUSIC.md`, `server/lib/music-catalogue.js`
