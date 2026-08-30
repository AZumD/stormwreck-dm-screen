/**
 * Validates catalogue ref-list pickers (search/add from related catalogues)
 * and PC/NPC equipment vs inventory + skill/feature/spell separation.
 * Run: node test/validate-catalogue-ref-picker.js
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

const configsCode = fs.readFileSync(path.join(root, "js/core/catalogue/configs.js"), "utf8");
const appCode = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/catalogue.css"), "utf8");
const registry = fs.readFileSync(path.join(root, "js/core/entity-registry.js"), "utf8");

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(configsCode, sandbox);
vm.runInContext(appCode, sandbox);
const configs = sandbox.window.CatalogueConfigs;
const helpers = sandbox.window.CatalogueApp._test;

if (!configs.pc.sections.some((s) => s.fields.some((f) => f.id === "inventory" && f.refType === "item"))) {
  fail("PC missing inventory list with item refType");
} else {
  pass("PC inventory is item-linked list");
}
if (!configs.pc.sections.some((s) => s.fields.some((f) => f.id === "equipment" && f.refType === "item"))) {
  fail("PC equipment missing item refType");
} else {
  pass("PC equipment is item-linked list");
}

for (const id of ["skillRefs", "featureRefs", "spellRefs"]) {
  const field = configs.pc.sections.flatMap((s) => s.fields).find((f) => f.id === id);
  if (!field?.refType) fail(`PC missing ${id} ref list`);
}
pass("PC has separate skill/feature/spell ref lists");

for (const id of ["equipment", "inventory", "skillRefs", "featureRefs", "spellRefs"]) {
  const field = configs.npc.sections.flatMap((s) => s.fields).find((f) => f.id === id);
  if (!field?.refType) fail(`NPC missing ${id} ref list`);
}
pass("NPC has equipment/inventory and skill/feature/spell refs");

if (!configs.monster.sections.flatMap((s) => s.fields).some((f) => f.id === "spellRefs" && f.refType === "spell")) {
  fail("monster missing spellRefs");
} else {
  pass("monster has spellRefs");
}

if (!appCode.includes("cat-ref-picker") || !appCode.includes("bindRefPickers") || !appCode.includes("formatStoredRef")) {
  fail("app.js missing ref picker implementation");
} else {
  pass("app.js ref picker present");
}
if (!css.includes(".cat-ref-results[hidden]") || !css.includes("display: none !important")) {
  fail("catalogue.css must hide empty ref results (display:flex must not override hidden)");
} else {
  pass("empty ref results are hidden");
}
if (!appCode.includes("resolveEntityForRef") || !appCode.includes("entity-link")) {
  fail("app.js should resolve refs into entity-link buttons");
} else {
  pass("entity-link resolution helpers present");
}

const related = helpers.collectRelatedTypes(configs.pc);
for (const t of ["item", "skill", "feature", "spell"]) {
  if (!related.includes(t)) fail(`PC related types missing ${t}`);
}
pass("PC relatedTypes derived from ref fields");

const stored = helpers.formatStoredRef("item", { id: "sw-torch", name: "Torch" });
if (stored !== "@item:sw-torch|Torch") fail(`formatStoredRef unexpected: ${stored}`);
else pass("formatStoredRef builds @type:id|Label");

if (!registry.includes("inventory") || !registry.includes('refsBlock("Spells"')) {
  fail("entity-registry should surface inventory/spells for PC/NPC");
} else {
  pass("entity-registry includes inventory and spell refs");
}

const compendiumHtml = fs.readFileSync(path.join(root, "dm/compendium/index.html"), "utf8");
for (const seed of ["core-skills.js", "core-features.js", "core-spells.js", "stormwreck-isle.js"]) {
  if (!compendiumHtml.includes(seed)) fail(`compendium page missing ${seed}`);
}
pass("compendium loads related catalogue seeds");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll catalogue ref-picker checks passed.");
