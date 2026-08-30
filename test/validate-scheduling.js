/**
 * Platform scheduling + campaign board validation.
 * Run: node test/validate-scheduling.js
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
  failed++;
}
function pass(msg) {
  console.log("OK:", msg);
}

const schedulingSrc = fs.readFileSync(path.join(root, "server/lib/scheduling.js"), "utf8");
const boardSrc = fs.readFileSync(path.join(root, "server/lib/campaign-board.js"), "utf8");
const apiSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
const clientSrc = fs.readFileSync(path.join(root, "server/lib/datetime.js"), "utf8");
const playerAppSrc = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");
const schedUiSrc = fs.readFileSync(path.join(root, "js/player-scheduling.js"), "utf8");
const playerHtml = fs.readFileSync(path.join(root, "player/index.html"), "utf8");
const apiClientSrc = fs.readFileSync(path.join(root, "js/core/player-api-client.js"), "utf8");

if (!fs.existsSync(path.join(root, "db/migrations/0007_scheduling.sql"))) {
  fail("missing migration 0007_scheduling.sql");
} else pass("migration 0007 present");

[
  "user_availability",
  "campaign_events",
  "campaign_event_rsvps",
  "campaign_posts"
].forEach((t) => {
  const sql = fs.readFileSync(path.join(root, "db/migrations/0007_scheduling.sql"), "utf8");
  if (!sql.includes(t)) fail(`migration missing ${t}`);
  else pass(`migration defines ${t}`);
});

if (schedulingSrc.includes("campaign_characters") || schedulingSrc.includes("dnd5e")) {
  fail("scheduling.js must not depend on campaign_characters or dnd5e");
} else pass("scheduling has no character/game-system dependency");

if (boardSrc.includes("campaign_characters") || boardSrc.includes("dnd5e")) {
  fail("campaign-board.js must not depend on campaign_characters or dnd5e");
} else pass("board has no character/game-system dependency");

if (!schedulingSrc.includes("campaign_memberships")) fail("scheduling must use campaign_memberships");
else pass("availability overlap uses campaign_memberships");

if (!apiSrc.includes("listUserAvailability")) fail("api missing player availability");
else pass("api player availability routes");

if (!apiSrc.includes("upcoming-events")) fail("api missing upcoming events");
else pass("api upcoming events route");

if (!apiSrc.includes("createCampaignEvent") || !apiSrc.includes("/events")) {
  fail("api missing DM event routes");
} else pass("api DM event routes");

if (!apiClientSrc.includes("putAvailability") || !apiClientSrc.includes("campaignPosts")) {
  fail("player-api-client missing scheduling methods");
} else pass("player-api-client scheduling methods");

if (!playerHtml.includes("campaign-section-nav") || !playerHtml.includes('data-campaign-section="schedule"')) {
  fail("player HTML missing campaign section nav");
} else pass("campaign Play|Schedule|Board nav");

if (!playerHtml.includes("home-schedule-list")) fail("player home missing schedule section");
else pass("player global schedule section");

{
  const scheduleIdx = playerHtml.indexOf(">Schedule<");
  const campaignsIdx = playerHtml.indexOf(">My campaigns<");
  const charactersIdx = playerHtml.indexOf(">My characters<");
  if (scheduleIdx < 0 || campaignsIdx < 0 || charactersIdx < 0) {
    fail("player home missing Schedule / My campaigns / My characters headings");
  } else if (!(scheduleIdx < campaignsIdx && campaignsIdx < charactersIdx)) {
    fail("player home order must be Schedule → My campaigns → My characters");
  } else pass("player home order Schedule → campaigns → characters");
}

if (playerHtml.includes('data-open-availability')) {
  fail("home must show calendar inline (no My availability gate button)");
} else pass("home availability calendar is inline (no gate button)");

if (!schedUiSrc.includes("home-sched-panel") || !schedUiSrc.includes("calendarGrid")) {
  fail("renderHomeSchedule must render inline calendar");
} else pass("home schedule renders inline calendar");

if (playerAppSrc.includes("availabilityMain")) {
  fail("player-app should not reference removed availability-main");
} else pass("player-app uses day editor dialog only");

if (playerAppSrc.includes('campaignSection === "schedule"') && playerAppSrc.includes("PlayerSchedulingUI")) {
  pass("player-app integrates scheduling UI");
} else fail("player-app scheduling integration");

if (!schedUiSrc.includes("esc(") || schedUiSrc.includes("innerHTML") && !schedUiSrc.includes("esc(")) {
  /* board uses esc with innerHTML */
}
if (schedUiSrc.includes("esc(") && schedUiSrc.includes(".replace(/\\n/g")) pass("board content escaped");
else fail("scheduling UI escape helpers");

if (playerAppSrc.includes("character-shell") && playerAppSrc.match(/campaignSection.*character/)) {
  fail("character workspace must not include schedule");
} else pass("schedule not in character workspace");

const datetime = require(path.join(root, "server/lib/datetime.js"));
try {
  datetime.parseCalendarDate("2026-09-12", "date");
  pass("parseCalendarDate accepts YYYY-MM-DD");
} catch (e) {
  fail(`parseCalendarDate: ${e.message}`);
}

async function liveTests() {
  if (!process.env.DATABASE_URL) {
    pass("live scheduling tests skipped (DATABASE_URL unset)");
    return;
  }

  process.env.AUTH_REQUIRED = "1";
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
  }

  const db = require(path.join(root, "server/lib/db.js"));
  const scheduling = require(path.join(root, "server/lib/scheduling.js"));
  const board = require(path.join(root, "server/lib/campaign-board.js"));
  const auth = require(path.join(root, "server/lib/auth.js"));
  const guard = require(path.join(root, "test/lib/dev-data-guard.js"));

  const health = await db.health();
  if (!health.ok) {
    fail(`postgres not reachable: ${health.error || "unknown"}`);
    return;
  }
  pass("postgres reachable");

  const tables = await db.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [["user_availability", "campaign_events", "campaign_event_rsvps", "campaign_posts"]]
  );
  if (tables.rows.length !== 4) fail("scheduling tables not migrated");
  else pass("scheduling tables exist");

  const suffix = crypto.randomBytes(4).toString("hex");
  const campA = `camp-sched-a-${suffix}`;
  const campB = `camp-sched-b-${suffix}`;
  const password = `SchedPass-${suffix}!`;
  const dmEmail = `dm-sched-${suffix}@example.local`;
  const p1Email = `p1-sched-${suffix}@example.local`;
  const p2Email = `p2-sched-${suffix}@example.local`;
  const outsiderEmail = `out-sched-${suffix}@example.local`;

  const dmHash = await auth.hashPassword(password);
  const p1Hash = await auth.hashPassword(password);
  const p2Hash = await auth.hashPassword(password);
  const outHash = await auth.hashPassword(password);

  const dmIns = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id`,
    ["Sched DM", auth.normalizeEmail(dmEmail), dmHash]
  );
  const p1Ins = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id`,
    ["Player One", auth.normalizeEmail(p1Email), p1Hash]
  );
  const p2Ins = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id`,
    ["Player Two", auth.normalizeEmail(p2Email), p2Hash]
  );
  const outIns = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id`,
    ["Outsider", auth.normalizeEmail(outsiderEmail), outHash]
  );

  const dmId = dmIns.rows[0].id;
  const p1Id = p1Ins.rows[0].id;
  const p2Id = p2Ins.rows[0].id;
  const outId = outIns.rows[0].id;

  await db.query(
    `INSERT INTO campaigns (id, name, description, game_system_id) VALUES ($1,$2,$3,'dnd5e'),($4,$5,$6,'dnd5e')`,
    [campA, "Sched A", "", campB, "Sched B", ""]
  );
  await db.query(
    `INSERT INTO campaign_memberships (campaign_id, user_id, role) VALUES
     ($1,$2,'dm'),($1,$3,'player'),($1,$4,'player'),($5,$3,'player')`,
    [campA, dmId, p1Id, p2Id, campB]
  );

  const loginDm = await auth.loginWithPassword(dmEmail, password);
  const loginP1 = await auth.loginWithPassword(p1Email, password);
  const loginP2 = await auth.loginWithPassword(p2Email, password);
  const loginOut = await auth.loginWithPassword(outsiderEmail, password);

  const fakeReq = (cookie, method = "GET") => ({
    method,
    headers: {
      host: "127.0.0.1:3000",
      cookie: cookie ? `${auth.COOKIE_NAME}=${encodeURIComponent(cookie)}` : "",
      origin: "http://127.0.0.1:3000",
      "content-type": "application/json"
    }
  });

  const testDate = "2026-09-12";

  try {
    const entry = await scheduling.upsertUserAvailability(
      fakeReq(loginP1.rawToken, "PUT"),
      testDate,
      { status: "available", availableFrom: "18:00", note: "evenings" }
    );
    if (entry.status !== "available") fail("availability upsert");
    else pass("availability CRUD upsert");

    const dup = await scheduling.upsertUserAvailability(
      fakeReq(loginP1.rawToken, "PUT"),
      testDate,
      { status: "maybe" }
    );
    if (dup.status !== "maybe") fail("one row per user/date");
    else pass("one availability row per user/date");

    await scheduling.deleteUserAvailability(fakeReq(loginP1.rawToken, "DELETE"), testDate);
    const list = await scheduling.listUserAvailability(
      fakeReq(loginP1.rawToken),
      testDate,
      testDate
    );
    if (list.length) fail("delete clears availability");
    else pass("missing availability = no response");

    await scheduling.upsertUserAvailability(fakeReq(loginP2.rawToken, "PUT"), testDate, {
      status: "available"
    });

    const day = await scheduling.getCampaignAvailabilityDay(fakeReq(loginP1.rawToken), campA, testDate);
    if (day.total !== 3) fail(`expected 3 members, got ${day.total}`);
    else pass("campaign availability uses memberships only");

    const names = day.members.map((m) => m.userName);
    if (new Set(names).size !== names.length) fail("duplicate members in overlap");
    else pass("each campaign member appears once");

    const noPcMember = day.members.find((m) => m.userId === p2Id);
    if (!noPcMember) fail("member without PC missing");
    else pass("campaign member without PC included");

    try {
      await scheduling.getCampaignAvailabilityDay(fakeReq(loginOut.rawToken), campA, testDate);
      fail("outsider should not read availability");
    } catch (err) {
      if (err.status === 403) pass("outsider cannot inspect availability");
      else fail(`outsider availability wrong status: ${err.status}`);
    }

    const startsAt = new Date("2026-09-12T18:00:00").toISOString();
    const event = await scheduling.createCampaignEvent(fakeReq(loginDm.rawToken, "POST"), campA, {
      title: "Session 3",
      startsAt
    });
    if (!event.id) fail("DM create event");
    else pass("DM create event");

    try {
      await scheduling.createCampaignEvent(fakeReq(loginP1.rawToken, "POST"), campA, {
        title: "Nope",
        startsAt
      });
      fail("player create event should fail");
    } catch (err) {
      if (err.status === 403) pass("player cannot create DM event");
      else fail(`player create event status: ${err.status}`);
    }

    const events = await scheduling.listCampaignEvents(fakeReq(loginP1.rawToken), campA, {});
    if (!events.some((e) => e.id === event.id)) fail("member can list events");
    else pass("campaign member can view events");

    try {
      await scheduling.listCampaignEvents(fakeReq(loginOut.rawToken), campA, {});
      fail("outsider list events");
    } catch (err) {
      if (err.status === 403) pass("outsider cannot view events");
      else fail(`outsider events status: ${err.status}`);
    }

    const rsvp = await scheduling.putEventRsvp(fakeReq(loginP1.rawToken, "PUT"), campA, event.id, {
      status: "going"
    });
    if (rsvp.status !== "going") fail("RSVP self");
    else pass("RSVP own event");

    try {
      await db.query(
        `INSERT INTO campaign_event_rsvps (event_id, user_id, status) VALUES ($1,$2,'going')
         ON CONFLICT DO NOTHING`,
        [event.id, p2Id]
      );
      await scheduling.putEventRsvp(fakeReq(loginP1.rawToken, "PUT"), campA, event.id, {
        status: "maybe"
      });
      /* p1 can only update own row — verify p2 unchanged */
      const p2row = await db.query(
        `SELECT status FROM campaign_event_rsvps WHERE event_id = $1 AND user_id = $2`,
        [event.id, p2Id]
      );
      if (p2row.rows[0]?.status !== "going") fail("RSVP overwrote other user");
      else pass("cannot modify another user RSVP via API");
    } catch (err) {
      fail(`RSVP isolation: ${err.message}`);
    }

    const detail = await scheduling.getCampaignEventDetail(fakeReq(loginP1.rawToken), campA, event.id);
    if (detail.counts.going < 1) fail("RSVP summary counts");
    else pass("event RSVP summary counts");

    await scheduling.updateCampaignEvent(fakeReq(loginDm.rawToken, "PATCH"), campA, event.id, {
      title: "Session 3 revised",
      status: "cancelled"
    });
    const updated = await scheduling.listCampaignEvents(fakeReq(loginP1.rawToken), campA, {});
    const cancelled = updated.find((e) => e.id === event.id);
    if (cancelled?.status !== "cancelled") fail("cancel/edit event");
    else pass("cancel/edit event works");

    const evA2 = await scheduling.createCampaignEvent(fakeReq(loginDm.rawToken, "POST"), campA, {
      title: "Session 4",
      startsAt: new Date("2026-09-18T19:00:00").toISOString()
    });
    await scheduling.putEventRsvp(fakeReq(loginP1.rawToken, "PUT"), campA, evA2.id, { status: "maybe" });

    await db.query(
      `INSERT INTO campaign_memberships (campaign_id, user_id, role) VALUES ($1,$2,'dm') ON CONFLICT DO NOTHING`,
      [campB, dmId]
    );
    const evB = await scheduling.createCampaignEvent(fakeReq(loginDm.rawToken, "POST"), campB, {
      title: "Camp B session",
      startsAt: new Date("2026-09-20T19:00:00").toISOString()
    });
    await scheduling.putEventRsvp(fakeReq(loginP1.rawToken, "PUT"), campB, evB.id, { status: "going" });

    const upcoming = await scheduling.listUpcomingEventsForUser(fakeReq(loginP1.rawToken), { limit: 10 });
    if (!upcoming.some((e) => e.campaignId === campA && e.status === "scheduled")) {
      fail("global upcoming missing camp A scheduled event");
    } else if (!upcoming.some((e) => e.campaignId === campB)) {
      fail("global upcoming missing camp B");
    } else pass("global upcoming spans campaigns");

    const xssBody = "<script>alert(1)</script>\nline2";
    const post = await board.createCampaignPost(fakeReq(loginP1.rawToken, "POST"), campA, { body: xssBody });
    if (post.body !== xssBody) fail("post body stored plain");
    else pass("board stores plain text");

    const posts = await board.listCampaignPosts(fakeReq(loginP1.rawToken), campA);
    if (!posts.some((p) => p.id === post.id)) fail("board list");
    else pass("board read for member");

    try {
      await board.listCampaignPosts(fakeReq(loginOut.rawToken), campA);
      fail("outsider board read");
    } catch (err) {
      if (err.status === 403) pass("outsider cannot read board");
      else fail(`outsider board status: ${err.status}`);
    }

    try {
      await board.setPostPinned(fakeReq(loginP1.rawToken, "PUT"), campA, post.id, true);
      fail("player pin should fail");
    } catch (err) {
      if (err.status === 403) pass("player cannot pin");
      else fail(`player pin status: ${err.status}`);
    }

    const pinned = await board.setPostPinned(fakeReq(loginDm.rawToken, "PUT"), campA, post.id, true);
    if (!pinned.pinned) fail("DM pin");
    else pass("DM can pin");

    const alth = await db.query(
      `SELECT 1 FROM campaign_characters WHERE character_id = $1 AND campaign_id = $2`,
      [guard.IMPORTED_ALTHARIEL_ID, guard.IMPORTED_CAMPAIGN_ID]
    );
    if (!alth.rows.length) fail("Stormwreck Althariel link broken");
    else pass("Stormwreck still functional");
  } finally {
    await db.query("DELETE FROM campaigns WHERE id = ANY($1::text[])", [[campA, campB]]);
    await db.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[dmId, p1Id, p2Id, outId]]);
  }
}

(async () => {
  try {
    await liveTests();
  } catch (err) {
    fail(`live scheduling error: ${err.message}`);
    console.error(err);
  }
  if (failed) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll scheduling checks passed.");
})();
