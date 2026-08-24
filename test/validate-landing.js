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

const gate = fs.readFileSync(path.join(root, "index.html"), "utf8");
const html = fs.readFileSync(path.join(root, "dm/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/landing.css"), "utf8");
const homeCss = fs.readFileSync(path.join(root, "css/home.css"), "utf8");

if (!gate.includes("DM login") || !gate.includes("/dm/") || !gate.includes("/player/")) {
  fail("root gate missing DM/Player entry links");
} else {
  pass("root gate DM/Player links");
}
if (!homeCss.includes("medieval-fantasy-krvphc5yb1whovd1.jpg")) {
  fail("home.css missing gate background image");
} else {
  pass("home gate background");
}
if (!fs.existsSync(path.join(root, "assets/medieval-fantasy-krvphc5yb1whovd1.jpg"))) {
  fail("missing gate background asset");
} else {
  pass("gate background asset present");
}

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

if (!html.includes('id="view-login"') || !html.includes('id="dm-login-form"')) {
  fail("DM landing missing login gate");
} else {
  pass("DM landing login gate");
}

const landingJs = fs.readFileSync(path.join(root, "js/landing.js"), "utf8");
if (!landingJs.includes("/api/auth/login") || !landingJs.includes("hasDmRole")) {
  fail("landing.js missing DM auth flow");
} else {
  pass("landing.js DM auth flow");
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
