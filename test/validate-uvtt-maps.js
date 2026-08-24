/**
 * Phase M1–M3-lite: UVTT import, distance, campaign-scoped map images, tokens shape.
 * Run: node test/validate-uvtt-maps.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const os = require("os");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

const uvtt = require(path.join(root, "server/lib/uvtt.js"));
const mapDistance = require(path.join(root, "server/lib/map-distance.js"));
const campaignMaps = require(path.join(root, "server/lib/campaign-maps.js"));
const { CAMPAIGN_DOC_KINDS } = require(path.join(root, "server/lib/ids.js"));

if (!CAMPAIGN_DOC_KINDS.includes("maps")) fail("maps doc kind missing");
else pass("maps document kind registered");

const fixturePath = path.join(root, "test/fixtures/sample.uvtt.json");
const fixtureText = fs.readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);

/* --- parse / normalize --- */
try {
  uvtt.parseUvttText("{not json");
  fail("malformed JSON should throw");
} catch (e) {
  if (e.status === 400) pass("malformed JSON rejection");
  else fail(`malformed status ${e.status}`);
}

try {
  uvtt.normalizeUvtt({ resolution: { pixels_per_grid: 70, map_size: { x: 2, y: 2 } } });
  fail("missing image should throw");
} catch (e) {
  if (e.status === 400) pass("missing image rejection");
  else fail(`missing image ${e.message}`);
}

const { map: norm, image } = uvtt.parseUvttText(fixtureText, {
  sourceFormat: "uvtt",
  name: "Fixture Cave"
});
if (norm.kind !== "uvtt" || norm.grid.pixelsPerGrid !== 70) fail("grid/resolution normalize");
else pass("grid/resolution normalization");
if (norm.grid.sizeX !== 4 || norm.grid.sizeY !== 3) fail("map size");
else pass("map size from resolution");
if (norm.widthPx !== 280 || norm.heightPx !== 210) fail(`px size ${norm.widthPx}x${norm.heightPx}`);
else pass("width/height from size × ppg");
if (!image.buffer?.length || image.ext !== "png") fail("image extract");
else pass("extracted image buffer");

const wallSources = (norm.geometry.walls || []).map((w) => w.source);
if (!wallSources.includes("line_of_sight") || !wallSources.includes("objects_line_of_sight")) {
  fail("LOS + objects_line_of_sight");
} else pass("LOS import includes walls and objects_line_of_sight");
if ((norm.geometry.portals || []).length !== 1) fail("portal import");
else pass("portal import");
if ((norm.geometry.lights || []).length !== 2) fail("light import");
else pass("light import");
if (norm.import?.stats?.wallsObjectsLos !== 1) fail("objects LOS stats");
else pass("objects_line_of_sight stats preserved");

/* dd2vtt alias via sourceFormat */
const dd = uvtt.normalizeUvtt(fixture, { sourceFormat: "dd2vtt", name: "DD" });
if (dd.map.sourceFormat !== "dd2vtt") fail("dd2vtt source format");
else pass("valid .dd2vtt-style import normalize");

/* distance */
const d = mapDistance.distanceBetween(
  { x: 0, y: 0 },
  { x: 3, y: 4 },
  { distancePerGrid: 5, unit: "ft" }
);
if (d.distance !== 25 || d.label !== "25 ft") fail(`distance ${JSON.stringify(d)}`);
else pass("distance calculation (3-4-5 × 5 ft)");
const snapped = mapDistance.distanceBetween(
  { x: 0, y: 0 },
  { x: 2.4, y: 0 },
  { distancePerGrid: 5, unit: "ft" },
  { snap: true }
);
if (snapped.distance !== 10) fail(`snap ${snapped.distance}`);
else pass("snapped distance");

/* custom scale not hard-coded */
const d10 = mapDistance.distanceBetween(
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { distancePerGrid: 10, unit: "m" }
);
if (d10.distance !== 20 || d10.unit !== "m") fail("custom scale");
else pass("distance uses scale.distancePerGrid");

/* --- persistence + HTTP --- */
(async () => {
  const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "uvtt-maps-"));
  process.env.DM_DATA_ROOT = tmp;
  process.env.AUTH_REQUIRED = "0";

  const campaigns = require(path.join(root, "server/lib/campaigns.js"));
  const { ensureDataLayout } = require(path.join(root, "server/lib/atomic-fs.js"));
  await ensureDataLayout();

  const camp = await campaigns.createCampaign({ title: "UVTT Test Camp", description: "" });
  const campaignId = camp.id;

  const imported = await campaignMaps.importUvtt(campaignId, {
    text: fixtureText,
    filename: "sample.uvtt",
    name: "Seagrow Test"
  });
  if (!imported.id || imported.kind !== "uvtt") fail("importUvtt entry");
  else pass("valid .uvtt import");

  const imgPath = path.join(tmp, "assets", "maps", "campaign-map", campaignId, `${imported.id}.png`);
  if (!fs.existsSync(imgPath)) fail("extracted image not on disk under campaign-map path");
  else pass("extracted image persistence (campaign-scoped path)");

  const listed = await campaignMaps.listMaps(campaignId);
  if (!listed.some((m) => m.id === imported.id)) fail("list maps");
  else pass("list maps includes import");

  const full = await campaignMaps.getMap(campaignId, imported.id);
  if ((full.geometry.walls || []).length < 2) fail("persisted walls");
  else pass("geometry persisted in maps.json");

  const patched = await campaignMaps.patchMap(campaignId, imported.id, {
    scale: { distancePerGrid: 10, unit: "ft" },
    display: { showGrid: false, snapToGrid: true }
  });
  if (patched.scale.distancePerGrid !== 10 || patched.display.snapToGrid !== true) fail("patch scale");
  else pass("patch distancePerGrid / display");

  /* existing PNG upload path still works */
  const assets = require(path.join(root, "server/lib/assets.js"));
  const tiny =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const put = await assets.putFieldFromDataUrl("location", "loc-uvtt-test", "mapImage", tiny);
  if (!put?.url?.includes("/api/assets/maps/location/")) fail("legacy mapImage upload");
  else pass("existing PNG/JPEG map upload path remains functional");

  const { createApiRoutes, handleApi } = require(path.join(root, "server/routes/api.js"));
  const routes = createApiRoutes();

  function httpRequest(method, urlPath, { body } = {}) {
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
                : {})
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
              resolve({ status: res.statusCode, headers: res.headers, data, raw: text });
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

  const imgRes = await httpRequest(
    "GET",
    `/api/campaigns/${campaignId}/maps/${imported.id}/image`
  );
  if (imgRes.status !== 200 || !(imgRes.raw && imgRes.raw.length)) fail("campaign map image route");
  else pass("campaign-scoped map image route");

  const badImport = await httpRequest("POST", `/api/campaigns/${campaignId}/maps/import-uvtt`, {
    body: { text: "{bad", filename: "x.uvtt" }
  });
  if (badImport.status !== 400) fail(`malformed import HTTP ${badImport.status}`);
  else pass("malformed import returns useful error");

  const distRes = await httpRequest(
    "POST",
    `/api/campaigns/${campaignId}/maps/${imported.id}/distance`,
    { body: { from: { x: 0, y: 0 }, to: { x: 1, y: 0 } } }
  );
  if (distRes.status !== 200 || distRes.data.distance !== 10) fail("distance API uses patched scale");
  else pass("distance API");

  /* token coordinate persistence shape in map-state */
  const token = {
    id: "tok-test-1",
    label: "Marker",
    ref: null,
    x: 1.5,
    y: 2.25,
    size: 1,
    visible: true,
    imageUrl: null
  };
  await campaigns.putDocument(campaignId, "map-state", {
    activeMap: imported.id,
    filters: null,
    pinPositions: {},
    partyPositions: {},
    customPins: {},
    tokens: { [imported.id]: [token] }
  });
  const ms = await campaigns.getDocument(campaignId, "map-state");
  if (ms.tokens?.[imported.id]?.[0]?.x !== 1.5) fail("token coordinate persistence");
  else pass("token coordinate persistence");

  /* static UI wiring checks */
  const mapPanel = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
  const mapSpatial = fs.readFileSync(path.join(root, "js/core/map-spatial.js"), "utf8");
  const mapDistClient = fs.readFileSync(path.join(root, "js/core/map-distance.js"), "utf8");
  if (!mapDistClient.includes("distanceBetween")) fail("client MapDistance missing");
  else pass("client MapDistance module");
  if (!mapSpatial.includes("map-uvtt-file") || !mapSpatial.includes("Location catalogue")) {
    fail("map spatial UVTT UI missing");
  } else pass("map spatial UVTT import UI");
  if (!mapPanel.includes("getEffectiveMaps") || !mapPanel.includes("MapSpatial")) {
    fail("map-panel calibrated integration missing");
  } else pass("map-panel calibrated / UVTT integration");
  if (!mapSpatial.includes("objects_line_of_sight") && !fixtureText.includes("objects_line_of_sight")) {
    fail("objects_line_of_sight fixture missing");
  } else pass("objects_line_of_sight fixture present");

  const httpUtilSrc = fs.readFileSync(path.join(root, "server/lib/http-util.js"), "utf8");
  const apiSrc = fs.readFileSync(path.join(root, "server/routes/api.js"), "utf8");
  if (!httpUtilSrc.includes("UVTT_BODY_LIMIT") || !httpUtilSrc.includes("64 * 1024 * 1024")) {
    fail("http-util missing UVTT_BODY_LIMIT (64MB)");
  } else pass("UVTT body limit constant");
  const uvttLimitCalls = (apiSrc.match(/readJsonBody\(req,\s*\{\s*limit:\s*UVTT_BODY_LIMIT\s*\}/g) || [])
    .length;
  if (uvttLimitCalls < 2) {
    fail("import-uvtt and catalogue uvtt routes must use readJsonBody(req, { limit: UVTT_BODY_LIMIT })");
  } else pass("UVTT routes use raised body limit");

  const bigPayload = JSON.stringify({
    text: "x".repeat(26 * 1024 * 1024),
    filename: "oversize.uvtt"
  });
  const bigRes = await new Promise((resolve, reject) => {
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
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/api/catalogue-assets/location/loc-oversize/uvtt",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bigPayload)
          }
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            server.close();
            resolve({ status: res.statusCode });
          });
        }
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      req.write(bigPayload);
      req.end();
    });
  });
  if (bigRes.status === 413) fail("catalogue uvtt rejected 26MB body (25MB cap bug)");
  else pass("catalogue uvtt accepts body > 25MB");

  /* dd2vtt filename path */
  const importedDd = await campaignMaps.importUvtt(campaignId, {
    text: fixtureText,
    filename: "room.dd2vtt",
    name: "DD Room"
  });
  if (importedDd.sourceFormat !== "dd2vtt") fail("dd2vtt import sourceFormat");
  else pass("valid .dd2vtt import");

  try {
    await fs.promises.rm(tmp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  if (failed) {
    console.error(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll UVTT / calibrated map checks passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
