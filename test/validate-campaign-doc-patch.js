/**
 * Campaign document PATCH + multi-client map-state / initiative checks.
 * Run: node test/validate-campaign-doc-patch.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const os = require("os");
const fsp = require("fs/promises");
const vm = require("vm");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

async function withTempData(fn) {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "dm-patch-"));
  const prev = process.env.DM_DATA_ROOT;
  process.env.DM_DATA_ROOT = tmp;
  Object.keys(require.cache).forEach((key) => {
    if (key.replace(/\\/g, "/").includes("/server/lib/") || key.replace(/\\/g, "/").includes("/server/routes/")) {
      delete require.cache[key];
    }
  });
  try {
    const atomic = require("../server/lib/atomic-fs");
    await atomic.ensureDataLayout();
    await fn(tmp);
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

/* ——— Static wiring ——— */
const api = read("server/routes/api.js");
const campaignsSrc = read("server/lib/campaigns.js");
const mapStateSrc = read("js/core/campaign-map-state.js");
const clientSrc = read("js/core/local-api-client.js");
const modalSrc = read("js/core/combat-sheet-modal.js");
const mapPanelSrc = read("js/core/map-panel.js");
const arch = read("docs/CLIENT-ARCHITECTURE.md");

if (!api.includes('"PATCH"') || !api.includes("patchDocument") || !api.includes("requireDmIfAuthRequired")) {
  fail("PATCH document route missing or unauthorized");
} else pass("PATCH route + DM auth gate");

if (!campaignsSrc.includes("async function patchDocument") && !campaignsSrc.includes("function patchDocument")) {
  fail("campaigns.patchDocument missing");
} else pass("campaigns.patchDocument");

if (!clientSrc.includes("patchCampaignDocument") || !clientSrc.includes('"PATCH"')) {
  fail("LocalApiClient.patchCampaignDocument missing");
} else pass("LocalApiClient.patchCampaignDocument");

if (!mapStateSrc.includes("patchCampaignDocument") || mapStateSrc.includes('putCampaignDocument(campaignId, "map-state", data)')) {
  /* persist() may still PUT; patch() must use PATCH */
  if (!mapStateSrc.includes("patchCampaignDocument")) fail("CampaignMapState must call patchCampaignDocument");
  else pass("CampaignMapState uses patchCampaignDocument");
} else {
  pass("CampaignMapState uses patchCampaignDocument");
}

if (mapStateSrc.includes("function patch") && mapStateSrc.includes("patchCampaignDocument")) {
  const patchFn = mapStateSrc.slice(mapStateSrc.indexOf("function patch("), mapStateSrc.indexOf("function persist("));
  if (patchFn.includes("putCampaignDocument")) fail("CampaignMapState.patch must not PUT full document");
  else pass("CampaignMapState.patch sends PATCH only");
} else fail("CampaignMapState.patch not found");

if (!mapStateSrc.includes("initiativeTracker") || !mapStateSrc.includes("initiative-tracker")) {
  fail("CampaignMapState local fallback missing initiativeTracker");
} else pass("initiativeTracker in local empty/load/save");

for (const field of ["activeMap", "pinPositions", "partyPositions", "customPins", "tokens", "initiativeTracker"]) {
  if (!mapStateSrc.includes(`${field}:`)) fail(`empty() missing ${field}`);
}
pass("empty() shared state fields");

if (!modalSrc.includes("readInitiative") || !modalSrc.includes("initiativeTracker")) {
  fail("CombatSheetModal missing canonical initiative read");
} else pass("CombatSheetModal reads tracker");

if (modalSrc.includes("combat_initiative: normalizeInitiative(form.initiative)")) {
  fail("PC save must not write combat_initiative");
} else pass("PC save does not write combat_initiative");

if (modalSrc.includes("entry.combatInitiative = normalizeInitiative(form.initiative)")) {
  fail("NPC save must not write combatInitiative");
} else pass("NPC save does not write combatInitiative");

if (/initiative:\s*normalizeInitiative\(form\.initiative\)/.test(modalSrc)) {
  fail("Monster token save must not write token.initiative");
} else pass("Monster token save does not write initiative");

if (!modalSrc.includes("initiativeTracker: { [key]: null }") && !modalSrc.includes("[key]: null")) {
  fail("Clearing initiative should null-delete tracker key");
} else pass("Initiative clear uses null delete");

if (!mapPanelSrc.includes("refreshInitiative") || !mapPanelSrc.includes("b.initiative - a.initiative")) {
  fail("Map initiative list sort missing");
} else pass("Map initiative sorted highest-first");

if (!arch.includes("Canonical source") || !arch.includes("session cookie") || !arch.includes("tracker")) {
  fail("CLIENT-ARCHITECTURE.md incomplete");
} else pass("CLIENT-ARCHITECTURE.md");

if (!fs.existsSync(path.join(root, "docs/README/DEEP-MERGE.md"))) fail("DEEP-MERGE.md missing");
else pass("DEEP-MERGE.md");

/* ——— deepMerge unit checks ——— */
const { deepMerge } = require("../server/lib/deep-merge");

{
  const merged = deepMerge(
    { a: 1, nested: { x: 1, y: 2 }, list: [1, 2], keep: true },
    { nested: { y: 9, z: 3 }, list: [9], a: 5 }
  );
  if (merged.a !== 5 || merged.nested.x !== 1 || merged.nested.y !== 9 || merged.nested.z !== 3) {
    fail("recursive object merge");
  } else pass("recursive object merge");
  if (!Array.isArray(merged.list) || merged.list.length !== 1 || merged.list[0] !== 9) {
    fail("arrays replace");
  } else pass("arrays replace");
  if (merged.keep !== true) fail("unrelated keys survive");
  else pass("unrelated keys survive");
}

{
  const proto = deepMerge({ safe: 1 }, JSON.parse('{"__proto__":{"polluted":true},"prototype":{"x":1},"constructor":{"y":1},"ok":2}'));
  if (proto.polluted || Object.prototype.polluted) fail("prototype keys blocked");
  else if (proto.ok !== 2 || proto.safe !== 1) fail("prototype filter broke merge");
  else pass("unsafe prototype keys ignored");
}

{
  const deleted = deepMerge({ a: 1, b: 2, nested: { c: 3, d: 4 } }, { b: null, nested: { d: null, e: 5 } });
  if ("b" in deleted) fail("null should delete top-level key");
  else if ("d" in deleted.nested || deleted.nested.c !== 3 || deleted.nested.e !== 5) fail("null nested delete");
  else pass("null deletes keys");
}

/* ——— Library + HTTP integration ——— */
(async () => {
  await withTempData(async () => {
    const campaigns = require("../server/lib/campaigns");

    await campaigns.putDocument("stormwreck-isle", "map-state", {
      activeMap: "dragons-rest",
      pinPositions: { a: { x: 1 } },
      tokens: { m1: [{ id: "t1", label: "A" }] },
      initiativeTracker: { "pc:1": { name: "Ada", initiative: 10, kind: "pc" } },
      keepMe: "yes"
    });

    const patched = await campaigns.patchDocument("stormwreck-isle", "map-state", {
      initiativeTracker: {
        "pc:1": { name: "Ada", initiative: 18, kind: "pc" },
        "npc:runara": { name: "Runara", initiative: 12, kind: "npc" }
      },
      tokens: { m1: [{ id: "t1", label: "A" }, { id: "t2", label: "B" }] }
    });

    if (patched.keepMe !== "yes" || patched.activeMap !== "dragons-rest" || !patched.pinPositions?.a) {
      fail("patchDocument lost unrelated map-state keys");
    } else pass("patchDocument preserves unrelated keys");

    if (patched.initiativeTracker["pc:1"].initiative !== 18 || patched.initiativeTracker["npc:runara"].initiative !== 12) {
      fail("patchDocument initiative merge");
    } else pass("patchDocument initiative merge");

    if (!Array.isArray(patched.tokens.m1) || patched.tokens.m1.length !== 2) {
      fail("patchDocument token array replace");
    } else pass("patchDocument token array replace");

    const cleared = await campaigns.patchDocument("stormwreck-isle", "map-state", {
      initiativeTracker: { "pc:1": null }
    });
    if (cleared.initiativeTracker["pc:1"]) fail("patchDocument null delete initiative");
    else if (!cleared.initiativeTracker["npc:runara"]) fail("patchDocument deleted wrong initiative key");
    else pass("patchDocument null delete initiative key");

    try {
      await campaigns.patchDocument("stormwreck-isle", "map-state", [1, 2]);
      fail("array body should 400");
    } catch (err) {
      if (err.status !== 400) fail("array body should status 400");
      else pass("rejects non-object PATCH body");
    }

    /* HTTP route */
    const { createApiRoutes, handleApi } = require("../server/routes/api");
    const routes = createApiRoutes();
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://127.0.0.1");
        if (url.pathname.startsWith("/api")) {
          await handleApi(req, res, url.pathname, routes);
          return;
        }
        res.writeHead(404);
        res.end();
      } catch (err) {
        res.writeHead(err.status || 500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
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

    const httpPatch = await req("PATCH", "/api/campaigns/stormwreck-isle/documents/map-state", {
      activeMap: "seagrow-caves",
      extra: { nested: true }
    });
    if (httpPatch.status !== 200 || httpPatch.body?.document?.activeMap !== "seagrow-caves") {
      fail("HTTP PATCH campaign document");
    } else if (httpPatch.body.document.keepMe !== "yes") {
      fail("HTTP PATCH dropped unrelated keys");
    } else pass("HTTP PATCH campaign document");

    const httpGet = await req("GET", "/api/campaigns/stormwreck-isle/documents/map-state");
    if (httpGet.body?.document?.activeMap !== "seagrow-caves") fail("GET after PATCH");
    else pass("GET after PATCH");

    await new Promise((resolve) => server.close(resolve));
  });

  /* CampaignMapState PATCH vs PUT via vm sandbox */
  {
    const calls = [];
    const localStorage = {
      _d: {},
      getItem(k) {
        return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null;
      },
      setItem(k, v) {
        this._d[k] = String(v);
      },
      removeItem(k) {
        delete this._d[k];
      }
    };
    const sandbox = {
      window: {},
      localStorage,
      console,
      Object,
      Array,
      JSON,
      Map,
      Set,
      Number,
      String,
      Boolean
    };
    sandbox.window = sandbox;
    sandbox.window.LocalApiClient = {
      isAvailable: () => true,
      ready: async () => true,
      getCampaignDocument: async () => ({
        activeMap: null,
        pinPositions: {},
        partyPositions: {},
        customPins: {},
        tokens: {},
        initiativeTracker: { "pc:old": { name: "Old", initiative: 5, kind: "pc" } }
      }),
      putCampaignDocument: async (cid, kind, doc) => {
        calls.push({ method: "PUT", cid, kind, doc });
        return doc;
      },
      patchCampaignDocument: async (cid, kind, patch) => {
        calls.push({ method: "PATCH", cid, kind, patch });
        const base = sandbox.window.CampaignMapState.get(cid);
        /* Simulate server merge: use client's deepMerge if exposed */
        const merged = sandbox.window.CampaignMapState.deepMerge(base, patch);
        return merged;
      }
    };
    vm.runInNewContext(mapStateSrc, sandbox);
    const CMS = sandbox.window.CampaignMapState;
    await CMS.bootstrap("camp-test");
    calls.length = 0;
    CMS.patch("camp-test", {
      initiativeTracker: { "pc:1": { name: "Ada", initiative: 15, kind: "pc" } }
    });
    await new Promise((r) => setTimeout(r, 20));
    if (!calls.length || calls[0].method !== "PATCH") fail("CampaignMapState API path must PATCH");
    else if (calls.some((c) => c.method === "PUT")) fail("CampaignMapState.patch issued PUT");
    else if (!calls[0].patch.initiativeTracker?.["pc:1"]) fail("PATCH body should be partial only");
    else pass("CampaignMapState API uses PATCH partial");

    const after = CMS.get("camp-test");
    if (after.initiativeTracker["pc:old"]?.initiative !== 5 || after.initiativeTracker["pc:1"]?.initiative !== 15) {
      fail("optimistic/reconcile initiative merge");
    } else pass("initiative merge keeps unrelated tracker keys");

    /* local fallback */
    sandbox.window.LocalApiClient.isAvailable = () => false;
    calls.length = 0;
    CMS.patch("camp-local", {
      initiativeTracker: { "tok:1": { name: "Goblin", initiative: 7, kind: "monster" } }
    });
    const raw = localStorage.getItem("camp-local-initiative-tracker");
    if (!raw || !raw.includes("Goblin")) fail("localStorage initiativeTracker persist");
    else pass("initiativeTracker survives local fallback");
  }

  /* Sort render sanity (same rules as MapPanel) */
  {
    const tracker = {
      b: { name: "Bob", initiative: 10, kind: "pc" },
      a: { name: "Ada", initiative: 18, kind: "pc" },
      z: { name: "Zero", initiative: 0, kind: "npc" }
    };
    const rows = Object.entries(tracker)
      .map(([id, row]) => ({
        id,
        name: row?.name || id,
        initiative: Number(row?.initiative) || 0,
        kind: row?.kind || "combatant"
      }))
      .filter((r) => r.initiative !== 0)
      .sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name));
    if (rows.length !== 2 || rows[0].name !== "Ada" || rows[1].name !== "Bob") {
      fail("initiative sort/render order");
    } else pass("initiative sort/render order");
  }

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll campaign document PATCH checks passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
