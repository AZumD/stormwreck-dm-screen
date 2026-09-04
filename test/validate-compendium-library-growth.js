"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const monsters = require("../js/catalogue-seeds/compendium-bestiary-ii");
const items = require("../js/catalogue-seeds/compendium-items");
const html = read("dm/compendium/index.html");
const seedSync = read("server/lib/catalogue-seed-sync.js");
const itemExtension = read("js/core/catalogue/item-extension.js");
const svGrowth = read("js/i18n/catalogue-content-sv-library-growth.js");
const attribution = read("docs/OPEN-CONTENT.md");

assert.strictEqual(monsters.length, 48, "second bestiary wave has 48 curated SRD creatures");
assert.strictEqual(new Set(monsters.map((seed) => seed.id)).size, monsters.length, "second bestiary ids are unique");
assert.ok(monsters.every((seed) => seed.type === "monster" && seed.entry?.id === seed.id), "second bestiary uses canonical monster manifest shape");
assert.ok(monsters.every((seed) => seed.entry?.source === "SRD 5.1 (CC BY 4.0)"), "second bestiary preserves SRD provenance");
assert.ok(monsters.some((seed) => seed.id === "monster-basilisk"), "second bestiary includes Basilisk");
assert.ok(monsters.some((seed) => seed.id === "monster-rust-monster"), "second bestiary includes Rust Monster");
assert.ok(monsters.some((seed) => seed.id === "monster-ghost"), "second bestiary includes Ghost");
for (const element of ["air", "earth", "fire", "water"]) {
  assert.ok(monsters.some((seed) => seed.id === `monster-${element}-elemental`), `second bestiary includes ${element} elemental`);
}
const basilisk = monsters.find((seed) => seed.id === "monster-basilisk").entry;
assert.ok(basilisk.traits.includes("Petrifying Gaze"), "Basilisk quick reference keeps its defining gaze");
const ghost = monsters.find((seed) => seed.id === "monster-ghost").entry;
assert.ok(ghost.actions.includes("Possession"), "Ghost quick reference keeps possession");

assert.ok(items.length >= 130, `item expansion should remain substantial; found ${items.length}`);
assert.strictEqual(new Set(items.map((seed) => seed.id)).size, items.length, "item expansion ids are unique");
assert.ok(items.every((seed) => seed.type === "item" && seed.entry?.id === seed.id), "item expansion uses canonical item manifest shape");
assert.ok(items.every((seed) => seed.entry?.source === "SRD 5.1 (CC BY 4.0)"), "item expansion preserves SRD provenance");
for (const id of [
  "item-srd-dagger",
  "item-srd-plate-armor",
  "item-srd-bag-of-holding",
  "item-srd-potion-of-healing",
  "item-srd-immovable-rod",
  "item-srd-sun-blade",
  "item-srd-weapon-plus-3"
]) {
  assert.ok(items.some((seed) => seed.id === id), `item expansion includes ${id}`);
}
const plate = items.find((seed) => seed.id === "item-srd-plate-armor").entry;
assert.ok(plate.properties.includes("AC 18"), "plate armor quick reference includes AC");
const healingPotion = items.find((seed) => seed.id === "item-srd-potion-of-healing").entry;
assert.ok(healingPotion.properties.includes("2d4 + 2"), "healing potion quick reference includes healing dice");
const magicItems = items.filter((seed) => seed.entry.tags.includes("magic"));
assert.ok(magicItems.length >= 60, `item expansion includes a deep magic-item shelf; found ${magicItems.length}`);
const weapons = items.filter((seed) => seed.entry.category === "Weapon");
assert.ok(weapons.length >= 35, `item expansion includes the core weapon shelf; found ${weapons.length}`);

for (const script of [
  "compendium-bestiary-ii.js",
  "compendium-items.js",
  "item-extension.js",
  "catalogue-content-sv-library-growth.js"
]) {
  assert.ok(html.includes(script), `Compendium loads ${script}`);
  assert.ok(html.indexOf(script) < html.indexOf("CompendiumApp.init"), `${script} loads before CompendiumApp.init`);
}
assert.ok(html.indexOf("compendium-items.js") < html.indexOf("catalogue-content-sv-library-growth.js"), "item seeds load before Swedish search aliases");
assert.ok(html.indexOf("item-extension.js") < html.indexOf("catalogue-localization.js"), "item fields exist before catalogue chrome localization runs");

assert.doesNotThrow(() => new vm.Script(itemExtension, { filename: "item-extension.js" }), "item extension parses as JavaScript");
assert.doesNotThrow(() => new vm.Script(svGrowth, { filename: "catalogue-content-sv-library-growth.js" }), "library-growth localization parses as JavaScript");
assert.ok(itemExtension.includes('facet.id === "source"'), "Item catalogue gains a Source facet");
assert.ok(itemExtension.includes('id: "source"'), "Item catalogue exposes source metadata in the editor");
assert.ok(itemExtension.includes('config.searchFields.includes(field)'), "Item catalogue protects search field additions from duplication");

assert.ok(seedSync.includes('require("../../js/catalogue-seeds/compendium-bestiary-ii")'), "server materializes second bestiary wave");
assert.ok(seedSync.includes('require("../../js/catalogue-seeds/compendium-items")'), "server materializes item expansion");
assert.ok(attribution.includes("compendium-bestiary-ii.js"), "open-content attribution covers second bestiary wave");
assert.ok(attribution.includes("compendium-items.js"), "open-content attribution covers item expansion");

const registered = {};
const sandbox = {
  window: {
    CatalogueSeeds: {
      monster: monsters.map((seed) => seed.entry),
      item: items.map((seed) => seed.entry)
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
assert.strictEqual(Object.keys(registered.monster || {}).length, monsters.length, "Swedish search pack covers every second-wave monster");
assert.strictEqual(Object.keys(registered.item || {}).length, items.length, "Swedish search pack covers every SRD item seed");
assert.ok(registered.monster["monster-polar-bear"].aliases.includes("isbjörn"), "Swedish monster search finds polar bear as isbjörn");
assert.ok(registered.item["item-srd-longbow"].aliases.includes("båge"), "Swedish item search finds bow terminology");
assert.ok(registered.item["item-srd-potion-of-healing"].aliases.includes("läkning"), "Swedish item search finds healing terminology");

console.log(`compendium library growth validation passed (${monsters.length} monsters, ${items.length} items)`);
