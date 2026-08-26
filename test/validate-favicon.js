/**
 * Favicon present + linked + served (incl. /favicon.ico alias).
 * Run: node test/validate-favicon.js
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

const faviconPath = path.join(root, "favicon.png");
if (!fs.existsSync(faviconPath)) fail("favicon.png missing at repo root");
else {
  const buf = fs.readFileSync(faviconPath);
  if (buf[0] !== 0x89 || buf[1] !== 0x50) fail("favicon.png is not a PNG");
  else pass("favicon.png present");
}

const pages = [
  "index.html",
  "dm/index.html",
  "player/index.html",
  "music-katalog/index.html",
  "source-katalog/index.html",
  "pc-katalog/index.html",
  "npc-katalog/index.html",
  "monster-katalog/index.html",
  "item-katalog/index.html",
  "location-katalog/index.html",
  "spell-katalog/index.html",
  "skill-katalog/index.html",
  "feature-katalog/index.html",
  "race-katalog/index.html",
  "class-katalog/index.html",
  "campaigns/stormwreck-isle/index.html",
  "campaigns/sandbox/index.html"
];

for (const rel of pages) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  if (!html.includes('rel="icon"') || !html.includes('href="/favicon.png')) {
    fail(`missing favicon link: ${rel}`);
  } else pass(`favicon link: ${rel}`);
}

(async () => {
  const { serveStatic } = require("../server/index.js");
  const server = http.createServer(async (req, res) => {
    const host = req.headers.host || "127.0.0.1";
    const url = new URL(req.url || "/", `http://${host}`);
    await serveStatic(req, res, root, url.pathname);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  function get(urlPath) {
    return new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${port}${urlPath}`, (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              status: res.statusCode,
              type: res.headers["content-type"] || "",
              body: Buffer.concat(chunks)
            })
          );
        })
        .on("error", reject);
    });
  }

  try {
    const png = await get("/favicon.png");
    if (png.status !== 200 || !png.type.includes("image/png") || png.body[0] !== 0x89) {
      fail(`/favicon.png status=${png.status} type=${png.type}`);
    } else pass("GET /favicon.png");

    const ico = await get("/favicon.ico");
    if (ico.status !== 200 || !ico.type.includes("image/png") || ico.body[0] !== 0x89) {
      fail(`/favicon.ico alias status=${ico.status} type=${ico.type}`);
    } else pass("GET /favicon.ico serves favicon.png");
  } finally {
    server.close();
  }

  if (failed) {
    console.error(`\n${failed} favicon check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll favicon checks passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
