# MUSIC-MIXER-UI.js

## Purpose
Campaign right-rail **Music** tab: add tracks from the Music catalogue, play/pause, volume, remove, drag to reorder.

## File
`js/core/music-mixer-ui.js` → `window.MusicMixerUi`

## UI
- Starts with tools (**Pause all**, **+**); tracks stack above the add control
- Each row: drag handle, play/pause, title, volume slider, loop toggle, remove
- Music tab button gets `.is-playing` while any mixer track is playing
- **+** opens a catalogue picker dialog (`#music-mixer-dialog`) — only entries with uploaded audio
- Drag the **⋮⋮** handle to change order (pointer-based; not HTML5 DnD) so the volume slider never starts a drag

## Playback
One `<audio>` element per mixer slot. Source from `LocalApiClient.getMusicPlayback(catalogueMusicId)` (stream or signed URL). Loop/volume follow the stored slot. Signed URLs refresh before expiry (`expiresIn` / `dataset.expiresAt`). Playing a mixer track pauses MediaBar YouTube (and vice versa via `pauseAll`).

## Wiring
Campaign pages load `campaign-music-mixer.js` then `music-mixer-ui.js`. `CampaignApp` bootstraps mixer state and calls `MusicMixerUi.init`. `MapPanel.setActiveTab("music")` re-renders the list.

## Related
`docs/README/CAMPAIGN-MUSIC-MIXER.md`, `docs/README/MAP-PANEL.md`
