/**
 * Source Catalogue static checks.
 * Run: node test/validate-source-catalogue.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
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

const ids = fs.readFileSync(path.join(root, "server/lib/ids.js"), "utf8");
const types = fs.readFileSync(path.join(root, "js/core/catalogue/types.js"), "utf8");
const configs = fs.readFileSync(path.join(root, "js/core/catalogue/configs.js"), "utf8");
const app = fs.readFileSync(path.join(root, "js/core/catalogue/app.js"), "utf8");
const sourceUi = fs.readFileSync(path.join(root, "js/core/source-ui.js"), "utf8");
const landing = fs.readFileSync(path.join(root, "dm/index.html"), "utf8");
const page = fs.readFileSync(path.join(root, "source-katalog/index.html"), "utf8");
const player = fs.readFileSync(path.join(root, "server/lib/player.js"), "utf8");
const playerApp = fs.readFileSync(path.join(root, "js/player-app.js"), "utf8");
const docs = fs.readFileSync(path.join(root, "docs/README/SOURCE.md"), "utf8");

if (!ids.includes('"source"')) fail("ids.js missing source");
else pass("source in CATALOGUE_TYPES");
if (!types.includes('id: "source"')) fail("types.js missing source");
else pass("CatalogueTypes source");
if (!configs.includes("source:") || !configs.includes('type: "chapters"')) {
  fail("configs missing source / chapters field");
} else pass("source config + chapters field");
if (
  !configs.includes('value: "Adventures"') ||
  !configs.includes('value: "Rulebooks"') ||
  !configs.includes('value: "Others"') ||
  !configs.includes('groupBy: "category"')
) {
  fail("source config missing Kind (Adventures/Rulebooks/Others)");
} else pass("source Kind select + groupBy");
if (!app.includes('field.type === "chapters"') || !app.includes("SourceUi") || !app.includes("cat-field--chapters")) {
  fail("CatalogueApp missing chapters wiring");
} else pass("CatalogueApp chapters wiring");
if (!sourceUi.includes("window.SourceUi") || !sourceUi.includes("renderChaptersWiki")) {
  fail("source-ui.js incomplete");
} else pass("source-ui.js");
if (!landing.includes("compendium/") || !landing.includes("Compendium")) {
  fail("landing missing Compendium link");
} else pass("landing Compendium link");
if (!page.includes("legacy-redirect.js") || !page.includes('data-type="source"')) {
  fail("source-katalog legacy redirect");
} else pass("source-katalog legacy redirect");
if (!player.includes("PLAYER_LIBRARY_BROWSE_TYPES") || !player.includes('"source"')) {
  fail("player allowlist missing source browse");
} else pass("player source browse allowlist");
if (!player.includes("isPlayerVisibleSource") || !player.includes("PLAYER_HIDDEN_SOURCE_CATEGORIES")) {
  fail("player missing adventure source filter");
} else pass("player adventure source filter");
{
  const browseBlock = player.match(/PLAYER_LIBRARY_BROWSE_TYPES = new Set\(\[([\s\S]*?)\]\)/);
  if (browseBlock && /"location"/.test(browseBlock[1])) {
    fail("player browse still includes location");
  } else pass("player browse excludes location");
}if (!playerApp.includes('"source"') || !/LIBRARY_TYPES = \[[^\]]*source/.test(playerApp)) {
  fail("player-app LIBRARY_TYPES missing source");
} else pass("player-app source chip");
if (/LIBRARY_TYPES = \[[^\]]*location/.test(playerApp)) {
  fail("player-app LIBRARY_TYPES still has location");
} else pass("player-app drops location chip");
if (!docs.includes("Source Catalogue") || !docs.includes("Adventures")) fail("SOURCE.md incomplete");
else pass("SOURCE.md");

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(sourceUi, sandbox);
const SourceUi = sandbox.window.SourceUi;
const chapters = SourceUi.normalizeChapters([
  {
    title: "Ch 1",
    content: "{{read-aloud}}Hello{{/read-aloud}}",
    subchapters: [{ title: "A", content: "**Bold**" }]
  }
]);
if (chapters.length !== 1 || chapters[0].subchapters.length !== 1) fail("normalizeChapters");
else pass("normalizeChapters");
const wiki = SourceUi.renderChaptersWiki(chapters, { player: true });
if (!wiki.includes("source-chapter") || !wiki.includes("Ch 1")) fail("renderChaptersWiki");
else pass("renderChaptersWiki");
if (!wiki.includes("source-chapters--reader")) fail("player wiki missing reader class");
else pass("player wiki reader class");
const stripped = SourceUi.playerSafeMarkup("ok {{dm-note}}secret{{/dm-note}} end");
if (stripped.includes("secret") || !stripped.includes("ok")) fail("playerSafeMarkup");
else pass("playerSafeMarkup strips dm-note");

try {
  const playerMod = require(path.join(root, "server/lib/player.js"));
  if (
    playerMod.isPlayerVisibleSource({ category: "Adventures" }) ||
    !playerMod.isPlayerVisibleSource({ category: "Rulebooks" }) ||
    !playerMod.isPlayerVisibleSource({ category: "" })
  ) {
    fail("isPlayerVisibleSource runtime");
  } else pass("isPlayerVisibleSource runtime");
} catch (err) {
  fail(`player module load: ${err.message}`);
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll source catalogue checks passed.");
