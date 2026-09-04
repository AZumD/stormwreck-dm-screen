"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const bestiaryOne = require("../js/catalogue-seeds/compendium-bestiary");
const bestiaryTwo = require("../js/catalogue-seeds/compendium-bestiary-ii");
const fauna = require("../js/catalogue-seeds/compendium-bestiary-fauna");
const npcs = require("../js/catalogue-seeds/compendium-bestiary-npcs");
const itemsOne = require("../js/catalogue-seeds/compendium-items");
const itemsTwo = require("../js/catalogue-seeds/compendium-items-ii");
const loot = require("../js/catalogue-seeds/compendium-items-loot");
const html = read("dm/compendium/index.html");
const seedSync = read("server/lib/catalogue-seed-sync.js");
const svGrowthTwo = read("js/i18n/catalogue-content-sv-library-growth-ii.js");
const monsterExtension = read("js/core/catalogue/monster-extension.js");
const attribution = read("docs/OPEN-CONTENT.md");

assert.strictEqual(npcs.length, 17, "NPC wave has 17 reusable SRD templates");
assert.strictEqual(new Set(npcs.map((seed) => seed.id)).size, npcs.length, "NPC template ids are unique");
assert.ok(npcs.every((seed) => seed.type === "monster" && seed.entry?.id === seed.id), "NPC wave uses canonical monster manifest shape");
assert.ok(npcs.every((seed) => seed.entry?.source === "SRD 5.1 (CC BY 4.0)"), "NPC wave preserves SRD provenance");
assert.ok(npcs.every((seed) => seed.entry?.tags?.includes("npc-template")), "NPC wave is consistently tagged for table discovery");
for (const id of [
  "monster-commoner",
  "monster-guard",
  "monster-acolyte",
  "monster-scout",
  "monster-priest",
  "monster-knight",
  "monster-mage",
  "monster-assassin",
  "monster-archmage"
]) {
  assert.ok(npcs.some((seed) => seed.id === id), `NPC wave includes ${id}`);
}
const mage = npcs.find((seed) => seed.id === "monster-mage").entry;
assert.ok(mage.traits.includes("Spellcasting"), "Mage keeps a table-ready spellcasting summary");
const knight = npcs.find((seed) => seed.id === "monster-knight").entry;
assert.ok(knight.actions.includes("Leadership"), "Knight keeps Leadership");

const allMonsterIds = [...bestiaryOne, ...bestiaryTwo, ...fauna, ...npcs].map((seed) => seed.id);
assert.strictEqual(new Set(allMonsterIds).size, allMonsterIds.length, "all generic bestiary waves remain collision-free");
assert.strictEqual(allMonsterIds.length, 138, "generic SRD bestiary now has 138 entries");

assert.strictEqual(loot.length, 69, "loot wave has 69 trade-good and gemstone entries");
assert.strictEqual(new Set(loot.map((seed) => seed.id)).size, loot.length, "loot ids are unique");
assert.ok(loot.every((seed) => seed.type === "item" && seed.entry?.id === seed.id), "loot wave uses canonical item manifest shape");
assert.ok(loot.every((seed) => seed.entry?.source === "SRD 5.1 (CC BY 4.0)"), "loot wave preserves SRD provenance");
assert.strictEqual(loot.filter((seed) => seed.entry.category === "Trade Good").length, 17, "loot wave has 17 trade goods");
assert.strictEqual(loot.filter((seed) => seed.entry.itemType === "Gemstone").length, 52, "loot wave has 52 gemstones");
for (const id of [
  "item-srd-trade-saffron",
  "item-srd-trade-gold",
  "item-srd-trade-platinum",
  "item-srd-gem-diamond",
  "item-srd-gem-ruby",
  "item-srd-gem-emerald",
  "item-srd-gem-black-opal"
]) {
  assert.ok(loot.some((seed) => seed.id === id), `loot wave includes ${id}`);
}
const platinum = loot.find((seed) => seed.id === "item-srd-trade-platinum").entry;
assert.strictEqual(platinum.value, "500 gp", "Platinum keeps its trade reference value");
const diamond = loot.find((seed) => seed.id === "item-srd-gem-diamond").entry;
assert.strictEqual(diamond.value, "5,000 gp", "Diamond keeps its gemstone value tier");

const allItemIds = [...itemsOne, ...itemsTwo, ...loot].map((seed) => seed.id);
assert.strictEqual(new Set(allItemIds).size, allItemIds.length, "all SRD item waves remain collision-free");
assert.strictEqual(allItemIds.length, 339, "SRD item library now has 339 entries");

for (const script of [
  "compendium-bestiary-npcs.js",
  "compendium-items-loot.js",
  "catalogue-content-sv-library-growth-ii.js"
]) {
  assert.ok(html.includes(script), `Compendium loads ${script}`);
  assert.ok(html.indexOf(script) < html.indexOf("CompendiumApp.init"), `${script} loads before CompendiumApp.init`);
}
assert.ok(html.indexOf("compendium-bestiary-npcs.js") < html.indexOf("catalogue-content-sv-library-growth-ii.js"), "NPC seeds load before their Swedish aliases");
assert.ok(html.indexOf("compendium-items-loot.js") < html.indexOf("catalogue-content-sv-library-growth-ii.js"), "loot seeds load before their Swedish aliases");
assert.ok(seedSync.includes('require("../../js/catalogue-seeds/compendium-bestiary-npcs")'), "server materializes NPC template wave");
assert.ok(seedSync.includes('require("../../js/catalogue-seeds/compendium-items-loot")'), "server materializes loot wave");
assert.ok(attribution.includes("compendium-bestiary-npcs.js"), "open-content attribution covers NPC wave");
assert.ok(attribution.includes("compendium-items-loot.js"), "open-content attribution covers loot wave");
assert.doesNotThrow(() => new vm.Script(svGrowthTwo, { filename: "catalogue-content-sv-library-growth-ii.js" }), "NPC/loot Swedish alias pack parses");
assert.doesNotThrow(() => new vm.Script(monsterExtension, { filename: "monster-extension.js" }), "monster family extension parses");
assert.ok(monsterExtension.includes('config.groupBy = "creatureFamily"'), "large bestiary groups by creature family");
assert.ok(monsterExtension.includes('typeFacet.label = "Family"'), "monster type facet becomes a family facet");
assert.ok(monsterExtension.includes("bootstrapWithMonsterFamily"), "persisted bestiary entries gain family grouping after bootstrap");

const registered = {};
const sandbox = {
  window: {
    CatalogueSeeds: {
      monster: npcs.map((seed) => seed.entry),
      item: loot.map((seed) => seed.entry)
    },
    CatalogueContentI18n: {
      register(type, entries) {
        registered[type] = { ...(registered[type] || {}), ...(entries || {}) };
      }
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(svGrowthTwo, sandbox, { filename: "catalogue-content-sv-library-growth-ii.js" });
assert.strictEqual(Object.keys(registered.monster || {}).length, npcs.length, "Swedish search pack covers every NPC template");
assert.strictEqual(Object.keys(registered.item || {}).length, loot.length, "Swedish search pack covers every loot entry");
assert.ok(registered.monster["monster-guard"].aliases.includes("vakt"), "Swedish search finds Guard as vakt");
assert.ok(registered.monster["monster-assassin"].aliases.includes("lönnmördare"), "Swedish search finds Assassin as lönnmördare");
assert.ok(registered.item["item-srd-trade-gold"].aliases.includes("guld"), "Swedish search finds Gold as guld");
assert.ok(registered.item["item-srd-gem-diamond"].aliases.includes("diamant"), "Swedish search finds Diamond as diamant");
assert.ok(registered.item["item-srd-gem-diamond"].aliases.includes("ädelsten"), "gemstones share a Swedish category alias");

console.log(`compendium library growth III validation passed (${npcs.length} NPCs, ${loot.length} loot; ${allMonsterIds.length}/${allItemIds.length} total generic entries)`);
