# MEDIA-BAR.js

## Purpose
Play YouTube ambience/music from passage chips. Supports **several tracks at once** with a compact strip, mixer drawer, and a separate visible player dock.

## File
`js/core/media-bar.js` → `window.MediaBar`

## Passage syntax
```
{{youtube:VIDEO_ID_OR_URL|Button label}}
```

## Layout
- **Strip** (~50–70px): `Ambience · N active` + Mixer / Pause all / Stop all
- **Mixer** panel: per-track title, play/pause, volume, stop, status
- **Dock** (`#media-dock`): side-by-side/grid of visible players (sizes adapt for 1–4 tracks)
- Expanded map mode repositions the dock; players are **not** remounted on layout change

## YouTube constraints
- Do **not** hide players with `display:none`, 1×1 iframes, `opacity:0`, offscreen stacking, or covering controls
- Covered/stacked iframes get paused by YouTube — keep each embed visibly laid out
- Uses the **YouTube IFrame API** and re-calls `playVideo()` when YouTube pauses sibling embeds (only while `wantPlay` is true)
- Playlist `list=` is ignored on embeds

## Behaviour
- Each chip **adds** a track (same video id is not duplicated)
- Independent play/pause and volume per track
- **Pause all** keeps players mounted; **Stop all** destroys every layer
- `onLayoutChange()` resizes dock CSS only (map expand/collapse safe)

## API
`init()`, `play(idOrUrl, title)`, `stop()` (all), `stopTrack(key)`, `pauseTrack(key)`, `resumeTrack(key)`, `toggleTrack(key)`, `pauseAll()`, `setTrackVolume(key, 0–100)`, `getTracks()`, `resumeAll()`, `onLayoutChange()`, `extractYouTubeId(raw)`
