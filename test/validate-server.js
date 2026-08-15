/**
 * Backend file-persistence + API tests.
 * Run: node test/validate-server.js
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

async function withTempData(fn) {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-data-"));
  const prev = process.env.DM_DATA_ROOT;
  process.env.DM_DATA_ROOT = tmp;
  /* Clear require cache so libs pick up env-backed dataRoot cleanly */
  Object.keys(require.cache).forEach((key) => {
    if (key.replace(/\\/g, "/").includes("/server/lib/") || key.replace(/\\/g, "/").includes("/server/routes/")) {
      delete require.cache[key];
    }
  });
  try {
    const atomic = require("../server/lib/atomic-fs");
    await atomic.ensureDataLayout();
    await fn(tmp, atomic);
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

async function main() {
  /* Static files exist */
  for (const rel of [
    "server/index.js",
    "server/lib/ids.js",
    "server/lib/atomic-fs.js",
    "server/lib/catalogues.js",
    "server/lib/campaigns.js",
    "server/lib/assets.js",
    "server/routes/api.js",
    "package.json",
    "js/core/local-api-client.js",
    "js/core/browser-import.js",
    "js/core/campaign-prefs.js",
    "js/core/campaign-map-state.js"
  ]) {
    if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
    else pass(`file ${rel}`);
  }

  const ids = require("../server/lib/ids");
  try {
    ids.assertSafeId("../etc/passwd");
    fail("path traversal id should throw");
  } catch {
    pass("rejects path traversal id");
  }
  try {
    ids.assertCatalogueType("weapon");
    fail("bad type should throw");
  } catch {
    pass("rejects unknown catalogue type");
  }
  try {
    ids.assertDocKind("secrets");
    fail("bad doc kind should throw");
  } catch {
    pass("rejects unknown doc kind");
  }

  await withTempData(async (tmp) => {
    const catalogues = require("../server/lib/catalogues");
    const campaigns = require("../server/lib/campaigns");
    const assets = require("../server/lib/assets");
    const atomic = require("../server/lib/atomic-fs");

    const entry = await catalogues.upsert("npc", "gideon-vale", {
      id: "gideon-vale",
      name: "Gideon Vale",
      summary: "Test"
    });
    if (entry.name !== "Gideon Vale") fail("catalogue upsert");
    else pass("catalogue upsert");

    const file = path.join(tmp, "catalogues", "npc", "gideon-vale.json");
    if (!fs.existsSync(file)) fail("npc json missing on disk");
    else pass("npc json on disk");

    const pretty = fs.readFileSync(file, "utf8");
    if (!pretty.includes("\n  ") || !pretty.endsWith("\n")) fail("pretty JSON formatting");
    else pass("pretty-printed JSON");

    const listed = await catalogues.list("npc");
    if (!listed.some((e) => e.id === "gideon-vale")) fail("catalogue list");
    else pass("catalogue list");

    const got = await catalogues.get("npc", "gideon-vale");
    if (!got || got.name !== "Gideon Vale") fail("catalogue get");
    else pass("catalogue get");

    await catalogues.upsert("npc", "gideon-vale", { id: "gideon-vale", name: "Gideon Vale", summary: "Updated" });
    const again = await catalogues.get("npc", "gideon-vale");
    if (again.summary !== "Updated") fail("catalogue update");
    else pass("catalogue update");

    const bak = path.join(tmp, ".backup", "catalogues", "npc", "gideon-vale.json.bak");
    if (!fs.existsSync(bak)) fail("backup missing after overwrite");
    else pass("json .bak backup");

    /* Atomic write does not leave .tmp */
    const leftovers = fs.readdirSync(path.join(tmp, "catalogues", "npc")).filter((n) => n.includes(".tmp"));
    if (leftovers.length) fail("tmp files left behind");
    else pass("no leftover tmp files");

    await catalogues.remove("npc", "gideon-vale");
    if (await catalogues.get("npc", "gideon-vale")) fail("catalogue remove");
    else pass("catalogue remove");

    /* Campaign docs */
    const camp = await campaigns.createCampaign({ title: "Coastal Hex" });
    if (camp.id !== "coastal-hex") fail("campaign create id");
    else pass("campaign create");

    await campaigns.putDocument(camp.id, "chronicle", {
      version: 1,
      storySoFar: "Once upon a storm",
      sessions: {},
      keyEvents: []
    });
    const chron = await campaigns.getDocument(camp.id, "chronicle");
    if (chron.storySoFar !== "Once upon a storm") fail("chronicle doc");
    else pass("chronicle document");

    await campaigns.upsertCampaign({
      id: "imported-camp",
      title: "Imported",
      description: "from browser"
    });
    if (!(await campaigns.getCampaign("imported-camp"))) fail("upsertCampaign");
    else pass("upsertCampaign exact id");

    /* Assets */
    const tinyPng =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const put = await assets.putFieldFromDataUrl("npc", "gideon-vale", "portrait", tinyPng);
    if (!put.url.includes("/api/assets/portraits/npc/gideon-vale")) fail("asset url");
    else pass("asset upload");
    const read = await assets.readAsset("portraits", "npc", "gideon-vale");
    if (!read || !read.buffer.length) fail("asset read");
    else pass("asset read");
    await assets.deleteField("npc", "gideon-vale", "portrait");
    if (await assets.readAsset("portraits", "npc", "gideon-vale")) fail("asset delete");
    else pass("asset delete");

    /* Corrupted JSON */
    const badPath = path.join(tmp, "catalogues", "npc", "broken.json");
    await fsp.mkdir(path.dirname(badPath), { recursive: true });
    await fsp.writeFile(badPath, "{not json", "utf8");
    try {
      await atomic.readJson(badPath);
      fail("corrupted JSON should throw");
    } catch (err) {
      if (err.status === 500) pass("corrupted JSON detected");
      else fail("corrupted JSON wrong error");
    }
  });

  /* HTTP smoke: boot API on ephemeral port with temp data */
  await withTempData(async () => {
    const { createApiRoutes, handleApi } = require("../server/routes/api");
    const { sendJson } = require("../server/lib/http-util");
    const apiRoutes = createApiRoutes();

    const server = http.createServer(async (req, res) => {
      const host = req.headers.host || "127.0.0.1";
      const url = new URL(req.url || "/", `http://${host}`);
      const handled = await handleApi(req, res, url.pathname, apiRoutes);
      if (!handled) sendJson(res, 404, { ok: false, error: "Not found" });
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();

    function req(method, urlPath, body) {
      return new Promise((resolve, reject) => {
        const data = body != null ? JSON.stringify(body) : null;
        const r = http.request(
          {
            hostname: "127.0.0.1",
            port,
            path: urlPath,
            method,
            headers: data
              ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
              : {}
          },
          (res) => {
            let raw = "";
            res.on("data", (c) => (raw += c));
            res.on("end", () => {
              let parsed = null;
              try {
                parsed = raw ? JSON.parse(raw) : null;
              } catch {
                parsed = { raw };
              }
              resolve({ status: res.statusCode, body: parsed });
            });
          }
        );
        r.on("error", reject);
        if (data) r.write(data);
        r.end();
      });
    }

    const health = await req("GET", "/api/health");
    if (!health.body?.ok) fail("health");
    else pass("HTTP health");

    const put = await req("PUT", "/api/catalogues/npc/runara", {
      id: "runara",
      name: "Runara",
      summary: "Dragon"
    });
    if (put.status !== 200 || put.body?.entry?.name !== "Runara") fail("HTTP put catalogue");
    else pass("HTTP put catalogue");

    const list = await req("GET", "/api/catalogues/npc");
    if (!list.body?.entries?.some((e) => e.id === "runara")) fail("HTTP list catalogue");
    else pass("HTTP list catalogue");

    const bad = await req("GET", "/api/catalogues/npc/../secret");
    if (bad.status === 200 && bad.body?.ok) fail("HTTP path traversal should fail");
    else pass("HTTP rejects traversal");

    const doc = await req("PUT", "/api/campaigns/stormwreck-isle/documents/scene-meta", {
      opening: { locationId: "dragons-rest" }
    });
    if (!doc.body?.ok) fail("HTTP campaign doc");
    else pass("HTTP campaign doc");

    const restartRead = await req("GET", "/api/catalogues/npc/runara");
    if (restartRead.body?.entry?.name !== "Runara") fail("persistence across requests");
    else pass("persistence across requests");

    await new Promise((resolve) => server.close(resolve));
  });

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll server persistence checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
