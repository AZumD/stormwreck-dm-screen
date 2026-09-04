"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const species = require("../js/catalogue-seeds/compendium-species-expansion");
const bestiary = require("../js/catalogue-seeds/compendium-bestiary");
const html = read("dm/compendium/index.html");
const raceExtension = read("js/core/catalogue/race-extension.js");
const monsterExtension = read("js/core/catalogue/monster-extension.js");
const localizationPack = read("js/i18n/catalogue-content-sv-expansion.js");
const seedSync = read("server/lib/catalogue-seed-sync.js");
const attribution = read("docs/OPEN-CONTENT.md");

for (const [file, source] of [
  ["race-extension.js", raceExtension],
  ["monster-extension.js", monsterExtension],
  ["catalogue-content-sv-expansion.js", localizationPack]
]) {
  assert.doesNotThrow(() => new vm.Script(source, { filename: file }), `${file} parses as JavaScript`);
}

assert.strictEqual(species.length, 18, "species expansion keeps the expected curated entry count");
assert.strictEqual(new Set(species.map((seed) => seed.id)).size, species.length, "species expansion ids are unique");
assert.ok(species.every((seed) => seed.type === "race" && seed.entry?.id === seed.id), "species expansion uses canonical race manifest shape");
assert.ok(species.some((seed) => seed.id === "race-grung"), "species expansion includes Grung");
assert.ok(species.some((seed) => seed.id === "race-kender"), "species expansion includes Kender");
assert.ok(species.some((seed) => seed.id === "race-locathah"), "species expansion includes Locathah");
assert.ok(species.some((seed) => seed.id === "race-verdan"), "species expansion includes Verdan");
assert.ok(species.some((seed) => seed.id === "subspecies-genasi-air"), "species expansion includes Genasi lineages");
assert.ok(species.some((seed) => seed.id === "subspecies-shifter-wildhunt"), "species expansion includes Shifter lineages");
assert.ok(species.some((seed) => seed.id === "subspecies-tiefling-infernal"), "species expansion includes 2024 Tiefling legacies");
assert.ok(species.some((seed) => seed.id === "subspecies-aasimar-fallen"), "species expansion includes legacy Aasimar variants");

assert.strictEqual(bestiary.length, 33, "generic bestiary keeps the expected curated entry count");
assert.strictEqual(new Set(bestiary.map((seed) => seed.id)).size, bestiary.length, "generic bestiary ids are unique");
assert.ok(bestiary.every((seed) => seed.type === "monster"), "generic bestiary uses monster manifest entries");
assert.ok(bestiary.every((seed) => seed.entry?.source === "SRD 5.1 (CC BY 4.0)"), "generic bestiary keeps SRD provenance on every entry");
assert.ok(bestiary.every((seed) => seed.entry?.actions != null), "generic bestiary entries expose table-reference action text");
assert.ok(bestiary.some((seed) => seed.id === "monster-mimic"), "generic bestiary includes Mimic");
assert.ok(bestiary.some((seed) => seed.id === "monster-gelatinous-cube"), "generic bestiary includes Gelatinous Cube");
assert.ok(bestiary.some((seed) => seed.id === "monster-owlbear"), "generic bestiary includes Owlbear");

for (const color of ["black", "white", "green", "blue", "red"]) {
  assert.ok(bestiary.some((seed) => seed.id === `monster-young-${color}-dragon`), `generic bestiary includes young ${color} dragon`);
}
const redDragon = bestiary.find((seed) => seed.id === "monster-young-red-dragon").entry;
assert.ok(redDragon.actions.includes("2d10+6 piercing plus 1d6 fire"), "young dragon bite keeps physical and elemental dice separate");
assert.ok(!redDragon.actions.includes("20 (2d10+6 plus 1d6 fire)"), "young dragon bite does not show a misleading combined average");

for (const script of [
  "compendium-species-expansion.js",
  "compendium-bestiary.js",
  "race-extension.js",
  "monster-extension.js",
  "catalogue-content-sv-expansion.js"
]) {
  assert.ok(html.includes(script), `Compendium loads ${script}`);
  assert.ok(html.indexOf(script) < html.indexOf("CompendiumApp.init"), `${script} loads before CompendiumApp.init`);
}

assert.ok(raceExtension.includes('facet.id === "source"'), "Species catalogue gains a Source facet");
assert.ok(raceExtension.includes('id: "rulesets"'), "Species catalogue exposes ruleset metadata");
assert.ok(raceExtension.includes('id: "tags"'), "Species catalogue exposes expansion tags");
assert.ok(monsterExtension.includes('id: "damageVulnerabilities"'), "Monster catalogue exposes damage vulnerabilities");
assert.ok(monsterExtension.includes('"damageVulnerabilities", "damageResistances"'), "Monster search includes damage defense fields");

assert.ok(seedSync.includes('require("../../js/catalogue-seeds/compendium-species-expansion")'), "server materializes species expansion seeds");
assert.ok(seedSync.includes('require("../../js/catalogue-seeds/compendium-bestiary")'), "server materializes generic bestiary seeds");
assert.ok(attribution.includes("System Reference Document 5.1"), "open-content attribution identifies SRD 5.1");
assert.ok(attribution.includes("CC BY 4.0"), "open-content attribution identifies CC BY 4.0");

const localized = {};
const sandbox = {
  window: {
    CatalogueContentI18n: {
      register(type, entries) {
        localized[type] = { ...(localized[type] || {}), ...(entries || {}) };
      }
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(localizationPack, sandbox, { filename: "catalogue-content-sv-expansion.js" });
assert.strictEqual(Object.keys(localized.race || {}).length, 18, "Swedish expansion pack covers every new species/lineage");
assert.strictEqual(Object.keys(localized.monster || {}).length, 33, "Swedish expansion pack covers every new generic monster");
assert.ok(localized.race["race-grung"].aliases.includes("grodfolk"), "Swedish species search includes table-friendly aliases");
assert.ok(localized.monster["monster-skeleton"].aliases.includes("skelett"), "Swedish monster search includes table-friendly aliases");
assert.ok(localized.monster["monster-young-red-dragon"].sv.actions.includes("16d6"), "Swedish dragon quick reference includes breath damage");

console.log("compendium expansion validation passed");
