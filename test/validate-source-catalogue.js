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
if (!app.includes('field.type === "chapters"') || !app.includes("SourceUi") || !app.includes("cat-field--chapters")) {
  fail("CatalogueApp missing chapters wiring");
} else pass("CatalogueApp chapters wiring");
if (!sourceUi.includes("window.SourceUi") || !sourceUi.includes("renderChaptersWiki")) {
  fail("source-ui.js incomplete");
} else pass("source-ui.js");
if (!landing.includes("source-katalog") || !landing.includes("Source Catalogue")) {
  fail("landing missing Source link");
} else pass("landing Source Catalogue link");
if (!page.includes('CatalogueApp.init("source")') || !page.includes("source-ui.js")) {
  fail("source-katalog page");
} else pass("source-katalog page");
if (!player.includes("PLAYER_LIBRARY_BROWSE_TYPES") || !player.includes('"source"')) {
  fail("player allowlist missing source browse");
} else pass("player source browse allowlist");
if (!playerApp.includes('"source"') || !/LIBRARY_TYPES = \[[^\]]*source/.test(playerApp)) {
  fail("player-app LIBRARY_TYPES missing source");
} else pass("player-app source chip");
if (!docs.includes("Source Catalogue")) fail("SOURCE.md incomplete");
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
const stripped = SourceUi.playerSafeMarkup("ok {{dm-note}}secret{{/dm-note}} end");
if (stripped.includes("secret") || !stripped.includes("ok")) fail("playerSafeMarkup");
else pass("playerSafeMarkup strips dm-note");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll source catalogue checks passed.");
