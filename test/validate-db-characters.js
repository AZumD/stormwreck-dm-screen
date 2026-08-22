/**
 * Phase 2 character DB tests — static wiring always; live Postgres when DATABASE_URL is set.
 * Run: node test/validate-db-characters.js
 */
require("dotenv").config();
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

const required = [
  "server/lib/characters.js",
  "server/lib/entity-ref.js",
  "db/seed-characters.mjs",
  "data/catalogues/pc/pc-mswdvrcy-u6nnt.json",
  "data/campaigns/stormwreck-isle/campaign-state.json"
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
  else pass(`file ${rel}`);
}

const api = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
if (!api.includes('require("../lib/characters")')) fail("api missing characters module");
else pass("api requires characters module");
if (!api.includes("/characters$")) fail("api missing list characters route");
else pass("api list characters route");
if (!api.includes("/state$")) fail("api missing character state route");
else pass("api character state route");
if (!api.includes("/inventory$")) fail("api missing inventory route");
else pass("api inventory route");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (!pkg.scripts?.["db:seed:characters"]) fail("package.json missing db:seed:characters");
else pass("package.json db:seed:characters script");

const { parseEntityRef } = require(path.join(root, "server/lib/entity-ref.js"));
const parsed = parseEntityRef("@item:sw-flint-knife|Flintadolk");
if (parsed?.type !== "item" || parsed.id !== "sw-flint-knife") fail("parseEntityRef item ref");
else pass("parseEntityRef item ref");

const { buildSheetFromPc, mapInventoryRows } = require(path.join(root, "server/lib/characters.js"));
const pc = JSON.parse(
  fs.readFileSync(path.join(root, "data/catalogues/pc/pc-mswdvrcy-u6nnt.json"), "utf8")
);
const sheet = buildSheetFromPc(pc);
if (sheet.class !== "Druid" || sheet.abilities?.wis !== 16) fail("buildSheetFromPc Althariel");
else pass("buildSheetFromPc Althariel");
if (sheet.sourceName !== "Althariel ") fail("buildSheetFromPc preserves raw sourceName");
else pass("buildSheetFromPc preserves raw sourceName");

const inv = mapInventoryRows(pc, new Set(["sw-flint-knife", "sw-raven-chick-skull-focus", "sw-woven-travel-bag"]));
if (inv.length !== 3 || inv.filter((r) => r.itemId).length !== 3) fail("mapInventoryRows equipment");
else pass("mapInventoryRows resolves Althariel equipment");

async function liveTests() {
  if (!process.env.DATABASE_URL) {
    pass("live Postgres tests skipped (DATABASE_URL unset)");
    return;
  }

  const db = require(path.join(root, "server/lib/db.js"));
  const characters = require(path.join(root, "server/lib/characters.js"));
  const health = await db.health();
  if (!health.ok) {
    fail(`postgres not reachable: ${health.error || "unknown"}`);
    return;
  }
  pass("postgres reachable");

  const campaignId = "stormwreck-isle";
  const altharielId = "pc-mswdvrcy-u6nnt";
  const secondId = "pc-test-second-u6nnt";

  await characters.importCampaignPartyPcs(campaignId);
  await characters.importCampaignPartyPcs(campaignId);
  const list1 = await characters.listCharacters(campaignId);
  const althCount = list1.filter((c) => c.id === altharielId).length;
  if (althCount !== 1) fail(`duplicate import created ${althCount} Althariel rows`);
  else pass("idempotent import keeps one Althariel");

  const pool = await db.getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await characters.upsertCharacterFromPc(client, campaignId, {
      id: secondId,
      name: "Test Second",
      class: "Fighter",
      level: 1,
      race: "Human",
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
      hpCurrent: 10,
      hpMax: 10,
      equipment: ["@item:sw-flint-knife|Knife"],
      inventory: []
    });
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const list2 = await characters.listCharacters(campaignId);
  if (list2.filter((c) => c.campaign_id === campaignId).length < 2) {
    fail("expected two characters in campaign");
  } else pass("two characters in same campaign");

  const a = await characters.getCharacter(campaignId, altharielId);
  if (!a || a.catalogue_pc_id !== altharielId) fail("fetch Althariel by campaign+id");
  else pass("fetch Althariel by campaign+id");
  if (a.name !== "Althariel") fail(`canonical name not trimmed: ${JSON.stringify(a.name)}`);
  else pass("canonical name trimmed (Althariel)");

  try {
    await characters.getCharacter(campaignId, "pc-does-not-exist");
    fail("missing character should 404");
  } catch (err) {
    if (err.status === 404) pass("missing character returns 404");
    else fail(`missing character wrong error: ${err.message}`);
  }

  const invA = await characters.listInventory(campaignId, altharielId);
  const invB = await characters.listInventory(campaignId, secondId);
  if (!invA.length || !invB.length) fail("inventory rows missing");
  else if (invA.some((r) => r.character_id !== altharielId)) fail("Althariel inventory scope");
  else if (invB.some((r) => r.character_id !== secondId)) fail("second character inventory scope");
  else pass("inventory scoped to character");

  await characters.updateCharacterState(campaignId, altharielId, { hp_current: 7 });
  const stateA = await characters.getCharacterState(campaignId, altharielId);
  const stateB = await characters.getCharacterState(campaignId, secondId);
  if (stateA.hp_current !== 7) fail("Althariel state update");
  else if (stateB.hp_current === 7) fail("state update leaked to second character");
  else pass("state update isolated per character");

  await clientCleanup(db, secondId);
}

async function clientCleanup(db, characterId) {
  await db.query("DELETE FROM characters WHERE id = $1", [characterId]);
  pass("test second character cleaned up");
}

(async () => {
  try {
    await liveTests();
  } catch (err) {
    fail(`live test error: ${err.message}`);
    console.error(err);
  }

  if (failed) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll db-characters checks passed.");
})();
