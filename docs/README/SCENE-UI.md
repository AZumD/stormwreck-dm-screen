# SCENE-UI.js

## Purpose
Renders **At this scene** (location + cast chips) and **Connections** for a scene, plus pickers to edit SceneMeta.

## File
`js/core/scene-ui.js` → `window.SceneUI`

## Behavior
- Used by both **Play** (one scene) and **Document** (continuous scroll) views
- Location shown first from `SceneMeta.locationId` (set / change / clear)
- Cast chips grouped by resolved EntityRegistry type (NPCs, Monsters, Features, …)
- Quantity shows as `Zombie ×2`; scene notes on chip title / note span
- Chips open the normal entity modal via `.entity-link`
- Removing a scene ref never deletes the catalogue entry
- Connections jump via `api.jumpToSection` (does **not** auto-set Current)
- **Edit mode:** section header **Link scene** + Connections **+ Add connection** / remove; play mode only shows jump links
- Tray collapse is campaign-global (`SceneMeta.setTrayCollapsed`)

## Init
Called from `campaign-app.js` with `jumpToSection`, `getSections`, `getSectionTitle`, `getSectionBase`, `onSceneMetaChange`.
