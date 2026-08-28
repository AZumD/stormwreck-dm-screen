/**
 * Validates D&D size → grid token footprint helpers.
 * Run: node test/validate-map-token-size.js
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

const src = fs.readFileSync(path.join(root, "js/core/map-token-size.js"), "utf8");
const spatial = fs.readFileSync(path.join(root, "js/core/map-spatial.js"), "utf8");
const panel = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const combat = fs.readFileSync(path.join(root, "js/core/combat-sheet-modal.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "campaigns/stormwreck-isle/index.html"), "utf8");

[
  "dndSizeToGridCells",
  "resolveNpcSize",
  "resolvePinSize",
  "gridCells",
  "MapTokenSize"
].forEach((token) => {
  if (token === "MapTokenSize") {
    if (!src.includes("window.MapTokenSize")) fail("map-token-size.js missing export");
    else pass("MapTokenSize module");
    return;
  }
  const hay = src.includes(`function ${token}`) || src.includes(`${token}(`) ? src : `${spatial}${panel}${combat}${css}`;
  if (!hay.includes(token)) fail(`missing token ${token}`);
  else pass(`has ${token}`);
});

if (!`${spatial}${css}`.includes("map-grid-token")) fail("missing map-grid-token class");
else pass("has map-grid-token class");

if (!html.includes("map-token-size.js")) fail("campaign HTML missing map-token-size.js");
else pass("script tag in campaign HTML");

if (!css.includes(".map-grid-token") || css.match(/\.map-grid-token\s*\{[^}]*transform:\s*scale/)) {
  fail("map-grid-token should not counter-scale with zoom");
} else pass("map-grid-token skips pin counter-scale");

const sandbox = {
  window: {},
  CatalogueStore: {
    _data: {
      monster: [
        { id: "sw-stirge", name: "Stirge", size: "Tiny" },
        { id: "sw-merrow", name: "Merrow", size: "Large" }
      ],
      race: [{ id: "race-halfling", name: "Halfling", size: "Small" }]
    },
    loadAll(type) {
      return sandbox.CatalogueStore._data[type] || [];
    },
    get(type, id) {
      return (sandbox.CatalogueStore._data[type] || []).find((e) => e.id === id) || null;
    }
  },
  PARTY: [],
  EntityRegistry: null
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const MTS = sandbox.window.MapTokenSize;

const sizes = [
  ["Tiny", 1],
  ["Small", 1],
  ["Medium", 1],
  ["Large", 2],
  ["Huge", 3],
  ["Gargantuan", 4]
];
sizes.forEach(([label, cells]) => {
  if (MTS.dndSizeToGridCells(label) !== cells) fail(`dndSizeToGridCells(${label}) expected ${cells}`);
  else pass(`dndSizeToGridCells(${label}) = ${cells}`);
});

const map = { grid: { sizeX: 20, sizeY: 20 } };
const largeSpan = MTS.cellSpanPercent(2, map);
if (Math.abs(largeSpan.w - 10) > 0.001 || Math.abs(largeSpan.h - 10) > 0.001) {
  fail(`cellSpanPercent Large on 20x20 expected 10% got ${largeSpan.w}`);
} else pass("cellSpanPercent Large = 10% on 20x20");

if (MTS.resolveNpcSize({ race: "Kobold" }) !== "Small") fail("Kobold NPC default should be Small");
else pass("Kobold NPC → Small via default");

if (MTS.resolveNpcSize({ race: "Winged kobold" }) !== "Small") fail("Winged kobold should resolve Small");
else pass("Winged kobold → Small");

if (MTS.lookupMonsterSizeByRace("Stirge") !== "Tiny") fail("Stirge race lookup should hit monster catalogue");
else pass("Stirge → monster catalogue Tiny");

if (MTS.resolveNpcSize({ race: "Halfling" }) !== "Small") fail("Halfling NPC should use race catalogue");
else pass("Halfling NPC → race catalogue Small");

if (MTS.resolveTokenUrl({ tokenImage: "/api/assets/tokens/npc/x" }) !== "/api/assets/tokens/npc/x") {
  fail("resolveTokenUrl should return tokenImage url");
} else pass("resolveTokenUrl returns tokenImage");

if (MTS.resolveTokenUrl({ portrait: "/api/assets/portraits/npc/y" }) !== "/api/assets/portraits/npc/y") {
  fail("resolveTokenUrl should fall back to portrait");
} else pass("resolveTokenUrl portrait fallback");

const pinImages = MTS.resolvePinImageUrls("npc", { id: "sw-runara", portrait: "/api/assets/portraits/npc/sw-runara" }, {
  entityId: "runara"
});
if (pinImages.url !== "/api/assets/portraits/npc/sw-runara") {
  fail("resolvePinImageUrls should return portrait when no tokenImage");
} else pass("resolvePinImageUrls portrait");

const tokenFirst = MTS.resolvePinImageUrls(
  "npc",
  { id: "x", tokenImage: "/api/assets/tokens/npc/x", portrait: "/api/assets/portraits/npc/x" },
  {}
);
if (tokenFirst.url !== "/api/assets/tokens/npc/x" || tokenFirst.fallbackUrl !== "/api/assets/portraits/npc/x") {
  fail("resolvePinImageUrls should prefer token with portrait fallback");
} else pass("resolvePinImageUrls token + fallback");

const tokenHtml = MTS.tokenImageHtml("/a", "Test", "/b");
if (!tokenHtml.includes('data-fallback="/b"') || !tokenHtml.includes('src="/a"')) {
  fail("tokenImageHtml should include fallback attr");
} else pass("tokenImageHtml fallback attr");

if (spatial.includes('tokenTitle(t),\n              ""')) {
  fail("monster renderGridToken must not pass empty labelHtml (suppresses token art)");
} else pass("monster tokens use null labelHtml");

const docs = fs.readFileSync(path.join(root, "docs/README/MAP-TOKEN-SIZE.md"), "utf8");
if (!docs.includes("validate-map-token-size.js")) fail("docs README missing");
else pass("docs/README/MAP-TOKEN-SIZE.md");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll map-token-size checks passed.");
