/**
 * Validates landing page sidebar catalogues layout.
 * Run: node test/validate-landing.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

function pass(msg) {
  console.log("OK:", msg);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/landing.css"), "utf8");

if (!html.includes("landing-sidebar") || !html.includes("landing-nav")) {
  fail("landing missing catalogue sidebar markup");
} else {
  pass("catalogue sidebar markup");
}

if (html.includes("catalogue-grid") || html.includes("landing-section--reference")) {
  fail("old bottom catalogue grid still present");
} else {
  pass("bottom catalogue grid removed");
}

["pc-katalog", "npc-katalog", "race-katalog", "class-katalog", "spell-katalog", "skill-katalog", "feature-katalog", "item-katalog", "monster-katalog", "location-katalog"].forEach((folder) => {
  if (!html.includes(folder)) fail(`landing missing link to ${folder}`);
  else pass(`link ${folder}`);
});

if (!css.includes(".landing-sidebar") || !css.includes(".landing-body")) {
  fail("landing.css missing sidebar layout");
} else {
  pass("landing sidebar styles");
}

if (!html.includes("create-campaign-btn") || !html.includes("user-campaign-list")) {
  fail("landing missing create/list campaign hooks");
} else {
  pass("create campaign hooks");
}

if (html.includes("card-placeholder") && html.includes("Coming soon")) {
  fail("Coming soon placeholder still present");
} else {
  pass("coming soon placeholder gone");
}

if (!css.includes(".card-create") || !css.includes(".create-campaign-dialog")) {
  fail("landing.css missing create campaign styles");
} else {
  pass("create campaign styles");
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll landing checks passed");
