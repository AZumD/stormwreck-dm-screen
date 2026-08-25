/**
 * Streaming static/asset responses, ETag/304, versioned Cache-Control.
 * Run: node test/validate-http-cache.js
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

const indexSrc = fs.readFileSync(path.join(root, "server/index.js"), "utf8");
const assetsSrc = fs.readFileSync(path.join(root, "server/lib/assets.js"), "utf8");
const storeSrc = fs.readFileSync(path.join(root, "js/core/catalogue/store.js"), "utf8");
const cataloguesSrc = fs.readFileSync(path.join(root, "server/lib/catalogues.js"), "utf8");
const appSrc = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const imagesSrc = fs.readFileSync(path.join(root, "js/core/catalogue/images.js"), "utf8");

if (indexSrc.includes("fsp.readFile(filePath)") || /await fsp\.readFile\(target\)/.test(indexSrc)) {
  fail("static handler still buffers with readFile");
} else if (!indexSrc.includes("sendFileStream") && !indexSrc.includes("createReadStream")) {
  fail("static handler missing stream path");
} else pass("static handler streams files");

if (!assetsSrc.includes("resolveAsset") || !assetsSrc.includes("?v=")) {
  fail("assets missing resolveAsset / versioned publicUrl");
} else pass("assets resolve + versioned URLs");

if (!storeSrc.includes("Promise.all") || !/bootstrap[\s\S]*Promise\.all/.test(storeSrc)) {
  fail("catalogue bootstrap not parallel");
} else pass("catalogue bootstrap uses Promise.all");

if (!cataloguesSrc.includes("Promise.all") || !/list\(type\)[\s\S]*Promise\.all/.test(cataloguesSrc)) {
  fail("catalogues.list not parallel");
} else pass("catalogues.list parallel reads");

if (!appSrc.includes('loading="lazy"')) fail("list thumbs missing loading=lazy");
else pass("catalogue list thumbs lazy-load");

if (!imagesSrc.includes("File-backed") && !imagesSrc.includes("on demand")) {
  fail("preload docs should note API assets load on demand");
} else pass("preload does not eagerly fetch /api/assets");

const {
  weakEtagFromStat,
  notModified,
  cacheControlForAssetUrl
} = require("../server/lib/http-cache");

const fakeStat = { size: 100, mtimeMs: 1_700_000_000_000, mtime: new Date(1_700_000_000_000) };
const etag = weakEtagFromStat(fakeStat);
if (!etag.startsWith("W/\"") || !etag.includes("-")) fail("weak etag shape");
else pass("weak ETag from size+mtime");

if (
  !notModified({ headers: { "if-none-match": etag } }, etag, fakeStat.mtime) ||
  notModified({ headers: {} }, etag, fakeStat.mtime)
) {
  fail("If-None-Match 304 logic");
} else pass("If-None-Match handling");

if (cacheControlForAssetUrl("/api/assets/portraits/npc/x?v=123").includes("immutable")) {
  pass("versioned asset Cache-Control immutable");
} else fail("versioned asset should be immutable");

if (cacheControlForAssetUrl("/api/assets/portraits/npc/x").includes("immutable")) {
  fail("legacy asset must not be immutable");
} else pass("legacy asset short Cache-Control");

(async () => {
  process.env.DM_DATA_ROOT = path.join(root, "data");
  const { ensureDataLayout } = require("../server/lib/atomic-fs");
  const { createApiRoutes, handleApi } = require("../server/routes/api");
  const { sendJson } = require("../server/lib/http-util");
  const { serveStatic } = require("../server/index.js");
  const assets = require("../server/lib/assets");

  await ensureDataLayout();

  const tinyPng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const put = await assets.putFieldFromDataUrl("npc", "cache-test", "portrait", tinyPng);
  if (!put.url.includes("?v=")) fail("upload URL missing version query");
  else pass("upload returns versioned asset URL");

  if (!assets.isAssetUrl(put.url)) fail("isAssetUrl rejects versioned URL");
  else pass("isAssetUrl accepts versioned URL");

  const apiRoutes = createApiRoutes();
  const server = http.createServer(async (req, res) => {
    const host = req.headers.host || "127.0.0.1";
    const url = new URL(req.url || "/", `http://${host}`);
    if (url.pathname.startsWith("/api")) {
      const handled = await handleApi(req, res, url.pathname, apiRoutes);
      if (!handled) sendJson(res, 404, { ok: false, error: "Not found" });
      return;
    }
    await serveStatic(req, res, root, url.pathname);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  function get(urlPath, headers = {}) {
    return new Promise((resolve, reject) => {
      http
        .get({ hostname: "127.0.0.1", port, path: urlPath, headers }, (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: Buffer.concat(chunks)
            })
          );
        })
        .on("error", reject);
    });
  }

  const css = await get("/css/style.css");
  if (css.status !== 200 || !css.headers.etag || !css.headers["last-modified"]) {
    fail("static response missing ETag/Last-Modified");
  } else pass("static response has ETag + Last-Modified");
  if (!css.headers["content-length"]) fail("static missing Content-Length");
  else pass("static Content-Length set");
  const cssCc = String(css.headers["cache-control"] || "");
  if (!cssCc.includes("must-revalidate")) fail(`css Cache-Control should revalidate, got ${cssCc}`);
  else pass("css/js use must-revalidate (not long-lived CDN cache)");

  const js = await get("/js/core/catalogue/configs.js");
  const jsCc = String(js.headers["cache-control"] || "");
  if (js.status !== 200 || !jsCc.includes("must-revalidate") || jsCc.includes("86400")) {
    fail(`configs.js Cache-Control should revalidate, got ${jsCc}`);
  } else pass("configs.js must-revalidate");

  const fav = await get("/favicon.png");
  const favCc = String(fav.headers["cache-control"] || "");
  if (fav.status !== 200 || !favCc.includes("must-revalidate")) {
    fail(`favicon Cache-Control should revalidate, got ${favCc}`);
  } else pass("favicon must-revalidate");

  const css304 = await get("/css/style.css", { "If-None-Match": css.headers.etag });
  if (css304.status !== 304) fail(`static If-None-Match expected 304 got ${css304.status}`);
  else pass("static 304 Not Modified");

  const css304ims = await get("/css/style.css", {
    "If-Modified-Since": css.headers["last-modified"]
  });
  if (css304ims.status !== 304) fail(`static If-Modified-Since expected 304 got ${css304ims.status}`);
  else pass("static If-Modified-Since 304");

  const versioned = await get(put.url);
  if (versioned.status !== 200 || !versioned.body.length) fail("versioned asset GET");
  else pass("versioned asset GET works");
  const cc = String(versioned.headers["cache-control"] || "");
  if (!cc.includes("immutable") || !cc.includes("31536000")) fail(`versioned Cache-Control ${cc}`);
  else pass("versioned asset immutable Cache-Control");

  const legacyPath = `/api/assets/portraits/npc/cache-test`;
  const legacy = await get(legacyPath);
  if (legacy.status !== 200 || !legacy.body.length) fail("legacy unversioned asset GET");
  else pass("legacy unversioned asset GET works");
  const legacyCc = String(legacy.headers["cache-control"] || "");
  if (legacyCc.includes("immutable")) fail("legacy Cache-Control must not be immutable");
  else pass("legacy asset short revalidate Cache-Control");

  if (!legacy.headers.etag) fail("asset missing ETag");
  else pass("asset response has ETag");

  const asset304 = await get(legacyPath, { "If-None-Match": legacy.headers.etag });
  if (asset304.status !== 304) fail(`asset If-None-Match expected 304 got ${asset304.status}`);
  else pass("asset 304 Not Modified");

  /* Security still holds */
  const leaked = await get("/data/campaigns/index.json");
  if (leaked.status === 200) fail("static guard regression");
  else pass("static security guard still denies /data");

  await assets.deleteField("npc", "cache-test", "portrait");
  await new Promise((resolve) => server.close(resolve));

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll http-cache checks passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
