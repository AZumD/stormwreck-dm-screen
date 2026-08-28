/**
 * Static checks for PC catalogue ↔ campaign character mirror + player create.
 * Run: node test/validate-pc-catalogue-mirror.js
 */
"use strict";

const path = require("path");
const fs = require("fs");
const assert = require("assert");

const root = path.join(__dirname, "..");
const mirror = require(path.join(root, "server/lib/pc-catalogue-mirror.js"));
const playerSrc = fs.readFileSync(path.join(root, "server/lib/player.js"), "utf8");
const apiSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
const clientSrc = fs.readFileSync(path.join(root, "js/core/player-api-client.js"), "utf8");
const appSrc = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");

let failed = 0;
function pass(msg) {
  console.log("OK:", msg);
}
function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}

try {
  const id = mirror.generatePcId();
  assert.ok(/^pc-[a-z0-9]+-[a-z0-9]+$/i.test(id), "id shape");
  pass("generatePcId shape");
} catch (err) {
  fail(`generatePcId: ${err.message}`);
}

try {
  const entry = mirror.bundleToPcEntry(
    {
      id: "pc-test-1",
      campaign_id: "camp-1",
      name: "Test Hero",
      level: 3,
      portrait_url: "",
      catalogue_pc_id: "pc-test-1",
      sheet: {
        class: "Fighter",
        race: "Human",
        abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 11, cha: 8 },
        ac: 16,
        skillRefs: ["@skill:athletics|Athletics"]
      }
    },
    { hp_current: 22, hp_max: 28 },
    [
      {
        item_id: "item-sword",
        item_name: "Longsword",
        equipped: true,
        custom_name: null,
        custom_item: null
      },
      {
        item_id: null,
        item_name: null,
        equipped: false,
        custom_name: "Lucky rock",
        custom_item: { sourceRef: "Lucky rock" }
      }
    ]
  );
  assert.strictEqual(entry.name, "Test Hero");
  assert.strictEqual(entry.class, "Fighter");
  assert.strictEqual(entry.hpCurrent, 22);
  assert.strictEqual(entry.hpMax, 28);
  assert.strictEqual(entry.str, 16);
  assert.ok(entry.equipment.some((r) => String(r).includes("item-sword")));
  assert.ok(entry.inventory.some((r) => String(r).includes("Lucky rock")));
  pass("bundleToPcEntry maps sheet/state/inventory");
} catch (err) {
  fail(`bundleToPcEntry: ${err.message}`);
}

try {
  const merged = mirror.mergeCatalogueOnlyFields(
    { id: "pc-1", name: "Hero" },
    { tokenImage: "/api/assets/tokens/pc/pc-1" },
    { tokenImage: "/api/assets/tokens/pc/old" }
  );
  assert.strictEqual(merged.tokenImage, "/api/assets/tokens/pc/pc-1");
  assert.strictEqual(merged.name, "Hero");

  const preserved = mirror.mergeCatalogueOnlyFields(
    { id: "pc-1", name: "Hero" },
    {},
    { tokenImage: "/api/assets/tokens/pc/pc-1" }
  );
  assert.strictEqual(preserved.tokenImage, "/api/assets/tokens/pc/pc-1");

  const cleared = mirror.mergeCatalogueOnlyFields(
    { id: "pc-1", tokenImage: "/api/assets/tokens/pc/pc-1" },
    { tokenImage: "" },
    { tokenImage: "/api/assets/tokens/pc/pc-1" }
  );
  assert.strictEqual(cleared.tokenImage, "");
  pass("mergeCatalogueOnlyFields preserves/clears tokenImage");
} catch (err) {
  fail(`mergeCatalogueOnlyFields: ${err.message}`);
}

const mirrorSrc = fs.readFileSync(path.join(root, "server/lib/pc-catalogue-mirror.js"), "utf8");
if (!mirrorSrc.includes("mergeCatalogueOnlyFields") || !mirrorSrc.includes("tokenImage")) {
  fail("pc-catalogue-mirror missing catalogue-only tokenImage merge");
} else pass("mirror preserves catalogue-only tokenImage");

if (!playerSrc.includes("async function createMyCharacter")) fail("player missing createMyCharacter");
else pass("player createMyCharacter present");

if (!playerSrc.includes("mirrorCharacterToCatalogueSafe")) fail("player missing mirror hooks");
else pass("player mirrors on writes");

if (!apiSrc.includes("createMyCharacter")) fail("api missing player create route");
else pass("api player create route present");

if (!apiSrc.includes("upsertPcFromDm")) fail("api missing DM pc upsert mirror");
else pass("api DM pc catalogue upsert uses mirror");

if (!apiSrc.includes("mirror-to-catalogue")) fail("api missing DM remirror route");
else pass("api DM remirror route present");

if (!clientSrc.includes("createCharacter")) fail("player client missing createCharacter");
else pass("player client createCharacter");

if (!appSrc.includes("data-create-character")) fail("player UI missing create CTA");
else pass("player UI create CTA");

for (const d of [
  "docs/README/PC-CATALOGUE-MIRROR.md",
  "docs/README/VALIDATE-PC-CATALOGUE-MIRROR.md"
]) {
  if (!fs.existsSync(path.join(root, d))) fail(`missing ${d}`);
  else pass(`doc ${d}`);
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll pc-catalogue-mirror checks passed.");
