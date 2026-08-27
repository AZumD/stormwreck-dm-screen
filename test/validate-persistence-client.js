/**
 * Frontend persistence client / wiring static checks.
 * Run: node test/validate-persistence-client.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

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

const store = read("js/core/catalogue/store.js");
const images = read("js/core/catalogue/images.js");
const client = read("js/core/local-api-client.js");
const campaignApp = read("js/campaign-app.js");
const landing = read("dm/index.html");
const importSrc = read("js/core/browser-import.js");
const gitignore = read(".gitignore");

if (!store.includes("LocalApiClient") || !store.includes("async function bootstrap")) {
  fail("CatalogueStore missing API bootstrap");
} else pass("CatalogueStore API bootstrap");

if (!images.includes("/api/assets/") || !images.includes("putCatalogueAsset")) {
  fail("CatalogueImages missing file asset support");
} else pass("CatalogueImages file assets");

if (!client.includes("startWrite") || !client.includes(".catch(() => undefined)")) {
  fail("LocalApiClient must serialize writes per key via factories");
} else pass("LocalApiClient write serialization");

if (!client.includes("patchCampaignDocument") || !client.includes("putCampaignDocument")) {
  fail("LocalApiClient missing document put/patch");
} else pass("LocalApiClient document put/patch");

if (!campaignApp.includes("CatalogueStore.bootstrap") || !campaignApp.includes("CampaignPrefs.bootstrap")) {
  fail("campaign-app missing file-backed bootstrap");
} else pass("campaign-app bootstrap");

if (!landing.includes("Import browser data") || !landing.includes("browser-import.js")) {
  fail("landing missing import tool");
} else pass("landing import tool");

if (!importSrc.includes("localStorage") || !importSrc.includes("exportAllIdb")) {
  fail("browser import missing storage sources");
} else pass("browser import sources");

if (gitignore.includes("\ndata/\n") || gitignore.includes("\ndata\n")) {
  fail("gitignore must not ignore whole /data");
} else pass("data/ not fully gitignored");

if (!gitignore.includes("source/*.pdf") || !gitignore.includes(".cursor/") || !gitignore.includes("credentials.json")) {
  fail("gitignore missing restored protections");
} else pass("gitignore restored protections");

if (!gitignore.includes("data/.backup/") || !gitignore.includes("node_modules/")) {
  fail("gitignore missing backup/node_modules rules");
} else pass("gitignore ephemeral rules");

const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.start !== "node server/index.js") fail("npm start missing");
else pass("npm start");
if (!pkg.scripts?.test) fail("npm test missing");
else pass("npm test");

["stormwreck-isle", "sandbox"].forEach((c) => {
  const html = read(`campaigns/${c}/index.html`);
  if (!html.includes("local-api-client.js") || !html.includes("campaign-prefs.js")) {
    fail(`${c} missing persistence scripts`);
  } else pass(`${c} persistence scripts`);
});

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll persistence-client checks passed");
