/**
 * Bidirectional sync between campaign characters (Postgres) and DM PC catalogue JSON.
 * Linked via characters.catalogue_pc_id (usually same as character id).
 */
"use strict";

const db = require("./db");
const catalogues = require("./catalogues");
const { assertSafeId } = require("./ids");
const { parseEntityRef } = require("./entity-ref");

function requireDb() {
  if (!db.isDbConfigured()) {
    const err = new Error("DATABASE_URL is not configured");
    err.status = 503;
    throw err;
  }
}

function generatePcId() {
  const id = `pc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return assertSafeId(id, "pc id");
}

function abilityScore(sheet, key) {
  const fromAbilities = sheet?.abilities && sheet.abilities[key];
  if (fromAbilities != null && Number.isFinite(Number(fromAbilities))) return Number(fromAbilities);
  if (sheet && sheet[key] != null && Number.isFinite(Number(sheet[key]))) return Number(sheet[key]);
  return null;
}

function inventoryRowToRef(row) {
  if (row.item_id) {
    const label = row.item_name || row.custom_name || row.item_id;
    return `@item:${row.item_id}|${label}`;
  }
  const custom = row.custom_item && typeof row.custom_item === "object" ? row.custom_item : null;
  if (custom?.sourceRef) return String(custom.sourceRef);
  if (row.custom_name) return String(row.custom_name);
  return null;
}

function bundleToPcEntry(characterRow, stateRow, inventoryRows) {
  const sheet =
    characterRow.sheet && typeof characterRow.sheet === "object" && !Array.isArray(characterRow.sheet)
      ? characterRow.sheet
      : {};
  const state = stateRow || {};
  const equipped = [];
  const loose = [];
  (inventoryRows || []).forEach((row) => {
    const ref = inventoryRowToRef(row);
    if (!ref) return;
    if (row.equipped) equipped.push(ref);
    else loose.push(ref);
  });

  const catalogueId = assertSafeId(
    characterRow.catalogue_pc_id || characterRow.id,
    "catalogue pc id"
  );

  const entry = {
    id: catalogueId,
    name: characterRow.name || "",
    portrait: characterRow.portrait_url || sheet.portrait || "",
    class: sheet.class != null ? String(sheet.class) : "",
    level: Number.isFinite(Number(characterRow.level)) ? Number(characterRow.level) : 1,
    race: sheet.race != null ? String(sheet.race) : "",
    background: sheet.background != null ? String(sheet.background) : "",
    alignment: sheet.alignment != null ? String(sheet.alignment) : "",
    playerName: sheet.playerName != null ? String(sheet.playerName) : "",
    activeCampaign: sheet.activeCampaign != null ? String(sheet.activeCampaign) : "",
    location: sheet.location != null ? String(sheet.location) : "",
    str: abilityScore(sheet, "str"),
    dex: abilityScore(sheet, "dex"),
    con: abilityScore(sheet, "con"),
    int: abilityScore(sheet, "int"),
    wis: abilityScore(sheet, "wis"),
    cha: abilityScore(sheet, "cha"),
    ac: sheet.ac ?? null,
    hpCurrent: state.hp_current ?? null,
    hpMax: state.hp_max ?? null,
    speed: sheet.speed != null ? String(sheet.speed) : "",
    initiative: sheet.initiative != null ? String(sheet.initiative) : "",
    proficiencyBonus: sheet.proficiencyBonus != null ? String(sheet.proficiencyBonus) : "",
    hitDice: sheet.hitDice != null ? String(sheet.hitDice) : "",
    savingThrows: sheet.savingThrows != null ? String(sheet.savingThrows) : "",
    skills: sheet.skills != null ? String(sheet.skills) : "",
    languages: sheet.languages != null ? String(sheet.languages) : "",
    equipment: equipped,
    inventory: loose,
    skillRefs: Array.isArray(sheet.skillRefs) ? sheet.skillRefs.map(String) : [],
    featureRefs: Array.isArray(sheet.featureRefs) ? sheet.featureRefs.map(String) : [],
    spellRefs: Array.isArray(sheet.spellRefs) ? sheet.spellRefs.map(String) : [],
    featuresSpells: sheet.featuresSpells != null ? String(sheet.featuresSpells) : "",
    backstory: sheet.backstory != null ? String(sheet.backstory) : "",
    notes: sheet.notes != null ? String(sheet.notes) : "",
    updatedAt: Date.now(),
    sync: {
      source: "campaign-character",
      characterId: characterRow.id,
      campaignId: characterRow.campaign_id,
      syncedAt: new Date().toISOString()
    }
  };

  if (sheet.currency && typeof sheet.currency === "object") {
    entry.currency = sheet.currency;
  }
  if (sheet.subclass != null && String(sheet.subclass)) {
    entry.subclass = String(sheet.subclass);
  }

  return entry;
}

async function loadCharacterBundleById(characterId) {
  requireDb();
  const safeId = assertSafeId(characterId, "character id");
  const charResult = await db.query(
    `SELECT id, campaign_id, name, type, level, portrait_url, sheet, catalogue_pc_id, created_at, updated_at
     FROM characters WHERE id = $1`,
    [safeId]
  );
  if (!charResult.rows.length) {
    const err = new Error("Character not found");
    err.status = 404;
    throw err;
  }
  const stateResult = await db.query("SELECT * FROM character_state WHERE character_id = $1", [
    safeId
  ]);
  const invResult = await db.query(
    `SELECT ie.id, ie.character_id, ie.item_id, ie.quantity, ie.equipped, ie.notes,
            ie.custom_name, ie.custom_item, ie.created_at, ie.updated_at,
            i.name AS item_name
     FROM inventory_entries ie
     LEFT JOIN items i ON i.id = ie.item_id
     WHERE ie.character_id = $1
     ORDER BY ie.equipped DESC, COALESCE(ie.custom_name, i.name, '') ASC`,
    [safeId]
  );
  return {
    character: charResult.rows[0],
    state: stateResult.rows[0] || null,
    inventory: invResult.rows
  };
}

async function findLinkedCharacters(cataloguePcId) {
  requireDb();
  const safeId = assertSafeId(cataloguePcId, "catalogue pc id");
  const result = await db.query(
    `SELECT id, campaign_id, catalogue_pc_id
     FROM characters
     WHERE catalogue_pc_id = $1 OR id = $1`,
    [safeId]
  );
  return result.rows;
}

async function resolveItemIds(itemIds) {
  const ids = [...new Set(itemIds.filter(Boolean))];
  if (!ids.length) return new Set();
  const { rows } = await db.query("SELECT id FROM items WHERE id = ANY($1::text[])", [ids]);
  return new Set(rows.map((r) => r.id));
}

async function replaceInventoryFromPc(characterId, raw) {
  const refs = []
    .concat(Array.isArray(raw.equipment) ? raw.equipment : [])
    .concat(Array.isArray(raw.inventory) ? raw.inventory : []);
  const parsedIds = refs
    .map((ref) => parseEntityRef(ref))
    .filter((p) => p?.type === "item" && p.id)
    .map((p) => p.id);
  const resolved = await resolveItemIds(parsedIds);

  await db.query("DELETE FROM inventory_entries WHERE character_id = $1", [characterId]);

  const pushRow = async (ref, equipped, index, bucket) => {
    const parsed = parseEntityRef(ref);
    const itemId =
      parsed?.type === "item" && parsed.id && resolved.has(parsed.id) ? parsed.id : null;
    const customName = parsed?.label || (itemId ? null : String(ref));
    await db.query(
      `INSERT INTO inventory_entries (
        character_id, item_id, quantity, equipped, notes, custom_name, custom_item, updated_at
      ) VALUES ($1, $2, 1, $3, '', $4, $5::jsonb, now())`,
      [
        characterId,
        itemId,
        equipped,
        customName,
        JSON.stringify({
          sourceRef: String(ref),
          slot: `${bucket}:${index}`,
          unresolved: !itemId
        })
      ]
    );
  };

  const equipment = Array.isArray(raw.equipment) ? raw.equipment : [];
  for (let i = 0; i < equipment.length; i++) {
    await pushRow(equipment[i], true, i, "equipment");
  }
  const inventory = Array.isArray(raw.inventory) ? raw.inventory : [];
  for (let i = 0; i < inventory.length; i++) {
    await pushRow(inventory[i], false, i, "inventory");
  }
}

function sheetFromPcEntry(raw, existingSheet) {
  const sheet =
    existingSheet && typeof existingSheet === "object" && !Array.isArray(existingSheet)
      ? { ...existingSheet }
      : {};
  sheet.class = raw.class != null ? String(raw.class) : sheet.class || "";
  if (raw.subclass != null) sheet.subclass = String(raw.subclass);
  sheet.race = raw.race != null ? String(raw.race) : sheet.race || "";
  sheet.background = raw.background != null ? String(raw.background) : sheet.background || "";
  sheet.alignment = raw.alignment != null ? String(raw.alignment) : sheet.alignment || "";
  sheet.playerName = raw.playerName != null ? String(raw.playerName) : sheet.playerName || "";
  sheet.activeCampaign =
    raw.activeCampaign != null ? String(raw.activeCampaign) : sheet.activeCampaign || "";
  sheet.location = raw.location != null ? String(raw.location) : sheet.location || "";
  sheet.abilities = {
    ...(sheet.abilities || {}),
    str: raw.str ?? sheet.abilities?.str ?? null,
    dex: raw.dex ?? sheet.abilities?.dex ?? null,
    con: raw.con ?? sheet.abilities?.con ?? null,
    int: raw.int ?? sheet.abilities?.int ?? null,
    wis: raw.wis ?? sheet.abilities?.wis ?? null,
    cha: raw.cha ?? sheet.abilities?.cha ?? null
  };
  if (raw.ac != null) sheet.ac = Number.isFinite(Number(raw.ac)) ? Number(raw.ac) : raw.ac;
  sheet.speed = raw.speed != null ? String(raw.speed) : sheet.speed || "";
  sheet.initiative = raw.initiative != null ? String(raw.initiative) : sheet.initiative || "";
  sheet.proficiencyBonus =
    raw.proficiencyBonus != null ? String(raw.proficiencyBonus) : sheet.proficiencyBonus || "";
  sheet.hitDice = raw.hitDice != null ? String(raw.hitDice) : sheet.hitDice || "";
  sheet.savingThrows = raw.savingThrows != null ? String(raw.savingThrows) : sheet.savingThrows || "";
  sheet.skills = raw.skills != null ? String(raw.skills) : sheet.skills || "";
  sheet.languages = raw.languages != null ? String(raw.languages) : sheet.languages || "";
  sheet.featuresSpells =
    raw.featuresSpells != null ? String(raw.featuresSpells) : sheet.featuresSpells || "";
  sheet.backstory = raw.backstory != null ? String(raw.backstory) : sheet.backstory || "";
  sheet.notes = raw.notes != null ? String(raw.notes) : sheet.notes || "";
  if (Array.isArray(raw.skillRefs)) sheet.skillRefs = raw.skillRefs.map(String);
  if (Array.isArray(raw.featureRefs)) sheet.featureRefs = raw.featureRefs.map(String);
  if (Array.isArray(raw.spellRefs)) sheet.spellRefs = raw.spellRefs.map(String);
  if (raw.currency && typeof raw.currency === "object") sheet.currency = raw.currency;
  sheet.updatedAt = Date.now();
  return sheet;
}

async function mirrorCharacterToCatalogue(characterId) {
  const bundle = await loadCharacterBundleById(characterId);
  const entry = bundleToPcEntry(bundle.character, bundle.state, bundle.inventory);
  const saved = await catalogues.upsert("pc", entry.id, entry);

  if (!bundle.character.catalogue_pc_id || bundle.character.catalogue_pc_id !== entry.id) {
    await db.query(`UPDATE characters SET catalogue_pc_id = $1, updated_at = now() WHERE id = $2`, [
      entry.id,
      bundle.character.id
    ]);
  }
  return saved;
}

async function applyCatalogueEntryToCharacter(campaignId, characterId, raw) {
  requireDb();
  const safeCampaign = assertSafeId(campaignId, "campaign id");
  const safeCharacter = assertSafeId(characterId, "character id");
  const existing = await db.query(
    `SELECT id, sheet, catalogue_pc_id FROM characters WHERE id = $1 AND campaign_id = $2`,
    [safeCharacter, safeCampaign]
  );
  if (!existing.rows.length) {
    const err = new Error("Character not found in campaign");
    err.status = 404;
    throw err;
  }

  const name = String(raw?.name || existing.rows[0].id).trim() || existing.rows[0].id;
  const level = Number.isFinite(Number(raw?.level)) ? Number(raw.level) : 1;
  const portraitUrl = raw?.portrait ? String(raw.portrait) : null;
  const sheet = sheetFromPcEntry(raw || {}, existing.rows[0].sheet);
  const cataloguePcId = assertSafeId(
    raw?.id || existing.rows[0].catalogue_pc_id || safeCharacter,
    "catalogue pc id"
  );

  await db.query(
    `UPDATE characters
     SET name = $1, level = $2, portrait_url = $3, sheet = $4::jsonb,
         catalogue_pc_id = $5, updated_at = now()
     WHERE id = $6 AND campaign_id = $7`,
    [name, level, portraitUrl, JSON.stringify(sheet), cataloguePcId, safeCharacter, safeCampaign]
  );

  const hpCurrent = Number.isFinite(Number(raw?.hpCurrent)) ? Number(raw.hpCurrent) : null;
  const hpMax = Number.isFinite(Number(raw?.hpMax)) ? Number(raw.hpMax) : null;
  await db.query(
    `INSERT INTO character_state (
      character_id, hp_current, hp_max, hp_temp, conditions, death_saves,
      spell_slots, class_resources, inspiration, extras, updated_at
    ) VALUES ($1, $2, $3, 0, '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, false, '{}'::jsonb, now())
    ON CONFLICT (character_id) DO UPDATE SET
      hp_current = EXCLUDED.hp_current,
      hp_max = EXCLUDED.hp_max,
      updated_at = now()`,
    [safeCharacter, hpCurrent, hpMax]
  );

  await replaceInventoryFromPc(safeCharacter, raw || {});
  return loadCharacterBundleById(safeCharacter);
}

/**
 * DM catalogue save for type=pc: push into linked campaign characters, then
 * rewrite catalogue from the primary linked character (or plain upsert if none).
 */
async function upsertPcFromDm(cataloguePcId, body) {
  requireDb();
  const safeId = assertSafeId(cataloguePcId, "catalogue pc id");
  const linked = await findLinkedCharacters(safeId);
  if (!linked.length) {
    return catalogues.upsert("pc", safeId, body || {});
  }

  for (const row of linked) {
    await applyCatalogueEntryToCharacter(row.campaign_id, row.id, {
      ...(body || {}),
      id: safeId
    });
  }
  return mirrorCharacterToCatalogue(linked[0].id);
}

async function mirrorCharacterToCatalogueSafe(characterId) {
  try {
    return await mirrorCharacterToCatalogue(characterId);
  } catch (err) {
    console.error("[pc-catalogue-mirror] failed for", characterId, err.message || err);
    return null;
  }
}

module.exports = {
  generatePcId,
  bundleToPcEntry,
  loadCharacterBundleById,
  findLinkedCharacters,
  mirrorCharacterToCatalogue,
  mirrorCharacterToCatalogueSafe,
  applyCatalogueEntryToCharacter,
  upsertPcFromDm
};
