/**
 * Declarative catalogue entity types.
 * Adding a future type should mainly mean: config + converter (+ optional seeds/page),
 * not editing parser/search/registry type lists by hand.
 */

/*
 * Most app surfaces load CatalogueTypes early. Use that shared seam to install
 * the language runtime before later UI modules initialize. Parser-inserted
 * scripts stay synchronous while the document is loading, so campaign modules
 * see the selected dictionary from their first line of code.
 */
(function bootstrapLanguageRuntime() {
  if (typeof document === "undefined") return;

  const scripts = [];
  if (!window.I18N) scripts.push("/js/i18n/en.js?v=20260904i1");
  if (!window.I18N_SV) scripts.push("/js/i18n/sv.js?v=20260904i1");
  if (!window.AppI18n) scripts.push("/js/i18n/language.js?v=20260904i1");
  if (!window.StormwreckDomLocalization) scripts.push("/js/i18n/dom-localization.js?v=20260904i1");
  if (!scripts.length) return;

  if (document.readyState === "loading") {
    document.write(scripts.map((src) => `<script src="${src}"><\/script>`).join(""));
    return;
  }

  let chain = Promise.resolve();
  scripts.forEach((src) => {
    chain = chain.then(() => new Promise((resolve) => {
      if (document.querySelector(`script[src^="${src.split("?")[0]}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    }));
  });
})();

window.CatalogueTypes = (function () {
  "use strict";

  /**
   * @typedef {{ id: string, label: string, linkable?: boolean, folder?: string }} CatalogueTypeDef
   */

  /** @type {CatalogueTypeDef[]} */
  const TYPES = [
    { id: "pc", label: "PC", linkable: true, folder: "pc-katalog" },
    { id: "npc", label: "NPC", linkable: true, folder: "npc-katalog" },
    { id: "item", label: "Item", linkable: true, folder: "item-katalog" },
    { id: "monster", label: "Monster", linkable: true, folder: "monster-katalog" },
    { id: "location", label: "Location", linkable: true, folder: "location-katalog" },
    { id: "race", label: "Race", linkable: true, folder: "race-katalog" },
    { id: "background", label: "Background", linkable: true, folder: "background-katalog" },
    { id: "class", label: "Class", linkable: true, folder: "class-katalog" },
    { id: "spell", label: "Spell", linkable: true, folder: "spell-katalog" },
    { id: "skill", label: "Skill", linkable: true, folder: "skill-katalog" },
    { id: "feature", label: "Feature", linkable: true, folder: "feature-katalog" },
    { id: "rule", label: "Rule", linkable: true, folder: "rule-katalog" },
    { id: "music", label: "Music", linkable: false, folder: "music-katalog" },
    { id: "source", label: "Source", linkable: true, folder: "source-katalog" }
  ];

  function all() {
    return TYPES.slice();
  }

  function ids() {
    return TYPES.map((t) => t.id);
  }

  function linkable() {
    return TYPES.filter((t) => t.linkable !== false);
  }

  function linkableIds() {
    return linkable().map((t) => t.id);
  }

  function get(id) {
    return TYPES.find((t) => t.id === id) || null;
  }

  /** Regex alternation for @type: / [[type: links */
  function linkAlternation() {
    return linkableIds()
      .map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
  }

  function typeMap() {
    const map = {};
    TYPES.forEach((t) => {
      map[t.id] = t.id;
    });
    return map;
  }

  return {
    TYPES,
    all,
    ids,
    linkable,
    linkableIds,
    get,
    linkAlternation,
    typeMap
  };
})();

/*
 * Player Companion uses the catalogue type registry before its own app bundle.
 * Load optional player-side catalogue affordances here without coupling the
 * main player-app closure to every future catalogue type.
 */
if (
  typeof document !== "undefined" &&
  typeof location !== "undefined" &&
  /^\/player(?:\/|$)/.test(location.pathname)
) {
  const script = document.createElement("script");
  script.src = "/js/player-backgrounds.js?v=20260904p1";
  script.async = false;
  document.head.appendChild(script);
}

/*
 * Campaign pages need rule seeds in the universal entity index so Ctrl+K can
 * answer table questions such as "constitution", "cover", or "movement".
 * These scripts are additive and the extension waits for Store/Registry readiness.
 */
if (
  typeof document !== "undefined" &&
  typeof location !== "undefined" &&
  /^\/campaigns(?:\/|$)/.test(location.pathname)
) {
  [
    "/js/catalogue-seeds/dm-rules.js?v=20260904r1",
    "/js/core/catalogue/rule-extension.js?v=20260904r1"
  ].forEach((src) => {
    if (document.querySelector(`script[src^="${src.split("?")[0]}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  });
}
