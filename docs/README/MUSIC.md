# MUSIC (catalogue)

## Purpose
DM-only **Music** catalogue for long-form ambience / creature atmosphere / music tracks. Foundation for a future Pocket Bard multi-track mixer. This phase is upload → organize → browse → preview only (no mixer).

## Files
| Path | Role |
|------|------|
| `music-katalog/index.html` | Catalogue page |
| `js/core/catalogue/configs.js` → `music` | Field schema, facets, grouping by `kind` |
| `js/core/catalogue/music-ui.js` | Upload dialog + single preview player |
| `js/core/catalogue/types.js` | `music` type (`linkable: false`) |
| `server/lib/music-catalogue.js` | Metadata normalize, MP3 validate, upload/replace/delete |
| `server/lib/audio-storage.js` | `put` / `getStream` / `getPlaybackUrl` / `delete` |
| `server/routes/api.js` | Music audio PUT/GET/DELETE + stream |
| `test/validate-music-catalogue.js` | Validator |

## Entry shape (metadata JSON only)
Stored at `data/catalogues/music/<id>.json` (gitignored runtime files). Binary audio is **never** in JSON or Postgres.

| Field | Notes |
|-------|--------|
| `id`, `title`, `name` | `name` mirrors `title` for shared catalogue list/search |
| `kind` | `ambience` \| `creature` \| `music` |
| `category` | Optional freeform (e.g. `coastal`, `combat`) |
| `tags[]`, `notes` | Searchable |
| `defaultVolume` | 0–1 |
| `loopByDefault` | bool |
| `audio` | `{ key, originalFilename, mimeType, sizeBytes, durationSec?, storageBackend }` |
| `createdAt`, `updatedAt` | ms |

## Storage
| Mode | When | Where |
|------|------|--------|
| Local | default / no `AUDIO_S3_BUCKET` | `{DM_DATA_ROOT}/assets/audio/music/<id>/<uuid>.mp3` |
| S3-compatible | `AUDIO_S3_BUCKET` (+ keys/endpoint) set | Railway / S3 object; private |

Env vars: see `.env.example` (`AUDIO_S3_*`). Never commit credentials.

Playback:
- Local → authenticated `GET /api/catalogues/music/:id/audio/stream` (Range supported)
- S3 → short-lived signed URL from `GET /api/catalogues/music/:id/audio`

## API (DM-gated via `requireAnyDmIfAuthRequired`)
| Method | Path | Role |
|--------|------|------|
| PUT | `/api/catalogues/music` metadata via normal catalogue PUT | Upsert metadata |
| PUT | `/api/catalogues/music/:id/audio` | Raw MP3 body (`Content-Type: audio/mpeg`, `X-Original-Filename`, optional `X-Audio-Duration`) |
| GET | `/api/catalogues/music/:id/audio` | Playback hint (proxy or signed) |
| GET | `/api/catalogues/music/:id/audio/stream` | Byte stream (local / proxy) |
| DELETE | `/api/catalogues/music/:id` | Removes metadata **and** audio object |
| DELETE | `/api/catalogues/music/:id/audio` | Clears audio object, keeps entry |

## Security
- Not in player catalogue allowlist (`PLAYER_BLOCKED_CATALOGUE_TYPES` includes `music`)
- Safe storage keys (never original filenames as paths)
- MP3 sniff + MIME check; max ~50MB
- Upload `PUT` uses `Content-Type: audio/mpeg` (allowed by mutation CSRF checks; see AUTH.md)
- Entry `DELETE` sends `Content-Type: application/json` from the client; server also accepts DELETE with no Content-Type

## Out of scope (later Pocket Bard)
Multi-track mixer, scene presets, fades, player controls, SFX, YouTube migration.
