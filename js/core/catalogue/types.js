/**
 * Declarative catalogue entity types.
 * Adding a future type should mainly mean: config + converter (+ optional seeds/page),
 * not editing parser/search/registry type lists by hand.
 */
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
