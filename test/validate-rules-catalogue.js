"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const { CATALOGUE_TYPES } = require(path.join(root, "server", "lib", "ids.js"));
const ruleSeeds = require(path.join(root, "js", "catalogue-seeds", "dm-rules.js"));

assert.ok(CATALOGUE_TYPES.includes("rule"), "server API recognizes the rule catalogue type");
assert.ok(Array.isArray(ruleSeeds), "DM rules seed module exports an array");
assert.ok(ruleSeeds.length >= 35, `expected a useful first cheat-sheet batch, got ${ruleSeeds.length}`);

const ids = new Set();
for (const entry of ruleSeeds) {
  assert.ok(/^rule-[a-z0-9-]+$/.test(entry.id), `rule id is safe: ${entry.id}`);
  assert.ok(!ids.has(entry.id), `rule id is unique: ${entry.id}`);
  ids.add(entry.id);
  assert.ok(String(entry.name || "").trim(), `${entry.id} has a name`);
  assert.ok(String(entry.summary || "").trim(), `${entry.id} has a summary`);
  assert.ok(String(entry.quickReference || "").trim(), `${entry.id} has a quick reference`);
  assert.ok(String(entry.category || "").trim(), `${entry.id} has a category`);
  assert.ok(String(entry.rulesets || "").trim(), `${entry.id} identifies its ruleset`);
  assert.ok(Array.isArray(entry.tags), `${entry.id} has searchable tags`);
}

function byId(id) {
  return ruleSeeds.find((entry) => entry.id === id);
}

const constitution = byId("rule-constitution");
assert.ok(constitution, "Constitution cheat sheet exists");
assert.match(constitution.quickReference, /hit points/i, "Constitution explains HP relevance");
assert.match(constitution.quickReference, /concentration/i, "Constitution explains concentration relevance");
assert.ok(constitution.tags.some((tag) => /health|stamina|concentration/i.test(tag)), "Constitution has practical search aliases");

for (const required of [
  "rule-ability-checks",
  "rule-saving-throws",
  "rule-difficulty-classes",
  "rule-cover",
  "rule-concentration",
  "rule-death-and-dying",
  "rule-surprise",
  "rule-grappling-shoving",
  "rule-movement-speed",
  "rule-difficult-terrain",
  "rule-jumping",
  "rule-falling",
  "rule-conditions",
  "rule-exhaustion",
  "rule-vision-light"
]) {
  assert.ok(byId(required), `common DM-screen rule exists: ${required}`);
}

assert.match(byId("rule-surprise").rulesets, /2014.*2024/i, "Surprise calls out edition differences");
assert.match(byId("rule-exhaustion").editionNotes, /2014/i, "Exhaustion includes 2014 notes");
assert.match(byId("rule-exhaustion").editionNotes, /2024/i, "Exhaustion includes 2024 notes");

const extensionCode = fs.readFileSync(path.join(root, "js/core/catalogue/rule-extension.js"), "utf8");
let registeredType = null;
let registeredConverter = null;
const sandbox = {
  window: {
    CatalogueConfigs: {},
    CatalogueTypes: { TYPES: [] },
    CatalogueSeeds: { rule: ruleSeeds },
    CatalogueStore: {
      isReady: () => false,
      mergeSeeds: async () => 0
    },
    EntityRegistry: {
      register(type, converter) {
        registeredType = type;
        registeredConverter = converter;
        return true;
      },
      build: async () => ({})
    },
    CompendiumApp: {
      LABELS: {},
      GROUPS: [{ id: "rules", label: "Rules", types: ["race", "class", "skill"] }],
      ALL_TYPES: ["race", "class", "skill"]
    },
    I18N: { typeLabels: {} }
  },
  console,
  setInterval: () => 1,
  clearInterval: () => {}
};
vm.createContext(sandbox);
vm.runInContext(extensionCode, sandbox);

const cfg = sandbox.window.CatalogueConfigs.rule;
assert.ok(cfg, "Rules catalogue config is installed");
assert.ok(cfg.searchFields.includes("quickReference"), "quick reference text participates in search");
assert.ok(cfg.searchFields.includes("tags"), "search aliases participate in search");
assert.strictEqual(cfg.groupBy, "category", "Rules are grouped by practical category");
assert.ok(cfg.facets.some((facet) => facet.id === "rulesets"), "Rules can be filtered by ruleset");
assert.strictEqual(registeredType, "rule", "Rules entity converter is registered");
assert.strictEqual(typeof registeredConverter, "function", "Rules entity converter is callable");

const conEntity = registeredConverter(constitution);
assert.strictEqual(conEntity.type, "rule", "converted rule has entity type rule");
assert.match(conEntity.details, /Quick reference/i, "entity detail contains cheat sheet");
assert.ok(conEntity.tags.some((tag) => /constitution/i.test(tag)), "entity search tags contain Constitution terms");
assert.strictEqual(sandbox.window.I18N.typeLabels.rule, "Rule", "command palette gets a Rule type label");
assert.ok(sandbox.window.CompendiumApp.GROUPS[0].types.includes("rule"), "Compendium Rules group contains rule catalogue");
assert.ok(sandbox.window.CompendiumApp.ALL_TYPES.includes("rule"), "Compendium route accepts rule catalogue");

const typesSource = fs.readFileSync(path.join(root, "js/core/catalogue/types.js"), "utf8");
assert.ok(typesSource.includes('id: "rule"'), "catalogue registry contains rule type");
assert.ok(typesSource.includes("dm-rules.js"), "campaign pages load rule seeds for universal search");
assert.ok(typesSource.includes("rule-extension.js"), "campaign pages load rule entity integration");

const seedSyncSource = fs.readFileSync(path.join(root, "server/lib/catalogue-seed-sync.js"), "utf8");
assert.ok(seedSyncSource.includes("dm-rules"), "persistent data seed sync includes rules cheat sheets");
assert.ok(seedSyncSource.includes('type: "rule"'), "rule seeds materialize under data/catalogues/rule");

const compendiumHtml = fs.readFileSync(path.join(root, "dm/compendium/index.html"), "utf8");
assert.ok(compendiumHtml.includes("dm-rules.js"), "Compendium loads rule seeds");
assert.ok(compendiumHtml.includes("rule-extension.js"), "Compendium loads rule config/converter");

const legacyRoute = fs.readFileSync(path.join(root, "rule-katalog/index.html"), "utf8");
assert.ok(legacyRoute.includes('data-type="rule"'), "legacy /rule-katalog route redirects into Compendium");

console.log(`Rules catalogue validation passed (${ruleSeeds.length} cheat sheets)`);
