/**
 * Modest game-system registry — not a plugin framework.
 * Core code asks systems for catalogue types and character sections.
 */
"use strict";

const DND5E_CATALOGUE_TYPES = [
  "pc",
  "npc",
  "item",
  "monster",
  "location",
  "race",
  "class",
  "spell",
  "skill",
  "feature",
  "music",
  "source"
];

const DND5E_PLAYER_LIBRARY_TYPES = ["skill", "feature", "spell", "race", "class", "source"];

const DND5E_CHARACTER_SECTIONS = [
  { id: "identity", label: "Identity" },
  { id: "abilities", label: "Abilities" },
  { id: "combat", label: "Combat" },
  { id: "skills", label: "Skills" },
  { id: "features", label: "Features" },
  { id: "spells", label: "Spells" },
  { id: "inventory", label: "Inventory" },
  { id: "notes", label: "Notes" }
];

const SYSTEMS = {
  dnd5e: {
    id: "dnd5e",
    name: "Dungeons & Dragons 5e",
    description: "D&D 5th Edition tabletop rules",
    catalogueTypes: DND5E_CATALOGUE_TYPES,
    playerLibraryTypes: DND5E_PLAYER_LIBRARY_TYPES,
    characterSections: DND5E_CHARACTER_SECTIONS
  }
};

function getGameSystem(id) {
  const key = String(id || "").trim();
  return SYSTEMS[key] || null;
}

function listGameSystems() {
  return Object.values(SYSTEMS);
}

function assertGameSystem(id) {
  const sys = getGameSystem(id);
  if (!sys) {
    const err = new Error(`Unknown game system: ${id}`);
    err.status = 400;
    throw err;
  }
  return sys;
}

function assertCompatibleGameSystems(campaignSystemId, characterSystemId) {
  const a = String(campaignSystemId || "").trim();
  const b = String(characterSystemId || "").trim();
  if (!a || !b || a !== b) {
    const err = new Error(
      `Character game system (${b || "unknown"}) does not match campaign (${a || "unknown"})`
    );
    err.status = 400;
    throw err;
  }
}

module.exports = {
  getGameSystem,
  listGameSystems,
  assertGameSystem,
  assertCompatibleGameSystems,
  DND5E_CATALOGUE_TYPES,
  DND5E_PLAYER_LIBRARY_TYPES
};
