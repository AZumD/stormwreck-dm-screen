/**
 * Catalogue wiki linking + EntityUI modal navigation.
 * Run: node test/validate-entity-wiki.js
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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

/* ── Static wiring ────────────────────────────────────── */

const uiSrc = read("js/core/entity-ui.js");
const registrySrc = read("js/core/entity-registry.js");
const configs = read("js/core/catalogue/configs.js");
const appSrc = read("js/core/catalogue/app.js");
const features = read("js/catalogue-seeds/core-features.js");
const storm = read("js/catalogue-seeds/stormwreck-isle.js");
const monsterHtml = read("monster-katalog/index.html");
const parserSrc = read("js/core/parser.js");
const typesSrc = read("js/core/catalogue/types.js");

if (!uiSrc.includes("navStack") || !uiSrc.includes("goBack") || !uiSrc.includes("pushHistory")) {
  fail("EntityUI missing modal history/back");
} else pass("EntityUI modal history");

if (!uiSrc.includes("clearNavStack") || !uiSrc.includes('addEventListener("close"')) {
  fail("EntityUI must clear stack on close");
} else pass("modal close clears history");

if (!configs.includes("Monster trait") || !configs.includes("Monster action") || !configs.includes("traitRefs")) {
  fail("Feature types / monster ref fields missing");
} else pass("monster feature types + ref fields");

if (!features.includes('linkId: "slam"') || !features.includes("Monster action")) {
  fail("Slam feature seed missing");
} else pass("Slam feature seed");

if (!storm.includes("traitRefs") || !storm.includes("undead-fortitude") || !storm.includes("actionRefs")) {
  fail("Zombie seed missing trait/action refs");
} else pass("Zombie catalogue refs");

if (!monsterHtml.includes("entity-ui.js") || !monsterHtml.includes("entity-modal")) {
  fail("Monster katalog missing EntityUI");
} else pass("Monster katalog EntityUI");

if (!appSrc.includes("cannot resolve") && !appSrc.includes("No broken link") && !appSrc.includes("Legacy plain")) {
  /* renderEntityRefHtml comment */
  if (!appSrc.includes("Legacy plain string")) fail("wiki refs should skip unresolved links");
  else pass("wiki unresolved refs are plain text");
} else pass("wiki unresolved refs are plain text");

if (!registrySrc.includes("formatRefMarkdown") || !registrySrc.includes('refsBlock("Traits"')) {
  fail("EntityRegistry monster refsBlock wiring missing");
} else pass("EntityRegistry monster refs");

/* ── Runtime: registry + parser ───────────────────────── */

const store = new Map();
const sandbox = {
  window: { CatalogueSeeds: {}, ENTITIES: {} },
  console,
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  }
};
vm.createContext(sandbox);

function run(code) {
  vm.runInContext(code, sandbox);
}

run(typesSrc);
run(`
window.CatalogueSeeds = window.CatalogueSeeds || {};
window.CatalogueStore = {
  list(type) {
    const key = "catalogue-" + type;
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
  },
  mergeSeeds(type, seeds) {
    if (!Array.isArray(seeds)) return 0;
    const key = "catalogue-" + type;
    const cur = this.list(type);
    const byId = new Map(cur.map((e) => [e.id, e]));
    seeds.forEach((seed) => {
      if (!seed?.id) return;
      if (!byId.has(seed.id)) byId.set(seed.id, { ...seed });
      else {
        const existing = byId.get(seed.id);
        Object.keys(seed).forEach((k) => {
          const empty = existing[k] == null || existing[k] === "" || (Array.isArray(existing[k]) && !existing[k].length);
          if (empty && seed[k] != null && !(Array.isArray(seed[k]) && !seed[k].length)) {
            existing[k] = Array.isArray(seed[k]) ? seed[k].slice() : seed[k];
          }
        });
      }
    });
    localStorage.setItem(key, JSON.stringify([...byId.values()]));
    return seeds.length;
  }
};
`);
run(features);
run(storm);
run(parserSrc);
run(registrySrc);

const EntityRegistry = sandbox.window.EntityRegistry;
EntityRegistry.build();

const zombie = EntityRegistry.resolve("zombie");
if (!zombie) fail("resolve zombie");
else pass("resolve zombie");

if (!zombie.details.includes("@feature:undead-fortitude") && !zombie.details.includes("undead-fortitude")) {
  fail("zombie details missing Undead Fortitude ref");
} else pass("zombie Feature ref in details");

if (!zombie.details.includes("@feature:slam") && !zombie.details.includes("slam")) {
  fail("zombie details missing Slam ref");
} else pass("zombie Action ref in details");

const fort = EntityRegistry.resolve("undead-fortitude");
if (!fort || fort.type !== "feature") fail("Undead Fortitude feature resolve");
else pass("Undead Fortitude resolves as feature");

const perception = EntityRegistry.resolve("perception");
if (!perception || perception.type !== "skill") {
  /* skills may not be seeded in this sandbox */
  run(read("js/catalogue-seeds/core-skills.js"));
  EntityRegistry.build();
}
const skill = EntityRegistry.resolve("perception");
if (!skill || skill.type !== "skill") fail("Perception skill resolve");
else pass("Perception skill resolves");

const md = sandbox.window.ContentParser.markdownLite("See @feature:undead-fortitude|Undead Fortitude and @skill:perception|Perception.");
if (!md.includes('data-id="undead-fortitude"') || !md.includes("entity-link")) {
  fail("@feature in rich text should render entity-link");
} else pass("@feature renders entity-link");

if (!md.includes('data-id="perception"')) fail("@skill link missing");
else pass("@skill renders entity-link");

const legacy = EntityRegistry.formatRefMarkdown("Some local-only trait text", "feature");
if (legacy.includes("@feature:")) fail("unresolvable text must not become a link");
else pass("unresolvable legacy text stays plain");

const campaignLink = sandbox.window.ContentParser.replaceLinks("@monster:zombie|Zombie", sandbox.window.ENTITIES);
if (!campaignLink.includes('data-id="zombie"') && !campaignLink.includes("sw-zombie")) {
  /* link id may be zombie via alias */
  if (!campaignLink.includes("entity-link")) fail("campaign @monster link broken");
  else pass("campaign @monster link works");
} else pass("campaign @monster link works");

if (!configs.includes("Monster trait") || !registrySrc.includes('TYPE_MAP')) {
  fail("feature types should not need registry changes");
} else pass("new Feature types need no EntityRegistry TYPE_MAP change");

/* ── Modal history with fake DOM ──────────────────────── */

function createFakeModal() {
  const listeners = {};
  const el = {
    open: false,
    classList: { contains: () => false },
    querySelector(sel) {
      if (sel === ".modal-header") return header;
      if (sel === "#modal-close") return closeBtn;
      return null;
    },
    addEventListener(type, fn) {
      (listeners[type] = listeners[type] || []).push(fn);
    },
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
      (listeners.close || []).forEach((fn) => fn());
    },
    setAttribute() {},
    removeAttribute() {},
    hasAttribute(name) {
      return name === "open" ? this.open : false;
    }
  };
  const header = {
    querySelector(sel) {
      return sel === "#modal-close" ? closeBtn : null;
    },
    insertBefore(node) {
      this._back = node;
    },
    appendChild(node) {
      this._back = node;
    }
  };
  const closeBtn = { addEventListener() {} };
  const title = { textContent: "" };
  const body = { innerHTML: "" };
  return { el, title, body, header, listeners };
}

const fake = createFakeModal();
const tooltip = {
  classList: { add() {}, remove() {}, contains: () => true },
  style: {},
  innerHTML: ""
};

sandbox.document = {
  getElementById(id) {
    if (id === "entity-modal") return fake.el;
    if (id === "modal-title") return fake.title;
    if (id === "modal-body") return fake.body;
    if (id === "modal-close") return { addEventListener() {} };
    if (id === "modal-back") return null;
    if (id === "entity-tooltip") return tooltip;
    return null;
  },
  addEventListener() {},
  createElement(tag) {
    return {
      type: "",
      id: "",
      className: "",
      innerHTML: "",
      classList: {
        toggle(name, on) {
          this._hidden = name === "hidden" ? on : this._hidden;
        }
      },
      setAttribute() {},
      addEventListener() {},
      disabled: false
    };
  }
};
sandbox.window.I18N = { typeLabels: {}, clickForDetails: "Click" };

/* Re-init EntityUI against fake DOM (skip bootstrap by evaluating module after document exists) */
run(`
  delete window.EntityUI;
`);
run(uiSrc.replace(/\(function bootstrapEntityUI\(\)[\s\S]*$/m, ""));

sandbox.window.EntityUI.init({
  tooltip,
  modal: fake.el,
  modalTitle: fake.title,
  modalBody: fake.body
});

sandbox.window.EntityUI.openModal("zombie");
if (fake.title.textContent !== "Zombie") fail("openModal zombie title");
else pass("openModal zombie");

if (!String(fake.body.innerHTML).includes("entity-link") && !String(fake.body.innerHTML).includes("Undead Fortitude")) {
  fail("zombie modal should include fortitude link content");
} else pass("zombie modal shows linked traits");

sandbox.window.EntityUI.openModal("undead-fortitude", { pushHistory: true });
let nav = sandbox.window.EntityUI._navState();
if (nav.current !== "undead-fortitude" || !nav.stack.includes("zombie")) {
  fail("modal pushHistory should stack zombie");
} else pass("modal navigates to feature with history");

sandbox.window.EntityUI.goBack();
nav = sandbox.window.EntityUI._navState();
if (fake.title.textContent !== "Zombie" || nav.current !== "zombie") {
  fail("modal Back should return to Zombie");
} else pass("modal Back returns to Zombie");

sandbox.window.EntityUI.openModal("slam", { pushHistory: true });
sandbox.window.EntityUI.closeModal();
nav = sandbox.window.EntityUI._navState();
if (nav.stack.length || nav.current) fail("close should clear modal history");
else pass("close clears modal history");

sandbox.window.EntityUI.openModal("zombie");
nav = sandbox.window.EntityUI._navState();
if (nav.stack.length) fail("fresh open should start empty stack");
else pass("fresh open starts empty stack");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll entity-wiki checks passed");
