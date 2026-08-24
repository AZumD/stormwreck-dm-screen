/**
 * Campaign view theme assets (sidebar / main / map panel backgrounds).
 * Run: node test/validate-campaign-theme.js
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

const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const assets = ["left-sidebar.png", "main-body.png", "right-sidebar.png"];

for (const file of assets) {
  const rel = path.join("assets/campaign", file);
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
  else pass(`asset ${rel}`);
}

if (!css.includes("--campaign-nav-bg") || !css.includes("/assets/campaign/left-sidebar.png")) {
  fail("style.css missing left sidebar background");
} else pass("CSS left sidebar bg");

if (!css.includes("--campaign-main-bg") || !css.includes("/assets/campaign/main-body.png")) {
  fail("style.css missing main body background");
} else pass("CSS main body bg");

if (!css.includes("--campaign-map-bg") || !css.includes("/assets/campaign/right-sidebar.png")) {
  fail("style.css missing map panel background");
} else pass("CSS map panel bg");

if (!css.includes(".main-scroll") || !css.includes("var(--campaign-main-bg)")) {
  fail("main-scroll should use campaign main background");
} else pass("main-scroll background wiring");

if (!css.includes(".campaign-page .sidebar") || !css.includes("scrollbar-width: thin")) {
  fail("sidebar missing thin scrollbar styling");
} else pass("sidebar scrollbar styling");

if (css.includes("rgba(18, 26, 38, 0.86)")) {
  fail("sidebar/map overlay still too opaque for dark textures");
} else pass("sidebar/map overlay lightness");

if (
  !css.includes(".campaign-page .sidebar") ||
  !css.includes("background-attachment: scroll, scroll, fixed")
) {
  fail("sidebar missing fixed artwork layer for scroll stability");
} else pass("sidebar fixed artwork attachment");

if (
  !css.includes(".campaign-page .sidebar .nav-btn.active") ||
  !css.includes("linear-gradient(") ||
  !css.includes("--sidebar-ivory")
) {
  fail("sidebar missing legibility scrim or active nav treatment");
} else pass("sidebar legibility pass");

if (!css.includes(".campaign-page .main-chrome") || !css.includes("rgba(10, 14, 20, 0.15)")) {
  fail("campaign topbar should use ~15% overlay");
} else pass("campaign topbar overlay");

for (const html of ["campaigns/stormwreck-isle/index.html", "campaigns/sandbox/index.html"]) {
  const page = fs.readFileSync(path.join(root, html), "utf8");
  if (!page.includes('class="campaign-page"')) fail(`${html} missing campaign-page class`);
  else pass(`${html} campaign-page`);
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll campaign theme checks passed");
