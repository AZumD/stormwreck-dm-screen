/**
 * Validates adventure @ links resolve to catalogue entries (via linkId).
 * Run: node test/validate-data.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const campaign = "stormwreck-isle";
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
      const id = catalogueLinkId(entry);
      entities[id] = { id, name: entry.name, type };
    }
  }
  return entities;
}

const seeds = loadGlobal("js/catalogue-seeds/stormwreck-isle.js", "CatalogueSeeds");
const ENTITIES = buildEntityIndex(seeds);
const ADVENTURE = loadGlobal(`js/campaigns/${campaign}/adventure.js`, "ADVENTURE");

const linkRe = /(?:\[\[(?:npc|monster|location|item):([\w-]+)|@(npc|monster|location|item):([\w-]+))/g;

pass(`${Object.keys(ENTITIES).length} catalogue link IDs indexed`);

const sectionIds = new Set();
const chapterIds = new Set(ADVENTURE.chapters.map((c) => c.id));

for (const section of ADVENTURE.sections) {
  if (sectionIds.has(section.id)) fail(`Duplicate section id: ${section.id}`);
  sectionIds.add(section.id);
  if (!chapterIds.has(section.chapter)) {
    fail(`Section "${section.id}" references unknown chapter "${section.chapter}"`);
  }
  let m;
  while ((m = linkRe.exec(section.content)) !== null) {
    const id = m[1] || m[3];
    if (!ENTITIES[id]) fail(`Section "${section.id}" links to missing catalogue entry: ${id}`);
  }
}
pass(`${sectionIds.size} sections validated`);

if (failed) {
  console.error(`\n${failed} error(s)`);
  process.exit(1);
}

console.log("\nAll checks passed.");
