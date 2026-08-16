/**
 * Passage editor must survive link-tag prompts / focus refreshes.
 * Run: node test/validate-editor-draft.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js/campaign-app.js"), "utf8");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

if (!app.includes("captureEditorDraft") || !app.includes("restoreEditorDraft")) {
  fail("missing editor draft capture/restore");
} else pass("draft capture/restore helpers");

if (!app.includes("if (editingSectionId) return;")) {
  fail("focus handler should skip re-render while editing");
} else pass("focus handler skips wipe while editing");

if (!app.includes("preserveDraft") || !app.includes("openSectionEditor(draft.sectionId, draft)")) {
  fail("re-renders should accept/restore preserveDraft");
} else pass("re-renders restore preserveDraft");

if (!app.includes("insertEntityLinkSnippet") || !app.includes('data-link="npc"')) {
  fail("entity link toolbar missing");
} else pass("entity link toolbar present");

const docs = fs.readFileSync(path.join(root, "docs/README/CAMPAIGN-APP.md"), "utf8");
if (!docs.includes("draft is preserved")) fail("CAMPAIGN-APP.md should mention draft preservation");
else pass("docs mention draft preservation");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll editor-draft checks passed");
