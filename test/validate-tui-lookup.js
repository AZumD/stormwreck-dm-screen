#!/usr/bin/env node
/**
 * Runs Go unit tests for TUI master lookup (Ctrl+K cross-catalogue search).
 * Exit 0 on pass.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const tui = path.join(root, "tui");

// Do not use shell:true — Windows cmd splits -run patterns on "|".
const r = spawnSync(
  "go",
  [
    "test",
    "./internal/actions/",
    "./internal/ui/",
    "-count=1",
    "-run",
    "AppLookup|FilterLookup|BuildAndFilterLookup",
  ],
  {
    cwd: tui,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  }
);

process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");
if (r.error) {
  console.error("validate-tui-lookup:", r.error.message);
  process.exit(1);
}
if (r.status !== 0) {
  console.error("validate-tui-lookup: go test failed");
  process.exit(r.status == null ? 1 : r.status);
}
console.log("validate-tui-lookup: ok");
