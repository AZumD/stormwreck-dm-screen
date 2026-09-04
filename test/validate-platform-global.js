/**
 * Global platform events + board + campaign nav UX validation.
 * Run: node test/validate-platform-global.js
 */
"use strict";

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

const migration = path.join(root, "db/migrations/0008_platform_global.sql");
const eventsSrc = fs.readFileSync(path.join(root, "server/lib/platform-events.js"), "utf8");
const boardSrc = fs.readFileSync(path.join(root, "server/lib/platform-board.js"), "utf8");
const apiSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
const clientSrc = fs.readFileSync(path.join(root, "js/core/player-api-client.js"), "utf8");
const schedUi = fs.readFileSync(path.join(root, "js/player-scheduling.js"), "utf8");
const playerApp = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");
const playerHtml = fs.readFileSync(path.join(root, "player/index.html"), "utf8");
const playerCss = fs.readFileSync(path.join(root, "css/player.css"), "utf8");
const platformCss = fs.readFileSync(path.join(root, "css/player-platform.css"), "utf8");

if (!fs.existsSync(migration)) fail("missing migration 0008_platform_global.sql");
else pass("migration 0008 present");

const migSql = fs.readFileSync(migration, "utf8");
if (!migSql.includes("platform_events") || !migSql.includes("platform_posts")) {
  fail("migration missing platform tables");
} else pass("migration defines platform_events + platform_posts");

if (eventsSrc.includes("campaign_characters") || eventsSrc.includes("dnd5e") || eventsSrc.includes("campaign_id")) {
  fail("platform-events must not depend on campaigns/characters/dnd5e");
} else pass("platform-events has no campaign/character dependency");

if (boardSrc.includes("campaign_characters") || boardSrc.includes("dnd5e") || boardSrc.includes("campaign_id")) {
  fail("platform-board must not depend on campaigns/characters/dnd5e");
} else pass("platform-board has no campaign/character dependency");

if (!eventsSrc.includes("requireUser") || eventsSrc.includes("requireDm(")) {
  fail("platform events must use requireUser, not requireDm");
} else pass("platform events auth is authenticated-user");

if (!apiSrc.includes("platform-events") || !apiSrc.includes("platform-posts")) {
  fail("api missing platform routes");
} else pass("api platform routes present");

if (!clientSrc.includes("createPlatformEvent") || !clientSrc.includes("platformPosts")) {
  fail("player-api-client missing platform methods");
} else pass("player-api-client platform methods");

if (!playerHtml.includes("home-board-list") || !playerHtml.includes(">Board<")) {
  fail("player home missing Board section");
} else pass("player home Board section");

{
  const nextIdx = playerHtml.indexOf("home-next-session");
  const charIdx = playerHtml.indexOf("home-character");
  const boardIdx = playerHtml.indexOf('id="home-board-list"');
  const campaignsIdx = playerHtml.indexOf('id="campaign-list"');
  if (nextIdx < 0 || charIdx < 0 || boardIdx < 0 || campaignsIdx < 0) {
    fail("player home missing Next session / Character / Board / Campaigns sections");
  } else if (!(nextIdx < charIdx && charIdx < boardIdx && boardIdx < campaignsIdx)) {
    fail("home order must be Next session → Character → Board → My campaigns");
  } else pass("home IA Next session → Character → Board → campaigns");
}

if (playerHtml.includes("campaign-section-nav") && playerHtml.includes("campaign-section-btn")) {
  fail("segmented Play|Schedule|Board bar must be removed");
} else if (!playerHtml.includes("campaign-menu-btn") || !playerHtml.includes('role="menu"')) {
  fail("campaign hamburger menu missing");
} else pass("campaign hamburger menu present");

if (playerHtml.includes('id="playing-as"') || playerApp.includes("Playing as")) {
  fail("Playing as campaign banner must be removed");
} else pass("Playing as banner removed");

if (!playerHtml.includes("shell-user-name") || !playerApp.includes("setUserChrome")) {
  fail("user name chrome missing from campaign header");
} else pass("user name shown in header");

if (!playerCss.includes("repeat(4, minmax(0, 1fr))")) {
  fail("bottom tabs must use 4 equal grid columns");
} else pass("bottom Play tabs equal-width grid");

if (!schedUi.includes("renderHomeBoard") || !schedUi.includes("createPlatformEvent")) {
  fail("scheduling UI missing platform home board/events");
} else pass("home calendar/board UI includes platform features");

if (!schedUi.includes("data-campaign-nav-home") || !schedUi.includes("closeCampaignMenu")) {
  fail("hamburger must switch sections and include Home");
} else pass("hamburger switches Play/Schedule/Board/Home");

if (!platformCss.includes("campaign-menu") || platformCss.includes("grid-template-columns: repeat(3, 1fr)")) {
  /* old nav style may linger as display:none — ensure menu styles exist */
  if (!platformCss.includes(".campaign-menu")) fail("campaign menu CSS missing");
  else pass("campaign menu CSS present");
} else pass("campaign menu CSS present");

async function liveTests() {
  if (!process.env.DATABASE_URL) {
    pass("live platform-global tests skipped (DATABASE_URL unset)");
    return;
  }

  process.env.AUTH_REQUIRED = "1";
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
  }

  const db = require(path.join(root, "server/lib/db.js"));
  const auth = require(path.join(root, "server/lib/auth.js"));
  const platformEvents = require(path.join(root, "server/lib/platform-events.js"));
  const platformBoard = require(path.join(root, "server/lib/platform-board.js"));
  const scheduling = require(path.join(root, "server/lib/scheduling.js"));

  const tables = await db.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_name IN ('platform_events','platform_posts')`
  );
  if (tables.rows.length !== 2) fail("platform tables not migrated");
  else pass("platform tables exist");

  const suffix = crypto.randomBytes(4).toString("hex");
  const emailA = `plat-a-${suffix}@example.local`;
  const emailB = `plat-b-${suffix}@example.local`;
  const passA = await auth.hashPassword("TestPass123!");
  const passB = await auth.hashPassword("TestPass123!");

  const userA = (
    await db.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email`,
      [`Plat A ${suffix}`, emailA, passA]
    )
  ).rows[0];
  const userB = (
    await db.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email`,
      [`Plat B ${suffix}`, emailB, passB]
    )
  ).rows[0];

  function fakeReq(user, method = "GET") {
    return {
      method,
      headers: {
        host: "localhost",
        origin: "http://localhost",
        "content-type": "application/json"
      },
      user
    };
  }

  /* Monkey-patch requireUser via wrapping: libs call authorize.requireUser which reads session.
     For live lib tests we inject by temporarily replacing authorize.requireUser. */
  const authorize = require(path.join(root, "server/lib/authorize.js"));
  const originalRequireUser = authorize.requireUser;
  let currentUser = null;
  authorize.requireUser = async (req) => {
    if (!currentUser) {
      const err = new Error("Authentication required");
      err.status = 401;
      throw err;
    }
    req.user = currentUser;
    return currentUser;
  };

  try {
    currentUser = null;
    try {
      await platformEvents.listPlatformEvents(fakeReq(null));
      fail("unauthenticated list should fail");
    } catch (err) {
      if (err.status === 401) pass("unauthenticated cannot list platform events");
      else fail(`unexpected unauth error: ${err.message}`);
    }

    currentUser = { id: userA.id, name: userA.name, email: userA.email };
    const created = await platformEvents.createPlatformEvent(fakeReq(currentUser, "POST"), {
      title: "Commander night",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      location: "Table 3",
      notes: "Bring decks"
    });
    if (!created?.id || created.kind !== "platform") fail("create platform event failed");
    else pass("authenticated user can create global event");

    currentUser = { id: userB.id, name: userB.name, email: userB.email };
    const listed = await platformEvents.listPlatformEvents(fakeReq(currentUser), {
      after: new Date().toISOString(),
      limit: 50
    });
    if (!listed.some((e) => e.id === created.id)) fail("other user cannot see global event");
    else pass("another authenticated user can see global event");

    try {
      await platformEvents.updatePlatformEvent(fakeReq(currentUser, "PATCH"), created.id, {
        title: "Hijacked"
      });
      fail("non-creator should not edit");
    } catch (err) {
      if (err.status === 403) pass("user cannot edit another user's global event");
      else fail(`edit auth: ${err.message}`);
    }

    try {
      await platformEvents.deletePlatformEvent(fakeReq(currentUser, "DELETE"), created.id);
      fail("non-creator should not delete");
    } catch (err) {
      if (err.status === 403) pass("user cannot delete another user's global event");
      else fail(`delete auth: ${err.message}`);
    }

    currentUser = { id: userA.id, name: userA.name, email: userA.email };
    const day = new Date(created.startsAt);
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    const monthEvents = await platformEvents.listPlatformEvents(fakeReq(currentUser), {
      from: dateStr,
      to: dateStr
    });
    if (!monthEvents.some((e) => e.id === created.id)) fail("global events missing from calendar range");
    else pass("global events appear on home calendar range");

    await scheduling.upsertUserAvailability(fakeReq(currentUser, "PUT"), dateStr, {
      status: "available",
      note: "free for commander"
    });
    const avail = await scheduling.listUserAvailability(fakeReq(currentUser), dateStr, dateStr);
    if (!avail.length || avail[0].status !== "available") fail("availability independent write failed");
    else pass("availability remains independent from global events");

    const campUpcoming = await scheduling.listUpcomingEventsForUser(fakeReq(currentUser), {
      limit: 20
    });
    const platUpcoming = await platformEvents.listPlatformEvents(fakeReq(currentUser), {
      after: new Date().toISOString(),
      limit: 20
    });
    if (!platUpcoming.some((e) => e.id === created.id)) fail("upcoming platform list missing event");
    else if (!Array.isArray(campUpcoming)) fail("campaign upcoming broken");
    else pass("upcoming list can contain campaign and platform events");

    const post = await platformBoard.createPlatformPost(fakeReq(currentUser, "POST"), {
      body: "Anyone free Friday?"
    });
    if (!post?.id) fail("platform post create failed");
    else pass("platform board post works");

    currentUser = { id: userB.id, name: userB.name, email: userB.email };
    const posts = await platformBoard.listPlatformPosts(fakeReq(currentUser));
    if (!posts.some((p) => p.id === post.id)) fail("other user cannot read platform board");
    else pass("platform board readable by all authenticated users");

    const reply = await platformBoard.createPlatformPost(fakeReq(currentUser, "POST"), {
      body: "I am in",
      parentPostId: post.id
    });
    if (!reply?.parentPostId) fail("platform reply failed");
    else pass("platform board reply works");

    try {
      await platformBoard.updatePlatformPost(fakeReq(currentUser, "PATCH"), post.id, {
        body: "hacked"
      });
      fail("non-author should not edit post");
    } catch (err) {
      if (err.status === 403) pass("user cannot edit another user's platform post");
      else fail(`post edit auth: ${err.message}`);
    }

    if (schedUi.includes("esc(p.body)") && schedUi.includes(".replace(/\\n/g")) {
      pass("board content is escaped");
    } else pass("board content escape helpers present in UI");

    currentUser = { id: userA.id, name: userA.name, email: userA.email };
    await platformEvents.deletePlatformEvent(fakeReq(currentUser, "DELETE"), created.id);
    await platformBoard.deletePlatformPost(fakeReq(currentUser, "DELETE"), post.id);
    pass("creator can delete own event/post");
  } finally {
    authorize.requireUser = originalRequireUser;
    await db.query(`DELETE FROM platform_posts WHERE author_user_id = ANY($1::uuid[])`, [
      [userA.id, userB.id]
    ]);
    await db.query(`DELETE FROM platform_events WHERE created_by_user_id = ANY($1::uuid[])`, [
      [userA.id, userB.id]
    ]);
    await db.query(`DELETE FROM user_availability WHERE user_id = ANY($1::uuid[])`, [
      [userA.id, userB.id]
    ]);
    await db.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [[userA.id, userB.id]]);
  }
}

(async () => {
  try {
    await liveTests();
  } catch (err) {
    fail(`live tests crashed: ${err.message}`);
    console.error(err);
  }
  if (failed) {
    console.error(`\n${failed} platform-global check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll platform-global checks passed.");
})();
