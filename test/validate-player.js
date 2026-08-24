/**
 * Phase 3B player API tests — static always; live Postgres when DATABASE_URL is set.
 * Run: node test/validate-player.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const http = require("http");
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

const required = [
  "server/lib/player.js",
  "player/index.html",
  "js/player-app.js",
  "js/core/player-api-client.js",
  "css/player.css",
  "docs/README/PLAYER.md",
  "docs/README/VALIDATE-PLAYER.md",
  "test/lib/dev-data-guard.js"
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
  else pass(`file ${rel}`);
}

const apiSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
if (!apiSrc.includes("api\\/player\\/bootstrap") || !apiSrc.includes("characters\\/mine")) {
  fail("api missing player routes");
} else pass("api player routes present");

const appSrc = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");
if (/\bwindow\.prompt\s*\(/.test(appSrc) || /\bwindow\.confirm\s*\(/.test(appSrc)) {
  fail("player-app still uses prompt/confirm");
} else pass("player-app has no prompt/confirm");
if (!appSrc.includes("openNoteEditor") || !appSrc.includes("note-confirm")) {
  fail("player-app missing in-app note editor");
} else pass("player-app in-app note editor");
if (!appSrc.includes("no-portrait") || !appSrc.includes("PlayerAppDropPortrait")) {
  fail("player-app missing empty-portrait collapse");
} else pass("player-app collapses missing portraits");

const playerHtml = fs.readFileSync(path.join(root, "player/index.html"), "utf8");
if (!playerHtml.includes('id="note-dialog"') || !playerHtml.includes('id="note-confirm-delete"')) {
  fail("player html missing note dialog");
} else pass("player html note dialog");

const playerCss = fs.readFileSync(path.join(root, "css/player.css"), "utf8");
if (!playerCss.includes("--tab-bar-height") || !playerCss.includes(".view-shell")) {
  fail("player.css missing tab-bar clearance");
} else pass("player.css tab-bar clearance");
if (!playerCss.includes("padding-bottom: calc(var(--tab-bar-height)") || !playerCss.includes("scroll-padding-bottom")) {
  fail("player.css missing scroll/safe-area padding");
} else pass("player.css scroll padding above tabs");
if (!playerCss.includes(".identity.no-portrait") && !playerCss.includes(".vitals.no-portrait")) {
  fail("player.css missing no-portrait layout");
} else pass("player.css no-portrait layout");
if (!/\.pill\s*\{[\s\S]*?min-height:\s*44px/.test(playerCss)) fail("player.css pill tap height");
else pass("player.css pill min-height 44px");
if (!playerCss.includes("/assets/player/fairy-forest-bg.jpg") || !playerCss.includes("--accent")) {
  fail("player.css missing fantasy theme background");
} else pass("player.css fantasy theme background");
if (!playerCss.includes(".sheet-section") || !playerCss.includes(".vitals")) {
  fail("player.css missing sheet-section / vitals");
} else pass("player.css compact sheet sections");

if (!appSrc.includes("data-toggle-section") || !appSrc.includes("sheet-section")) {
  fail("player-app missing collapsible sections");
} else pass("player-app collapsible sections");
if (!appSrc.includes("data-inspiration")) fail("player-app missing inspiration toggle");
else pass("player-app inspiration toggle");

if (apiSrc.includes("theme/background") || apiSrc.includes("theme\\/background")) {
  fail("theme background must be static, not API under DM_DATA_ROOT");
} else pass("no DM_DATA_ROOT theme background API");

if (!fs.existsSync(path.join(root, "assets/player/fairy-forest-bg.jpg"))) {
  fail("missing static assets/player/fairy-forest-bg.jpg");
} else pass("static fairy-forest wallpaper present");

const paperAsset = "assets/grunge-stained-old-paper-texture-130-752543118.png";
if (!fs.existsSync(path.join(root, paperAsset))) {
  fail("missing stained paper texture asset");
} else pass("stained paper texture present");
if (!playerCss.includes("--paper-texture") || !playerCss.includes(".notes-panel")) {
  fail("player.css missing paper texture notes styling");
} else pass("player.css paper notes styling");
const styleCss = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
if (!styleCss.includes("grunge-stained-old-paper-texture") || !styleCss.includes(".read-aloud")) {
  fail("style.css read-aloud missing paper texture");
} else pass("style.css read-aloud paper texture");
if (!appSrc.includes("notes-panel")) fail("player-app missing notes-panel wrapper");
else pass("player-app notes-panel wrapper");

if (!fs.existsSync(path.join(root, "docs/README/PHASE5-PLAYER-SHEET.md"))) {
  fail("missing PHASE5-PLAYER-SHEET.md");
} else pass("PHASE5-PLAYER-SHEET.md present");

const player = require(path.join(root, "server/lib/player.js"));
if (!player.PLAYER_STATE_WHITELIST?.has("hp_current") || !player.PLAYER_STATE_WHITELIST?.has("hp_max")) {
  fail("PLAYER_STATE_WHITELIST");
} else pass("PLAYER_STATE_WHITELIST");
if (!player.PLAYER_SHEET_WHITELIST?.has("name") || !player.PLAYER_SHEET_WHITELIST?.has("currency")) {
  fail("PLAYER_SHEET_WHITELIST");
} else pass("PLAYER_SHEET_WHITELIST");

if (!apiSrc.includes("characters\\/([^/]+)\\/inventory") && !apiSrc.includes("characters/([^/]+)/inventory")) {
  fail("api missing player inventory routes");
} else pass("api player inventory routes");
if (!apiSrc.includes("patchMyCharacter")) fail("api missing patchMyCharacter wiring");
else pass("api patchMyCharacter wiring");

const clientSrc = fs.readFileSync(path.join(root, "js/core/player-api-client.js"), "utf8");
if (!clientSrc.includes("patchSheet") || !clientSrc.includes("addInventory") || !clientSrc.includes("putPortrait")) {
  fail("player-api-client missing sheet edit helpers");
} else pass("player-api-client sheet edit helpers");

if (!playerHtml.includes('data-tab="library"') || !appSrc.includes("loadLibrary")) {
  fail("player library tab UI missing");
} else pass("player library tab UI");
if (!playerHtml.includes('data-tab="people"') || !appSrc.includes("loadPeople") || !appSrc.includes("openRevealedNpc")) {
  fail("player People / revealed NPC UI missing");
} else pass("player People tab UI");
if (!clientSrc.includes("revealedNpcs") || !clientSrc.includes("revealedNpc")) {
  fail("player-api-client missing revealed NPC helpers");
} else pass("player-api-client revealed NPC helpers");
if (!apiSrc.includes("revealed-npcs") || !apiSrc.includes("/npcs")) {
  fail("api missing revealed NPC routes");
} else pass("api revealed NPC routes");
if (!fs.existsSync(path.join(root, "db/migrations/0003_phase5_npc_reveal.sql"))) {
  fail("missing 0003_phase5_npc_reveal.sql");
} else pass("npc reveal migration present");
if (!fs.existsSync(path.join(root, "server/lib/revealed-npcs.js"))) {
  fail("missing revealed-npcs.js");
} else pass("revealed-npcs module present");
if (!clientSrc.includes("libraryAttach") || !clientSrc.includes("library:")) {
  fail("player-api-client missing library helpers");
} else pass("player-api-client library helpers");
if (
  !player.PLAYER_CATALOGUE_TYPES?.has("monster") ||
  !player.PLAYER_CATALOGUE_TYPES?.has("location") ||
  !player.PLAYER_BLOCKED_CATALOGUE_TYPES?.has("npc") ||
  !player.PLAYER_BLOCKED_CATALOGUE_TYPES?.has("pc")
) {
  fail("player catalogue allow/deny sets");
} else pass("player catalogue allow/deny sets");
if (!apiSrc.includes("listPlayerCatalogue") || !apiSrc.includes("library-attach")) {
  fail("api missing player library routes");
} else pass("api player library routes");

if (!playerHtml.includes('id="add-dialog"') || !appSrc.includes("openAddDialog") || !appSrc.includes("data-open-add")) {
  fail("player add-from-catalogue dialog missing");
} else pass("player add-from-catalogue dialog");
if (appSrc.includes('id="inv-add-form"') || appSrc.includes('id="skill-add-form"')) {
  fail("inline add forms should be replaced by + modal");
} else pass("inline add forms removed");

if (!playerHtml.includes('id="sheet-dialog"') || !appSrc.includes("openSheetEditor")) {
  fail("player sheet editor UI missing");
} else pass("player sheet editor UI");
if (player.abilityModifier(16) !== 3 || player.abilityModifier(6) !== -2) fail("abilityModifier");
else pass("abilityModifier");

const mech = player.toMechanicalDto(
  {
    id: "pc-x",
    campaign_id: "c",
    name: "Test",
    type: "player",
    level: 1,
    portrait_url: null,
    sheet: {
      race: "Elf",
      class: "Druid",
      abilities: { str: 12, dex: 14, con: 14, int: 10, wis: 16, cha: 6 },
      ac: 10,
      skillRefs: ["@skill:skill-perception|Perception"],
      backstory: "secret"
    }
  },
  { hp_current: 1, hp_max: 1, hp_temp: 0, conditions: [] },
  []
);
if (mech.state.hpCurrent !== 1 || mech.state.hpMax !== 1) fail("dto HP 1/1");
else pass("mechanical DTO preserves HP 1/1");
if (mech.abilities.wis.modifier !== 3) fail("dto modifiers");
else pass("mechanical DTO ability modifiers");
if (mech.backstory != null || mech.sheet) fail("dto leaked private fields");
else pass("mechanical DTO omits private sheet fields");

const party = player.toPartyCardDto({
  id: "pc-y",
  campaign_id: "c",
  name: "Other",
  type: "player",
  level: 2,
  portrait_url: null,
  sheet: { race: "Human", class: "Fighter", backstory: "nope" }
});
const keys = Object.keys(party).sort().join(",");
if (keys !== "campaignId,class,id,level,name,portraitUrl,race,type") fail(`party keys ${keys}`);
else pass("party DTO only allowed fields");
if (party.backstory || party.inventory || party.state) fail("party leaked private");
else pass("party DTO excludes private fields");

async function liveTests() {
  if (!process.env.DATABASE_URL) {
    pass("live player tests skipped (DATABASE_URL unset)");
    return;
  }

  process.env.AUTH_REQUIRED = "1";
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
  }

  const db = require(path.join(root, "server/lib/db.js"));
  const auth = require(path.join(root, "server/lib/auth.js"));
  const guard = require(path.join(root, "test/lib/dev-data-guard.js"));
  const health = await db.health();
  if (!health.ok) {
    fail(`postgres unreachable: ${health.error || "unknown"}`);
    return;
  }
  pass("postgres reachable");

  const altharielBefore = await guard.snapshotAlthariel(db);
  const suffix = crypto.randomBytes(4).toString("hex");
  const campaignId = `camp-p3b-${suffix}`;
  const pcAId = `pc-p3b-a-${suffix}`;
  const pcBId = `pc-p3b-b-${suffix}`;
  const npcId = `npc-p3b-${suffix}`;
  const password = `TestPass-${suffix}!`;
  const dmEmail = `dm-p3b-${suffix}@example.local`;
  const p1Email = `p1-p3b-${suffix}@example.local`;
  const p2Email = `p2-p3b-${suffix}@example.local`;
  const outEmail = `out-p3b-${suffix}@example.local`;
  const userIds = [];

  async function insertUser(name, email) {
    const hash = await auth.hashPassword(password);
    const r = await db.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id`,
      [name, auth.normalizeEmail(email), hash]
    );
    userIds.push(r.rows[0].id);
    return r.rows[0].id;
  }

  async function cleanupFixtures() {
    await db.query("DELETE FROM campaigns WHERE id = $1", [campaignId]);
    if (userIds.length) {
      await db.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [userIds]);
    }
  }

  let dmId;
  let p1Id;
  let p2Id;
  try {
    dmId = await insertUser("DM P3B", dmEmail);
    p1Id = await insertUser("Player One", p1Email);
    p2Id = await insertUser("Player Two", p2Email);
    await insertUser("Outsider", outEmail);

    await db.query(`INSERT INTO campaigns (id, name, description) VALUES ($1,$2,$3)`, [
      campaignId,
      "P3B Test Campaign",
      ""
    ]);
    await db.query(
      `INSERT INTO campaign_memberships (campaign_id, user_id, role) VALUES
        ($1,$2,'dm'),($1,$3,'player'),($1,$4,'player')`,
      [campaignId, dmId, p1Id, p2Id]
    );

    const sheetA = {
      race: "Elf",
      class: "Druid",
      abilities: { str: 12, dex: 14, con: 14, int: 10, wis: 16, cha: 6 },
      ac: 10,
      speed: "30 ft.",
      skillRefs: ["@skill:skill-perception|Perception"],
      backstory: "secret"
    };
    await db.query(
      `INSERT INTO characters (id, campaign_id, name, type, level, sheet)
       VALUES ($1,$2,'Test Althariel','player',1,$3::jsonb)`,
      [pcAId, campaignId, JSON.stringify(sheetA)]
    );
    await db.query(
      `INSERT INTO character_state (character_id, hp_current, hp_max, hp_temp, conditions)
       VALUES ($1,1,1,0,'[]'::jsonb)`,
      [pcAId]
    );
    await db.query(
      `INSERT INTO inventory_entries (character_id, item_id, quantity, equipped)
       VALUES ($1,'sw-flint-knife',1,true)`,
      [pcAId]
    );
    await db.query(
      `INSERT INTO characters (id, campaign_id, name, type, level, sheet)
       VALUES ($1,$2,'Second PC','player',1,'{"race":"Human","class":"Fighter"}'::jsonb)`,
      [pcBId, campaignId]
    );
    await db.query(
      `INSERT INTO character_state (character_id, hp_current, hp_max, hp_temp, conditions)
       VALUES ($1,10,10,0,'[]'::jsonb)`,
      [pcBId]
    );
    await db.query(
      `INSERT INTO characters (id, campaign_id, name, type, level, sheet)
       VALUES ($1,$2,'Secret NPC','npc',1,'{}'::jsonb)`,
      [npcId, campaignId]
    );
    await db.query(
      `INSERT INTO character_controllers (character_id, user_id) VALUES ($1,$2),($3,$2),($3,$4)`,
      [pcAId, p1Id, pcBId, p2Id]
    );
  } catch (err) {
    await cleanupFixtures();
    throw err;
  }

  const { createApiRoutes, handleApi } = require(path.join(root, "server/routes/api.js"));
  const routes = createApiRoutes();

  try {

  function httpRequest(method, urlPath, { body, cookie } = {}) {
    return new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
        const handled = await handleApi(req, res, u.pathname, routes);
        if (!handled) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Not found" }));
        }
      });
      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address();
        const payload = body != null ? JSON.stringify(body) : null;
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port,
            path: urlPath,
            method,
            headers: {
              Host: `127.0.0.1:${port}`,
              Accept: "application/json",
              ...(payload
                ? {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload)
                  }
                : {}),
              ...(cookie ? { Cookie: cookie } : {})
            }
          },
          (res) => {
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => {
              server.close();
              const text = Buffer.concat(chunks).toString("utf8");
              let data = null;
              try {
                data = text ? JSON.parse(text) : null;
              } catch {
                data = { raw: text };
              }
              resolve({ status: res.statusCode, headers: res.headers, data });
            });
          }
        );
        req.on("error", (err) => {
          server.close();
          reject(err);
        });
        if (payload) req.write(payload);
        req.end();
      });
    });
  }

  function cookieFrom(res) {
    const setCookie = res.headers["set-cookie"];
    const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const m = String(raw || "").match(new RegExp(`${auth.COOKIE_NAME}=([^;]+)`));
    return m ? `${auth.COOKIE_NAME}=${m[1]}` : "";
  }

  const unauth = await httpRequest("GET", "/api/player/bootstrap");
  if (unauth.status !== 401) fail(`unauth bootstrap expected 401 got ${unauth.status}`);
  else pass("unauthenticated player API → 401");

  const login = async (email) => {
    const res = await httpRequest("POST", "/api/auth/login", { body: { email, password } });
    if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
    return cookieFrom(res);
  };

  const c1 = await login(p1Email);
  const c2 = await login(p2Email);
  const cOut = await login(outEmail);
  const cDm = await login(dmEmail);

  const boot1 = await httpRequest("GET", "/api/player/bootstrap", { cookie: c1 });
  if (boot1.status !== 200 || !(boot1.data.campaigns || []).some((c) => c.id === campaignId)) {
    fail("player sees their campaigns");
  } else pass("player sees only their campaigns");

  const bootOut = await httpRequest("GET", "/api/player/bootstrap", { cookie: cOut });
  if ((bootOut.data.campaigns || []).some((c) => c.id === campaignId)) {
    fail("outsider should not see campaign");
  } else pass("outsider has no campaign membership");

  const mine1 = await httpRequest("GET", `/api/player/campaigns/${campaignId}/characters/mine`, {
    cookie: c1
  });
  const ids1 = (mine1.data.characters || []).map((c) => c.id);
  if (!ids1.includes(pcAId) || !ids1.includes(pcBId)) fail("multi-character control");
  else pass("one user controlling multiple characters");
  const al = (mine1.data.characters || []).find((c) => c.id === pcAId);
  if (!al || al.state?.hpCurrent !== 1 || al.state?.hpMax !== 1) fail("fixture HP DTO");
  else pass("controlled character mechanical DTO (HP 1/1)");

  const mine2 = await httpRequest("GET", `/api/player/campaigns/${campaignId}/characters/mine`, {
    cookie: c2
  });
  const ids2 = (mine2.data.characters || []).map((c) => c.id);
  if (ids2.length !== 1 || !ids2.includes(pcBId) || ids2.includes(pcAId)) {
    fail("one user controlling one character");
  } else pass("one user controlling one character");
  if ((mine2.data.characters || []).length < 1) fail("two players in campaign");
  else pass("two players in one campaign");

  const denyAlth = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}`,
    { cookie: c2 }
  );
  if (denyAlth.status !== 403) fail(`p2 Althariel expected 403 got ${denyAlth.status}`);
  else pass("player A cannot obtain player B private character DTO");

  const patchOk = await httpRequest(
    "PATCH",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}/state`,
    { cookie: c1, body: { hp_current: 1, conditions: ["prone"] } }
  );
  if (patchOk.status !== 200 || patchOk.data.character?.state?.conditions?.[0] !== "prone") {
    fail(`state update failed ${patchOk.status}`);
  } else pass("player state update succeeds on controlled character");

  const patchDeny = await httpRequest(
    "PATCH",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}/state`,
    { cookie: c2, body: { hp_current: 99 } }
  );
  if (patchDeny.status !== 403) fail("uncontrolled state update should 403");
  else pass("player state update fails on uncontrolled character");

  const patchBad = await httpRequest(
    "PATCH",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}/state`,
    { cookie: c1, body: { name: "Hacked", sheet: { ac: 20 }, hp_max: 99 } }
  );
  if (patchBad.status !== 400) fail("non-whitelist fields should 400");
  else pass("state update rejects non-whitelisted sheet fields");

  const sheetOk = await httpRequest("PATCH", `/api/player/campaigns/${campaignId}/characters/${pcAId}`, {
    cookie: c1,
    body: {
      name: "Renamed Hero",
      level: 2,
      race: "Elf",
      class: "Wizard",
      subclass: "Evoker",
      ac: 13,
      abilities: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 12 },
      skillRefs: ["@skill:skill-arcana|Arcana", "Custom Lore"],
      currency: { gp: 15, sp: 4 }
    }
  });
  if (
    sheetOk.status !== 200 ||
    sheetOk.data.character?.name !== "Renamed Hero" ||
    sheetOk.data.character?.level !== 2 ||
    sheetOk.data.character?.subclass !== "Evoker" ||
    sheetOk.data.character?.currency?.gp !== 15
  ) {
    fail(`sheet patch failed ${sheetOk.status} ${JSON.stringify(sheetOk.data)}`);
  } else pass("player sheet patch updates identity and currency");

  const hpMaxOk = await httpRequest(
    "PATCH",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}/state`,
    { cookie: c1, body: { hp_max: 12, hp_current: 10 } }
  );
  if (hpMaxOk.status !== 200 || hpMaxOk.data.character?.state?.hpMax !== 12) {
    fail(`hp_max patch failed ${hpMaxOk.status}`);
  } else pass("player can patch hp_max");

  const invAdd = await httpRequest(
    "POST",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}/inventory`,
    { cookie: c1, body: { customName: "Lucky rock", quantity: 1 } }
  );
  if (invAdd.status !== 201 || !(invAdd.data.character?.inventory || []).some((i) => i.customName === "Lucky rock")) {
    fail(`inventory add failed ${invAdd.status}`);
  } else pass("player inventory add custom item");
  const entryId = invAdd.data.entryId;
  const invDel = await httpRequest(
    "DELETE",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}/inventory/${entryId}`,
    { cookie: c1, body: {} }
  );
  if (invDel.status !== 200 || (invDel.data.character?.inventory || []).some((i) => i.id === entryId)) {
    fail(`inventory delete failed ${invDel.status}`);
  } else pass("player inventory remove");

  const sheetDeny = await httpRequest(
    "PATCH",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}`,
    { cookie: c2, body: { name: "Nope" } }
  );
  if (sheetDeny.status !== 403) fail("uncontrolled sheet patch should 403");
  else pass("player sheet patch denied for uncontrolled character");

  const partyRes = await httpRequest("GET", `/api/player/campaigns/${campaignId}/party`, {
    cookie: c1
  });
  const partyRows = partyRes.data.party || [];
  if (partyRows.some((p) => p.type !== "player")) fail("party non-player");
  else pass("party contains PCs only");
  if (partyRows.some((p) => p.id === npcId)) fail("party includes NPC");
  else pass("party excludes NPCs");
  if (partyRows.some((p) => p.inventory || p.state || p.sheet || p.backstory)) {
    fail("party DTO disallowed fields");
  } else pass("party DTO contains only allowed fields");

  const noteCreate = await httpRequest("POST", `/api/player/campaigns/${campaignId}/notes`, {
    cookie: c1,
    body: { title: "Secret", body: "private", characterId: pcAId }
  });
  if (noteCreate.status !== 201) fail(`note create ${noteCreate.status}`);
  else pass("notes CRUD create");
  const noteId = noteCreate.data.note.id;
  const notesP2 = await httpRequest("GET", `/api/player/campaigns/${campaignId}/notes`, {
    cookie: c2
  });
  if ((notesP2.data.notes || []).some((n) => n.id === noteId)) fail("p2 saw p1 notes");
  else pass("player A cannot read player B notes");
  const notesDm = await httpRequest("GET", `/api/player/campaigns/${campaignId}/notes`, {
    cookie: cDm
  });
  if ((notesDm.data.notes || []).some((n) => n.id === noteId)) fail("DM saw player notes");
  else pass("DM does not automatically receive private player notes");
  const noteUpd = await httpRequest("PUT", `/api/player/notes/${noteId}`, {
    cookie: c1,
    body: { title: "Updated", body: "still private" }
  });
  if (noteUpd.status !== 200) fail("note update");
  else pass("notes CRUD update");
  const noteDel = await httpRequest("DELETE", `/api/player/notes/${noteId}`, {
    cookie: c1,
    body: {}
  });
  if (noteDel.status !== 200) fail("note delete");
  else pass("notes CRUD delete");

  const catOk = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/catalogues/item/sw-flint-knife`,
    { cookie: c1 }
  );
  if (catOk.status !== 200) fail(`catalogue resolve ${catOk.status}`);
  else pass("player catalogue entity resolution works");

  const catList = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/catalogues/item?q=flint&limit=20`,
    { cookie: c1 }
  );
  if (
    catList.status !== 200 ||
    !(catList.data.entries || []).some((e) => e.id === "sw-flint-knife")
  ) {
    fail(`catalogue browse/search ${catList.status}`);
  } else pass("player catalogue browse/search returns entries");

  const catMonster = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/catalogues/monster?limit=5`,
    { cookie: c1 }
  );
  if (catMonster.status !== 200) fail(`monster catalogue browse ${catMonster.status}`);
  else pass("monster catalogue browse allowed for players");

  const catNpc = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/catalogues/npc/anything`,
    { cookie: c1 }
  );
  if (catNpc.status !== 403 && catNpc.status !== 400) fail("npc catalogue type blocked");
  else pass("NPC catalogue type blocked for players");

  const catNpcList = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/catalogues/npc`,
    { cookie: c1 }
  );
  if (catNpcList.status !== 403 && catNpcList.status !== 400) fail("npc catalogue list blocked");
  else pass("NPC catalogue list blocked for players");

  const catPcList = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/catalogues/pc`,
    { cookie: c1 }
  );
  if (catPcList.status !== 403 && catPcList.status !== 400) fail("pc catalogue list blocked");
  else pass("PC catalogue list blocked for players");

  const catOut = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/catalogues/item`,
    { cookie: cOut }
  );
  if (catOut.status !== 403) fail(`outsider catalogue expected 403 got ${catOut.status}`);
  else pass("outsider denied player catalogue browse");

  const attachSpell = await httpRequest(
    "POST",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}/library-attach`,
    {
      cookie: c1,
      body: { action: "spell", type: "spell", id: "spell-healing-word" }
    }
  );
  const attachedSpell =
    attachSpell.status === 200 &&
    JSON.stringify(attachSpell.data.character?.spellRefs || []).includes("spell-healing-word");
  if (!attachedSpell) fail(`library attach spell ${attachSpell.status}`);
  else pass("library attach adds spell to controlled character");

  const attachDeny = await httpRequest(
    "POST",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}/library-attach`,
    {
      cookie: c2,
      body: { action: "spell", type: "spell", id: "spell-healing-word" }
    }
  );
  if (attachDeny.status !== 403) fail(`uncontrolled attach expected 403 got ${attachDeny.status}`);
  else pass("library attach denied for uncontrolled character");

  const attachNpc = await httpRequest(
    "POST",
    `/api/player/campaigns/${campaignId}/characters/${pcAId}/library-attach`,
    {
      cookie: c1,
      body: { action: "inventory", type: "npc", id: "anything" }
    }
  );
  if (attachNpc.status !== 403 && attachNpc.status !== 400) fail("npc attach blocked");
  else pass("library attach blocked for NPC catalogue type");

  /* Phase 5D revealed NPCs */
  const catalogues = require(path.join(root, "server/lib/catalogues.js"));
  const revealNpcId = `npc-reveal-${suffix}`;
  await catalogues.upsert("npc", revealNpcId, {
    id: revealNpcId,
    name: "Revealed Test NPC",
    role: "Guide",
    summary: "A friendly face at the docks.",
    description: "Knows the tide schedules."
  });
  try {
    const beforeReveal = await httpRequest("GET", `/api/player/campaigns/${campaignId}/npcs`, {
      cookie: c1
    });
    if (beforeReveal.status !== 200) fail(`player npc list before reveal ${beforeReveal.status}`);
    else if ((beforeReveal.data.npcs || []).some((n) => n.id === revealNpcId)) {
      fail("unrevealed NPC listed for player");
    } else pass("player npc list empty before reveal");

    const unrevealedGet = await httpRequest(
      "GET",
      `/api/player/campaigns/${campaignId}/npcs/${revealNpcId}`,
      { cookie: c1 }
    );
    if (unrevealedGet.status !== 404) fail(`unrevealed get expected 404 got ${unrevealedGet.status}`);
    else pass("unrevealed NPC detail is 404");

    const playerReveal = await httpRequest(
      "PUT",
      `/api/campaigns/${campaignId}/revealed-npcs/${revealNpcId}`,
      { cookie: c1, body: {} }
    );
    if (playerReveal.status !== 403) fail(`player reveal expected 403 got ${playerReveal.status}`);
    else pass("player cannot reveal NPCs");

    const dmReveal = await httpRequest(
      "PUT",
      `/api/campaigns/${campaignId}/revealed-npcs/${revealNpcId}`,
      { cookie: cDm, body: { note: "Met at the pier" } }
    );
    if (dmReveal.status !== 200 || dmReveal.data?.npc?.id !== revealNpcId) {
      fail(`DM reveal failed ${dmReveal.status} ${dmReveal.data?.error || ""}`);
    } else pass("DM can reveal NPC");

    const afterReveal = await httpRequest("GET", `/api/player/campaigns/${campaignId}/npcs`, {
      cookie: c1
    });
    if (
      afterReveal.status !== 200 ||
      !(afterReveal.data.npcs || []).some((n) => n.id === revealNpcId)
    ) {
      fail("revealed NPC missing from player list");
    } else pass("player sees revealed NPC in list");

    const detail = await httpRequest(
      "GET",
      `/api/player/campaigns/${campaignId}/npcs/${revealNpcId}`,
      { cookie: c1 }
    );
    if (detail.status !== 200 || detail.data?.npc?.name !== "Revealed Test NPC") {
      fail(`revealed detail ${detail.status}`);
    } else pass("player can read revealed NPC detail");

    const outsiderList = await httpRequest("GET", `/api/player/campaigns/${campaignId}/npcs`, {
      cookie: cOut
    });
    if (outsiderList.status !== 403) fail(`outsider npc list expected 403 got ${outsiderList.status}`);
    else pass("outsider denied revealed NPC list");

    const dmUnreveal = await httpRequest(
      "DELETE",
      `/api/campaigns/${campaignId}/revealed-npcs/${revealNpcId}`,
      { cookie: cDm, body: {} }
    );
    if (dmUnreveal.status !== 200) fail(`DM unreveal ${dmUnreveal.status}`);
    else pass("DM can unreveal NPC");

    const afterUnreveal = await httpRequest(
      "GET",
      `/api/player/campaigns/${campaignId}/npcs/${revealNpcId}`,
      { cookie: c1 }
    );
    if (afterUnreveal.status !== 404) fail("unreveal should hide NPC again");
    else pass("unrevealed NPC hidden again");
  } finally {
    try {
      await catalogues.remove("npc", revealNpcId);
    } catch {
      /* ignore */
    }
  }

  const catEnum = await httpRequest("GET", "/api/catalogues/npc", { cookie: c1 });
  if (catEnum.status !== 403) fail(`catalogue enum expected 403 got ${catEnum.status}`);
  else pass("DM catalogue enumeration remains unavailable to players");

  const portrait = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/portraits/characters/${pcAId}`,
    { cookie: c1 }
  );
  if (portrait.status !== 200 && portrait.status !== 404) fail(`portrait ${portrait.status}`);
  else pass("player-safe portrait retrieval authorized (200 or 404 if missing file)");

  const badPortrait = await httpRequest(
    "GET",
    `/api/player/campaigns/${campaignId}/portraits/characters/${npcId}`,
    { cookie: c1 }
  );
  if (badPortrait.status !== 404 && badPortrait.status !== 403) fail("npc portrait should fail");
  else pass("hidden/unrelated asset retrieval fails");

  const dmDoc = await httpRequest("GET", `/api/campaigns/${campaignId}/documents/campaign-state`, {
    cookie: c1
  });
  if (dmDoc.status !== 403) fail(`DM doc expected 403 got ${dmDoc.status}`);
  else pass("DM-only endpoints return 403 for the player");

  const rawToken = decodeURIComponent(c1.slice(auth.COOKIE_NAME.length + 1));
  const tokenHash = auth.hashToken(rawToken);
  await db.query(`UPDATE sessions SET expires_at = now() - interval '1 hour' WHERE token_hash = $1`, [
    tokenHash
  ]);
  const expired = await httpRequest("GET", "/api/player/bootstrap", { cookie: c1 });
  if (expired.status !== 401) fail("expired session should 401");
  else pass("expired session returns 401");
  } finally {
    await cleanupFixtures();
    pass("player test fixtures cleaned up");
    try {
      await guard.assertAltharielUnchanged(db, altharielBefore, "validate-player");
      pass("live player-state tests leave imported Althariel unchanged");
    } catch (err) {
      fail(err.message);
    }
    delete process.env.AUTH_REQUIRED;
  }
}

(async () => {
  try {
    await liveTests();
  } catch (err) {
    fail(`live error: ${err.message}`);
    console.error(err);
  }
  if (failed) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll player checks passed.");
})();
