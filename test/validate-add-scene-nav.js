/**
 * Validates Prep-workspace sidebar Add scene + ensureEditMode wiring.
 * Run: node test/validate-add-scene-nav.js
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

const app = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const i18n = fs.readFileSync(path.join(root, "js/i18n/en.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");

const buildNavMatch = app.match(/function buildNav\(\)\s*\{[\s\S]*?\n  \}/);
if (!buildNavMatch) {
  fail("could not extract buildNav()");
} else {
  const body = buildNavMatch[0];
  if (!body.includes("nav-add-scene") || !body.includes("nav-add-scene-btn")) {
    fail("buildNav missing nav-add-scene button");
  } else {
    pass("buildNav has nav-add-scene button");
  }

  const editModeBlock = body.match(/if\s*\(\s*editMode\s*\)\s*\{[\s\S]*?\n    \}/);
  if (!editModeBlock) {
    fail("buildNav missing editMode block");
  } else if (!editModeBlock[0].includes("nav-add-scene")) {
    fail("nav-add-scene must live inside Prep/editMode authoring block");
  } else {
    pass("nav-add-scene is Prep/editMode-only");
  }

  if (editModeBlock && editModeBlock[0].includes("nav-add-group")) {
    pass("New group stays edit-mode-only");
  } else {
    fail("editMode block should still add New group");
  }

  if (!body.includes("t.addScene") && !body.includes("t.addScene ||")) {
    fail("buildNav should use t.addScene label");
  } else {
    pass("buildNav uses addScene label");
  }
}

if (!app.includes("function ensureEditMode")) {
  fail("missing ensureEditMode()");
} else if (!app.includes('setWorkspace("prep"')) {
  fail("ensureEditMode should switch to Prep when needed");
} else {
  pass("ensureEditMode switches to Prep");
}

const addPassageMatch = app.match(/function addPassage\(afterId\)\s*\{[\s\S]*?\n  \}/);
if (!addPassageMatch) {
  fail("could not extract addPassage()");
} else if (!addPassageMatch[0].includes("ensureEditMode()")) {
  fail("addPassage must call ensureEditMode()");
} else {
  pass("addPassage enables Prep/edit mode");
}

["addScene", "addSceneHint"].forEach((key) => {
  if (!i18n.includes(`${key}:`)) fail(`i18n missing ${key}`);
  else pass(`i18n has ${key}`);
});

if (!css.includes(".nav-add-scene-btn")) {
  fail("css missing .nav-add-scene-btn");
} else {
  pass("css styles nav-add-scene-btn");
}

const docs = fs.readFileSync(path.join(root, "docs/README/VALIDATE-ADD-SCENE-NAV.md"), "utf8");
if (!docs.includes("validate-add-scene-nav.js")) {
  fail("docs README missing script reference");
} else {
  pass("docs/README/VALIDATE-ADD-SCENE-NAV.md present");
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll add-scene-nav checks passed.");
