/**
 * Static checks for DM combat sheet wiring (PC/NPC/monster tokens).
 * Run: node test/validate-combat-sheets.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const modal = read("js/core/combat-sheet-modal.js");
const client = read("js/core/local-api-client.js");
const party = read("js/core/party.js");
const mapPanel = read("js/core/map-panel.js");
const mapSpatial = read("js/core/map-spatial.js");
const configs = read("js/core/catalogue/configs.js");
const registry = read("js/core/entity-registry.js");
const isle = read("campaigns/stormwreck-isle/index.html");
const sandbox = read("campaigns/sandbox/index.html");
const docs = read("docs/README/COMBAT-SHEET-MODAL.md");
const characters = read("server/lib/characters.js");
const api = read("server/routes/api.js");

if (!modal.includes("window.CombatSheetModal") || !modal.includes("buildMonsterToken")) {
  fail("CombatSheetModal missing core API");
} else pass("CombatSheetModal module");

if (!modal.includes('kind === "pc"') || !modal.includes('kind === "npc"') || !modal.includes("monster-token")) {
  fail("CombatSheetModal missing pc/npc/monster-token paths");
} else pass("CombatSheetModal open kinds");

if (!modal.includes("putCharacterState") || !modal.includes("patchCharacter")) {
  fail("PC path must call character state + sheet patch APIs");
} else pass("PC LocalApiClient save path");

if (!modal.includes('CatalogueStore.upsert("npc"') && !modal.includes("CatalogueStore.upsert(\"npc\"")) {
  if (!/CatalogueStore\.upsert\(\s*[\"']npc[\"']/.test(modal)) {
    fail("NPC path must upsert NPC catalogue");
  } else pass("NPC catalogue upsert");
} else pass("NPC catalogue upsert");

if (!modal.includes("CampaignMapState.patch") || !modal.includes("hpCurrent")) {
  fail("Monster token path must patch map tokens with combat fields");
} else pass("Monster token patch");

if (modal.includes('putCatalogue("monster"') || modal.includes("upsert(\"monster\"")) {
  fail("Monster instance edits must not write monster catalogue");
} else pass("No monster catalogue write-back");

for (const fn of ["listCharacters", "getCharacter", "getCharacterState", "putCharacterState", "patchCharacter"]) {
  if (!client.includes(`function ${fn}`) && !client.includes(`async function ${fn}`)) {
    fail(`LocalApiClient missing ${fn}`);
  }
}
pass("LocalApiClient character helpers");

if (!characters.includes("patchCharacterSheet") || !api.includes("patchCharacterSheet")) {
  fail("Server must expose DM character sheet PATCH (AC)");
} else pass("DM patchCharacterSheet route");

if (!party.includes("CombatSheetModal.open")) {
  fail("PartyRoster must open combat sheet for members");
} else pass("Party → combat sheet");

if (!mapPanel.includes("CombatSheetModal.open") || !mapPanel.includes("spawnMonsterToken")) {
  fail("MapPanel must open combat sheet + spawn monster tokens");
} else pass("MapPanel combat wiring");

if (!mapPanel.includes("removeStaticPinFromMap") || !mapPanel.includes("removedPins")) {
  fail("MapPanel missing static NPC pin removal");
} else pass("MapPanel static NPC pin removal");

if (!mapSpatial.includes("token: tok") || !mapSpatial.includes("onRemoved:")) {
  fail("MapSpatial NPC token open should pass map token for removal");
} else pass("MapSpatial NPC token remove wiring");

if (!modal.includes("data-remove-from-map") || !modal.includes("removeFromMapPlacement")) {
  fail("CombatSheetModal missing remove-from-map for map tokens");
} else pass("Map token remove from map");

if (!/removeFromMap:\s*onMap/.test(modal)) {
  fail("CombatSheetModal missing remove-from-map for NPCs on the map");
} else pass("NPC remove from map in combat sheet");

if (!modal.includes("saveNpcCombatToken") || !modal.includes("current.mapToken")) {
  fail("NPC combat token save must patch map token instance, not catalogue only");
} else pass("NPC combat token instance save");

const npcTokenSaveBlock = modal.match(/async function saveNpcCombatToken[\s\S]*?(?=async function saveNpc)/);
if (!npcTokenSaveBlock || npcTokenSaveBlock[0].includes("CatalogueStore.upsert")) {
  fail("saveNpcCombatToken must not upsert the NPC catalogue");
} else pass("NPC instance save isolated from catalogue upsert");

if (!modal.includes("fillCombatReference") || !modal.includes("data-combat-reference")) {
  fail("CombatSheetModal missing combat reference stat block section");
} else pass("Combat reference section");

if (!registry.includes("catalogueId") || !registry.includes("seen.has(key)")) {
  fail("EntityRegistry.byType must dedupe catalogue alias keys");
} else pass("EntityRegistry byType dedupe");

if (!mapSpatial.includes("renderGridToken") || !mapSpatial.includes('t.kind === "monster"')) {
  fail("Monster tokens should render as map-grid-token footprints, not pin dots");
} else pass("Monster grid token rendering");

if (!configs.includes("combatConditions")) {
  fail("NPC catalogue schema missing combatConditions");
} else pass("NPC combatConditions field");

if (!isle.includes("combat-sheet-modal.js") || !sandbox.includes("combat-sheet-modal.js")) {
  fail("Campaign HTML must load combat-sheet-modal.js");
} else pass("Campaign HTML script tags");

if (!docs.includes("CombatSheetModal") || !docs.includes("buildMonsterToken") || !docs.includes("initiativeTracker")) {
  fail("COMBAT-SHEET-MODAL.md incomplete");
} else pass("COMBAT-SHEET-MODAL.md");

if (!modal.includes("classResourcesHtml") || !modal.includes("class_resources")) {
  fail("CombatSheetModal missing class resources");
} else pass("CombatSheetModal class resources");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll combat sheet checks passed");
