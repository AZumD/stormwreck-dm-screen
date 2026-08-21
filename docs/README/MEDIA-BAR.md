# MEDIA-BAR.js

## Purpose
Play YouTube ambience/music from passage chips. Supports **several tracks at once** in one compact sticky bar.

## File
`js/core/media-bar.js` → `window.MediaBar`

## Passage syntax
```
{{youtube:VIDEO_ID_OR_URL|Button label}}
```

## Behaviour
- Each chip **adds** a track (same video id is not duplicated)
- Compact pills list active tracks (open on YouTube / per-track ×)
- **Stop all** clears every layer
- Players sit **side-by-side** in a horizontally scrolling 200×200 dock (covered/stacked iframes get paused by YouTube)
- Uses the **YouTube IFrame API** and re-calls `playVideo()` when YouTube pauses sibling embeds, so layers keep playing together
- Playlist `list=` is ignored on embeds

## API
`init()`, `play(idOrUrl, title)`, `stop()` (all), `stopTrack(key)`, `getTracks()`, `resumeAll()`, `extractYouTubeId(raw)`
