/**
 * Validates Skill/Feature catalogues, refs, and declarative types.
 * Run: node test/validate-skills-features.js
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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const types = read("js/core/catalogue/types.js");
const configs = read("js/core/catalogue/configs.js");
const registry = read("js/core/entity-registry.js");
const parser = read("js/core/parser.js");
const rules = read("js/catalogue-seeds/core-rules.js");
const skills = read("js/catalogue-seeds/core-skills.js");
const features = read("js/catalogue-seeds/core-features.js");
const adventure = read("js/campaigns/stormwreck-isle/adventure.js");

if (!types.includes("skill") || !types.includes("feature") || !types.includes("linkAlternation")) {
  fail("CatalogueTypes incomplete");
} else pass("CatalogueTypes includes skill/feature");

if (!configs.includes("refType: \"feature\"") || !configs.includes("refType: \"skill\"")) {
  fail("class/race configs missing refType lists");
} else pass("featureRefs/skillRefs field configs");

if (!configs.includes('type: "select"') || !configs.includes("Class feature")) {
  fail("feature type select missing");
} else pass("feature type select field");

if (!registry.includes("skillToEntity") || !registry.includes("featureToEntity") || !registry.includes("function register")) {
  fail("registry missing skill/feature/register");
} else pass("registry skill/feature + register");

if (!parser.includes("linkAlternation")) fail("parser not declarative");
else pass("parser uses linkAlternation");

if (!skills.includes('linkId: "nature"') || !features.includes('linkId: "wild-shape"')) {
  fail("stable linkIds missing on seeds");
} else pass("stable skill/feature linkIds");

if (!rules.includes("@feature:wild-shape") || !rules.includes("@skill:nature")) {
  fail("core-rules missing example refs");
} else pass("core-rules wires feature/skill refs");

if (!adventure.includes("@skill:nature") || !adventure.includes("@feature:wild-shape")) {
  fail("adventure missing example @skill/@feature links");
} else pass("adventure demonstrates campaign links");

["skill-katalog/index.html", "feature-katalog/index.html"].forEach((p) => {
  if (!fs.existsSync(path.join(root, p))) fail(`missing ${p}`);
  else pass(`${p} exists`);
});

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll skill/feature checks passed");
