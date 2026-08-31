/**
 * Validates catalogue taxonomy architecture: facets/grouping, item categories,
 * class/subclass + race/subspecies entities, flat storage, and browsing helpers.
 * Run: node test/validate-catalogue-taxonomy.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

function pass(msg) {
  console.log("OK:", msg);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const ITEM_CATEGORIES = new Set([
  "Weapon",
  "Armor & Shield",
  "Ammunition",
  "Adventuring Gear",
  "Tool & Kit",
  "Consumable",
  "Ingredient & Material",
  "Wondrous Item",
  "Treasure & Valuable",
  "Document & Lore",
  "Container & Storage",
  "Trade Good",
  "Trinket & Curio",
  "Junk & Salvage",
  "Hazard & Trap",
  "Collection & Hoard",
  "Other"
]);

/* ── Config / app contracts ───────────────────────────────── */
const configsCode = fs.readFileSync(path.join(root, "js/core/catalogue/configs.js"), "utf8");
const appCode = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const storeCode = fs.readFileSync(path.join(root, "js/core/catalogue/store.js"), "utf8");
const serverCat = fs.readFileSync(path.join(root, "server/lib/catalogues.js"), "utf8");

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(configsCode, sandbox);
const configs = sandbox.window.CatalogueConfigs;

if (!configs?.item?.facets?.some((f) => f.id === "category")) {
  fail("item config missing category facet");
} else {
  pass("item config has category facet");
}

const categoryField = configs.item.sections
  .flatMap((s) => s.fields)
  .find((f) => f.id === "category");
if (!categoryField || categoryField.type !== "select") {
  fail("item category field must be controlled select");
} else {
  const opts = categoryField.options.filter(Boolean);
  for (const c of ITEM_CATEGORIES) {
    if (!opts.includes(c)) fail(`item category options missing ${c}`);
  }
  pass("item category select options cover taxonomy");
}

if (configs.item.groupBy !== "category") fail("item groupBy should be category");
else pass("item groupBy category");

if (!configs.class?.facets?.some((f) => f.id === "entryKind")) fail("class missing entryKind facet");
if (configs.class.groupBy !== "entryKind") fail("class groupBy entryKind");
if (configs.class.groupLabels?.class !== "Classes" || configs.class.groupLabels?.subclass !== "Subclasses") {
  fail("class groupLabels should read Classes / Subclasses");
} else {
  pass("class browsing labels");
}

if (!configs.race?.facets?.some((f) => f.id === "entryKind")) fail("race missing entryKind facet");
if (configs.race.groupLabels?.species !== "Species") fail("race Species label");
if (configs.race.groupLabels?.subspecies !== "Subspecies") fail("race Subspecies label");
else pass("race browsing labels");

for (const type of ["feature", "location", "monster", "spell", "skill"]) {
  if (!Array.isArray(configs[type]?.facets) || !configs[type].facets.length) {
    fail(`${type} missing facets`);
  }
}
pass("feature/location/monster/spell/skill have facets");

const locNpcs = configs.location.sections.flatMap((s) => s.fields).find((f) => f.id === "npcs");
if (locNpcs?.refType !== "npc") fail("location.npcs should use refType npc");
else pass("location entity ref lists configured");

if (!appCode.includes("showWhen") || !appCode.includes("matchesShowWhen")) {
  fail("app.js missing showWhen support");
} else {
  pass("app.js showWhen support");
}
if (!appCode.includes("data-cat-facets-panel") || !appCode.includes("data-cat-facets") || !appCode.includes("groupBy") || !appCode.includes("Uncategorized")) {
  fail("app.js missing facet/group browsing UI");
} else {
  pass("app.js facet/group browsing");
}
if (!appCode.includes("buildSearchHaystack") || !appCode.includes("searchFields")) {
  fail("app.js missing declarative search");
} else {
  pass("app.js declarative search");
}
if (/if\s*\(\s*type\s*===\s*["']item["']\s*\)[\s\S]{0,80}facet/.test(appCode)) {
  fail("app.js appears to hardcode item-only facet logic");
} else {
  pass("facet system is not item-hardcoded");
}

for (const field of [
  "category",
  "entryKind",
  "subclassRefs",
  "parentClassRef",
  "subspeciesRefs",
  "parentSpeciesRef",
  "locationType",
  "classRefs"
]) {
  if (!storeCode.includes(`"${field}"`)) fail(`mergeSeeds missing backfill for ${field}`);
}
pass("mergeSeeds backfills taxonomy fields");
if (!storeCode.includes("legendaryActionRefs")) fail("mergeSeeds should include legendaryActionRefs");
else pass("mergeSeeds legendaryActionRefs");

if (!serverCat.includes('path.join(dataRoot(), "catalogues",') || !serverCat.includes("${safeId}.json")) {
  fail("server catalogues.js flat path pattern missing");
} else {
  pass("server flat storage path pattern");
}

/* Nested category folders must not exist */
for (const bad of [
  "data/catalogues/item/weapons",
  "data/catalogues/item/ingredients",
  "data/catalogues/class/subclasses",
  "data/catalogues/race/subspecies"
]) {
  if (fs.existsSync(path.join(root, bad))) fail(`unexpected category folder ${bad}`);
}
pass("no filesystem category folders");

/* ── Browse helpers (vm) ──────────────────────────────────── */
vm.runInContext(appCode, sandbox);
const helpers = sandbox.window.CatalogueApp?._test;
if (!helpers) {
  fail("CatalogueApp._test helpers not exported");
} else {
  const entries = [
    { id: "a", name: "Longsword", category: "Weapon", rarity: "Common", tags: ["metal"] },
    { id: "b", name: "Heart Cap", category: "Ingredient & Material", rarity: "Uncommon", tags: ["quest"] },
    { id: "c", name: "Mystery", rarity: "Common", tags: [] }
  ];
  const itemCfg = configs.item;
  const filtered = entries.filter(
    (e) =>
      helpers.matchesFacet(e, { id: "category" }, "Weapon") &&
      helpers.buildSearchHaystack(e, itemCfg).includes("long")
  );
  if (filtered.length !== 1 || filtered[0].id !== "a") fail("search + facet combine failed");
  else pass("search and facet filtering combine");

  const groups = new Map();
  entries.forEach((e) => {
    const key = helpers.groupKeyForEntry(e, "category");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  });
  if (!groups.has("") || groups.get("").length !== 1) fail("Uncategorized group missing");
  if (helpers.groupLabel(itemCfg, "") !== "Uncategorized") fail("Uncategorized label");
  else pass("grouping yields Uncategorized");

  if (!helpers.matchesShowWhen({ field: "entryKind", equals: "subclass" }, { entryKind: "subclass" })) {
    fail("showWhen equals broken");
  }
  if (helpers.matchesShowWhen({ field: "entryKind", equals: "subclass" }, { entryKind: "class" })) {
    fail("showWhen equals should fail for class");
  }
  if (!helpers.matchesShowWhen({ field: "entryKind", notEquals: "subclass" }, { entryKind: "class" })) {
    fail("showWhen notEquals broken");
  }
  pass("showWhen equals/notEquals");

  /* Missing category must still be searchable / visible */
  const legacy = { id: "legacy", name: "Old Rope", itemType: "junk" };
  const hay = helpers.buildSearchHaystack(legacy, itemCfg);
  if (!hay.includes("old rope") && !hay.includes("junk")) fail("legacy item without category not searchable");
  else pass("legacy items without category still searchable");

  if (helpers.groupKeyForEntry(legacy, "category") !== "") {
    fail("empty category should group as blank key");
  } else {
    pass("entries without category metadata remain groupable");
  }
}

/* ── Data files ───────────────────────────────────────────── */
const itemDir = path.join(root, "data/catalogues/item");
const itemFiles = fs.readdirSync(itemDir).filter((f) => f.endsWith(".json"));
const requiredSeedItems = {
  "sw-heart-cap-mushrooms": "Ingredient & Material",
  "sw-cartographers-tools": "Tool & Kit",
  "sw-sparkrender-hoard": "Collection & Hoard"
};
for (const file of itemFiles) {
  const data = readJson(path.join(itemDir, file));
  if (data.category != null && data.category !== "" && !ITEM_CATEGORIES.has(data.category)) {
    fail(`item ${data.id} has invalid category: ${data.category}`);
  }
  if (data.tags != null && !Array.isArray(data.tags)) {
    fail(`item ${data.id} tags must be an array when present`);
  }
  const expected = requiredSeedItems[data.id];
  if (expected && data.category !== expected) {
    fail(`seed item ${data.id} expected category ${expected}, got ${data.category}`);
  }
}
pass(`${itemFiles.length} item JSON files load (missing category → Uncategorized OK)`);

const classDir = path.join(root, "data/catalogues/class");
const requiredSubclasses = [
  "subclass-barbarian-berserker",
  "subclass-barbarian-totem-warrior",
  "subclass-wizard-evocation",
  "subclass-cleric-life"
];
for (const id of requiredSubclasses) {
  const filePath = path.join(classDir, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    fail(`missing subclass file ${id}.json`);
    continue;
  }
  const data = readJson(filePath);
  if (data.entryKind !== "subclass") fail(`${id} entryKind != subclass`);
  if (!String(data.parentClassRef || "").startsWith("@class:")) {
    fail(`${id} parentClassRef must use @class:`);
  }
}
pass("required subclass JSON files present with @class: parents");

const barbarian = readJson(path.join(classDir, "class-barbarian.json"));
if (barbarian.entryKind !== "class") fail("class-barbarian entryKind");
if (!Array.isArray(barbarian.subclassRefs) || barbarian.subclassRefs.length < 2) {
  fail("class-barbarian subclassRefs incomplete");
} else {
  pass("class-barbarian has subclassRefs");
}

const raceDir = path.join(root, "data/catalogues/race");
const requiredSubspecies = [
  "subspecies-dwarf-hill",
  "subspecies-dwarf-mountain",
  "subspecies-elf-high",
  "subspecies-elf-wood",
  "subspecies-elf-drow",
  "subspecies-halfling-lightfoot",
  "subspecies-halfling-stout",
  "subspecies-gnome-forest",
  "subspecies-gnome-rock"
];
for (const id of requiredSubspecies) {
  const filePath = path.join(raceDir, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    fail(`missing subspecies file ${id}.json`);
    continue;
  }
  const data = readJson(filePath);
  if (data.entryKind !== "subspecies") fail(`${id} entryKind`);
  if (!String(data.parentSpeciesRef || "").startsWith("@race:")) {
    fail(`${id} parentSpeciesRef must use @race: (never @species:)`);
  }
}
pass("required subspecies JSON files present with @race: parents");

const elf = readJson(path.join(raceDir, "race-elf.json"));
if (elf.entryKind !== "species") fail("race-elf entryKind");
if (!Array.isArray(elf.subspeciesRefs) || elf.subspeciesRefs.length !== 3) {
  fail("race-elf subspeciesRefs");
} else {
  pass("race-elf has subspeciesRefs");
}
if (/High:|Wood:|Drow:/.test(elf.traits || "")) {
  fail("race-elf traits still embed subrace-specific rules");
} else {
  pass("race-elf traits do not embed subrace rules");
}

const locDir = path.join(root, "data/catalogues/location");
for (const file of fs.readdirSync(locDir).filter((f) => f.endsWith(".json"))) {
  const data = readJson(path.join(locDir, file));
  if (!data.locationType) fail(`location ${data.id} missing locationType`);
  if (!Array.isArray(data.tags)) fail(`location ${data.id} missing tags`);
}
pass("location JSON files have locationType + tags");

const monDir = path.join(root, "data/catalogues/monster");
for (const file of fs.readdirSync(monDir).filter((f) => f.endsWith(".json"))) {
  const data = readJson(path.join(monDir, file));
  if (data.tags != null && !Array.isArray(data.tags)) fail(`monster ${data.id} tags must be an array when present`);
}
pass("monster JSON files load (tags optional)");

/* Legacy plain-text location/equipment refs: readable text, not a broken entity-link */
if (!helpers?.renderEntityRefHtml) {
  fail("entity ref renderer should tolerate unknown/plain strings");
} else {
  const plain = helpers.renderEntityRefHtml("Flint knife (custom)", "item");
  const unknown = helpers.renderEntityRefHtml("totally-unknown-id", "item");
  const linked = helpers.renderEntityRefHtml("@item:sw-torch|Torch", "item");
  if (plain.includes("entity-link") || unknown.includes("entity-link")) {
    fail("plain/unknown refs should not render as entity-link");
  } else if (!linked.includes("entity-link") || !linked.includes("sw-torch")) {
    fail("linked @item ref should render entity-link");
  } else if (!plain.includes("Flint knife")) {
    fail("plain string should remain readable");
  } else {
    pass("legacy plain-text refs remain readable");
  }
}

const coreRules = fs.readFileSync(path.join(root, "js/catalogue-seeds/core-rules.js"), "utf8");
if (coreRules.includes("@species:")) fail("core-rules.js contains forbidden @species:");
if (!coreRules.includes("entryKind") || !coreRules.includes("subclassRefs") || !coreRules.includes("subspeciesRefs")) {
  fail("core-rules.js missing taxonomy fields");
} else {
  pass("core-rules.js has taxonomy fields");
}
if (!coreRules.includes("subclass-barbarian-berserker") || !coreRules.includes("subspecies-elf-high")) {
  fail("core-rules.js missing subclass/subspecies seed entries");
} else {
  pass("core-rules.js includes subclass and subspecies seeds");
}
if (!coreRules.includes("@class:class-barbarian") || !coreRules.includes("@race:race-elf")) {
  fail("core-rules parent refs should keep @class:/@race:");
} else {
  pass("legacy @class: / @race: link prefixes preserved");
}

const storm = fs.readFileSync(path.join(root, "js/catalogue-seeds/stormwreck-isle.js"), "utf8");
for (const needle of [
  'id: "sw-moonstone-key"',
  'category: "Adventuring Gear"',
  'locationType: "Island"',
  'id: "sw-clifftop-observatory"',
  'locationType: "Ruin"',
  'id: "sw-violet-fungus"',
  'source: "Stormwreck Isle"'
]) {
  if (!storm.includes(needle)) fail(`stormwreck-isle.js missing ${needle}`);
}
pass("stormwreck-isle.js taxonomy fields present");

/* Legacy catalogue folders redirect; compendium hosts CatalogueApp */
const compendiumHtml = fs.readFileSync(path.join(root, "dm/compendium/index.html"), "utf8");
if (!compendiumHtml.includes("CatalogueApp") || !compendiumHtml.includes("CompendiumApp.init")) {
  fail("compendium missing CatalogueApp host");
}
const folders = {
  item: "item-katalog",
  class: "class-katalog",
  race: "race-katalog",
  feature: "feature-katalog",
  location: "location-katalog",
  monster: "monster-katalog",
  spell: "spell-katalog",
  skill: "skill-katalog"
};
for (const [type, folder] of Object.entries(folders)) {
  const html = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  if (!html.includes("legacy-redirect.js") || !html.includes(`data-type="${type}"`)) {
    fail(`${folder} missing legacy redirect`);
  }
}
pass("legacy catalogue URLs redirect to compendium");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll taxonomy checks passed.");
