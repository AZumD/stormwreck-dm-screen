# VALIDATE-MUSIC-CATALOGUE

## Purpose
Validates the Music catalogue: type registration, local audio storage, MP3 upload/reject, metadata search, playback URL, replace cleanup, and delete.

## File
`test/validate-music-catalogue.js`

## Run
```bash
node test/validate-music-catalogue.js
```

Included in `npm test`.

## Coverage
1. Create music catalogue entry
2. Valid MP3 upload (tiny synthetic fixture)
3. Invalid file / MIME rejection
4. DM authorization wiring (player blocklist + DM-gated routes)
5. Search/filter metadata
6. Update metadata
7. Preview URL generation (+ HTTP stream)
8. Delete removes metadata and audio
9. Replacement cleans old object
10. Local filesystem fallback under `DM_DATA_ROOT`
11. Landing / page / config registration

## Related
`docs/README/MUSIC.md`
