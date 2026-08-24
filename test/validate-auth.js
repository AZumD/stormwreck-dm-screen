/**
 * Phase 3A auth tests — static wiring always; live Postgres when DATABASE_URL is set.
 * Run: node test/validate-auth.js
 *
 * Live tests temporarily set AUTH_REQUIRED=1 and use isolated bootstrap users.
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
  "server/lib/auth.js",
  "server/lib/authorize.js",
  "db/migrations/0002_phase3_auth.sql",
  "db/bootstrap-auth.mjs",
  "docs/README/AUTH.md"
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
  else pass(`file ${rel}`);
}

const migration = fs.readFileSync(path.join(root, "db/migrations/0002_phase3_auth.sql"), "utf8");
if (!migration.includes("password_hash") || !migration.includes("CREATE TABLE IF NOT EXISTS sessions")) {
  fail("migration 0002 missing password_hash/sessions");
} else pass("migration 0002 has password_hash + sessions");
if (!migration.includes("lower(btrim(email))")) fail("migration missing case-insensitive email index");
else pass("migration case-insensitive email index");

const authSrc = fs.readFileSync(path.join(root, "server/lib/auth.js"), "utf8");
if (!authSrc.includes("normalizeEmail") || !authSrc.includes("isAuthRequired")) {
  fail("auth.js missing core helpers");
} else pass("auth.js core helpers");
if (!authSrc.includes("HttpOnly") || !authSrc.includes("SameSite=Lax")) {
  fail("auth.js missing cookie security flags");
} else pass("auth.js cookie flags");

const authorizeSrc = fs.readFileSync(path.join(root, "server/lib/authorize.js"), "utf8");
[
  "requireUser",
  "requireDm",
  "requireAnyDm",
  "requireCharacterControl",
  "assertMutationSafety"
].forEach((fn) => {
  if (!authorizeSrc.includes(fn)) fail(`authorize missing ${fn}`);
});
pass("authorize helpers present");

const api = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
if (!/auth\\\/login/.test(api) || !/auth\\\/logout/.test(api) || !/auth\\\/me/.test(api)) {
  fail("api missing auth routes");
} else pass("api auth routes");
if (!api.includes("requireAnyDmIfAuthRequired") || !api.includes("requireDmIfAuthRequired")) {
  fail("api missing auth gates");
} else pass("api auth gates on DM routes");

const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
["SESSION_SECRET", "AUTH_REQUIRED", "COOKIE_SECURE", "BOOTSTRAP_DM_EMAIL"].forEach((k) => {
  if (!envExample.includes(k)) fail(`.env.example missing ${k}`);
});
pass(".env.example auth vars");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (!pkg.dependencies?.bcryptjs) fail("package.json missing bcryptjs");
else pass("package.json bcryptjs");
if (!pkg.scripts?.["db:bootstrap:auth"]) fail("package.json missing db:bootstrap:auth");
else pass("package.json db:bootstrap:auth");

const indexSrc = fs.readFileSync(path.join(root, "server/index.js"), "utf8");
if (!indexSrc.includes("validateStartupConfig") && !indexSrc.includes("requireAuthConfig")) {
  fail("server index missing startup/auth config validation");
} else pass("server refuses to start without auth config in production path");

const auth = require(path.join(root, "server/lib/auth.js"));
if (auth.normalizeEmail("  Maja@Example.COM ") !== "maja@example.com") {
  fail("normalizeEmail");
} else pass("normalizeEmail trim+lower");

/* Production fail-closed unit check */
const prevNodeEnv = process.env.NODE_ENV;
const prevAuthReq = process.env.AUTH_REQUIRED;
process.env.NODE_ENV = "production";
delete process.env.AUTH_REQUIRED;
if (!auth.isAuthRequired()) fail("production must require auth");
else pass("production fail-closed AUTH_REQUIRED");
process.env.NODE_ENV = prevNodeEnv || "";
if (prevAuthReq == null) delete process.env.AUTH_REQUIRED;
else process.env.AUTH_REQUIRED = prevAuthReq;

async function liveTests() {
  if (!process.env.DATABASE_URL) {
    pass("live auth tests skipped (DATABASE_URL unset)");
    return;
  }

  process.env.AUTH_REQUIRED = "1";
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
  }

  const db = require(path.join(root, "server/lib/db.js"));
  const authorize = require(path.join(root, "server/lib/authorize.js"));
  const guard = require(path.join(root, "test/lib/dev-data-guard.js"));
  const health = await db.health();
  if (!health.ok) {
    fail(`postgres not reachable: ${health.error || "unknown"}`);
    return;
  }
  pass("postgres reachable");

  /* Ensure migration columns exist */
  await db.query("SELECT password_hash FROM users LIMIT 0");
  await db.query("SELECT token_hash FROM sessions LIMIT 0");
  pass("sessions + password_hash schema present");

  const altharielBefore = await guard.snapshotAlthariel(db);
  const suffix = crypto.randomBytes(4).toString("hex");
  const campaignId = `camp-auth-${suffix}`;
  const dmEmail = `dm-auth-${suffix}@example.local`;
  const playerEmail = `player-auth-${suffix}@example.local`;
  const outsiderEmail = `outsider-auth-${suffix}@example.local`;
  const password = `TestPass-${suffix}!`;
  const characterId = `pc-auth-${suffix}`;

  const dmHash = await auth.hashPassword(password);
  const playerHash = await auth.hashPassword(password);
  const outsiderHash = await auth.hashPassword(password);

  const dmIns = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
    ["Test DM", auth.normalizeEmail(dmEmail), dmHash]
  );
  const playerIns = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
    ["Test Player", auth.normalizeEmail(playerEmail), playerHash]
  );
  const outsiderIns = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
    ["Outsider", auth.normalizeEmail(outsiderEmail), outsiderHash]
  );
  const dmId = dmIns.rows[0].id;
  const playerId = playerIns.rows[0].id;
  const outsiderId = outsiderIns.rows[0].id;

  await db.query(`INSERT INTO campaigns (id, name, description) VALUES ($1, $2, $3)`, [
    campaignId,
    "Auth test campaign",
    ""
  ]);
  await db.query(
    `INSERT INTO campaign_memberships (campaign_id, user_id, role) VALUES ($1, $2, 'dm')`,
    [campaignId, dmId]
  );
  await db.query(
    `INSERT INTO campaign_memberships (campaign_id, user_id, role) VALUES ($1, $2, 'player')`,
    [campaignId, playerId]
  );

  await db.query(
    `INSERT INTO characters (id, campaign_id, name, type, level, sheet)
     VALUES ($1, $2, 'Auth PC', 'player', 1, '{}'::jsonb)`,
    [characterId, campaignId]
  );
  await db.query(
    `INSERT INTO character_controllers (character_id, user_id) VALUES ($1, $2)`,
    [characterId, playerId]
  );

  /* Case-insensitive email uniqueness */
  try {
    await db.query(`INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)`, [
      "Dup",
      auth.normalizeEmail(dmEmail).toUpperCase(),
      dmHash
    ]);
    /* If insert used uppercase without normalize, unique index on lower(btrim) should still catch */
    fail("duplicate email case variant should be rejected");
  } catch (err) {
    if (String(err.message).includes("unique") || err.code === "23505") {
      pass("case-insensitive email uniqueness enforced");
    } else {
      /* Try inserting already-normalized duplicate of same lower email with different casing stored */
      try {
        await db.query(`INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)`, [
          "Dup2",
          `Dm-Auth-${suffix}@Example.Local`,
          dmHash
        ]);
        fail("duplicate mixed-case email should be rejected");
      } catch (err2) {
        if (err2.code === "23505" || String(err2.message).includes("unique")) {
          pass("case-insensitive email uniqueness enforced");
        } else fail(`unexpected email unique error: ${err2.message}`);
      }
    }
  }

  const loginDm = await auth.loginWithPassword(dmEmail.toUpperCase(), password);
  if (!loginDm.rawToken || loginDm.user.email !== auth.normalizeEmail(dmEmail)) {
    fail("login with mixed-case email");
  } else pass("login normalizes email case");

  const tokenHash = auth.hashToken(loginDm.rawToken);
  const sess = await db.query("SELECT token_hash FROM sessions WHERE token_hash = $1", [tokenHash]);
  if (!sess.rows.length) fail("session hash not stored");
  else if (sess.rows[0].token_hash === loginDm.rawToken) fail("raw token stored in DB");
  else pass("session stores hash only");

  const fakeReq = (cookie, method = "GET", headers = {}) => ({
    method,
    headers: {
      host: "127.0.0.1:3000",
      cookie: cookie ? `${auth.COOKIE_NAME}=${encodeURIComponent(cookie)}` : "",
      "content-type": headers["content-type"] || "application/json",
      origin: headers.origin,
      ...headers
    }
  });

  const resolved = await auth.resolveSessionUser(fakeReq(loginDm.rawToken));
  if (!resolved || resolved.id !== dmId) fail("resolveSessionUser");
  else pass("resolveSessionUser");

  /* Expired session */
  await db.query("UPDATE sessions SET expires_at = now() - interval '1 hour' WHERE token_hash = $1", [
    tokenHash
  ]);
  const expired = await auth.resolveSessionUser(fakeReq(loginDm.rawToken));
  if (expired) fail("expired session should not authenticate");
  else pass("expired session rejected");

  const loginDm2 = await auth.loginWithPassword(dmEmail, password);
  const loginPlayer = await auth.loginWithPassword(playerEmail, password);
  const loginOutsider = await auth.loginWithPassword(outsiderEmail, password);

  try {
    await authorize.requireUser(fakeReq(null));
    fail("unauthenticated requireUser should 401");
  } catch (err) {
    if (err.status === 401) pass("unauthenticated requests rejected");
    else fail(`wrong status: ${err.status}`);
  }

  try {
    await authorize.requireCampaignMember(fakeReq(loginOutsider.rawToken), campaignId);
    fail("outsider should not access campaign");
  } catch (err) {
    if (err.status === 403) pass("player/outsider cannot access foreign campaign");
    else fail(`wrong status outsider: ${err.status}`);
  }

  await authorize.requireCampaignMember(fakeReq(loginPlayer.rawToken), campaignId);
  pass("player can access their campaign (membership)");

  await authorize.requireCharacterControl(fakeReq(loginPlayer.rawToken), campaignId, characterId);
  pass("player can access controlled character");

  const otherCharId = `pc-test-other-${suffix}`;
  await db.query(
    `INSERT INTO characters (id, campaign_id, name, type, level, sheet)
     VALUES ($1, $2, 'Other', 'player', 1, '{}'::jsonb)`,
    [otherCharId, campaignId]
  );
  try {
    await authorize.requireCharacterControl(fakeReq(loginPlayer.rawToken), campaignId, otherCharId);
    fail("player should not access uncontrolled character");
  } catch (err) {
    if (err.status === 403) pass("player cannot access another character");
    else fail(`wrong status uncontrolled: ${err.status}`);
  }

  await authorize.requireDm(fakeReq(loginDm2.rawToken), campaignId);
  pass("DM can access campaign");

  try {
    await authorize.requireDm(fakeReq(loginPlayer.rawToken), campaignId);
    fail("player should not pass requireDm");
  } catch (err) {
    if (err.status === 403) pass("player denied DM-only campaign access");
    else fail(`wrong status player dm: ${err.status}`);
  }

  await authorize.requireAnyDm(fakeReq(loginDm2.rawToken));
  pass("requireAnyDm for DM");

  try {
    await authorize.requireAnyDm(fakeReq(loginPlayer.rawToken));
    fail("player should not pass requireAnyDm");
  } catch (err) {
    if (err.status === 403) pass("player denied global DM catalogue APIs");
    else fail(`wrong status anyDm: ${err.status}`);
  }

  /* CSRF: cross-origin Origin rejected */
  try {
    authorize.assertMutationSafety(
      fakeReq(loginDm2.rawToken, "POST", {
        origin: "https://evil.example",
        "content-type": "application/json"
      })
    );
    fail("cross-origin should be rejected");
  } catch (err) {
    if (err.status === 403) pass("cross-origin Origin rejected");
    else fail(`wrong csrf status: ${err.status}`);
  }

  try {
    authorize.assertMutationSafety(
      fakeReq(loginDm2.rawToken, "POST", {
        "content-type": "text/plain"
      })
    );
    fail("non-json content-type should be rejected");
  } catch (err) {
    if (err.status === 415) pass("mutation requires application/json");
    else fail(`wrong content-type status: ${err.status}`);
  }

  authorize.assertMutationSafety(
    fakeReq(loginDm2.rawToken, "POST", {
      origin: "http://127.0.0.1:3000",
      "content-type": "application/json"
    })
  );
  pass("same-origin JSON mutation allowed");

  /* Multi-character controller */
  const secondChar = `pc-test-second-${suffix}`;
  await db.query(
    `INSERT INTO characters (id, campaign_id, name, type, level, sheet)
     VALUES ($1, $2, 'Second', 'player', 1, '{}'::jsonb)`,
    [secondChar, campaignId]
  );
  await db.query(
    `INSERT INTO character_controllers (character_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [secondChar, playerId]
  );
  await authorize.requireCharacterControl(fakeReq(loginPlayer.rawToken), campaignId, characterId);
  await authorize.requireCharacterControl(fakeReq(loginPlayer.rawToken), campaignId, secondChar);
  pass("one user controlling multiple characters");

  /* Multi-player campaign */
  const player2Email = `player2-auth-${suffix}@example.local`;
  const p2Hash = await auth.hashPassword(password);
  const p2 = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
    ["Player Two", auth.normalizeEmail(player2Email), p2Hash]
  );
  await db.query(
    `INSERT INTO campaign_memberships (campaign_id, user_id, role) VALUES ($1, $2, 'player')`,
    [campaignId, p2.rows[0].id]
  );
  const loginP2 = await auth.loginWithPassword(player2Email, password);
  await authorize.requireCampaignMember(fakeReq(loginP2.rawToken), campaignId);
  pass("one campaign containing multiple players");

  /* Logout invalidates */
  await auth.destroySessionByToken(loginPlayer.rawToken);
  const afterLogout = await auth.resolveSessionUser(fakeReq(loginPlayer.rawToken));
  if (afterLogout) fail("logout should invalidate session");
  else pass("logout/session invalidation");

  /* HTTP route smoke: login sets cookie, me works, logout clears */
  const { createApiRoutes, handleApi } = require(path.join(root, "server/routes/api.js"));
  const routes = createApiRoutes();

  function httpRequest(method, urlPath, { body, cookie, origin } = {}) {
    return new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        const handled = await handleApi(req, res, urlPath, routes);
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
              ...(cookie ? { Cookie: cookie } : {}),
              ...(origin ? { Origin: origin } : {})
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
              resolve({
                status: res.statusCode,
                headers: res.headers,
                data
              });
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

  const loginRes = await httpRequest("POST", "/api/auth/login", {
    body: { email: dmEmail, password },
    origin: null
  });
  /* Login without Origin is OK (same-site navigations / curl); Content-Type required */
  if (loginRes.status !== 200 || !loginRes.data?.ok) {
    /* Retry with Origin matching host — assertMutationSafety allows missing Origin */
    fail(`login HTTP failed: ${loginRes.status} ${JSON.stringify(loginRes.data)}`);
  } else {
    const setCookie = loginRes.headers["set-cookie"];
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    if (!cookieStr || !cookieStr.includes("HttpOnly") || !cookieStr.includes(auth.COOKIE_NAME)) {
      fail("login Set-Cookie missing HttpOnly session");
    } else pass("login HTTP sets HttpOnly session cookie");

    const cookieVal = cookieStr.match(new RegExp(`${auth.COOKIE_NAME}=([^;]+)`));
    const meRes = await httpRequest("GET", "/api/auth/me", {
      cookie: `${auth.COOKIE_NAME}=${cookieVal[1]}`
    });
    if (meRes.status !== 200 || meRes.data?.user?.id !== dmId) fail("GET /api/auth/me");
    else pass("GET /api/auth/me");

    const unauthChars = await httpRequest("GET", `/api/campaigns/${campaignId}/characters`);
    if (unauthChars.status !== 401) fail(`unauth characters expected 401 got ${unauthChars.status}`);
    else pass("unauthenticated character API rejected when AUTH_REQUIRED");

    const unauthCat = await httpRequest("GET", "/api/catalogues/npc");
    if (unauthCat.status !== 401) fail(`unauth catalogue expected 401 got ${unauthCat.status}`);
    else pass("unauthenticated catalogue API rejected when AUTH_REQUIRED");

    const playerCookieLogin = await httpRequest("POST", "/api/auth/login", {
      body: { email: playerEmail, password }
    });
    const pCookie = (Array.isArray(playerCookieLogin.headers["set-cookie"])
      ? playerCookieLogin.headers["set-cookie"][0]
      : playerCookieLogin.headers["set-cookie"]
    ).match(new RegExp(`${auth.COOKIE_NAME}=([^;]+)`));
    const playerCat = await httpRequest("GET", "/api/catalogues/npc", {
      cookie: `${auth.COOKIE_NAME}=${pCookie[1]}`
    });
    if (playerCat.status !== 403) fail(`player catalogue expected 403 got ${playerCat.status}`);
    else pass("player blocked from DM catalogue list API");

    const dmChars = await httpRequest("GET", `/api/campaigns/${campaignId}/characters`, {
      cookie: `${auth.COOKIE_NAME}=${cookieVal[1]}`
    });
    if (dmChars.status !== 200 || !dmChars.data?.ok) fail("DM character list when AUTH_REQUIRED");
    else pass("DM can list campaign characters when AUTH_REQUIRED");

    const logoutRes = await httpRequest("POST", "/api/auth/logout", {
      cookie: `${auth.COOKIE_NAME}=${cookieVal[1]}`,
      body: {}
    });
    if (logoutRes.status !== 200) fail("logout HTTP");
    else {
      const meAfter = await httpRequest("GET", "/api/auth/me", {
        cookie: `${auth.COOKIE_NAME}=${cookieVal[1]}`
      });
      if (meAfter.status !== 401) fail("session should be dead after logout");
      else pass("HTTP logout invalidates session");
    }
  }

  /* Cleanup isolated test campaign + users (cascade sessions/memberships/controllers) */
  await db.query("DELETE FROM campaigns WHERE id = $1", [campaignId]);
  await db.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
    [dmId, playerId, outsiderId, p2.rows[0].id]
  ]);
  pass("auth test fixtures cleaned up");
  try {
    await guard.assertAltharielUnchanged(db, altharielBefore, "validate-auth");
    pass("auth live tests leave imported Althariel unchanged");
  } catch (err) {
    fail(err.message);
  }

  delete process.env.AUTH_REQUIRED;
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
  console.log("\nAll auth checks passed.");
})();
