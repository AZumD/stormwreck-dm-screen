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
