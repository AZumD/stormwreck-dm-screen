# DEV-DATA-GUARD.md

## Purpose
Shared helper for live Postgres tests: snapshot the imported Stormwreck Althariel row and fail if a suite mutates it.

## File
`test/lib/dev-data-guard.js`

## Snapshot shape (post platform refactor)
- **`characters`**: `id`, `name`, `type`, `game_system_id`, `portrait_url`, `catalogue_pc_id`, `sheet` (level lives in `sheet.level`, not a top-level column)
- **`character_state`**: `system_state`, `extras` (D&D play state is nested under `system_state.hp`, `system_state.conditions`, etc.)
- **`inventory_entries`**: full row list ordered by `id`
- **`character_controllers`**: `user_id` list
- **`campaign_characters`**: `campaign_id`, `status` participation rows

## Usage
```js
const guard = require("./lib/dev-data-guard");
const before = await guard.snapshotAlthariel(db);
// …isolated live tests…
await guard.assertAltharielUnchanged(db, before, "validate-player");
```

Live suites must use dedicated test campaign/character/user ids and delete them afterward. They must not `UPDATE` `pc-mswdvrcy-u6nnt` or attach leftover controllers to her.
