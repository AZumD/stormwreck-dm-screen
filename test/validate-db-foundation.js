/**
 * Validates Phase 1 DB foundation files (no live Postgres required).
 * Run: node test/validate-db-foundation.js
 */
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
  "db/schema.js",
  "db/migrations/0001_phase1.sql",
  "db/migrate.mjs",
  "db/seed-items.mjs",
  "drizzle.config.js",
  "server/lib/db.js",
  ".env.example",
  "docs/README/DB.md",
  "docs/README/MIGRATION-RAILWAY.md"
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
  else pass(`file ${rel}`);
}

const sql = fs.readFileSync(path.join(root, "db/migrations/0001_phase1.sql"), "utf8");
[
  "CREATE TABLE IF NOT EXISTS users",
  "CREATE TABLE IF NOT EXISTS campaigns",
  "CREATE TABLE IF NOT EXISTS campaign_memberships",
  "CREATE TABLE IF NOT EXISTS characters",
  "CREATE TABLE IF NOT EXISTS character_controllers",
  "CREATE TABLE IF NOT EXISTS character_state",
  "CREATE TABLE IF NOT EXISTS items",
  "CREATE TABLE IF NOT EXISTS inventory_entries",
  "CREATE TABLE IF NOT EXISTS player_notes",
  "stormwreck-isle"
].forEach((token) => {
  if (!sql.includes(token)) fail(`migration missing ${token}`);
});
pass("migration SQL has Phase 1 tables + stormwreck seed");

const schema = fs.readFileSync(path.join(root, "db/schema.js"), "utf8");
if (!schema.includes("inventoryEntries") || !schema.includes("playerNotes")) {
  fail("drizzle schema missing inventory/notes");
} else pass("drizzle schema exports core tables");

const api = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
if (!/db[\\/]+health/.test(api) || !api.includes('require("../lib/db")')) {
  fail("api missing db health wiring");
} else pass("api exposes db health");

const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
if (!envExample.includes("DATABASE_URL")) fail(".env.example missing DATABASE_URL");
else pass(".env.example documents DATABASE_URL");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (!pkg.scripts?.["db:migrate"] || !pkg.scripts?.["db:seed:items"]) {
  fail("package.json missing db scripts");
} else pass("package.json db scripts");

if (!pkg.dependencies?.pg || !pkg.dependencies?.["drizzle-orm"]) {
  fail("package.json missing pg / drizzle-orm (run npm install)");
} else pass("package.json has pg + drizzle-orm");

const seed = fs.readFileSync(path.join(root, "db/seed-items.mjs"), "utf8");
if (!seed.includes("data") || !seed.includes("catalogues") || !seed.includes("item")) {
  fail("seed-items should read data/catalogues/item");
} else pass("seed-items reads item JSON");

/* File mode still works without DATABASE_URL */
const db = require(path.join(root, "server/lib/db.js"));
if (db.isDbConfigured()) {
  pass("DATABASE_URL currently set in environment");
} else {
  pass("db module reports unconfigured without DATABASE_URL");
}

(async () => {
  const health = await db.health();
  if (health.configured === false && health.mode === "file") pass("health file mode when unset");
  else if (health.configured) pass("health postgres mode when configured");
  else fail(`unexpected health ${JSON.stringify(health)}`);

  if (failed) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll db-foundation checks passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
