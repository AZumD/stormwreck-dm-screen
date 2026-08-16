/**
 * Edit-mode “Link scene” wiring for scene connections.
 * Run: node test/validate-scene-link.js
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

const app = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
const sceneUi = fs.readFileSync(path.join(root, "js/core/scene-ui.js"), "utf8");
const i18n = fs.readFileSync(path.join(root, "js/i18n/en.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");

if (!app.includes("data-link-scene") || !app.includes("openConnectionPicker")) {
  fail("campaign-app missing Link scene button wiring");
} else pass("campaign-app Link scene button");

if (!sceneUi.includes("SectionEditor?.isEditMode") || !sceneUi.includes("noOtherScenes")) {
  fail("SceneUI should gate add/remove to edit mode and handle empty destinations");
} else pass("SceneUI edit-mode gated connections");

if (!i18n.includes("linkScene:") || !i18n.includes("noOtherScenes:")) {
  fail("i18n missing linkScene strings");
} else pass("i18n linkScene strings");

if (!css.includes(".section-link-btn")) {
  fail("CSS missing section-link-btn");
} else pass("section-link-btn styles");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll scene-link checks passed");
