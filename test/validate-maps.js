/**
 * Validates maps.js pin entity references against catalogue seeds.
 * Run: node test/validate-maps.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

function pass(msg) {
  console.log("OK:", msg);
}

function loadGlobal(file, globalName) {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  const fn = new Function(code + `\nreturn ${globalName};`);
  return fn();
}

function catalogueLinkId(entry) {
  if (entry.linkId) return entry.linkId;
  if (entry.id?.startsWith("sw-")) return entry.id.slice(3);
  return entry.id;
}

function buildEntityIndex(seeds) {
  const entities = {};
  for (const type of ["npc", "monster", "item", "location"]) {
    for (const entry of seeds[type] || []) {
      entities[catalogueLinkId(entry)] = true;
    }
  }
  return entities;
}

const seeds = loadGlobal("js/catalogue-seeds/stormwreck-isle.js", "CatalogueSeeds");
const ENTITIES = buildEntityIndex(seeds);
const MAPS = loadGlobal("js/campaigns/stormwreck-isle/maps.js", "MAPS");

let pinCount = 0;
for (const map of Object.values(MAPS)) {
  if (!map.id || !map.title || !map.image) fail(`Map missing id/title/image`);
  for (const pin of map.pins || []) {
    pinCount++;
    if (pin.entityId && !ENTITIES[pin.entityId]) {
      fail(`Pin "${pin.id}" on "${map.id}" links to missing catalogue entry: ${pin.entityId}`);
    }
    if (pin.x == null || pin.y == null) fail(`Pin "${pin.id}" missing x/y`);
  }
}
pass(`${Object.keys(MAPS).length} maps, ${pinCount} pins validated`);

if (failed) {
  console.error(`\n${failed} error(s)`);
  process.exit(1);
}

console.log("\nAll map checks passed.");
