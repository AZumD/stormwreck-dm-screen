/**
 * Scene block parser + DM scene read API checks.
 * Run: node test/validate-scenes-api.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const os = require("os");
const fsp = require("fs/promises");

const root = path.join(__dirname, "..");
let failed = 0;
function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

const blocksSrc = fs.readFileSync(path.join(root, "server/lib/scene-blocks.js"), "utf8");
const apiSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");

if (!blocksSrc.includes("parseBlocks") || !blocksSrc.includes("read-aloud")) {
  fail("scene-blocks missing parseBlocks/read-aloud");
} else pass("scene-blocks module");

if (!apiSrc.includes("/scenes") || !apiSrc.includes("sceneBlocks") || !apiSrc.includes("requireDmIfAuthRequired")) {
  fail("scenes routes missing or unauthorized");
} else pass("scenes API routes + DM gate");

if (!apiSrc.includes('route(\n      "PATCH"') && !apiSrc.includes('"PATCH"') || !apiSrc.includes("sceneMutate")) {
  // loose check: PATCH + sceneMutate present
}
if (!apiSrc.includes("sceneMutate") || !apiSrc.includes("PATCH")) {
  fail("scene PATCH route missing");
} else pass("scene PATCH route + sceneMutate");

const sceneMutate = require("../server/lib/scene-mutate");
{
  try {
    sceneMutate.normalizeScenePatch({ bogon: 1 });
    fail("normalize should reject unknown");
  } catch (e) {
    if (e.status !== 400) fail("unknown field status");
    else pass("normalizeScenePatch rejects unknown");
  }
  const applied = sceneMutate.applyContentPatch(
    { groups: [], scenes: [{ id: "a", title: "A", content: "x" }, { id: "b", title: "B", content: "y" }] },
    "a",
    { title: "A2", content: "z" }
  );
  if (applied.structure.scenes[1].content !== "y" || applied.scene.title !== "A2") {
    fail("applyContentPatch");
  } else pass("applyContentPatch preserves siblings");

  const st = sceneMutate.applyStatePatch(
    { scenes: { a: { status: "current", notes: "" }, b: { status: "unseen", notes: "" } } },
    "b",
    { status: "current" }
  );
  if (st.scenes.a.status !== "completed" || st.scenes.b.status !== "current") fail("applyStatePatch current");
  else pass("applyStatePatch demotes current");
}

const { parseBlocks, buildSceneList, buildSceneDetail } = require("../server/lib/scene-blocks");

{
  const blocks = parseBlocks(
    "Hello @npc:runara|Runara\n{{read-aloud}}\nSpeak this.\n{{/read-aloud}}\n{{dm-note}}\nSecret.\n{{/dm-note}}\n{{collapse:If asked}}\nMore.\n{{/collapse}}"
  );
  const types = blocks.map((b) => b.type);
  if (!types.includes("read-aloud") || !types.includes("dm-note") || !types.includes("collapse")) {
    fail(`block types ${types.join(",")}`);
  } else pass("parseBlocks read-aloud/dm-note/collapse");
  const ra = blocks.find((b) => b.type === "read-aloud");
  if (!ra?.text?.includes("Speak")) fail("read-aloud text");
  else pass("read-aloud text preserved");
  const refs = blocks.flatMap((b) => b.refs || []);
  if (!refs.some((r) => r.type === "npc" && r.id === "runara")) fail("refs extracted");
  else pass("refs extracted");
}

{
  const list = buildSceneList({
    structure: {
      groups: [{ id: "g1", title: "G" }],
      scenes: [
        { id: "a", title: "A", content: "x", groupId: "g1" },
        { id: "b", title: "B", content: "y" }
      ]
    },
    campaignState: { scenes: { b: { status: "current", notes: "n" } } },
    sceneMeta: { a: { locationId: "dragons-rest" } }
  });
  if (list.currentSceneId !== "b") fail("current scene");
  else pass("current scene from campaign-state");
  if (list.scenes[0].locationId !== "dragons-rest") fail("locationId from scene-meta");
  else pass("locationId from scene-meta");
}

{
  const detail = buildSceneDetail({
    scene: { id: "a", title: "T", content: "{{dm-note}}\nOnly DM\n{{/dm-note}}" },
    campaignState: { scenes: { a: { status: "current", notes: "play" } } },
    sceneMeta: {}
  });
  if (!detail.blocks.some((b) => b.type === "dm-note")) fail("dm-note in detail");
  else pass("DM note blocks included for DM API");
  if (detail.notes !== "play") fail("play notes");
  else pass("play notes on detail");
}

async function withTempData(fn) {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-scenes-"));
  const prev = process.env.DM_DATA_ROOT;
  process.env.DM_DATA_ROOT = tmp;
  Object.keys(require.cache).forEach((key) => {
    if (key.replace(/\\/g, "/").includes("/server/lib/") || key.replace(/\\/g, "/").includes("/server/routes/")) {
      delete require.cache[key];
    }
  });
  try {
    await require("../server/lib/atomic-fs").ensureDataLayout();
    await fn();
  } finally {
    if (prev === undefined) delete process.env.DM_DATA_ROOT;
    else process.env.DM_DATA_ROOT = prev;
    Object.keys(require.cache).forEach((key) => {
      if (key.replace(/\\/g, "/").includes("/server/lib/") || key.replace(/\\/g, "/").includes("/server/routes/")) {
        delete require.cache[key];
      }
    });
    await fsp.rm(tmp, { recursive: true, force: true });
  }
}

(async () => {
  await withTempData(async () => {
    const campaigns = require("../server/lib/campaigns");
    const { createApiRoutes, handleApi } = require("../server/routes/api");
    await campaigns.putDocument("stormwreck-isle", "section-structure", {
      groups: [],
      scenes: [{ id: "welcome", title: "Welcome", content: "{{read-aloud}}\nHi\n{{/read-aloud}}" }]
    });
    await campaigns.putDocument("stormwreck-isle", "campaign-state", {
      scenes: { welcome: { status: "current", notes: "" } },
      party: []
    });

    const routes = createApiRoutes();
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://127.0.0.1");
        if (url.pathname.startsWith("/api")) await handleApi(req, res, url.pathname, routes);
        else {
          res.writeHead(404);
          res.end();
        }
      } catch (err) {
        res.writeHead(err.status || 500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const { port } = server.address();
    const req = (method, p) =>
      new Promise((resolve, reject) => {
        const r = http.request({ hostname: "127.0.0.1", port, path: p, method }, (res) => {
          let raw = "";
          res.on("data", (c) => (raw += c));
          res.on("end", () => {
            let body = null;
            try {
              body = JSON.parse(raw);
            } catch {
              body = { raw };
            }
            resolve({ status: res.statusCode, body });
          });
        });
        r.on("error", reject);
        r.end();
      });

    const list = await req("GET", "/api/campaigns/stormwreck-isle/scenes");
    if (list.status !== 200 || list.body?.currentSceneId !== "welcome") fail("HTTP scenes list");
    else pass("HTTP scenes list");

    const one = await req("GET", "/api/campaigns/stormwreck-isle/scenes/welcome");
    if (one.status !== 200 || !one.body?.scene?.blocks?.some((b) => b.type === "read-aloud")) {
      fail("HTTP scene detail");
    } else pass("HTTP scene detail");

    const missing = await req("GET", "/api/campaigns/stormwreck-isle/scenes/nope");
    if (missing.status !== 404) fail("missing scene 404");
    else pass("missing scene 404");

    const reqBody = (method, p, body) =>
      new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const r = http.request(
          {
            hostname: "127.0.0.1",
            port,
            path: p,
            method,
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          },
          (res) => {
            let raw = "";
            res.on("data", (c) => (raw += c));
            res.on("end", () => {
              let parsed = null;
              try {
                parsed = JSON.parse(raw);
              } catch {
                parsed = { raw };
              }
              resolve({ status: res.statusCode, body: parsed });
            });
          }
        );
        r.on("error", reject);
        r.write(payload);
        r.end();
      });

    const otherTitle = (await campaigns.getDocument("stormwreck-isle", "section-structure")).scenes?.[0]
      ? null
      : null;
    await campaigns.putDocument("stormwreck-isle", "section-structure", {
      groups: [{ id: "g1", title: "Act 1" }],
      scenes: [
        { id: "welcome", title: "Welcome", content: "{{read-aloud}}\nHi\n{{/read-aloud}}", groupId: "g1" },
        { id: "other", title: "Other Scene", content: "Leave me alone", groupId: "g1" }
      ]
    });

    const patched = await reqBody("PATCH", "/api/campaigns/stormwreck-isle/scenes/welcome", {
      title: "Welcome Updated",
      content: "{{dm-note}}\nSecret\n{{/dm-note}}\nProse @npc:runara|Runara"
    });
    if (patched.status !== 200 || patched.body?.scene?.title !== "Welcome Updated") {
      fail(`PATCH content ${patched.status} ${JSON.stringify(patched.body)}`);
    } else if (!patched.body.scene.content.includes("{{dm-note}}")) {
      fail("PATCH content missing source");
    } else if (!patched.body.scene.blocks?.some((b) => b.type === "dm-note")) {
      fail("PATCH detail blocks");
    } else pass("HTTP PATCH scene content");

    const structureAfter = await campaigns.getDocument("stormwreck-isle", "section-structure");
    const other = structureAfter.scenes.find((s) => s.id === "other");
    if (!other || other.content !== "Leave me alone" || other.title !== "Other Scene") {
      fail("unrelated scene clobbered");
    } else pass("unrelated scene preserved");

    const badField = await reqBody("PATCH", "/api/campaigns/stormwreck-isle/scenes/welcome", {
      invented: true
    });
    if (badField.status !== 400) fail(`unknown field ${badField.status}`);
    else pass("unknown field rejected");

    const badId = await reqBody("PATCH", "/api/campaigns/stormwreck-isle/scenes/missing-scene", {
      title: "x"
    });
    if (badId.status !== 404) fail(`missing PATCH ${badId.status}`);
    else pass("missing scene PATCH 404");

    const statusPatch = await reqBody("PATCH", "/api/campaigns/stormwreck-isle/scenes/other", {
      status: "current"
    });
    if (statusPatch.status !== 200 || statusPatch.body?.scene?.status !== "current") {
      fail("status PATCH");
    } else pass("HTTP PATCH scene status");

    const stateAfter = await campaigns.getDocument("stormwreck-isle", "campaign-state");
    if (stateAfter.scenes?.welcome?.status === "current") fail("previous current not demoted");
    else if (stateAfter.scenes?.other?.status !== "current") fail("new current missing");
    else pass("current demotes previous");

    const getReflects = await req("GET", "/api/campaigns/stormwreck-isle/scenes/welcome");
    if (getReflects.body?.scene?.title !== "Welcome Updated") fail("GET after PATCH");
    else pass("GET reflects mutation");

    void otherTitle;

    await new Promise((r) => server.close(r));
  });

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll scenes API checks passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
