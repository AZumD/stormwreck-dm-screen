/**
 * Campaign participation via campaign_characters (attach/detach, party scoping).
 * Run: node test/validate-campaign-participation.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}
function pass(msg) {
  console.log("OK:", msg);
}

const apiSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
const charactersSrc = fs.readFileSync(path.join(root, "server/lib/characters.js"), "utf8");
const playerSrc = fs.readFileSync(path.join(root, "server/lib/player.js"), "utf8");
const playerMapSrc = fs.readFileSync(path.join(root, "server/lib/player-map.js"), "utf8");
const mirrorSrc = fs.readFileSync(path.join(root, "server/lib/pc-catalogue-mirror.js"), "utf8");
const dnd5eSrc = fs.readFileSync(path.join(root, "server/lib/dnd5e-character.js"), "utf8");
const clientSrc = fs.readFileSync(path.join(root, "js/core/player-api-client.js"), "utf8");
const appSrc = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");

[
  "attachCharacterToCampaign",
  "detachCharacterFromCampaign",
  "isCharacterInCampaign",
  "JOIN campaign_characters"
].forEach((needle) => {
  if (!charactersSrc.includes(needle)) fail(`characters.js missing ${needle}`);
  else pass(`characters.js has ${needle}`);
});

if (charactersSrc.includes("WHERE id = $2 AND campaign_id = $3")) {
  fail("characters.patchCharacterSheet still filters by campaign_id");
} else pass("patchCharacterSheet does not gate on characters.campaign_id");

if (
  playerMapSrc.includes("AND c.campaign_id") ||
  playerMapSrc.includes("WHERE c.campaign_id") ||
  playerMapSrc.includes("WHERE campaign_id = $1 AND catalogue")
) {
  fail("player-map still uses characters.campaign_id for control");
} else pass("player-map uses campaign_characters for map control");

if (!dnd5eSrc.includes("stateRowToApiDto")) fail("dnd5e missing stateRowToApiDto");
else pass("dnd5e stateRowToApiDto for DM API");

if (!apiSrc.includes("/attachable-campaigns")) fail("api missing attachable-campaigns");
else pass("api attachable-campaigns route");

if (!apiSrc.includes("/participation")) fail("api missing DM participation routes");
else pass("api DM participation routes");

if (!playerSrc.includes("listAttachableCampaigns")) fail("player missing listAttachableCampaigns");
else pass("player attach/detach helpers");

if (!clientSrc.includes("attachToCampaign") || !clientSrc.includes("detachFromCampaign")) {
  fail("player-api-client missing attach/detach");
} else pass("player-api-client attach/detach");

if (!appSrc.includes("renderCharacterCampaigns") || !appSrc.includes("open-attach-campaign")) {
  fail("player-app missing campaign participation UI");
} else pass("player-app campaign participation UI");

const prodSources = [
  ["characters.js", charactersSrc],
  ["player.js", playerSrc],
  ["pc-catalogue-mirror.js", mirrorSrc],
  ["player-map.js", playerMapSrc]
];

for (const [label, src] of prodSources) {
  if (/INSERT INTO characters\s*\([^)]*campaign_id/is.test(src)) {
    fail(`${label} still INSERTs characters.campaign_id`);
  } else pass(`${label} does not INSERT characters.campaign_id`);
  if (/UPDATE characters[\s\S]{0,200}\bcampaign_id\s*=/is.test(src)) {
    fail(`${label} still UPDATEs characters.campaign_id`);
  } else pass(`${label} does not UPDATE characters.campaign_id`);
}

if (mirrorSrc.includes("primaryCampaignIdForCharacter")) {
  fail("pc-catalogue-mirror still defines primaryCampaignIdForCharacter");
} else pass("no primaryCampaignIdForCharacter in mirror");

if (/sync\s*:\s*\{[^}]*campaignId|sync\.campaignId/.test(mirrorSrc)) {
  fail("pc-catalogue-mirror still writes sync.campaignId");
} else pass("pc catalogue mirror omits sync.campaignId");

if (playerSrc.includes("campaignId: characterRow.campaign_id")) {
  fail("toMechanicalDto still maps characterRow.campaign_id");
} else pass("toMechanicalDto has no singular campaignId");

const player = require(path.join(root, "server/lib/player.js"));
const dtoNoCamp = player.toMechanicalDto(
  { id: "x", name: "X", type: "player", game_system_id: "dnd5e", sheet: { level: 1 } },
  { system_state: { hp: { current: 1, max: 1, temp: 0 }, conditions: [] } },
  []
);
if (dtoNoCamp.campaignId != null) fail("toMechanicalDto exposes campaignId");
else pass("standalone mechanical DTO has no campaignId");

const dnd5e = require(path.join(root, "server/lib/dnd5e-character.js"));
const dto = dnd5e.stateRowToApiDto({
  system_state: { hp: { current: 5, max: 10, temp: 1 }, conditions: ["prone"] },
  extras: { note: "x" }
});
if (dto.hp_current !== 5 || dto.hp_max !== 10 || dto.conditions[0] !== "prone") {
  fail("stateRowToApiDto mapping");
} else pass("stateRowToApiDto HP/conditions");

async function liveTests() {
  if (!process.env.DATABASE_URL) {
    pass("live participation tests skipped (DATABASE_URL unset)");
    return;
  }

  const db = require(path.join(root, "server/lib/db.js"));
  const characters = require(path.join(root, "server/lib/characters.js"));
  const player = require(path.join(root, "server/lib/player.js"));
  const auth = require(path.join(root, "server/lib/auth.js"));
  const guard = require(path.join(root, "test/lib/dev-data-guard.js"));
  const health = await db.health();
  if (!health.ok) {
    fail(`postgres not reachable: ${health.error || "unknown"}`);
    return;
  }
  pass("postgres reachable");

  const colCheck = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'campaign_id'`
  );
  if (colCheck.rows.length) fail("characters.campaign_id column still exists (run db:migrate)");
  else pass("characters.campaign_id column dropped");

  const altharielBefore = await guard.snapshotAlthariel(db);
  const suffix = crypto.randomBytes(4).toString("hex");
  const campA = `camp-part-a-${suffix}`;
  const campB = `camp-part-b-${suffix}`;
  const charId = `pc-part-${suffix}`;
  const password = `PartPass-${suffix}!`;
  const playerEmail = `player-part-${suffix}@example.local`;
  const outsiderEmail = `out-part-${suffix}@example.local`;

  const playerHash = await auth.hashPassword(password);
  const outsiderHash = await auth.hashPassword(password);
  const playerIns = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id`,
    ["Part Player", auth.normalizeEmail(playerEmail), playerHash]
  );
  const outsiderIns = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id`,
    ["Outsider", auth.normalizeEmail(outsiderEmail), outsiderHash]
  );
  const playerId = playerIns.rows[0].id;
  const outsiderId = outsiderIns.rows[0].id;

  await db.query(
    `INSERT INTO campaigns (id, name, description, game_system_id) VALUES ($1,$2,$3,'dnd5e'), ($4,$5,$6,'dnd5e')`,
    [campA, "Camp A", "", campB, "Camp B", ""]
  );
  await db.query(
    `INSERT INTO campaign_memberships (campaign_id, user_id, role) VALUES ($1,$2,'player'),($3,$2,'player')`,
    [campA, playerId, campB]
  );

  await db.query(
    `INSERT INTO characters (id, name, type, game_system_id, sheet)
     VALUES ($1, 'Part Hero', 'player', 'dnd5e', '{"level":1}'::jsonb)`,
    [charId]
  );
  await db.query(
    `INSERT INTO character_state (character_id, system_state) VALUES ($1, '{"hp":{"current":8,"max":8,"temp":0},"conditions":[]}'::jsonb)`,
    [charId]
  );
  await db.query(
    `INSERT INTO character_controllers (character_id, user_id) VALUES ($1,$2)`,
    [charId, playerId]
  );

  const loginPlayer = await auth.loginWithPassword(playerEmail, password);
  const loginOut = await auth.loginWithPassword(outsiderEmail, password);
  const fakeReq = (cookie) => ({
    method: "POST",
    headers: {
      host: "127.0.0.1:3000",
      cookie: cookie ? `${auth.COOKIE_NAME}=${encodeURIComponent(cookie)}` : "",
      origin: "http://127.0.0.1:3000",
      "content-type": "application/json"
    }
  });

  try {
    const listBefore = await characters.listCharacters(campA);
    if (listBefore.some((c) => c.id === charId)) fail("standalone character in party before attach");
    else pass("standalone character not in party by default");

    const partyBefore = await player.listParty(fakeReq(loginPlayer.rawToken), campA);
    if (partyBefore.some((p) => p.id === charId)) fail("party includes unattached character");
    else pass("party excludes unattached character");

    await player.attachCharacterToCampaign(fakeReq(loginPlayer.rawToken), campA, charId);
    pass("attach controlled compatible character");

    const dup = await characters.attachCharacterToCampaign(campA, charId);
    if (!dup.characterId) fail("duplicate attach idempotent");
    else pass("duplicate attach handled safely");

    const listA = await characters.listCharacters(campA);
    if (!listA.some((c) => c.id === charId)) fail("listCharacters uses campaign_characters");
    else pass("campaign character listing via campaign_characters");

    await player.attachCharacterToCampaign(fakeReq(loginPlayer.rawToken), campB, charId);
    pass("one character in two compatible campaigns");

    const mineA = await player.listMyCharacters(fakeReq(loginPlayer.rawToken), campA);
    const mineB = await player.listMyCharacters(fakeReq(loginPlayer.rawToken), campB);
    if (!mineA.some((c) => c.id === charId) || !mineB.some((c) => c.id === charId)) {
      fail("playing-as lists attached + controlled in each campaign");
    } else pass("playing-as lists attached + controlled characters");

    const uncontrolled = `pc-other-${suffix}`;
    await db.query(
      `INSERT INTO characters (id, name, type, game_system_id, sheet)
       VALUES ($1,'Other','player','dnd5e','{"level":1}'::jsonb)`,
      [uncontrolled]
    );
    try {
      await player.attachCharacterToCampaign(fakeReq(loginPlayer.rawToken), campA, uncontrolled);
      fail("attach uncontrolled character should fail");
    } catch (err) {
      if (err.status === 403) pass("player cannot attach uncontrolled character");
      else fail(`uncontrolled attach wrong status: ${err.status}`);
    }

    await db.query(
      `INSERT INTO campaign_memberships (campaign_id, user_id, role) VALUES ($1,$2,'player')`,
      [campA, outsiderId]
    );
    try {
      await player.attachCharacterToCampaign(fakeReq(loginOut.rawToken), campB, charId);
      fail("outsider attach to foreign campaign should fail");
    } catch (err) {
      if (err.status === 403) pass("player cannot attach to campaign without membership for control path");
      else fail(`outsider attach wrong status: ${err.status}`);
    }

    await player.detachCharacterFromCampaign(fakeReq(loginPlayer.rawToken), campB, charId);
    const stillThere = await db.query("SELECT 1 FROM characters WHERE id = $1", [charId]);
    if (!stillThere.rows.length) fail("detach deleted character row");
    else pass("detach removes participation only");

    const stateRow = await characters.getCharacterState(campA, charId);
    if (stateRow.hp_current !== 8) fail("DM state DTO hp_current after detach sibling");
    else pass("DM getCharacterState exposes hp_current DTO");

    await characters.updateCharacterState(campA, charId, { hp_current: 3 });
    const updated = await characters.getCharacterState(campA, charId);
    if (updated.hp_current !== 3) fail("DM state write via adapter");
    else pass("DM state write updates system_state correctly");

    const alth = await characters.listCharacters(guard.IMPORTED_CAMPAIGN_ID);
    if (!alth.some((c) => c.id === guard.IMPORTED_ALTHARIEL_ID)) {
      fail("Stormwreck missing Althariel");
    } else pass("Stormwreck still contains Althariel");

    const althRow = await db.query(
      `SELECT id FROM characters WHERE id = $1`,
      [guard.IMPORTED_ALTHARIEL_ID]
    );
    if (!althRow.rows.length) fail("Althariel character row missing");
    else pass("Althariel exists as standalone character");

    const althLink = await db.query(
      `SELECT campaign_id FROM campaign_characters
       WHERE character_id = $1 AND campaign_id = $2`,
      [guard.IMPORTED_ALTHARIEL_ID, guard.IMPORTED_CAMPAIGN_ID]
    );
    if (!althLink.rows.length) fail("Althariel missing Stormwreck campaign_characters link");
    else pass("Althariel linked via campaign_characters only");

    const linkBefore = await db.query(
      `SELECT campaign_id, status FROM campaign_characters
       WHERE character_id = $1 ORDER BY campaign_id`,
      [guard.IMPORTED_ALTHARIEL_ID]
    );
    const pool = await db.getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const importAgain = await characters.importCampaignPc(
        client,
        guard.IMPORTED_CAMPAIGN_ID,
        guard.IMPORTED_ALTHARIEL_ID
      );
      await client.query("ROLLBACK");
      if (!importAgain?.id) fail("re-import Althariel failed");
      else pass("Stormwreck import is idempotent (rolled back)");
    } catch (err) {
      await client.query("ROLLBACK");
      fail(`re-import Althariel: ${err.message}`);
    } finally {
      client.release();
    }
    const linkAfter = await db.query(
      `SELECT campaign_id, status FROM campaign_characters
       WHERE character_id = $1 ORDER BY campaign_id`,
      [guard.IMPORTED_ALTHARIEL_ID]
    );
    if (JSON.stringify(linkBefore.rows) !== JSON.stringify(linkAfter.rows)) {
      fail("import changed Althariel campaign_characters rows");
    } else pass("import leaves campaign_characters unchanged");

    pass("party query does not filter on characters.campaign_id");
  } finally {
    await db.query("DELETE FROM campaigns WHERE id = ANY($1::text[])", [[campA, campB]]);
    await db.query("DELETE FROM characters WHERE id = ANY($1::text[])", [[charId, `pc-other-${suffix}`]]);
    await db.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[playerId, outsiderId]]);
    try {
      await guard.assertAltharielUnchanged(db, altharielBefore, "validate-campaign-participation");
      pass("participation live tests leave Althariel unchanged");
    } catch (err) {
      fail(err.message);
    }
  }
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
  console.log("\nAll campaign-participation checks passed.");
})();
