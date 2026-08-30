/**
 * Phase 3B player companion API — membership + controller scoped DTOs.
 * Never return DM-only campaign docs, NPC data, or another player's private fields.
 */
"use strict";

const db = require("./db");
const catalogues = require("./catalogues");
const assets = require("./assets");
const authorize = require("./authorize");
const characters = require("./characters");
const pcCatalogueMirror = require("./pc-catalogue-mirror");
const dnd5e = require("./dnd5e-character");
const gameSystems = require("./game-systems");
const { parseEntityRef } = require("./entity-ref");
const { assertSafeId, assertCatalogueType } = require("./ids");

const PLAYER_LIBRARY_BROWSE_TYPES = new Set([
  "skill",
  "feature",
  "spell",
  "race",
  "class",
  "source"
]);

/** Detail access (browse + inventory item open). Monster intentionally blocked. */
const PLAYER_CATALOGUE_TYPES = new Set([...PLAYER_LIBRARY_BROWSE_TYPES, "item"]);

const PLAYER_BLOCKED_CATALOGUE_TYPES = new Set(["npc", "pc", "music", "monster", "location"]);

/** Source kinds hidden from the player companion (spoilers). */
const PLAYER_HIDDEN_SOURCE_CATEGORIES = new Set(["adventures", "adventure"]);

function normalizeSourceCategory(entry) {
  const raw = String(entry?.category || "").trim();
  if (!raw) return "Others";
  const key = raw.toLowerCase();
  if (key === "adventure" || key === "adventures") return "Adventures";
  if (key === "rulebook" || key === "rulebooks") return "Rulebooks";
  if (key === "other" || key === "others") return "Others";
  return "Others";
}

function isPlayerVisibleSource(entry) {
  if (!entry || typeof entry !== "object") return false;
  const kind = normalizeSourceCategory(entry).toLowerCase();
  return !PLAYER_HIDDEN_SOURCE_CATEGORIES.has(kind);
}

const LIBRARY_ATTACH_ACTIONS = new Set([
  "inventory",
  "skill",
  "feature",
  "spell",
  "race",
  "class"
]);

/** Mutable play-state fields players may patch on characters they control. */
const PLAYER_STATE_WHITELIST = new Set([
  "hp_current",
  "hp_max",
  "hp_temp",
  "conditions",
  "class_resources",
  "spell_slots",
  "inspiration",
  "death_saves"
]);

/** Structural sheet / identity fields players may patch (trusted). */
const PLAYER_SHEET_WHITELIST = new Set([
  "name",
  "level",
  "race",
  "class",
  "subclass",
  "background",
  "alignment",
  "abilities",
  "ac",
  "speed",
  "initiative",
  "proficiencyBonus",
  "hitDice",
  "savingThrows",
  "languages",
  "skills",
  "skillRefs",
  "featureRefs",
  "spellRefs",
  "currency"
]);

const CURRENCY_KEYS = ["cp", "sp", "ep", "gp", "pp"];

function normalizeCurrency(raw) {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    const err = new Error("currency must be an object");
    err.status = 400;
    throw err;
  }
  const out = {};
  CURRENCY_KEYS.forEach((k) => {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) return;
    const n = Number(raw[k]);
    if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
      const err = new Error(`currency.${k} must be a non-negative integer`);
      err.status = 400;
      throw err;
    }
    out[k] = n;
  });
  return out;
}

function normalizeRefList(raw, fieldName) {
  if (!Array.isArray(raw)) {
    const err = new Error(`${fieldName} must be an array`);
    err.status = 400;
    throw err;
  }
  return raw.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function normalizeAbilities(raw) {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    const err = new Error("abilities must be an object");
    err.status = 400;
    throw err;
  }
  const out = {};
  ["str", "dex", "con", "int", "wis", "cha"].forEach((k) => {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) return;
    const n = Number(raw[k]);
    out[k] = Number.isFinite(n) ? n : raw[k];
  });
  return out;
}

function requireDb() {
  if (!db.isDbConfigured()) {
    const err = new Error("DATABASE_URL is not configured");
    err.status = 503;
    throw err;
  }
}

function abilityModifier(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  return Math.floor((n - 10) / 2);
}

function parseRefList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((raw) => {
      const parsed = parseEntityRef(raw);
      if (!parsed) return null;
      return {
        raw: parsed.raw,
        type: parsed.type,
        id: parsed.id,
        label: parsed.label
      };
    })
    .filter(Boolean);
}

function collectAuthorizedCatalogueKeys(sheet, inventoryRows) {
  const keys = new Set();
  const add = (type, id) => {
    if (type && id && PLAYER_CATALOGUE_TYPES.has(type)) keys.add(`${type}:${id}`);
  };

  const sheetObj = sheet && typeof sheet === "object" ? sheet : {};
  ["skillRefs", "featureRefs", "spellRefs"].forEach((field) => {
    parseRefList(sheetObj[field]).forEach((r) => add(r.type, r.id));
  });

  const race = sheetObj.race != null ? String(sheetObj.race).trim() : "";
  const klass = sheetObj.class != null ? String(sheetObj.class).trim() : "";
  /* Race/class may be plain labels; only resolve if stored as @refs */
  parseRefList(race ? [race] : []).forEach((r) => add(r.type, r.id));
  parseRefList(klass ? [klass] : []).forEach((r) => add(r.type, r.id));

  (inventoryRows || []).forEach((row) => {
    if (row.item_id) add("item", row.item_id);
  });

  return keys;
}

function toMechanicalDto(characterRow, stateRow, inventoryRows) {
  const sheet = characterRow.sheet && typeof characterRow.sheet === "object" ? characterRow.sheet : {};
  const abilitiesRaw = sheet.abilities || {
    str: sheet.str,
    dex: sheet.dex,
    con: sheet.con,
    int: sheet.int,
    wis: sheet.wis,
    cha: sheet.cha
  };
  const abilities = {};
  ["str", "dex", "con", "int", "wis", "cha"].forEach((k) => {
    const score = abilitiesRaw[k];
    abilities[k] = {
      score: Number.isFinite(Number(score)) ? Number(score) : score ?? null,
      modifier: abilityModifier(score)
    };
  });

  const state = stateRow || {};
  const playerState = dnd5e.systemStateToPlayerDto(dnd5e.readSystemState(state));
  return {
    id: characterRow.id,
    gameSystemId: characterRow.game_system_id || "dnd5e",
    name: characterRow.name,
    type: characterRow.type,
    level: dnd5e.getCharacterLevel(characterRow),
    portraitUrl: characterRow.portrait_url || null,
    race: sheet.race != null ? String(sheet.race) : "",
    class: sheet.class != null ? String(sheet.class) : "",
    subclass: sheet.subclass != null ? String(sheet.subclass) : "",
    background: sheet.background != null ? String(sheet.background) : "",
    alignment: sheet.alignment != null ? String(sheet.alignment) : "",
    abilities,
    ac: sheet.ac ?? null,
    speed: sheet.speed != null ? String(sheet.speed) : "",
    proficiencyBonus: sheet.proficiencyBonus != null ? String(sheet.proficiencyBonus) : "",
    hitDice: sheet.hitDice != null ? String(sheet.hitDice) : "",
    savingThrows: sheet.savingThrows != null ? String(sheet.savingThrows) : "",
    languages: sheet.languages != null ? String(sheet.languages) : "",
    skillsText: sheet.skills != null ? String(sheet.skills) : "",
    currency:
      sheet.currency && typeof sheet.currency === "object" && !Array.isArray(sheet.currency)
        ? sheet.currency
        : null,
    skillRefs: parseRefList(sheet.skillRefs),
    featureRefs: parseRefList(sheet.featureRefs),
    spellRefs: parseRefList(sheet.spellRefs),
    state: playerState,
    inventory: (inventoryRows || []).map((row) => ({
      id: row.id,
      itemId: row.item_id || null,
      itemName: row.item_name || row.custom_name || null,
      quantity: row.quantity,
      equipped: Boolean(row.equipped),
      notes: row.notes || "",
      customName: row.custom_name || null,
      custom: !row.item_id
    }))
  };
}

function toPartyCardDto(characterRow) {
  const sheet = characterRow.sheet && typeof characterRow.sheet === "object" ? characterRow.sheet : {};
  const playerState = dnd5e.systemStateToPlayerDto(dnd5e.readSystemState(characterRow));
  const conditions = Array.isArray(playerState.conditions) ? playerState.conditions : [];
  return {
    id: characterRow.id,
    name: characterRow.name,
    type: characterRow.type,
    level: dnd5e.getCharacterLevel(characterRow),
    portraitUrl: characterRow.portrait_url || null,
    race: sheet.race != null ? String(sheet.race) : "",
    class: sheet.class != null ? String(sheet.class) : "",
    hpCurrent: playerState.hpCurrent,
    hpMax: playerState.hpMax,
    conditions
  };
}

function toNoteDto(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    characterId: row.character_id || null,
    title: row.title || "",
    body: row.body || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listControlledCharacterIds(userId, campaignId) {
  const result = await db.query(
    `SELECT cc.character_id
     FROM character_controllers cc
     JOIN campaign_characters campc ON campc.character_id = cc.character_id
     WHERE cc.user_id = $1 AND campc.campaign_id = $2
     ORDER BY cc.character_id ASC`,
    [userId, campaignId]
  );
  return result.rows.map((r) => r.character_id);
}

async function listAllControlledCharacterIds(userId) {
  const result = await db.query(
    `SELECT cc.character_id
     FROM character_controllers cc
     JOIN characters c ON c.id = cc.character_id
     WHERE cc.user_id = $1
     ORDER BY c.name ASC`,
    [userId]
  );
  return result.rows.map((r) => r.character_id);
}

async function listCharacterCampaigns(characterId) {
  const result = await db.query(
    `SELECT cc.campaign_id, cc.status, camp.name AS campaign_name, camp.game_system_id
     FROM campaign_characters cc
     JOIN campaigns camp ON camp.id = cc.campaign_id
     WHERE cc.character_id = $1
     ORDER BY camp.name ASC`,
    [characterId]
  );
  return result.rows.map((r) => ({
    id: r.campaign_id,
    name: r.campaign_name,
    status: r.status,
    gameSystemId: r.game_system_id
  }));
}

async function getBootstrap(req) {
  requireDb();
  const user = await authorize.requireUser(req);
  const memberships = await db.query(
    `SELECT cm.campaign_id, cm.role, c.name AS campaign_name, c.description, c.game_system_id
     FROM campaign_memberships cm
     JOIN campaigns c ON c.id = cm.campaign_id
     WHERE cm.user_id = $1
     ORDER BY c.name ASC`,
    [user.id]
  );

  const campaignsOut = [];
  for (const m of memberships.rows) {
    const controlledIds = await listControlledCharacterIds(user.id, m.campaign_id);
    const chars = controlledIds.length
      ? (
          await db.query(
            `SELECT id, name, type, portrait_url, sheet, game_system_id
             FROM characters
             WHERE id = ANY($1::text[])
             ORDER BY name ASC`,
            [controlledIds]
          )
        ).rows
      : [];
    campaignsOut.push({
      id: m.campaign_id,
      name: m.campaign_name,
      description: m.description || "",
      role: m.role,
      gameSystemId: m.game_system_id || "dnd5e",
      participatingCharacters: chars.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        level: dnd5e.getCharacterLevel(c),
        portraitUrl: c.portrait_url || null,
        gameSystemId: c.game_system_id || "dnd5e"
      })),
      /* legacy alias */
      controlledCharacters: chars.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        level: dnd5e.getCharacterLevel(c),
        portraitUrl: c.portrait_url || null
      }))
    });
  }

  const allCharIds = await listAllControlledCharacterIds(user.id);
  const charactersOut = allCharIds.length
    ? (
        await db.query(
          `SELECT id, name, type, portrait_url, sheet, game_system_id
           FROM characters WHERE id = ANY($1::text[]) ORDER BY name ASC`,
          [allCharIds]
        )
      ).rows.map(async (c) => {
        const campaigns = await listCharacterCampaigns(c.id);
        return {
          id: c.id,
          name: c.name,
          type: c.type,
          level: dnd5e.getCharacterLevel(c),
          portraitUrl: c.portrait_url || null,
          gameSystemId: c.game_system_id || "dnd5e",
          campaigns
        };
      })
    : [];

  const resolvedCharacters = await Promise.all(charactersOut);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    campaigns: campaignsOut,
    characters: resolvedCharacters,
    gameSystems: gameSystems.listGameSystems().map((s) => ({ id: s.id, name: s.name }))
  };
}

async function loadCharacterBundle(characterId, campaignId) {
  const charResult = await db.query(
    `SELECT id, name, type, game_system_id, portrait_url, sheet, catalogue_pc_id, created_at, updated_at
     FROM characters
     WHERE id = $1`,
    [characterId]
  );
  if (!charResult.rows.length) {
    const err = new Error("Character not found");
    err.status = 404;
    throw err;
  }
  if (campaignId) {
    const inCampaign = await authorize.characterInCampaign(campaignId, characterId);
    if (!inCampaign) {
      const err = new Error("Character not found in campaign");
      err.status = 404;
      throw err;
    }
  }
  const stateResult = await db.query("SELECT * FROM character_state WHERE character_id = $1", [
    characterId
  ]);
  const invResult = await db.query(
    `SELECT ie.id, ie.character_id, ie.item_id, ie.quantity, ie.equipped, ie.notes,
            ie.custom_name, ie.custom_item, ie.created_at, ie.updated_at,
            i.name AS item_name
     FROM inventory_entries ie
     LEFT JOIN items i ON i.id = ie.item_id
     WHERE ie.character_id = $1
     ORDER BY ie.equipped DESC, COALESCE(ie.custom_name, i.name, '') ASC`,
    [characterId]
  );
  return {
    character: charResult.rows[0],
    state: stateResult.rows[0] || null,
    inventory: invResult.rows
  };
}

async function loadControlledCharacterBundle(campaignId, characterId) {
  return loadCharacterBundle(characterId, campaignId);
}

async function listMyCharacters(req, campaignId) {
  requireDb();
  const { user } = await authorize.requireCampaignMember(req, campaignId);
  const ids = await listControlledCharacterIds(user.id, campaignId);
  const out = [];
  for (const id of ids) {
    const bundle = await loadControlledCharacterBundle(campaignId, id);
    out.push(toMechanicalDto(bundle.character, bundle.state, bundle.inventory));
  }
  return out;
}

async function getMyCharacter(req, campaignId, characterId) {
  requireDb();
  await authorize.requireCharacterControl(req, campaignId, characterId);
  const bundle = await loadControlledCharacterBundle(campaignId, characterId);
  return toMechanicalDto(bundle.character, bundle.state, bundle.inventory);
}

async function listAllMyCharacters(req) {
  requireDb();
  const user = await authorize.requireUser(req);
  const ids = await listAllControlledCharacterIds(user.id);
  const out = [];
  for (const id of ids) {
    const bundle = await loadCharacterBundle(id, null);
    const dto = toMechanicalDto(bundle.character, bundle.state, bundle.inventory);
    dto.campaigns = await listCharacterCampaigns(id);
    out.push(dto);
  }
  return out;
}

async function getMyCharacterDirect(req, characterId) {
  requireDb();
  await authorize.requireCharacterControlDirect(req, characterId);
  const bundle = await loadCharacterBundle(characterId, null);
  const dto = toMechanicalDto(bundle.character, bundle.state, bundle.inventory);
  dto.campaigns = await listCharacterCampaigns(characterId);
  return dto;
}

async function createStandaloneCharacter(req, body) {
  requireDb();
  const user = await authorize.requireUser(req);
  const payload = body && typeof body === "object" ? body : {};
  const gameSystemId = String(payload.gameSystemId || "dnd5e").trim();
  gameSystems.assertGameSystem(gameSystemId);
  return insertPlayerCharacter(user, null, gameSystemId, payload);
}

async function insertPlayerCharacter(user, campaignId, gameSystemId, payload) {
  const name = String(payload.name || "").trim();
  if (!name) {
    const err = new Error("name is required");
    err.status = 400;
    throw err;
  }

  if (campaignId) {
    const camp = await db.query("SELECT game_system_id FROM campaigns WHERE id = $1", [campaignId]);
    if (!camp.rows.length) {
      const err = new Error("Campaign not found");
      err.status = 404;
      throw err;
    }
    gameSystems.assertCompatibleGameSystems(camp.rows[0].game_system_id, gameSystemId);
  }

  const id = pcCatalogueMirror.generatePcId();
  const level = Number.isFinite(Number(payload.level))
    ? Math.max(1, Math.min(30, Math.floor(Number(payload.level))))
    : 1;
  const race = String(payload.race || "").trim();
  const klass = String(payload.class || "").trim();
  const subclass = String(payload.subclass || "").trim();
  const background = String(payload.background || "").trim();
  const alignment = String(payload.alignment || "").trim();
  const abilities =
    payload.abilities && typeof payload.abilities === "object" && !Array.isArray(payload.abilities)
      ? normalizeAbilities(payload.abilities)
      : {};
  const hpMax = Number.isFinite(Number(payload.hpMax))
    ? Math.max(1, Math.floor(Number(payload.hpMax)))
    : 10;
  const hpCurrent = Number.isFinite(Number(payload.hpCurrent))
    ? Math.floor(Number(payload.hpCurrent))
    : hpMax;
  const ac = Number.isFinite(Number(payload.ac)) ? Number(payload.ac) : 10;

  const sheet = {
    level,
    race,
    class: klass,
    subclass,
    background,
    alignment,
    abilities,
    ac,
    speed: payload.speed != null ? String(payload.speed) : "30 ft.",
    proficiencyBonus: "+2",
    hitDice: payload.hitDice != null ? String(payload.hitDice) : "1d8",
    skillRefs: [],
    featureRefs: [],
    spellRefs: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    updatedAt: Date.now()
  };

  const systemState = dnd5e.normalizeSystemState({
    hp: { current: hpCurrent, max: hpMax, temp: 0 },
    conditions: [],
    deathSaves: {},
    spellSlots: {},
    classResources: {},
    inspiration: false
  });

  try {
    await db.query(
      `INSERT INTO characters (
        id, name, type, game_system_id, portrait_url, sheet, catalogue_pc_id, updated_at
      ) VALUES ($1, $2, 'player', $3, NULL, $4::jsonb, $1, now())`,
      [id, name, gameSystemId, JSON.stringify(sheet)]
    );
    await db.query(
      `INSERT INTO character_state (character_id, system_state, extras, updated_at)
       VALUES ($1, $2::jsonb, '{}'::jsonb, now())`,
      [id, JSON.stringify(systemState)]
    );
    if (campaignId) {
      await db.query(
        `INSERT INTO campaign_characters (campaign_id, character_id, status)
         VALUES ($1, $2, 'active')
         ON CONFLICT DO NOTHING`,
        [campaignId, id]
      );
    }
    await db.query(
      `INSERT INTO character_controllers (character_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, user.id]
    );
    if (campaignId) await pcCatalogueMirror.mirrorCharacterToCatalogue(id);
  } catch (err) {
    await db.query("DELETE FROM characters WHERE id = $1", [id]).catch(() => false);
    await catalogues.remove("pc", id).catch(() => false);
    throw err;
  }

  const bundle = await loadCharacterBundle(id, campaignId);
  return toMechanicalDto(bundle.character, bundle.state, bundle.inventory);
}

async function createMyCharacter(req, campaignId, body) {
  requireDb();
  const { user } = await authorize.requireCampaignMember(req, campaignId);
  const payload = body && typeof body === "object" ? body : {};
  const camp = await db.query("SELECT game_system_id FROM campaigns WHERE id = $1", [campaignId]);
  const gameSystemId = String(payload.gameSystemId || camp.rows[0]?.game_system_id || "dnd5e").trim();
  return insertPlayerCharacter(user, campaignId, gameSystemId, payload);
}

async function patchMyCharacterState(req, campaignId, characterId, body) {
  requireDb();
  if (campaignId) {
    await authorize.requireCharacterControl(req, campaignId, characterId);
  } else {
    await authorize.requireCharacterControlDirect(req, characterId);
  }

  const patch = body && typeof body === "object" ? body : {};
  const unknown = Object.keys(patch).filter((k) => !PLAYER_STATE_WHITELIST.has(k));
  if (unknown.length) {
    const err = new Error(`Non-whitelisted state fields: ${unknown.join(", ")}`);
    err.status = 400;
    throw err;
  }
  if (!Object.keys(patch).length) {
    const err = new Error("No state fields provided");
    err.status = 400;
    throw err;
  }

  /* Reject structural sheet smuggling */
  if (patch.sheet != null || patch.name != null || patch.level != null) {
    const err = new Error("Structural sheet fields cannot be updated via player state");
    err.status = 400;
    throw err;
  }

  const currentResult = await db.query("SELECT * FROM character_state WHERE character_id = $1", [
    characterId
  ]);
  const current = currentResult.rows[0] || {};
  const nextState = dnd5e.applyStatePatch(current, patch, PLAYER_STATE_WHITELIST);

  await db.query(
    `INSERT INTO character_state (character_id, system_state, extras, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, now())
     ON CONFLICT (character_id) DO UPDATE SET
      system_state = EXCLUDED.system_state,
      updated_at = now()`,
    [characterId, JSON.stringify(nextState), JSON.stringify(current.extras ?? {})]
  );

  await pcCatalogueMirror.mirrorCharacterToCatalogueSafe(characterId);
  const bundle = await loadCharacterBundle(characterId, campaignId);
  return toMechanicalDto(bundle.character, bundle.state, bundle.inventory);
}

async function patchMyCharacter(req, campaignId, characterId, body) {
  requireDb();
  if (campaignId) {
    await authorize.requireCharacterControl(req, campaignId, characterId);
  } else {
    await authorize.requireCharacterControlDirect(req, characterId);
  }

  const patch = body && typeof body === "object" ? body : {};
  const unknown = Object.keys(patch).filter((k) => !PLAYER_SHEET_WHITELIST.has(k));
  if (unknown.length) {
    const err = new Error(`Non-whitelisted sheet fields: ${unknown.join(", ")}`);
    err.status = 400;
    throw err;
  }
  if (!Object.keys(patch).length) {
    const err = new Error("No sheet fields provided");
    err.status = 400;
    throw err;
  }

  const rowResult = await db.query(
    `SELECT id, name, sheet FROM characters WHERE id = $1`,
    [characterId]
  );
  if (!rowResult.rows.length) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  const row = rowResult.rows[0];
  const sheet =
    row.sheet && typeof row.sheet === "object" && !Array.isArray(row.sheet) ? { ...row.sheet } : {};

  let name = row.name;
  let level = dnd5e.getCharacterLevel(row);

  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    name = String(patch.name || "").trim();
    if (!name) {
      const err = new Error("name is required");
      err.status = 400;
      throw err;
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, "level")) {
    const n = Number(patch.level);
    if (!Number.isFinite(n) || n < 1 || n > 30 || Math.floor(n) !== n) {
      const err = new Error("level must be an integer from 1 to 30");
      err.status = 400;
      throw err;
    }
    level = n;
  }

  const stringFields = [
    "race",
    "class",
    "subclass",
    "background",
    "alignment",
    "speed",
    "initiative",
    "proficiencyBonus",
    "hitDice",
    "savingThrows",
    "languages",
    "skills"
  ];
  stringFields.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      sheet[key] = String(patch[key] ?? "");
    }
  });

  if (Object.prototype.hasOwnProperty.call(patch, "ac")) {
    const n = Number(patch.ac);
    sheet.ac = Number.isFinite(n) ? n : patch.ac;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "abilities")) {
    const abilities = normalizeAbilities(patch.abilities);
    sheet.abilities = { ...(sheet.abilities || {}), ...abilities };
  }
  if (Object.prototype.hasOwnProperty.call(patch, "skillRefs")) {
    sheet.skillRefs = normalizeRefList(patch.skillRefs, "skillRefs");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "featureRefs")) {
    sheet.featureRefs = normalizeRefList(patch.featureRefs, "featureRefs");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "spellRefs")) {
    sheet.spellRefs = normalizeRefList(patch.spellRefs, "spellRefs");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "currency")) {
    const currency = normalizeCurrency(patch.currency);
    if (currency && Object.keys(currency).length) sheet.currency = { ...(sheet.currency || {}), ...currency };
    else if (patch.currency === null) delete sheet.currency;
    else sheet.currency = { ...(sheet.currency || {}), ...currency };
  }

  sheet.level = level;
  sheet.updatedAt = Date.now();

  await db.query(
    `UPDATE characters SET name = $1, sheet = $2::jsonb, updated_at = now()
     WHERE id = $3`,
    [name, JSON.stringify(sheet), characterId]
  );

  await pcCatalogueMirror.mirrorCharacterToCatalogueSafe(characterId);
  const bundle = await loadCharacterBundle(characterId, campaignId);
  return toMechanicalDto(bundle.character, bundle.state, bundle.inventory);
}

async function addInventoryEntry(req, campaignId, characterId, body) {
  requireDb();
  if (campaignId) {
    await authorize.requireCharacterControl(req, campaignId, characterId);
  } else {
    await authorize.requireCharacterControlDirect(req, characterId);
  }
  const payload = body && typeof body === "object" ? body : {};
  const itemId = payload.itemId ? assertSafeId(String(payload.itemId), "item id") : null;
  const customName = String(payload.customName || payload.name || "").trim();
  if (!itemId && !customName) {
    const err = new Error("itemId or customName required");
    err.status = 400;
    throw err;
  }
  if (itemId) {
    const item = await db.query("SELECT id FROM items WHERE id = $1", [itemId]);
    if (!item.rows.length) {
      /* Allow dangling catalogue refs that exist as files but not items table */
    }
  }
  const quantity = Number(payload.quantity);
  const qty = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
  const equipped = Boolean(payload.equipped);
  const notes = String(payload.notes || "");
  const result = await db.query(
    `INSERT INTO inventory_entries (
      character_id, item_id, quantity, equipped, notes, custom_name, custom_item, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, now())
    RETURNING id`,
    [
      characterId,
      itemId,
      qty,
      equipped,
      notes,
      customName || null,
      JSON.stringify(itemId ? { source: "player" } : { source: "player", custom: true })
    ]
  );
  const bundle = await loadCharacterBundle(characterId, campaignId);
  await pcCatalogueMirror.mirrorCharacterToCatalogueSafe(characterId);
  return {
    entryId: result.rows[0].id,
    character: toMechanicalDto(bundle.character, bundle.state, bundle.inventory)
  };
}

async function updateInventoryEntry(req, campaignId, characterId, entryId, body) {
  requireDb();
  if (campaignId) {
    await authorize.requireCharacterControl(req, campaignId, characterId);
  } else {
    await authorize.requireCharacterControlDirect(req, characterId);
  }
  const id = assertSafeId(String(entryId), "inventory id");
  const existing = await db.query(
    `SELECT ie.* FROM inventory_entries ie
     WHERE ie.id = $1 AND ie.character_id = $2`,
    [id, characterId]
  );
  if (!existing.rows.length) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  const row = existing.rows[0];
  const patch = body && typeof body === "object" ? body : {};
  const quantity = Object.prototype.hasOwnProperty.call(patch, "quantity")
    ? Math.max(1, Math.floor(Number(patch.quantity)) || 1)
    : row.quantity;
  const equipped = Object.prototype.hasOwnProperty.call(patch, "equipped")
    ? Boolean(patch.equipped)
    : Boolean(row.equipped);
  const notes = Object.prototype.hasOwnProperty.call(patch, "notes")
    ? String(patch.notes || "")
    : row.notes || "";
  const customName = Object.prototype.hasOwnProperty.call(patch, "customName")
    ? String(patch.customName || "").trim() || null
    : row.custom_name;
  await db.query(
    `UPDATE inventory_entries
     SET quantity = $1, equipped = $2, notes = $3, custom_name = $4, updated_at = now()
     WHERE id = $5`,
    [quantity, equipped, notes, customName, id]
  );
  await pcCatalogueMirror.mirrorCharacterToCatalogueSafe(characterId);
  const bundle = await loadCharacterBundle(characterId, campaignId);
  return toMechanicalDto(bundle.character, bundle.state, bundle.inventory);
}

async function removeInventoryEntry(req, campaignId, characterId, entryId) {
  requireDb();
  if (campaignId) {
    await authorize.requireCharacterControl(req, campaignId, characterId);
  } else {
    await authorize.requireCharacterControlDirect(req, characterId);
  }
  const id = assertSafeId(String(entryId), "inventory id");
  const result = await db.query(
    `DELETE FROM inventory_entries ie
     WHERE ie.id = $1 AND ie.character_id = $2
     RETURNING ie.id`,
    [id, characterId]
  );
  if (!result.rows.length) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  await pcCatalogueMirror.mirrorCharacterToCatalogueSafe(characterId);
  const bundle = await loadCharacterBundle(characterId, campaignId);
  return toMechanicalDto(bundle.character, bundle.state, bundle.inventory);
}

async function putMyCharacterPortrait(req, campaignId, characterId, body) {
  requireDb();
  if (campaignId) {
    await authorize.requireCharacterControl(req, campaignId, characterId);
  } else {
    await authorize.requireCharacterControlDirect(req, characterId);
  }
  const dataUrl = body?.dataUrl || body?.image || "";
  if (!dataUrl) {
    const err = new Error("dataUrl required");
    err.status = 400;
    throw err;
  }
  const saved = await assets.putFromDataUrl("portraits", "pc", characterId, dataUrl);
  await db.query(`UPDATE characters SET portrait_url = $1, updated_at = now() WHERE id = $2`, [
    saved.url,
    characterId
  ]);
  await pcCatalogueMirror.mirrorCharacterToCatalogueSafe(characterId);
  const bundle = await loadCharacterBundle(characterId, campaignId);
  return toMechanicalDto(bundle.character, bundle.state, bundle.inventory);
}

async function listParty(req, campaignId) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const result = await db.query(
    `SELECT c.id, c.name, c.type, c.portrait_url, c.sheet, cs.system_state
     FROM characters c
     JOIN campaign_characters cc ON cc.character_id = c.id AND cc.campaign_id = $1
     LEFT JOIN character_state cs ON cs.character_id = c.id
     WHERE c.type = 'player'
     ORDER BY c.name ASC`,
    [campaignId]
  );
  return result.rows.map(toPartyCardDto);
}

async function toPlayerCatalogueDto(safeType, safeId) {
  if (safeType === "item") {
    const itemResult = await db.query(
      `SELECT id, name, item_type, rarity, value, weight, attunement, description,
              properties, notes, category, tags, portrait_url
       FROM items WHERE id = $1`,
      [safeId]
    );
    if (itemResult.rows.length) {
      const row = itemResult.rows[0];
      return {
        type: "item",
        id: row.id,
        name: row.name,
        itemType: row.item_type,
        rarity: row.rarity,
        value: row.value,
        weight: row.weight,
        attunement: row.attunement,
        description: row.description || "",
        properties: row.properties || "",
        notes: row.notes || "",
        category: row.category || null,
        tags: row.tags || [],
        portraitUrl: row.portrait_url || null,
        actions: ["inventory"]
      };
    }
  }

  const entry = await catalogues.get(safeType, safeId);
  if (!entry) return null;

  const actions = [];
  if (safeType === "item") actions.push("inventory");
  if (safeType === "spell") actions.push("spell");
  if (safeType === "skill") actions.push("skill");
  if (safeType === "feature") actions.push("feature");
  if (safeType === "race") actions.push("race");
  if (safeType === "class") actions.push("class");

  return {
    type: safeType,
    id: entry.id || safeId,
    name: entry.name || entry.title || safeId,
    description: entry.description || entry.text || entry.rules || entry.notes || "",
    summary: entry.summary || entry.effect || entry.trait || "",
    level: entry.level ?? entry.spellLevel ?? null,
    school: entry.school || null,
    category: entry.category || entry.locationType || entry.itemType || entry.abbreviation || null,
    rarity: entry.rarity || null,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    portraitUrl: entry.portrait || entry.portraitUrl || entry.image || entry.mapImage || null,
    cr: entry.cr || entry.challengeRating || null,
    size: entry.size || null,
    typeLabel: entry.monsterType || entry.type || null,
    parentLocationRef: entry.parentLocationRef || null,
    castingTime: entry.castingTime || null,
    range: entry.range || null,
    components: entry.components || null,
    duration: entry.duration || null,
    abbreviation: entry.abbreviation || null,
    publisher: entry.publisher || null,
    chapters: safeType === "source" && Array.isArray(entry.chapters) ? entry.chapters : undefined,
    actions,
    rawSafe: {
      castingTime: entry.castingTime || null,
      range: entry.range || null,
      components: entry.components || null,
      duration: entry.duration || null,
      rarity: entry.rarity || null
    }
  };
}

function entrySearchBlob(entry) {
  const chapterBlob = Array.isArray(entry.chapters)
    ? entry.chapters
        .map((ch) => [ch?.title, ch?.content, ...(ch?.subchapters || []).map((s) => `${s?.title} ${s?.content}`)])
        .flat()
        .join(" ")
    : "";
  return [
    entry.name,
    entry.id,
    entry.description,
    entry.summary,
    entry.category,
    entry.school,
    entry.rarity,
    entry.itemType,
    entry.locationType,
    entry.abbreviation,
    entry.publisher,
    chapterBlob,
    ...(Array.isArray(entry.tags) ? entry.tags : [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

async function listPlayerCatalogue(req, campaignId, type, query = {}) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const safeType = assertCatalogueType(type);
  if (PLAYER_BLOCKED_CATALOGUE_TYPES.has(safeType) || !PLAYER_LIBRARY_BROWSE_TYPES.has(safeType)) {
    const err = new Error("Catalogue type not available to players");
    err.status = 403;
    throw err;
  }

  const q = String(query.q || "").trim().toLowerCase();
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 40));
  const offset = Math.max(0, Number(query.offset) || 0);

  let entries = await catalogues.list(safeType);
  if (safeType === "source") {
    entries = entries.filter(isPlayerVisibleSource);
  }
  if (q) {
    entries = entries.filter((e) => entrySearchBlob(e).includes(q));
  }
  const total = entries.length;
  const page = entries.slice(offset, offset + limit).map((e) => ({
    type: safeType,
    id: e.id,
    name: e.name || e.title || e.id,
    summary: e.summary || e.effect || e.description || "",
    category:
      safeType === "source"
        ? normalizeSourceCategory(e)
        : e.category || e.locationType || e.itemType || e.school || null,
    level: e.level ?? e.spellLevel ?? null,
    rarity: e.rarity || null,
    cr: e.cr || e.challengeRating || null,
    tags: Array.isArray(e.tags) ? e.tags.slice(0, 8) : []
  }));

  return { type: safeType, total, limit, offset, entries: page };
}

async function resolveCatalogue(req, campaignId, type, id) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const safeType = assertCatalogueType(type);
  const safeId = assertSafeId(id, "entry id");
  if (PLAYER_BLOCKED_CATALOGUE_TYPES.has(safeType) || !PLAYER_CATALOGUE_TYPES.has(safeType)) {
    const err = new Error("Catalogue type not available to players");
    err.status = 403;
    throw err;
  }

  if (safeType === "source") {
    const raw = await catalogues.get(safeType, safeId);
    if (!raw || !isPlayerVisibleSource(raw)) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }
  }

  const dto = await toPlayerCatalogueDto(safeType, safeId);
  if (!dto) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  if (safeType === "source") {
    dto.category = normalizeSourceCategory(dto);
  }
  return dto;
}

function formatAttachRef(type, id, name) {
  const label = String(name || id).replace(/\|/g, "/");
  return `@${type}:${id}|${label}`;
}

async function attachLibraryEntry(req, campaignId, characterId, body) {
  requireDb();
  await authorize.requireCharacterControl(req, campaignId, characterId);
  const payload = body && typeof body === "object" ? body : {};
  const safeType = assertCatalogueType(payload.type);
  const safeId = assertSafeId(payload.id, "entry id");
  const action = String(payload.action || "").trim();

  if (PLAYER_BLOCKED_CATALOGUE_TYPES.has(safeType) || !PLAYER_CATALOGUE_TYPES.has(safeType)) {
    const err = new Error("Catalogue type not available to players");
    err.status = 403;
    throw err;
  }
  if (!LIBRARY_ATTACH_ACTIONS.has(action)) {
    const err = new Error("Invalid attach action");
    err.status = 400;
    throw err;
  }

  const expected = {
    inventory: "item",
    skill: "skill",
    feature: "feature",
    spell: "spell",
    race: "race",
    class: "class"
  };
  if (expected[action] !== safeType) {
    const err = new Error(`Action ${action} does not apply to type ${safeType}`);
    err.status = 400;
    throw err;
  }

  const entry = await toPlayerCatalogueDto(safeType, safeId);
  if (!entry) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }

  if (action === "inventory") {
    return addInventoryEntry(req, campaignId, characterId, {
      itemId: safeId,
      customName: entry.name,
      quantity: 1
    });
  }

  const ref = formatAttachRef(safeType, safeId, entry.name);
  if (action === "race" || action === "class") {
    const character = await patchMyCharacter(req, campaignId, characterId, {
      [action]: ref
    });
    return { character, attached: ref, action };
  }

  const field =
    action === "skill" ? "skillRefs" : action === "feature" ? "featureRefs" : "spellRefs";
  const bundle = await loadControlledCharacterBundle(campaignId, characterId);
  const sheet =
    bundle.character.sheet && typeof bundle.character.sheet === "object"
      ? bundle.character.sheet
      : {};
  const current = Array.isArray(sheet[field]) ? sheet[field].map(String) : [];
  if (!current.includes(ref) && !current.some((r) => String(r).includes(`:${safeId}|`) || String(r).endsWith(`:${safeId}`))) {
    current.push(ref);
  }
  const character = await patchMyCharacter(req, campaignId, characterId, { [field]: current });
  return { character, attached: ref, action };
}

async function listNotes(req, campaignId) {
  requireDb();
  const { user } = await authorize.requireCampaignMember(req, campaignId);
  const result = await db.query(
    `SELECT id, user_id, campaign_id, character_id, title, body, created_at, updated_at
     FROM player_notes
     WHERE user_id = $1 AND campaign_id = $2
     ORDER BY updated_at DESC`,
    [user.id, campaignId]
  );
  return result.rows.map(toNoteDto);
}

async function createNote(req, campaignId, body) {
  requireDb();
  const { user } = await authorize.requireCampaignMember(req, campaignId);
  const title = body?.title != null ? String(body.title) : "";
  const noteBody = body?.body != null ? String(body.body) : "";
  let characterId = body?.characterId != null && body.characterId !== "" ? String(body.characterId) : null;
  if (characterId) {
    characterId = assertSafeId(characterId, "character id");
    const controls = await authorize.userControlsCharacter(user.id, characterId);
    if (!controls) {
      const err = new Error("Notes may only link to characters you control");
      err.status = 403;
      throw err;
    }
  }
  const result = await db.query(
    `INSERT INTO player_notes (user_id, campaign_id, character_id, title, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, campaign_id, character_id, title, body, created_at, updated_at`,
    [user.id, campaignId, characterId, title, noteBody]
  );
  return toNoteDto(result.rows[0]);
}

async function updateNote(req, noteId, body) {
  requireDb();
  const user = await authorize.requireUser(req);
  const existing = await db.query(
    `SELECT id, user_id, campaign_id, character_id, title, body, created_at, updated_at
     FROM player_notes WHERE id = $1`,
    [noteId]
  );
  if (!existing.rows.length) {
    const err = new Error("Note not found");
    err.status = 404;
    throw err;
  }
  const row = existing.rows[0];
  if (row.user_id !== user.id) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const title = body?.title != null ? String(body.title) : row.title;
  const noteBody = body?.body != null ? String(body.body) : row.body;
  let characterId = row.character_id;
  if (Object.prototype.hasOwnProperty.call(body || {}, "characterId")) {
    if (body.characterId == null || body.characterId === "") {
      characterId = null;
    } else {
      characterId = assertSafeId(String(body.characterId), "character id");
      const controls = await authorize.userControlsCharacter(user.id, characterId);
      if (!controls) {
        const err = new Error("Notes may only link to characters you control");
        err.status = 403;
        throw err;
      }
    }
  }

  const result = await db.query(
    `UPDATE player_notes
     SET title = $2, body = $3, character_id = $4, updated_at = now()
     WHERE id = $1 AND user_id = $5
     RETURNING id, user_id, campaign_id, character_id, title, body, created_at, updated_at`,
    [noteId, title, noteBody, characterId, user.id]
  );
  return toNoteDto(result.rows[0]);
}

async function deleteNote(req, noteId) {
  requireDb();
  const user = await authorize.requireUser(req);
  const existing = await db.query(`SELECT id, user_id FROM player_notes WHERE id = $1`, [noteId]);
  if (!existing.rows.length) {
    const err = new Error("Note not found");
    err.status = 404;
    throw err;
  }
  if (existing.rows[0].user_id !== user.id) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  await db.query(`DELETE FROM player_notes WHERE id = $1 AND user_id = $2`, [noteId, user.id]);
  return { deleted: true };
}

/**
 * Player-safe character portrait. Member may see portraits of type=player PCs in the campaign.
 */
async function listAttachableCampaigns(req, characterId) {
  requireDb();
  await authorize.requireCharacterControlDirect(req, characterId);
  const charResult = await db.query("SELECT game_system_id FROM characters WHERE id = $1", [
    characterId
  ]);
  if (!charResult.rows.length) {
    const err = new Error("Character not found");
    err.status = 404;
    throw err;
  }
  const gameSystemId = charResult.rows[0].game_system_id || "dnd5e";
  const user = req.user || (await authorize.requireUser(req));
  const memberships = await db.query(
    `SELECT cm.campaign_id, c.name, c.game_system_id
     FROM campaign_memberships cm
     JOIN campaigns c ON c.id = cm.campaign_id
     WHERE cm.user_id = $1
     ORDER BY c.name ASC`,
    [user.id]
  );
  const attached = await listCharacterCampaigns(characterId);
  const attachedIds = new Set(attached.map((c) => c.id));
  return memberships.rows
    .filter((m) => m.game_system_id === gameSystemId && !attachedIds.has(m.campaign_id))
    .map((m) => ({
      id: m.campaign_id,
      name: m.name,
      gameSystemId: m.game_system_id
    }));
}

async function attachCharacterToCampaign(req, campaignId, characterId) {
  requireDb();
  const { user, membership } = await authorize.requireCampaignMember(req, campaignId);
  if (membership.role !== "dm" && !(await authorize.userControlsCharacter(user.id, characterId))) {
    authorize.deny(403, "You do not control this character");
  }
  await characters.attachCharacterToCampaign(campaignId, characterId);
  await pcCatalogueMirror.mirrorCharacterToCatalogueSafe(characterId);
  return getMyCharacterDirect(req, characterId);
}

async function detachCharacterFromCampaign(req, campaignId, characterId) {
  requireDb();
  const { user, membership } = await authorize.requireCampaignMember(req, campaignId);
  if (membership.role !== "dm" && !(await authorize.userControlsCharacter(user.id, characterId))) {
    authorize.deny(403, "You do not control this character");
  }
  await characters.detachCharacterFromCampaign(campaignId, characterId);
  return { characterId, campaignId, campaigns: await listCharacterCampaigns(characterId) };
}

async function attachCharacterToCampaignAsDm(req, campaignId, characterId) {
  requireDb();
  await authorize.requireDmIfAuthRequired(req, campaignId);
  await characters.attachCharacterToCampaign(campaignId, characterId);
  await pcCatalogueMirror.mirrorCharacterToCatalogueSafe(characterId);
  return characters.getCharacter(campaignId, characterId);
}

async function detachCharacterFromCampaignAsDm(req, campaignId, characterId) {
  requireDb();
  await authorize.requireDmIfAuthRequired(req, campaignId);
  await characters.detachCharacterFromCampaign(campaignId, characterId);
  return { campaignId, characterId };
}

async function readCharacterPortrait(req, campaignId, characterId) {
  requireDb();
  await authorize.requireCampaignMember(req, campaignId);
  const safeId = assertSafeId(characterId, "character id");
  const result = await db.query(
    `SELECT c.id, c.type, c.portrait_url
     FROM characters c
     JOIN campaign_characters cc ON cc.character_id = c.id AND cc.campaign_id = $2
     WHERE c.id = $1`,
    [safeId, campaignId]
  );
  if (!result.rows.length || result.rows[0].type !== "player") {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }

  /* Serve file asset under portraits/pc/<id> when present */
  const asset = await assets.readAsset("portraits", "pc", safeId);
  if (asset) return asset;

  const err = new Error("Not found");
  err.status = 404;
  throw err;
}

/**
 * Player-safe catalogue artwork. Only for allowlisted types linked to controlled characters.
 */
async function readCataloguePortrait(req, campaignId, type, id) {
  await resolveCatalogue(req, campaignId, type, id);
  const safeType = assertCatalogueType(type);
  const safeId = assertSafeId(id, "entry id");
  if (!PLAYER_CATALOGUE_TYPES.has(safeType)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const asset = await assets.readAsset("portraits", safeType, safeId);
  if (!asset) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  return asset;
}

module.exports = {
  PLAYER_CATALOGUE_TYPES,
  PLAYER_LIBRARY_BROWSE_TYPES,
  PLAYER_BLOCKED_CATALOGUE_TYPES,
  PLAYER_HIDDEN_SOURCE_CATEGORIES,
  PLAYER_STATE_WHITELIST,
  PLAYER_SHEET_WHITELIST,
  LIBRARY_ATTACH_ACTIONS,
  normalizeSourceCategory,
  isPlayerVisibleSource,
  abilityModifier,
  toMechanicalDto,
  toPartyCardDto,
  getBootstrap,
  listAllMyCharacters,
  listMyCharacters,
  getMyCharacter,
  getMyCharacterDirect,
  createMyCharacter,
  createStandaloneCharacter,
  patchMyCharacterState,
  patchMyCharacter,
  addInventoryEntry,
  updateInventoryEntry,
  removeInventoryEntry,
  putMyCharacterPortrait,
  listParty,
  listAttachableCampaigns,
  attachCharacterToCampaign,
  detachCharacterFromCampaign,
  attachCharacterToCampaignAsDm,
  detachCharacterFromCampaignAsDm,
  listPlayerCatalogue,
  resolveCatalogue,
  attachLibraryEntry,
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  readCharacterPortrait,
  readCataloguePortrait,
  collectAuthorizedCatalogueKeys
};
