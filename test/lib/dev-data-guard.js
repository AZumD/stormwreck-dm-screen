/**
 * Snapshot imported Stormwreck development rows so live tests cannot silently mutate them.
 */
"use strict";

const IMPORTED_ALTHARIEL_ID = "pc-mswdvrcy-u6nnt";
const IMPORTED_CAMPAIGN_ID = "stormwreck-isle";

async function snapshotAlthariel(db) {
  const character = await db.query(
    `SELECT id, name, type, game_system_id, portrait_url, catalogue_pc_id, sheet
     FROM characters WHERE id = $1`,
    [IMPORTED_ALTHARIEL_ID]
  );
  const state = await db.query(
    `SELECT system_state, extras FROM character_state WHERE character_id = $1`,
    [IMPORTED_ALTHARIEL_ID]
  );
  const inventory = await db.query(
    `SELECT id, item_id, quantity, equipped, notes, custom_name
     FROM inventory_entries WHERE character_id = $1 ORDER BY id`,
    [IMPORTED_ALTHARIEL_ID]
  );
  const controllers = await db.query(
    `SELECT user_id FROM character_controllers WHERE character_id = $1 ORDER BY user_id::text`,
    [IMPORTED_ALTHARIEL_ID]
  );
  const participation = await db.query(
    `SELECT campaign_id, status FROM campaign_characters
     WHERE character_id = $1 ORDER BY campaign_id`,
    [IMPORTED_ALTHARIEL_ID]
  );
  return JSON.stringify({
    character: character.rows[0] || null,
    state: state.rows[0] || null,
    inventory: inventory.rows,
    controllers: controllers.rows,
    participation: participation.rows
  });
}

async function assertAltharielUnchanged(db, before, label) {
  const after = await snapshotAlthariel(db);
  if (before !== after) {
    const err = new Error(
      `${label}: imported Althariel (${IMPORTED_ALTHARIEL_ID}) changed during live tests`
    );
    err.before = before;
    err.after = after;
    throw err;
  }
}

module.exports = {
  IMPORTED_ALTHARIEL_ID,
  IMPORTED_CAMPAIGN_ID,
  snapshotAlthariel,
  assertAltharielUnchanged
};
