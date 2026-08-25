# MUSIC-MIXER-UI.js

## Purpose
Campaign right-rail **Music** tab: add tracks from the Music catalogue, play/pause, volume, remove, drag to reorder.

## File
`js/core/music-mixer-ui.js` → `window.MusicMixerUi`

## UI
- Starts with a **+** button; tracks stack above it
- Each row: drag handle, play/pause, title, volume slider, remove
- **+** opens a catalogue picker dialog (`#music-mixer-dialog`) — only entries with uploaded audio
- Drag the **⋮⋮** handle to change order (persisted via `CampaignMusicMixer`); volume/play stay undraggable

## Playback
One `<audio>` element per mixer slot. Source from `LocalApiClient.getMusicPlayback(catalogueMusicId)` (stream or signed URL). Loop/volume follow the stored slot.

## Wiring
Campaign pages load `campaign-music-mixer.js` then `music-mixer-ui.js`. `CampaignApp` bootstraps mixer state and calls `MusicMixerUi.init`. `MapPanel.setActiveTab("music")` re-renders the list.

## Related
`docs/README/CAMPAIGN-MUSIC-MIXER.md`, `docs/README/MAP-PANEL.md`
