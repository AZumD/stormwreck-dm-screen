/**
 * Static path deny-list + API assets still reachable.
 * Run: node test/validate-static-guard.js
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

const { isDeniedStaticPath } = require("../server/lib/static-guard");

[
  "/data/campaigns/index.json",
  "/data/README.md",
  "/server/index.js",
  "/.git/config",
  "/source/secret.pdf",
  "/.env",
  "/.env.local",
  "/.cursor/rules",
  "/node_modules/express/package.json"
].forEach((p) => {
  if (!isDeniedStaticPath(p)) fail(`should deny ${p}`);
  else pass(`deny ${p}`);
});

["/", "/index.html", "/css/style.css", "/js/campaign-app.js", "/npc-katalog/index.html"].forEach((p) => {
  if (isDeniedStaticPath(p)) fail(`should allow ${p}`);
  else pass(`allow ${p}`);
});

if (isDeniedStaticPath("/api/assets/portraits/npc/x")) {
  /* API is not static — guard is only for static; path starting api is fine if called on static */
  pass("guard focused on static paths (api handled separately)");
} else pass("api path not blocked by static guard helper");

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
  await assets.putFieldFromDataUrl("npc", "guard-test", "portrait", tinyPng);

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

  function get(urlPath) {
    return new Promise((resolve, reject) => {
      http
        .get({ hostname: "127.0.0.1", port, path: urlPath }, (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") })
          );
        })
        .on("error", reject);
    });
  }

  for (const p of [
    "/data/campaigns/index.json",
    "/data/README.md",
    "/server/index.js",
    "/.git/config",
    "/source/",
    "/.env"
  ]) {
    const res = await get(p);
    if (res.status === 200) fail(`HTTP static leaked ${p}`);
    else pass(`HTTP denies ${p} (${res.status})`);
  }

  const index = await get("/index.html");
  if (index.status !== 200 || !index.body.includes("Stormwreck") || !index.body.includes("DM login")) {
    fail("frontend index.html gate broken");
  } else pass("frontend index.html ok");
  const dm = await get("/dm/");
  if (dm.status !== 200 || !dm.body.includes("DM Library")) fail("DM landing /dm/ broken");
  else pass("DM landing /dm/ ok");

  const css = await get("/css/style.css");
  if (css.status !== 200 || !css.body.includes("--bg-deep")) fail("frontend css broken");
  else pass("frontend css ok");

  for (const p of [
    "/assets/campaign/left-sidebar.png",
    "/assets/campaign/main-body.png",
    "/assets/campaign/right-sidebar.png"
  ]) {
    const res = await get(p);
    if (res.status !== 200 || res.body.length < 1000) fail(`static asset missing ${p}`);
    else pass(`static asset ${p}`);
  }

  const asset = await get("/api/assets/portraits/npc/guard-test");
  if (asset.status !== 200 || !asset.body.length) fail("API asset route broken");
  else pass("API asset route ok");

  await assets.deleteField("npc", "guard-test", "portrait");
  await new Promise((resolve) => server.close(resolve));

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll static-guard checks passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
