# CAMPAIGN-MUSIC-MIXER.js

## Purpose
Persist the campaign map-rail **Music** mixer track list (order, volume, catalogue refs). Play state is runtime-only in `MusicMixerUi`.

## File
`js/core/campaign-music-mixer.js` → `window.CampaignMusicMixer`

## Storage
Campaign document kind `music-mixer` (`data/campaigns/<id>/music-mixer.json`), registered in `server/lib/ids.js` → `CAMPAIGN_DOC_KINDS`.

```json
{
  "tracks": [
    {
      "id": "mx-…",
      "catalogueMusicId": "music-…",
      "title": "Ocean Waves",
      "volume": 0.7,
      "loop": true,
      "order": 0
    }
  ]
}
```

Offline fallback: `localStorage` key `<campaignId>-music-mixer`.

## API
| Method | Role |
|--------|------|
| `bootstrap(campaignId)` | Load from API or localStorage |
| `sortedTracks(campaignId)` | Tracks by `order` |
| `addTrack` / `removeTrack` / `updateTrack` | Mutate + persist |
| `reorderTracks(campaignId, orderedIds)` | Drag-and-drop order |

## Related
`docs/README/MUSIC-MIXER-UI.md`, `docs/README/MUSIC.md`
