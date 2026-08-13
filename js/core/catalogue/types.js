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
    { id: "class", label: "Class", linkable: true, folder: "class-katalog" },
    { id: "spell", label: "Spell", linkable: true, folder: "spell-katalog" },
    { id: "skill", label: "Skill", linkable: true, folder: "skill-katalog" },
    { id: "feature", label: "Feature", linkable: true, folder: "feature-katalog" }
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
