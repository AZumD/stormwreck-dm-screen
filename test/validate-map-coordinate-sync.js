/**
 * Validates DM/player map coordinate helpers (fog, tokens, grid alignment).
 * Run: node test/validate-map-coordinate-sync.js
 */
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

const distance = fs.readFileSync(path.join(root, "js/core/map-distance.js"), "utf8");
const fog = fs.readFileSync(path.join(root, "js/core/map-fog.js"), "utf8");
const spatial = fs.readFileSync(path.join(root, "js/core/map-spatial.js"), "utf8");
const panel = fs.readFileSync(path.join(root, "js/core/map-panel.js"), "utf8");
const tokenSize = fs.readFileSync(path.join(root, "js/core/map-token-size.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const playerCss = fs.readFileSync(path.join(root, "css/player.css"), "utf8");

if (!distance.includes("imageContentRect") || !distance.includes("clientToNormalized")) {
  fail("map-distance missing imageContentRect / clientToNormalized");
} else pass("map-distance image coord helpers");

if (!fog.includes("mapImage") || !fog.includes("clientToNormalized")) {
  fail("map-fog should paint using map image coords");
} else pass("map-fog uses map image for paint coords");

if (!spatial.includes("mapImage,") || !spatial.includes("worldToPercent?.(ox + i")) {
  fail("map-spatial should pass mapImage to fog and grid via worldToPercent");
} else pass("map-spatial grid + fog wiring");

if (!panel.includes("clientToPercent")) {
  fail("map-panel pin drag should use clientToPercent");
} else pass("map-panel pin drag uses clientToPercent");

if (tokenSize.includes("margin:calc(-") || !tokenSize.includes("translate(-50%,-50%)")) {
  fail("gridTokenStyle should center with translate, not margin");
} else pass("gridTokenStyle uses translate(-50%,-50%)");

const mapImageBlock = css.match(/\.map-image\s*\{[^}]+\}/);
if (mapImageBlock && /object-fit:\s*contain/.test(mapImageBlock[0])) {
  fail("DM map-image should not letterbox with object-fit contain");
} else pass("DM map-image avoids object-fit contain letterboxing");

if (!distance.includes("ensureMapSurface")) {
  fail("map-distance missing ensureMapSurface");
} else pass("map-distance ensureMapSurface");

if (!css.includes(".map-surface") || !css.match(/\.map-image\s*\{[^}]*position:\s*absolute/)) {
  fail("DM map-image should fill map-surface absolutely");
} else pass("DM map-surface + absolute image");

if (!playerCss.includes(".player-map-surface")) {
  fail("player map missing player-map-surface");
} else pass("player-map-surface wrapper");

const sandbox = { window: {} };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(distance, sandbox);
const MD = sandbox.window.MapDistance;

const map = {
  widthPx: 2000,
  heightPx: 1000,
  grid: { pixelsPerGrid: 100, origin: { x: 2, y: 1 }, sizeX: 18, sizeY: 8 }
};

const pctOrigin = MD.worldToPercent(2, 1, map);
if (!pctOrigin || Math.abs(pctOrigin.x) > 0.001 || Math.abs(pctOrigin.y) > 0.001) {
  fail(`grid origin should map to ~0%,0% got ${pctOrigin?.x},${pctOrigin?.y}`);
} else pass("worldToPercent honors grid.origin at 0%,0%");

const pctCell = MD.worldToPercent(3, 1, map);
const expectedX = (100 / 2000) * 100;
if (!pctCell || Math.abs(pctCell.x - expectedX) > 0.001) {
  fail(`one cell from origin expected x=${expectedX} got ${pctCell?.x}`);
} else pass("worldToPercent cell step matches calibration");

const fakeImg = {
  naturalWidth: 2000,
  naturalHeight: 1000,
  getBoundingClientRect: () => ({ left: 100, top: 50, width: 400, height: 200, right: 500, bottom: 250 })
};
const norm = MD.clientToNormalized(300, 150, fakeImg, map);
if (!norm || Math.abs(norm.x - 0.5) > 0.001 || Math.abs(norm.y - 0.5) > 0.001) {
  fail(`clientToNormalized center expected 0.5,0.5 got ${norm?.x},${norm?.y}`);
} else pass("clientToNormalized center");

const letterImg = {
  naturalWidth: 1000,
  naturalHeight: 1000,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 })
};
const letterRect = MD.imageContentRect(letterImg);
if (!letterRect || Math.abs(letterRect.width - 100) > 0.001 || Math.abs(letterRect.left - 50) > 0.001) {
  fail("imageContentRect should trim horizontal letterbox");
} else pass("imageContentRect trims letterbox");

const docs = fs.readFileSync(path.join(root, "docs/README/VALIDATE-MAP-COORDINATE-SYNC.md"), "utf8");
if (!docs.includes("validate-map-coordinate-sync.js")) fail("docs missing");
else pass("docs README present");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll map coordinate sync checks passed.");
