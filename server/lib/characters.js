/**
 * Campaign-scoped characters, mutable state, and inventory (Postgres).
 * Requires DATABASE_URL. Routes should scope every query by campaign_id.
 */
"use strict";

const db = require("./db");
const { parseEntityRef } = require("./entity-ref");

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
  const name = String(raw.name || id).trim() || id;
  const level = Number.isFinite(Number(raw.level)) ? Number(raw.level) : 1;
  const portraitUrl = raw.portrait ? String(raw.portrait) : null;

  await client.query(
    `INSERT INTO characters (
      id, campaign_id, name, type, level, portrait_url, sheet, catalogue_pc_id, updated_at
    ) VALUES ($1, $2, $3, 'player', $4, $5, $6::jsonb, $7, now())
    ON CONFLICT (id) DO UPDATE SET
      campaign_id = EXCLUDED.campaign_id,
      name = EXCLUDED.name,
      level = EXCLUDED.level,
      portrait_url = EXCLUDED.portrait_url,
      sheet = EXCLUDED.sheet,
      catalogue_pc_id = EXCLUDED.catalogue_pc_id,
      updated_at = now()`,
    [id, campaignId, name, level, portraitUrl, JSON.stringify(sheet), id]
  );

  const hpCurrent = Number.isFinite(Number(raw.hpCurrent)) ? Number(raw.hpCurrent) : null;
  const hpMax = Number.isFinite(Number(raw.hpMax)) ? Number(raw.hpMax) : null;

  await client.query(
    `INSERT INTO character_state (
      character_id, hp_current, hp_max, hp_temp, conditions, death_saves,
      spell_slots, class_resources, inspiration, extras, updated_at
    ) VALUES ($1, $2, $3, 0, '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, false, $4::jsonb, now())
    ON CONFLICT (character_id) DO UPDATE SET
      hp_current = EXCLUDED.hp_current,
      hp_max = EXCLUDED.hp_max,
      extras = EXCLUDED.extras,
      updated_at = now()`,
    [
      id,
      hpCurrent,
      hpMax,
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
      `INSERT INTO campaigns (id, name, description) VALUES ($1, $2, $3)
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
    "SELECT id, campaign_id, name, type, level, portrait_url, sheet, catalogue_pc_id, created_at, updated_at FROM characters WHERE id = $1 AND campaign_id = $2",
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
    `SELECT c.id, c.campaign_id, c.name, c.type, c.level, c.portrait_url, c.catalogue_pc_id,
            c.created_at, c.updated_at,
            cs.hp_current, cs.hp_max
     FROM characters c
     LEFT JOIN character_state cs ON cs.character_id = c.id
     WHERE c.campaign_id = $1
     ORDER BY c.name ASC`,
    [campaignId]
  );
  return result.rows;
}

async function getCharacter(campaignId, characterId) {
  const row = await assertCharacterInCampaign(campaignId, characterId);
  return row;
}

async function getCharacterState(campaignId, characterId) {
  await assertCharacterInCampaign(campaignId, characterId);
  const result = await db.query(
    "SELECT * FROM character_state WHERE character_id = $1",
    [characterId]
  );
  return result.rows[0] || null;
}

async function updateCharacterState(campaignId, characterId, patch) {
  await assertCharacterInCampaign(campaignId, characterId);
  const current = (await getCharacterState(campaignId, characterId)) || {};
  const p = patch || {};
  const next = {
    hp_current: Object.prototype.hasOwnProperty.call(p, "hp_current") ? p.hp_current : current.hp_current,
    hp_max: Object.prototype.hasOwnProperty.call(p, "hp_max") ? p.hp_max : current.hp_max,
    hp_temp: Object.prototype.hasOwnProperty.call(p, "hp_temp") ? p.hp_temp : current.hp_temp ?? 0,
    conditions: Object.prototype.hasOwnProperty.call(p, "conditions") ? p.conditions : current.conditions ?? [],
    death_saves: Object.prototype.hasOwnProperty.call(p, "death_saves") ? p.death_saves : current.death_saves ?? {},
    spell_slots: Object.prototype.hasOwnProperty.call(p, "spell_slots") ? p.spell_slots : current.spell_slots ?? {},
    class_resources: Object.prototype.hasOwnProperty.call(p, "class_resources")
      ? p.class_resources
      : current.class_resources ?? {},
    inspiration: Object.prototype.hasOwnProperty.call(p, "inspiration") ? p.inspiration : current.inspiration ?? false,
    extras: Object.prototype.hasOwnProperty.call(p, "extras") ? p.extras : current.extras ?? {}
  };

  await db.query(
    `INSERT INTO character_state (
      character_id, hp_current, hp_max, hp_temp, conditions, death_saves,
      spell_slots, class_resources, inspiration, extras, updated_at
    ) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10::jsonb, now())
    ON CONFLICT (character_id) DO UPDATE SET
      hp_current = EXCLUDED.hp_current,
      hp_max = EXCLUDED.hp_max,
      hp_temp = EXCLUDED.hp_temp,
      conditions = EXCLUDED.conditions,
      death_saves = EXCLUDED.death_saves,
      spell_slots = EXCLUDED.spell_slots,
      class_resources = EXCLUDED.class_resources,
      inspiration = EXCLUDED.inspiration,
      extras = EXCLUDED.extras,
      updated_at = now()`,
    [
      characterId,
      next.hp_current ?? null,
      next.hp_max ?? null,
      next.hp_temp ?? 0,
      JSON.stringify(next.conditions ?? []),
      JSON.stringify(next.death_saves ?? {}),
      JSON.stringify(next.spell_slots ?? {}),
      JSON.stringify(next.class_resources ?? {}),
      Boolean(next.inspiration),
      JSON.stringify(next.extras ?? {})
    ]
  );
  return getCharacterState(campaignId, characterId);
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
  updateCharacterState,
  listInventory
};
