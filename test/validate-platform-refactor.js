/**
 * Platform refactor validation — game systems, campaign participation, player home.
 * Run: node test/validate-platform-refactor.js
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
  "db/migrations/0004_phase6_platform.sql",
  "db/migrations/0005_phase6_platform_cleanup.sql",
  "server/lib/game-systems.js",
  "server/lib/dnd5e-character.js",
  "test/validate-platform-refactor.js",
  "docs/README/GAME-SYSTEMS.md",
  "docs/README/DND5E-CHARACTER.md",
  "docs/README/VALIDATE-PLATFORM-REFACTOR.md"
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
  else pass(`file ${rel}`);
}

const gameSystems = require(path.join(root, "server/lib/game-systems.js"));
const dnd5e = require(path.join(root, "server/lib/dnd5e-character.js"));

if (!gameSystems.getGameSystem("dnd5e")?.name) fail("dnd5e registry missing");
else pass("game system registry contains dnd5e");

const m4 = fs.readFileSync(path.join(root, "db/migrations/0004_phase6_platform.sql"), "utf8");
[
  "game_systems",
  "campaign_characters",
  "system_state",
  "dnd5e",
  "sheet ? 'level'"
].forEach((t) => {
  if (!m4.includes(t)) fail(`0004 migration missing ${t}`);
});
pass("0004 migration structure");

const m5 = fs.readFileSync(path.join(root, "db/migrations/0005_phase6_platform_cleanup.sql"), "utf8");
if (!m5.includes("DROP COLUMN") || !m5.includes("level")) fail("0005 cleanup migration");
else pass("0005 cleanup migration");

const schema = fs.readFileSync(path.join(root, "db/schema.js"), "utf8");
if (!schema.includes("gameSystems") || !schema.includes("campaignCharacters") || !schema.includes("systemState")) {
  fail("drizzle schema missing platform tables");
} else pass("drizzle schema platform exports");

const api = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
/* Routes are regex literals like /^\/api\/player\/characters$/ — do not require unescaped path text. */
const hasCharacterListRoute = /\/api\\\/player\\\/characters\$/.test(api) || /\/api\/player\/characters/.test(api);
const hasCharacterIdRoute =
  /\/api\\\/player\\\/characters\\\/\(\[\^\/\]\+\)/.test(api) ||
  /\/api\/player\/characters\/:/.test(api);
const hasCharacterHandlers =
  api.includes("listAllMyCharacters") &&
  api.includes("createStandaloneCharacter") &&
  api.includes("getMyCharacterDirect");
if (!hasCharacterListRoute || !hasCharacterIdRoute || !hasCharacterHandlers) {
  fail("api missing character-level player routes");
} else pass("character-level player API routes");

const playerHtml = fs.readFileSync(path.join(root, "player/index.html"), "utf8");
if (
  !playerHtml.includes('id="view-home"') ||
  !playerHtml.includes('id="character-list"') ||
  !playerHtml.includes('id="view-character-shell"') ||
  !playerHtml.includes("player-app.js")
) {
  fail("player shell contract broken (home, characters, character workspace)");
} else pass("player shell contract ok");

const clientSrc = fs.readFileSync(path.join(root, "js/core/player-api-client.js"), "utf8");
if (
  !clientSrc.includes("/api/player/characters") ||
  !clientSrc.includes("listCharacters") ||
  !clientSrc.includes("getCharacter")
) {
  fail("player-api-client missing character-level routes");
} else pass("player-api-client character routes");

const gate = fs.readFileSync(path.join(root, "index.html"), "utf8");
if (!gate.includes('href="/dm/"') || !gate.includes('href="/player/"')) {
  fail("frontend index.html gate broken");
} else pass("frontend index.html ok");

const appSrc = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");
if (appSrc.includes("campaigns.length === 1")) fail("player still auto-opens single campaign");
else pass("player always shows home after login");
if (!appSrc.includes('show("home")') || !appSrc.includes("openCharacter")) {
  fail("player missing home/character navigation");
} else pass("player home + character navigation");

const dto = dnd5e.systemStateToPlayerDto(
  dnd5e.normalizeSystemState({
    hp: { current: 7, max: 12, temp: 2 },
    conditions: ["poisoned"],
    inspiration: true
  })
);
if (dto.hpCurrent !== 7 || dto.hpMax !== 12 || !dto.conditions.includes("poisoned")) {
  fail("dnd5e systemState DTO mapping");
} else pass("dnd5e systemState DTO mapping");

try {
  gameSystems.assertCompatibleGameSystems("dnd5e", "coc7e");
  fail("incompatible game system should throw");
} catch (err) {
  if (err.status === 400) pass("incompatible game-system association rejected");
  else fail(`incompatible game system wrong error: ${err.message}`);
}

(async () => {
  if (!process.env.DATABASE_URL) {
    pass("live postgres checks skipped (no DATABASE_URL)");
    if (failed) {
      console.error(`\n${failed} failure(s)`);
      process.exit(1);
    }
    console.log("\nAll platform-refactor static checks passed.");
    return;
  }

  const db = require(path.join(root, "server/lib/db.js"));
  const pool = await db.getPool();

  await pool.query(
    `INSERT INTO game_systems (id, name) VALUES ('dnd5e', 'Dungeons & Dragons 5e')
     ON CONFLICT (id) DO NOTHING`
  );

  const camp = await pool.query(
    "SELECT id, game_system_id FROM campaigns WHERE id = $1 LIMIT 1",
    ["stormwreck-isle"]
  );
  if (!camp.rows.length || camp.rows[0].game_system_id !== "dnd5e") {
    fail("stormwreck campaign not on dnd5e (run db:migrate)");
  } else pass("stormwreck campaign associated with dnd5e");

  const testCharId = `pc-test-platform-${Date.now().toString(36)}`;
  const testUser = await pool.query("SELECT id FROM users LIMIT 1");
  if (testUser.rows.length) {
    await pool.query("BEGIN");
    try {
      await pool.query(
        `INSERT INTO characters (id, name, type, game_system_id, sheet)
         VALUES ($1, 'Platform Test', 'player', 'dnd5e', '{"level":1}'::jsonb)`,
        [testCharId]
      );
      await pool.query(
        `INSERT INTO character_state (character_id, system_state)
         VALUES ($1, '{"hp":{"current":5,"max":5,"temp":0},"conditions":[]}'::jsonb)`,
        [testCharId]
      );
      await pool.query(
        `INSERT INTO character_controllers (character_id, user_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [testCharId, testUser.rows[0].id]
      );
      const solo = await pool.query(
        `SELECT c.id FROM characters c
         LEFT JOIN campaign_characters cc ON cc.character_id = c.id
         WHERE c.id = $1 AND cc.character_id IS NULL`,
        [testCharId]
      );
      if (!solo.rows.length) fail("character without campaign");
      else pass("character can exist without a campaign");

      await pool.query(
        `INSERT INTO campaign_characters (campaign_id, character_id)
         VALUES ('stormwreck-isle', $1) ON CONFLICT DO NOTHING`,
        [testCharId]
      );
      const link = await pool.query(
        "SELECT 1 FROM campaign_characters WHERE campaign_id = $1 AND character_id = $2",
        ["stormwreck-isle", testCharId]
      );
      if (!link.rows.length) fail("campaign_character association");
      else pass("campaign_character association works");

      await pool.query("DELETE FROM campaign_characters WHERE character_id = $1", [testCharId]);
      await pool.query("DELETE FROM character_controllers WHERE character_id = $1", [testCharId]);
      await pool.query("DELETE FROM character_state WHERE character_id = $1", [testCharId]);
      await pool.query("DELETE FROM characters WHERE id = $1", [testCharId]);
      await pool.query("COMMIT");
    } catch (e) {
      await pool.query("ROLLBACK");
      throw e;
    }
  } else {
    pass("live character tests skipped (no users)");
  }

  if (failed) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll platform-refactor checks passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
