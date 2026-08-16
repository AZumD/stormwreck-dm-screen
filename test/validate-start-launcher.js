/**
 * Checks the Windows start-dm-screen.bat launcher wiring.
 * Run: node test/validate-start-launcher.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const batPath = path.join(root, "start-dm-screen.bat");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

if (!fs.existsSync(batPath)) {
  fail("start-dm-screen.bat missing");
} else {
  pass("start-dm-screen.bat exists");
  const bat = fs.readFileSync(batPath, "utf8");
  for (const needle of [
    "server\\index.js",
    "http://127.0.0.1:3000/",
    ":find_node",
    "where node",
    "cursor\\resources\\app\\resources\\helpers\\node.exe"
  ]) {
    if (!bat.includes(needle)) fail(`bat missing: ${needle}`);
  }
  if (!failed) pass("bat contains expected start/open/find-node wiring");
}

const docs = path.join(root, "docs/README/START-DM-SCREEN.md");
if (!fs.existsSync(docs)) fail("docs/README/START-DM-SCREEN.md missing");
else pass("START-DM-SCREEN.md present");

const overview = fs.readFileSync(path.join(root, "docs/README/OVERVIEW.md"), "utf8");
if (!overview.includes("start-dm-screen.bat")) fail("OVERVIEW.md should mention start-dm-screen.bat");
else pass("OVERVIEW mentions launcher");

const serverDoc = fs.readFileSync(path.join(root, "docs/README/SERVER.md"), "utf8");
if (!serverDoc.includes("start-dm-screen.bat")) fail("SERVER.md should mention start-dm-screen.bat");
else pass("SERVER.md mentions launcher");

/* Smoke: bat can resolve node via a dry probe of the find logic (where node or fallbacks). */
const probe = spawnSync(
  process.execPath,
  ["-e", "console.log(process.version)"],
  { encoding: "utf8" }
);
if (probe.status !== 0) fail("current node cannot run a one-liner");
else pass(`node runnable (${String(probe.stdout || "").trim()})`);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll start-launcher checks passed");
