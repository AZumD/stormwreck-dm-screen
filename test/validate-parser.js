/**
 * Validates ContentParser line-break preservation.
 * Run: node test/validate-parser.js
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

const sandbox = {
  window: { I18N: { readAloud: "Read Aloud", dmNote: "DM Note" }, ENTITIES: {} },
  console
};
sandbox.window = Object.assign(sandbox.window, { MediaBar: null });
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/core/parser.js"), "utf8"), sandbox);

const { parseContent, preserveLineBreaks } = sandbox.window.ContentParser;

const plain = parseContent("Line one\nLine two\n\nNew block");
if (!plain.includes("Line one<br>Line two") || !plain.includes("<br><br>New block")) {
  fail("plain line breaks not preserved");
} else {
  pass("plain line breaks → br");
}

const html = parseContent("  <p>Alpha</p>\n  <p>Beta</p>  ");
if (html.includes("<br>") || !html.includes("<p>Alpha</p><p>Beta</p>")) {
  fail("HTML template newlines should collapse, got: " + html);
} else {
  pass("HTML inter-tag newlines collapsed");
}

const note = parseContent("{{dm-note}}First\nSecond{{/dm-note}}");
if (!note.includes("First<br>Second")) fail("dm-note line breaks missing");
else pass("dm-note preserves line breaks");

const collapse = parseContent("{{collapse:If the players lose}}\nThey wake at the cloister.\n{{/collapse}}");
if (!collapse.includes("<details") || !collapse.includes("If the players lose") || !collapse.includes("cloister")) {
  fail("collapse block missing");
} else {
  pass("collapse block renders");
}

const nested = parseContent(
  "{{collapse:Ask him}}\n{{read-aloud}}\nShipwrecks on the reef.\n{{/read-aloud}}\n{{/collapse}}"
);
if (
  !nested.includes("collapse-block") ||
  !nested.includes('class="read-aloud"') ||
  nested.includes("&lt;div") ||
  nested.includes("&lt;span")
) {
  fail("read-aloud inside collapse should render, not escape HTML: " + nested);
} else {
  pass("nested read-aloud inside collapse renders");
}

const nestedLink = parseContent(
  "{{collapse:Cast}}\nTalk to @npc:sw-runara|Runara\n{{/collapse}}",
  { "sw-runara": { name: "Elder Runara" } }
);
if (!nestedLink.includes("entity-link") || !nestedLink.includes("data-id=\"sw-runara\"")) {
  fail("entity link inside collapse missing: " + nestedLink);
} else {
  pass("entity link inside collapse works");
}

const nestedCollapse = parseContent(
  "{{collapse:Outer}}\nbefore\n{{collapse:Inner}}\ninside\n{{/collapse}}\nafter\n{{/collapse}}"
);
const detailsCount = (nestedCollapse.match(/<details/g) || []).length;
if (detailsCount !== 2) {
  fail(`expected 2 nested details, got ${detailsCount}: ${nestedCollapse}`);
} else if (!nestedCollapse.includes("Outer") || !nestedCollapse.includes("Inner") || !nestedCollapse.includes("inside")) {
  fail("nested collapse missing labels/body: " + nestedCollapse);
} else if (!nestedCollapse.includes("before") || !nestedCollapse.includes("after")) {
  fail("outer collapse lost sibling text: " + nestedCollapse);
} else {
  pass("nested collapse blocks render");
}

const spaceTitle = parseContent("{{collapse Search room}}\nNothing here.\n{{/collapse}}");
if (!spaceTitle.includes("Search room") || !spaceTitle.includes("Nothing here")) {
  fail("space-title collapse failed: " + spaceTitle);
} else {
  pass("collapse title with space separator");
}

if (typeof preserveLineBreaks !== "function") fail("preserveLineBreaks not exported");
else pass("preserveLineBreaks exported");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll parser checks passed.");
