# SCENE-MUTATE.js

## Purpose
Server-side narrow scene mutations for DM clients (TUI and future browser). Content and live status stay in separate documents.

## File
`server/lib/scene-mutate.js`

## Endpoint
`PATCH /api/campaigns/:campaignId/scenes/:sceneId` (DM auth)

## Allowed body fields
| Field | Document | Notes |
|-------|----------|-------|
| `title`, `content`, `groupId` | `section-structure` | One scene object updated; full structure rewritten server-side from fresh read |
| `status`, `notes` | `campaign-state` | Object-map merge; marking `current` demotes other current → `completed` |

Unknown fields → 400. Missing scene → 404.

## Response
Same shape as GET scene detail (`buildSceneDetail`), including raw `content` for editors.

## Concurrency
Safer than client whole-document PUT of `section-structure`. Two DMs editing different scenes can still race on structure rewrite; campaign-state object keys merge more safely via deep-merge when using document PATCH elsewhere.

## Tests
`test/validate-scenes-api.js`
