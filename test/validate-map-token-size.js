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

if (!css.includes(".map-grid-token--monster")) fail("css missing grid token variants");
else pass("css grid token variants");

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

const docs = fs.readFileSync(path.join(root, "docs/README/MAP-TOKEN-SIZE.md"), "utf8");
if (!docs.includes("validate-map-token-size.js")) fail("docs README missing");
else pass("docs/README/MAP-TOKEN-SIZE.md");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll map-token-size checks passed.");
