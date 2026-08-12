# MEDIA-BAR.js

## Purpose
Play YouTube ambience/music from passage chips without showing a large video.

## File
`js/core/media-bar.js` → `window.MediaBar`

## Passage syntax
```
{{youtube:VIDEO_ID_OR_URL|Button label}}
```

Examples:
- `{{youtube:dQw4w9WgXcQ|Cloister theme}}`
- `{{youtube:https://www.youtube.com/watch?v=dQw4w9WgXcQ|Boss fight}}`

In Edit mode, use **Insert YouTube** to paste a URL.

## Behaviour
- Renders a play chip in the passage
- Click loads a hidden YouTube nocookie iframe in the sticky `#media-bar`
- Bar shows title, YouTube link, and **Stop**

## API
`init()`, `play(idOrUrl, title)`, `stop()`, `extractYouTubeId(raw)`
