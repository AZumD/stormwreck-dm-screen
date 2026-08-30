/**
 * D&D 5e character sheet/state helpers.
 * Canonical play-state lives in character_state.system_state; legacy columns are no longer used.
 */
"use strict";

const DEFAULT_SYSTEM_STATE = {
  hp: { current: null, max: null, temp: 0 },
  conditions: [],
  deathSaves: {},
  spellSlots: {},
  classResources: {},
  inspiration: false
};

function cloneDefaultSystemState() {
  return JSON.parse(JSON.stringify(DEFAULT_SYSTEM_STATE));
}

function readSystemState(row) {
  const raw = row?.system_state;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return normalizeSystemState(raw);
  }
  return cloneDefaultSystemState();
}

function normalizeSystemState(raw) {
  const hpRaw = raw.hp && typeof raw.hp === "object" ? raw.hp : {};
  return {
    hp: {
      current: hpRaw.current ?? null,
      max: hpRaw.max ?? null,
      temp: Number.isFinite(Number(hpRaw.temp)) ? Number(hpRaw.temp) : 0
    },
    conditions: Array.isArray(raw.conditions) ? raw.conditions : [],
    deathSaves: raw.deathSaves && typeof raw.deathSaves === "object" ? raw.deathSaves : {},
    spellSlots: raw.spellSlots && typeof raw.spellSlots === "object" ? raw.spellSlots : {},
    classResources:
      raw.classResources && typeof raw.classResources === "object" ? raw.classResources : {},
    inspiration: Boolean(raw.inspiration)
  };
}

/** Flat DTO shape consumed by player UI (camelCase state fields). */
function systemStateToPlayerDto(systemState) {
  const s = normalizeSystemState(systemState);
  return {
    hpCurrent: s.hp.current ?? null,
    hpMax: s.hp.max ?? null,
    hpTemp: s.hp.temp ?? 0,
    conditions: s.conditions,
    deathSaves: s.deathSaves,
    spellSlots: s.spellSlots,
    classResources: s.classResources,
    inspiration: s.inspiration
  };
}

/** Map player/API patch keys to system_state paths. */
const PATCH_KEY_MAP = {
  hp_current: (s, v) => {
    s.hp.current = v;
  },
  hp_max: (s, v) => {
    s.hp.max = v;
  },
  hp_temp: (s, v) => {
    s.hp.temp = v;
  },
  conditions: (s, v) => {
    s.conditions = v;
  },
  death_saves: (s, v) => {
    s.deathSaves = v;
  },
  spell_slots: (s, v) => {
    s.spellSlots = v;
  },
  class_resources: (s, v) => {
    s.classResources = v;
  },
  inspiration: (s, v) => {
    s.inspiration = v;
  }
};

function applyStatePatch(currentRow, patch, whitelist) {
  const systemState = readSystemState(currentRow);
  const allowed = whitelist || new Set(Object.keys(PATCH_KEY_MAP));
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (!allowed.has(key)) return;
    const fn = PATCH_KEY_MAP[key];
    if (fn) fn(systemState, value);
  });
  return normalizeSystemState(systemState);
}

function getCharacterLevel(characterRow) {
  const sheet = characterRow?.sheet;
  if (sheet && typeof sheet === "object" && sheet.level != null) {
    const n = Number(sheet.level);
    if (Number.isFinite(n)) return Math.max(1, Math.min(30, Math.floor(n)));
  }
  if (characterRow?.level != null) {
    const n = Number(characterRow.level);
    if (Number.isFinite(n)) return Math.max(1, Math.min(30, Math.floor(n)));
  }
  return 1;
}

function setCharacterLevel(sheet, level) {
  const next = sheet && typeof sheet === "object" && !Array.isArray(sheet) ? { ...sheet } : {};
  next.level = level;
  return next;
}

/** Snake_case DTO for DM APIs and legacy clients (combat sheet, party enrich). */
function stateRowToApiDto(stateRow) {
  const player = systemStateToPlayerDto(readSystemState(stateRow));
  const extras =
    stateRow?.extras && typeof stateRow.extras === "object" && !Array.isArray(stateRow.extras)
      ? stateRow.extras
      : {};
  return {
    hp_current: player.hpCurrent,
    hp_max: player.hpMax,
    hp_temp: player.hpTemp,
    conditions: player.conditions,
    death_saves: player.deathSaves,
    spell_slots: player.spellSlots,
    class_resources: player.classResources,
    inspiration: player.inspiration,
    extras
  };
}

module.exports = {
  DEFAULT_SYSTEM_STATE,
  cloneDefaultSystemState,
  readSystemState,
  normalizeSystemState,
  systemStateToPlayerDto,
  stateRowToApiDto,
  applyStatePatch,
  getCharacterLevel,
  setCharacterLevel,
  PATCH_KEY_MAP
};
