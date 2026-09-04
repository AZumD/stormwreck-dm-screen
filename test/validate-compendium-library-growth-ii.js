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
const itemsOne = require("../js/catalogue-seeds/compendium-items");
const itemsTwo = require("../js/catalogue-seeds/compendium-items-ii");
const html = read("dm/compendium/index.html");
const seedSync = read("server/lib/catalogue-seed-sync.js");
const svGrowth = read("js/i18n/catalogue-content-sv-library-growth.js");
const attribution = read("docs/OPEN-CONTENT.md");

assert.strictEqual(fauna.length, 40, "fauna wave has 40 useful SRD beasts");
assert.strictEqual(new Set(fauna.map((seed) => seed.id)).size, fauna.length, "fauna ids are unique");
assert.ok(fauna.every((seed) => seed.type === "monster" && seed.entry?.id === seed.id), "fauna uses canonical monster manifest shape");
assert.ok(fauna.every((seed) => seed.entry?.creatureType === "Beast"), "fauna is explicitly typed as Beast");
assert.ok(fauna.every((seed) => seed.entry?.source === "SRD 5.1 (CC BY 4.0)"), "fauna preserves SRD provenance");
for (const id of [
  "monster-bat",
  "monster-cat",
  "monster-owl",
  "monster-raven",
  "monster-giant-frog",
  "monster-giant-octopus",
  "monster-reef-shark",
  "monster-killer-whale"
]) {
  assert.ok(fauna.some((seed) => seed.id === id), `fauna includes ${id}`);
}
const owl = fauna.find((seed) => seed.id === "monster-owl").entry;
assert.ok(owl.traits.includes("Flyby"), "Owl retains Flyby for familiar table use");
const octopus = fauna.find((seed) => seed.id === "monster-giant-octopus").entry;
assert.ok(octopus.actions.includes("Ink Cloud"), "Giant Octopus retains Ink Cloud");

const allMonsterIds = [...bestiaryOne, ...bestiaryTwo, ...fauna].map((seed) => seed.id);
assert.strictEqual(new Set(allMonsterIds).size, allMonsterIds.length, "generic bestiary waves do not collide");
assert.strictEqual(allMonsterIds.length, 121, "generic SRD bestiary now has 121 entries");

assert.strictEqual(itemsTwo.length, 132, "mundane equipment wave has 132 entries");
assert.strictEqual(new Set(itemsTwo.map((seed) => seed.id)).size, itemsTwo.length, "mundane equipment ids are unique");
assert.ok(itemsTwo.every((seed) => seed.type === "item" && seed.entry?.id === seed.id), "mundane equipment uses canonical item manifest shape");
assert.ok(itemsTwo.every((seed) => seed.entry?.source === "SRD 5.1 (CC BY 4.0)"), "mundane equipment preserves SRD provenance");
for (const id of [
  "item-srd-backpack",
  "item-srd-bedroll",
  "item-srd-crowbar",
  "item-srd-rope-hempen-50-ft",
  "item-srd-smiths-tools",
  "item-srd-druidic-focus-mistletoe",
  "item-srd-saddlebags",
  "item-srd-explorers-pack"
]) {
  assert.ok(itemsTwo.some((seed) => seed.id === id), `mundane equipment includes ${id}`);
}
const backpack = itemsTwo.find((seed) => seed.id === "item-srd-backpack").entry;
assert.ok(backpack.properties.includes("30 lb."), "Backpack keeps capacity quick reference");
const explorerPack = itemsTwo.find((seed) => seed.id === "item-srd-explorers-pack").entry;
assert.ok(explorerPack.properties.includes("tinderbox"), "Explorer's Pack lists its useful contents");
const allItemIds = [...itemsOne, ...itemsTwo].map((seed) => seed.id);
assert.strictEqual(new Set(allItemIds).size, allItemIds.length, "SRD item waves do not collide");
assert.strictEqual(allItemIds.length, 270, "SRD item library now has 270 entries");

for (const script of ["compendium-bestiary-fauna.js", "compendium-items-ii.js"]) {
  assert.ok(html.includes(script), `Compendium loads ${script}`);
  assert.ok(html.indexOf(script) < html.indexOf("CompendiumApp.init"), `${script} loads before CompendiumApp.init`);
}
assert.ok(seedSync.includes('require("../../js/catalogue-seeds/compendium-bestiary-fauna")'), "server materializes fauna wave");
assert.ok(seedSync.includes('require("../../js/catalogue-seeds/compendium-items-ii")'), "server materializes mundane item wave");
assert.ok(attribution.includes("compendium-bestiary-fauna.js"), "open-content attribution covers fauna wave");
assert.ok(attribution.includes("compendium-items-ii.js"), "open-content attribution covers mundane item wave");

const registered = {};
const sandbox = {
  window: {
    CatalogueSeeds: {
      monster: fauna.map((seed) => seed.entry),
      item: itemsTwo.map((seed) => seed.entry)
    },
    CatalogueContentI18n: {
      register(type, entries) {
        registered[type] = { ...(registered[type] || {}), ...(entries || {}) };
      }
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(svGrowth, sandbox, { filename: "catalogue-content-sv-library-growth.js" });
assert.strictEqual(Object.keys(registered.monster || {}).length, fauna.length, "Swedish search pack covers every fauna entry");
assert.strictEqual(Object.keys(registered.item || {}).length, itemsTwo.length, "Swedish search pack covers every new SRD item");
assert.ok(registered.monster["monster-owl"].aliases.includes("uggla"), "Swedish search finds Owl as uggla");
assert.ok(registered.monster["monster-killer-whale"].aliases.includes("späckhuggare"), "Swedish search finds Killer Whale as späckhuggare");
assert.ok(registered.item["item-srd-backpack"].aliases.includes("ryggsäck"), "Swedish search finds Backpack as ryggsäck");
assert.ok(registered.item["item-srd-crowbar"].aliases.includes("kofot"), "Swedish search finds Crowbar as kofot");
assert.ok(registered.item["item-srd-torch"].aliases.includes("fackla"), "Swedish search finds Torch as fackla");

console.log(`compendium library growth II validation passed (${fauna.length} fauna, ${itemsTwo.length} items; ${allMonsterIds.length}/${allItemIds.length} total generic entries)`);
