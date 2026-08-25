/**
 * Combat sheet + initiative tracker static checks.
 * Run: node test/validate-combat-initiative.js
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
const mapPanel = read("js/core/map-panel.js");
const player = read("js/player-app.js");
const isle = read("campaigns/stormwreck-isle/index.html");

if (!modal.includes('name="initiative"') || !modal.includes("syncInitiativeTracker")) {
  fail("combat sheet missing initiative field/tracker sync");
} else pass("combat sheet initiative");

if (!modal.includes("death_saves") || !modal.includes("spell_slots")) {
  fail("combat sheet missing death saves / spell slots for PCs");
} else pass("combat sheet death saves + spell slots");

if (!mapPanel.includes("refreshInitiative") || !mapPanel.includes("map-initiative")) {
  fail("map panel missing initiative list");
} else pass("map panel initiative list");

if (!isle.includes('id="map-initiative"')) fail("campaign HTML missing initiative list");
else pass("campaign HTML initiative list");

if (!player.includes("deathSavesBlock") || !player.includes("spellSlotsBlock")) {
  fail("player sheet missing death saves / spell slots UI");
} else pass("player sheet death saves + spell slots");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll combat initiative checks passed");
