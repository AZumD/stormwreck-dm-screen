/**
 * Validates map token upload field + asset wiring for PC/NPC/monster catalogues.
 * Run: node test/validate-catalogue-token-image.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

function pass(msg) {
  console.log("OK:", msg);
}

const configs = fs.readFileSync(path.join(root, "js/core/catalogue/configs.js"), "utf8");
const images = fs.readFileSync(path.join(root, "js/core/catalogue/images.js"), "utf8");
const app = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const ids = fs.readFileSync(path.join(root, "server/lib/ids.js"), "utf8");
const assets = fs.readFileSync(path.join(root, "server/lib/assets.js"), "utf8");
const mapToken = fs.readFileSync(path.join(root, "js/core/map-token-size.js"), "utf8");
const combat = fs.readFileSync(path.join(root, "js/core/combat-sheet-modal.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/catalogue.css"), "utf8");

["pc", "npc", "monster"].forEach((type) => {
  const re = new RegExp(`${type}:\\s*\\{[\\s\\S]*?id:\\s*"tokenImage"`);
  if (!re.test(configs)) fail(`${type} config missing tokenImage field`);
  else pass(`${type} catalogue has tokenImage`);
});

if (!images.includes('"tokenImage"')) fail("IMAGE_FIELDS missing tokenImage");
else pass("IMAGE_FIELDS includes tokenImage");

if (!app.includes("cat-token-preview") || !app.includes('field.id === "tokenImage"')) {
  fail("catalogue app missing token upload UI");
} else pass("catalogue app token upload UI");

if (!ids.includes('"tokens"') || !ids.includes("tokenImage")) fail("server ids missing tokens/tokenImage");
else pass("server asset kinds include tokens");

if (!assets.includes('f === "tokenImage"') || !assets.includes('"tokens"')) {
  fail("assets.js missing tokenImage → tokens mapping");
} else pass("assets fieldToKind for tokenImage");

if (!mapToken.includes("resolveTokenUrl") || !mapToken.includes("tokenUrl")) {
  fail("MapTokenSize missing resolveTokenUrl");
} else pass("MapTokenSize resolveTokenUrl");

if (!combat.includes("entry?.tokenImage")) fail("buildMonsterToken should use tokenImage");
else pass("buildMonsterToken uses tokenImage");

if (!css.includes(".cat-token-preview")) fail("css missing token preview");
else pass("css token preview");

const sandbox = { window: {}, CatalogueStore: { _data: {} }, PARTY: [], EntityRegistry: null };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(mapToken, sandbox);
const MTS = sandbox.window.MapTokenSize;
if (MTS.resolveTokenUrl({ tokenImage: "/api/assets/tokens/npc/x" }) !== "/api/assets/tokens/npc/x") {
  fail("resolveTokenUrl should return tokenImage url");
} else pass("resolveTokenUrl returns url");

const docs = fs.readFileSync(path.join(root, "docs/README/VALIDATE-CATALOGUE-TOKEN-IMAGE.md"), "utf8");
if (!docs.includes("validate-catalogue-token-image.js")) fail("docs missing");
else pass("docs README present");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll catalogue token-image checks passed.");
