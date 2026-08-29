/**
 * Adventure / map pin entityId → catalogue entry id (mirrors js/core/entity-registry.js).
 */
"use strict";

const LINK_ALIASES = Object.freeze({
  runara: "sw-runara",
  tarak: "sw-tarak",
  varnoth: "sw-varnoth",
  myla: "sw-myla",
  mek: "sw-mek",
  minn: "sw-minn",
  sinensa: "sw-sinensa",
  aidron: "sw-aidron",
  laylee: "sw-laylee",
  rix: "sw-rix",
  sparkrender: "sw-sparkrender",
  zombie: "sw-zombie",
  stirge: "sw-stirge",
  merrow: "sw-merrow",
  ghoul: "sw-ghoul",
  myconid: "sw-myconid",
  "moonstone-key": "sw-moonstone-key",
  "stormwreck-isle": "sw-stormwreck-isle",
  "dragons-rest": "sw-dragons-rest",
  "seagrow-caves": "sw-seagrow-caves",
  "compass-rose": "sw-compass-rose",
  "clifftop-observatory": "sw-clifftop-observatory"
});

function resolveCatalogueId(entityId, pinType) {
  if (!entityId) return null;
  const key = String(entityId).trim();
  if (LINK_ALIASES[key]) return LINK_ALIASES[key];
  if (key.startsWith("sw-")) return key;
  const prefixes = {
    npc: "sw-",
    monster: "sw-",
    pc: "sw-",
    item: "sw-"
  };
  const prefix = prefixes[pinType];
  if (prefix && !key.includes(":")) return `${prefix}${key}`;
  return key;
}

module.exports = { LINK_ALIASES, resolveCatalogueId };
