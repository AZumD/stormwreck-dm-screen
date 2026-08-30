/**
 * Campaign-scoped characters, mutable state, and inventory (Postgres).
 * Requires DATABASE_URL. Routes should scope every query by campaign_id.
 */
"use strict";

const db = require("./db");
const { parseEntityRef } = require("./entity-ref");
const dnd5e = require("./dnd5e-character");
const gameSystems = require("./game-systems");

const SHEET_KNOWN = new Set([
  "id",
  "name",
  "sourceName",
  "portrait",
  "class",
  "level",
  "race",
  "background",
  "alignment",
  "playerName",
  "activeCampaign",
  "location",
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
  "ac",
  "hpCurrent",
  "hpMax",
  "speed",
  "initiative",
  "proficiencyBonus",
  "hitDice",
  "savingThrows",
  "skills",
  "languages",
  "equipment",
  "featuresSpells",
  "backstory",
  "notes",
  "updatedAt",
  "skillRefs",
  "featureRefs",
  "spellRefs",
  "inventory"
]);

function requirePool() {
  if (!db.isDbConfigured()) {
    const err = new Error("DATABASE_URL is not configured");
    err.status = 503;
    throw err;
  }
}

function buildSheetFromPc(raw) {
  const sourceName = raw.name != null ? String(raw.name) : "";
  const sheet = {
    sourceName,
    class: raw.class != null ? String(raw.class) : "",
    race: raw.race != null ? String(raw.race) : "",
    background: raw.background != null ? String(raw.background) : "",
    alignment: raw.alignment != null ? String(raw.alignment) : "",
    playerName: raw.playerName != null ? String(raw.playerName) : "",
    activeCampaign: raw.activeCampaign != null ? String(raw.activeCampaign) : "",
    location: raw.location != null ? String(raw.location) : "",
    abilities: {
      str: raw.str,
      dex: raw.dex,
      con: raw.con,
      int: raw.int,
      wis: raw.wis,
      cha: raw.cha
    },
    ac: raw.ac,
    speed: raw.speed != null ? String(raw.speed) : "",
    initiative: raw.initiative != null ? String(raw.initiative) : "",
    proficiencyBonus: raw.proficiencyBonus != null ? String(raw.proficiencyBonus) : "",
    hitDice: raw.hitDice != null ? String(raw.hitDice) : "",
    savingThrows: raw.savingThrows != null ? String(raw.savingThrows) : "",
    skills: raw.skills != null ? String(raw.skills) : "",
    languages: raw.languages != null ? String(raw.languages) : "",
    featuresSpells: raw.featuresSpells != null ? String(raw.featuresSpells) : "",
    backstory: raw.backstory != null ? String(raw.backstory) : "",
    notes: raw.notes != null ? String(raw.notes) : "",
    skillRefs: Array.isArray(raw.skillRefs) ? raw.skillRefs.map(String) : [],
    featureRefs: Array.isArray(raw.featureRefs) ? raw.featureRefs.map(String) : [],
    spellRefs: Array.isArray(raw.spellRefs) ? raw.spellRefs.map(String) : [],
    unresolvedEquipment: [],
    unresolvedInventory: []
  };
  const extras = {};
  Object.entries(raw || {}).forEach(([k, v]) => {
    if (!SHEET_KNOWN.has(k)) extras[k] = v;
  });
  if (Object.keys(extras).length) sheet.extras = extras;
  return sheet;
}

function mapInventoryRows(raw, resolvedItemIds) {
  const equipped = Array.isArray(raw.equipment) ? raw.equipment.map(String) : [];
  const loose = Array.isArray(raw.inventory) ? raw.inventory.map(String) : [];
  const rows = [];

  equipped.forEach((ref, index) => {
    const parsed = parseEntityRef(ref);
    const itemId =
      parsed?.type === "item" && parsed.id && resolvedItemIds.has(parsed.id) ? parsed.id : null;
    if (!itemId && parsed?.type === "item" && parsed.id) {
      /* preserve ref even when item catalogue row missing */
    }
    rows.push({
      slot: `equipment:${index}`,
      itemId,
      quantity: 1,
      equipped: true,
      notes: "",
      customName: parsed?.label || ref,
      customItem: itemId
        ? { sourceRef: ref }
        : { sourceRef: ref, unresolved: true, refType: parsed?.type, refId: parsed?.id }
    });
  });

  loose.forEach((ref, index) => {
    const parsed = parseEntityRef(ref);
    const itemId =
      parsed?.type === "item" && parsed.id && resolvedItemIds.has(parsed.id) ? parsed.id : null;
    rows.push({
      slot: `inventory:${index}`,
      itemId,
      quantity: 1,
      equipped: false,
      notes: "",
      customName: parsed?.label || ref,
      customItem: itemId
        ? { sourceRef: ref }
        : { sourceRef: ref, unresolved: true, refType: parsed?.type, refId: parsed?.id }
    });
  });

  return rows;
}

async function resolveItemIds(client, itemIds) {
  const ids = [...new Set(itemIds.filter(Boolean))];
  if (!ids.length) return new Set();
  const { rows } = await client.query("SELECT id FROM items WHERE id = ANY($1::text[])", [ids]);
  return new Set(rows.map((r) => r.id));
}

async function upsertCharacterFromPc(client, campaignId, raw) {
  const id = String(raw?.id || "").trim();
  if (!id) throw new Error("PC entry missing id");

  const sheet = buildSheetFromPc(raw);
  const level = Number.isFinite(Number(raw.level)) ? Number(raw.level) : 1;
  sheet.level = level;
  const name = String(raw.name || id).trim() || id;
  const portraitUrl = raw.portrait ? String(raw.portrait) : null;
  const gameSystemId = "dnd5e";

  await client.query(
    `INSERT INTO campaigns (id, name, description, game_system_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET game_system_id = COALESCE(campaigns.game_system_id, EXCLUDED.game_system_id)`,
    [campaignId, campaignId, "", gameSystemId]
  );

  await client.query(
    `INSERT INTO characters (
      id, name, type, game_system_id, portrait_url, sheet, catalogue_pc_id, updated_at
    ) VALUES ($1, $2, 'player', $3, $4, $5::jsonb, $6, now())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      game_system_id = EXCLUDED.game_system_id,
      portrait_url = EXCLUDED.portrait_url,
      sheet = EXCLUDED.sheet,
      catalogue_pc_id = EXCLUDED.catalogue_pc_id,
      updated_at = now()`,
    [id, name, gameSystemId, portraitUrl, JSON.stringify(sheet), id]
  );

  await client.query(
    `INSERT INTO campaign_characters (campaign_id, character_id, status)
     VALUES ($1, $2, 'active')
     ON CONFLICT (campaign_id, character_id) DO NOTHING`,
    [campaignId, id]
  );

  const hpCurrent = Number.isFinite(Number(raw.hpCurrent)) ? Number(raw.hpCurrent) : null;
  const hpMax = Number.isFinite(Number(raw.hpMax)) ? Number(raw.hpMax) : null;
  const systemState = dnd5e.normalizeSystemState({
    hp: { current: hpCurrent, max: hpMax, temp: 0 },
    conditions: [],
    deathSaves: {},
    spellSlots: {},
    classResources: {},
    inspiration: false
  });

  await client.query(
    `INSERT INTO character_state (character_id, system_state, extras, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, now())
     ON CONFLICT (character_id) DO UPDATE SET
      system_state = EXCLUDED.system_state,
      extras = EXCLUDED.extras,
      updated_at = now()`,
    [
      id,
      JSON.stringify(systemState),
      JSON.stringify({
        importSource: "catalogue-pc",
        cataloguePcId: id,
        preservedAt: new Date().toISOString()
      })
    ]
  );

  const refs = []
    .concat(Array.isArray(raw.equipment) ? raw.equipment : [])
    .concat(Array.isArray(raw.inventory) ? raw.inventory : []);
  const parsedIds = refs
    .map(parseEntityRef)
    .filter((p) => p?.type === "item" && p.id)
    .map((p) => p.id);
  const resolved = await resolveItemIds(client, parsedIds);
  const invRows = mapInventoryRows(raw, resolved);

  await client.query("DELETE FROM inventory_entries WHERE character_id = $1", [id]);

  for (const row of invRows) {
    await client.query(
      `INSERT INTO inventory_entries (
        character_id, item_id, quantity, equipped, notes, custom_name, custom_item, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, now())`,
      [
        id,
        row.itemId,
        row.quantity,
        row.equipped,
        row.notes,
        row.customName,
        JSON.stringify({ ...row.customItem, slot: row.slot })
      ]
    );
  }

  return { id, campaignId, inventoryCount: invRows.length, resolvedItems: invRows.filter((r) => r.itemId).length };
}

async function importCampaignPc(client, campaignId, pcId) {
  const fs = require("fs");
  const path = require("path");
  const { dataRoot } = require("./atomic-fs");
  const file = path.join(dataRoot(), "catalogues", "pc", `${pcId}.json`);
  if (!fs.existsSync(file)) {
    const err = new Error(`PC catalogue file not found: ${pcId}`);
    err.status = 404;
    throw err;
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return upsertCharacterFromPc(client, campaignId, raw);
}

async function importCampaignPartyPcs(campaignId) {
  requirePool();
  const fs = require("fs");
  const path = require("path");
  const { dataRoot, readJson } = require("./atomic-fs");

  const statePath = path.join(dataRoot(), "campaigns", campaignId, "campaign-state.json");
  const state = fs.existsSync(statePath)
    ? await readJson(statePath, { party: [] })
    : { party: [] };
  const pcIds = (state.party || [])
    .filter((m) => m && m.type === "pc" && m.id)
    .map((m) => String(m.id).trim());

  const pool = await db.getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO campaigns (id, name, description, game_system_id) VALUES ($1, $2, $3, 'dnd5e')
       ON CONFLICT (id) DO NOTHING`,
      [campaignId, campaignId, ""]
    );
    const results = [];
    for (const pcId of pcIds) {
      results.push(await importCampaignPc(client, campaignId, pcId));
    }
    await client.query("COMMIT");
    return { campaignId, imported: results };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function assertCharacterInCampaign(campaignId, characterId) {
  requirePool();
  const result = await db.query(
    `SELECT c.id, c.name, c.type, c.game_system_id, c.portrait_url, c.sheet,
            c.catalogue_pc_id, c.created_at, c.updated_at
     FROM characters c
     JOIN campaign_characters cc ON cc.character_id = c.id AND cc.campaign_id = $2
     WHERE c.id = $1`,
    [characterId, campaignId]
  );
  if (!result.rows.length) {
    const err = new Error("Character not found in campaign");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

async function listCharacters(campaignId) {
  requirePool();
  const result = await db.query(
    `SELECT c.id, c.name, c.type, c.game_system_id, c.portrait_url, c.catalogue_pc_id,
            c.created_at, c.updated_at, c.sheet,
            cs.system_state
     FROM characters c
     JOIN campaign_characters cc ON cc.character_id = c.id AND cc.campaign_id = $1
     LEFT JOIN character_state cs ON cs.character_id = c.id
     ORDER BY c.name ASC`,
    [campaignId]
  );
  return result.rows.map((row) => {
    const state = dnd5e.readSystemState(row);
    return {
      ...row,
      level: dnd5e.getCharacterLevel(row),
      hp_current: state.hp.current,
      hp_max: state.hp.max
    };
  });
}

async function getCharacter(campaignId, characterId) {
  const row = await assertCharacterInCampaign(campaignId, characterId);
  return row;
}

function formatCharacterStateDto(characterId, stateRow) {
  const dto = dnd5e.stateRowToApiDto(stateRow);
  return {
    character_id: characterId,
    ...dto,
    updated_at: stateRow?.updated_at || null
  };
}

async function getCharacterState(campaignId, characterId) {
  await assertCharacterInCampaign(campaignId, characterId);
  const result = await db.query(
    "SELECT * FROM character_state WHERE character_id = $1",
    [characterId]
  );
  return formatCharacterStateDto(characterId, result.rows[0] || null);
}

async function patchCharacterSheet(campaignId, characterId, patch) {
  const row = await assertCharacterInCampaign(campaignId, characterId);
  const p = patch && typeof patch === "object" ? patch : {};
  const sheet =
    row.sheet && typeof row.sheet === "object" && !Array.isArray(row.sheet) ? { ...row.sheet } : {};

  if (Object.prototype.hasOwnProperty.call(p, "ac")) {
    const n = Number(p.ac);
    sheet.ac = Number.isFinite(n) ? n : p.ac;
  }

  await db.query(`UPDATE characters SET sheet = $1::jsonb, updated_at = now() WHERE id = $2`, [
    JSON.stringify(sheet),
    characterId
  ]);
  return getCharacter(campaignId, characterId);
}

async function updateCharacterState(campaignId, characterId, patch) {
  await assertCharacterInCampaign(campaignId, characterId);
  const current = (await getCharacterState(campaignId, characterId)) || {};
  const p = patch || {};
  const allowed = new Set([
    "hp_current",
    "hp_max",
    "hp_temp",
    "conditions",
    "death_saves",
    "spell_slots",
    "class_resources",
    "inspiration",
    "extras"
  ]);
  const statePatch = {};
  Object.keys(p).forEach((k) => {
    if (allowed.has(k) && k !== "extras") statePatch[k] = p[k];
  });
  const nextState = dnd5e.applyStatePatch(current, statePatch, new Set(Object.keys(statePatch)));
  const extras = Object.prototype.hasOwnProperty.call(p, "extras") ? p.extras : current.extras ?? {};

  await db.query(
    `INSERT INTO character_state (character_id, system_state, extras, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, now())
     ON CONFLICT (character_id) DO UPDATE SET
      system_state = EXCLUDED.system_state,
      extras = EXCLUDED.extras,
      updated_at = now()`,
    [characterId, JSON.stringify(nextState), JSON.stringify(extras ?? {})]
  );
  return getCharacterState(campaignId, characterId);
}

async function attachCharacterToCampaign(campaignId, characterId) {
  requirePool();
  const camp = await db.query("SELECT id, game_system_id FROM campaigns WHERE id = $1", [campaignId]);
  if (!camp.rows.length) {
    const err = new Error("Campaign not found");
    err.status = 404;
    throw err;
  }
  const char = await db.query("SELECT id, game_system_id FROM characters WHERE id = $1", [characterId]);
  if (!char.rows.length) {
    const err = new Error("Character not found");
    err.status = 404;
    throw err;
  }
  gameSystems.assertCompatibleGameSystems(camp.rows[0].game_system_id, char.rows[0].game_system_id);
  await db.query(
    `INSERT INTO campaign_characters (campaign_id, character_id, status)
     VALUES ($1, $2, 'active')
     ON CONFLICT (campaign_id, character_id) DO NOTHING`,
    [campaignId, characterId]
  );
  return { campaignId, characterId };
}

async function detachCharacterFromCampaign(campaignId, characterId) {
  requirePool();
  const result = await db.query(
    `DELETE FROM campaign_characters
     WHERE campaign_id = $1 AND character_id = $2
     RETURNING character_id`,
    [campaignId, characterId]
  );
  if (!result.rows.length) {
    const err = new Error("Character not in campaign");
    err.status = 404;
    throw err;
  }
  return { campaignId, characterId };
}

async function isCharacterInCampaign(campaignId, characterId) {
  requirePool();
  const result = await db.query(
    `SELECT 1 FROM campaign_characters WHERE campaign_id = $1 AND character_id = $2 LIMIT 1`,
    [campaignId, characterId]
  );
  return result.rows.length > 0;
}

async function listInventory(campaignId, characterId) {
  await assertCharacterInCampaign(campaignId, characterId);
  const result = await db.query(
    `SELECT ie.id, ie.character_id, ie.item_id, ie.quantity, ie.equipped, ie.notes,
            ie.custom_name, ie.custom_item, ie.created_at, ie.updated_at,
            i.name AS item_name
     FROM inventory_entries ie
     LEFT JOIN items i ON i.id = ie.item_id
     WHERE ie.character_id = $1
     ORDER BY ie.equipped DESC, ie.custom_name ASC`,
    [characterId]
  );
  return result.rows;
}

module.exports = {
  buildSheetFromPc,
  mapInventoryRows,
  importCampaignPartyPcs,
  importCampaignPc,
  upsertCharacterFromPc,
  listCharacters,
  getCharacter,
  getCharacterState,
  formatCharacterStateDto,
  patchCharacterSheet,
  updateCharacterState,
  listInventory,
  attachCharacterToCampaign,
  detachCharacterFromCampaign,
  isCharacterInCampaign
};
