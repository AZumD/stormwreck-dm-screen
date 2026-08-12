/** Build campaign ENTITIES from global catalogues (localStorage) */
window.EntityRegistry = (function () {
  "use strict";

  const TYPE_MAP = {
    npc: "npc",
    monster: "monster",
    item: "item",
    location: "location"
  };

  /** Adventure @ link ids → catalogue entry ids (explicit overrides) */
  const LINK_ALIASES = {
    runara: "sw-runara",
    tarak: "sw-tarak",
    varnoth: "sw-varnoth",
    myla: "sw-myla",
    mek: "sw-mek",
    minn: "sw-minn",
    sinensa: "sw-sinensa",
    aidron: "sw-aidron",
    laylee: "sw-laylee",
    rix: "sw-rix",
    sparkrender: "sw-sparkrender",
    zombie: "sw-zombie",
    stirge: "sw-stirge",
    merrow: "sw-merrow",
    ghoul: "sw-ghoul",
    myconid: "sw-myconid",
    "moonstone-key": "sw-moonstone-key",
    "stormwreck-isle": "sw-stormwreck-isle",
    "dragons-rest": "sw-dragons-rest",
    "seagrow-caves": "sw-seagrow-caves",
    "compass-rose": "sw-compass-rose",
    "clifftop-observatory": "sw-clifftop-observatory"
  };

  function asArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
  }

  function asString(value) {
    return value == null ? "" : String(value);
  }

  function normalizeEntry(entry) {
    return {
      ...entry,
      equipment: asArray(entry.equipment),
      npcs: asArray(entry.npcs),
      monsters: asArray(entry.monsters),
      itemsOfInterest: asArray(entry.itemsOfInterest),
      featuredIn: asArray(entry.featuredIn)
    };
  }

  function linkId(entry) {
    if (entry.linkId) return entry.linkId;
    if (entry.id?.startsWith("sw-")) return entry.id.slice(3);
    return entry.id;
  }

  function pickStats(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== "" && v != null && v !== false) out[k] = String(v);
    }
    return out;
  }

  function joinBlocks(parts) {
    return parts.filter(Boolean).join("\n\n");
  }

  function npcToEntity(entry) {
    const id = linkId(entry);
    const details = joinBlocks([
      entry.summary,
      entry.traits && `**Traits:** ${entry.traits}`,
      entry.ideals && `**Ideals:** ${entry.ideals}`,
      entry.bonds && `**Bonds:** ${entry.bonds}`,
      entry.flaws && `**Flaws:** ${entry.flaws}`,
      entry.equipment.length && `**Equipment:**\n${entry.equipment.map((i) => `- ${i}`).join("\n")}`,
      entry.backstory && `**Backstory:**\n${entry.backstory}`,
      entry.notes && `**Notes:**\n${entry.notes}`
    ]);

    return {
      id,
      catalogueId: entry.id,
      type: "npc",
      name: asString(entry.name) || id,
      summary: asString(entry.summary || entry.role),
      portrait: asString(entry.portrait),
      stats: pickStats({
        AC: entry.ac,
        HP: entry.hp,
        Speed: entry.speed,
        Campaign: entry.activeCampaign,
        Location: entry.location
      }),
      details,
      tags: [entry.activeCampaign, entry.location, entry.role].filter(Boolean)
    };
  }

  function monsterToEntity(entry) {
    const id = linkId(entry);
    const summary = [entry.size, entry.creatureType, entry.cr ? `CR ${entry.cr}` : ""].filter(Boolean).join(" · ");
    const details = joinBlocks([
      entry.traits,
      entry.actions && `**Actions:**\n${entry.actions}`,
      entry.bonusActions && `**Bonus Actions:**\n${entry.bonusActions}`,
      entry.reactions && `**Reactions:**\n${entry.reactions}`,
      entry.legendaryActions && `**Legendary Actions:**\n${entry.legendaryActions}`,
      entry.notes && `**Notes:**\n${entry.notes}`
    ]);

    return {
      id,
      catalogueId: entry.id,
      type: "monster",
      name: asString(entry.name) || id,
      summary,
      portrait: asString(entry.portrait),
      stats: pickStats({
        AC: entry.ac,
        HP: entry.hp,
        Speed: entry.speed,
        CR: entry.cr,
        XP: entry.xp,
        Saves: entry.savingThrows,
        Skills: entry.skills,
        Resist: entry.damageResistances,
        Immune: entry.damageImmunities,
        Cond: entry.conditionImmunities,
        Senses: entry.senses,
        Languages: entry.languages
      }),
      details,
      tags: [entry.creatureType, entry.cr ? `CR ${entry.cr}` : ""].filter(Boolean)
    };
  }

  function itemToEntity(entry) {
    const id = linkId(entry);
    const description = asString(entry.description);
    const details = joinBlocks([
      description,
      entry.properties && `**Properties:**\n${entry.properties}`,
      entry.notes && `**Notes:**\n${entry.notes}`
    ]);

    return {
      id,
      catalogueId: entry.id,
      type: "item",
      name: asString(entry.name) || id,
      summary: description.slice(0, 140) || asString(entry.itemType),
      portrait: asString(entry.portrait),
      stats: pickStats({
        Type: entry.itemType,
        Rarity: entry.rarity,
        Value: entry.value,
        Weight: entry.weight,
        Attunement: entry.attunement ? "Required" : "None"
      }),
      details,
      tags: [entry.itemType, entry.rarity].filter(Boolean)
    };
  }

  function locationToEntity(entry) {
    const id = linkId(entry);
    const description = asString(entry.description);
    const details = joinBlocks([
      description,
      entry.npcs.length && `**NPCs:**\n${entry.npcs.map((n) => `- ${n}`).join("\n")}`,
      entry.monsters.length && `**Monsters:**\n${entry.monsters.map((m) => `- ${m}`).join("\n")}`,
      entry.itemsOfInterest.length && `**Points of interest:**\n${entry.itemsOfInterest.map((i) => `- ${i}`).join("\n")}`,
      entry.featuredIn.length && `**Featured in:** ${entry.featuredIn.join(", ")}`,
      entry.notes && `**Notes:**\n${entry.notes}`
    ]);

    return {
      id,
      catalogueId: entry.id,
      type: "location",
      name: asString(entry.name) || id,
      summary: description.slice(0, 140),
      stats: pickStats({
        Campaign: entry.featuredIn[0] || ""
      }),
      details,
      tags: entry.featuredIn
    };
  }

  const CONVERTERS = {
    npc: npcToEntity,
    monster: monsterToEntity,
    item: itemToEntity,
    location: locationToEntity
  };

  const entriesByCatalogueId = new Map();

  function mergeAllSeeds() {
    if (!window.CatalogueSeeds || !window.CatalogueStore) return;
    for (const type of Object.keys(TYPE_MAP)) {
      if (CatalogueSeeds[type]?.length) {
        try {
          CatalogueStore.mergeSeeds(type, CatalogueSeeds[type]);
        } catch {
          /* storage unavailable */
        }
      }
    }
  }

  function loadCatalogueEntries(catalogueType) {
    const seeds = window.CatalogueSeeds?.[catalogueType] || [];
    let stored = [];
    try {
      stored = CatalogueStore.loadAll(catalogueType);
    } catch {
      stored = [];
    }

    const byId = new Map();
    seeds.forEach((entry) => {
      if (entry?.id) byId.set(entry.id, entry);
    });
    stored.forEach((entry) => {
      if (entry?.id) byId.set(entry.id, entry);
    });
    const merged = [...byId.values()];
    if (window.CatalogueImages) {
      return CatalogueImages.hydrateAll(catalogueType, merged);
    }
    return merged;
  }

  function indexEntries() {
    entriesByCatalogueId.clear();
    for (const catalogueType of Object.keys(TYPE_MAP)) {
      loadCatalogueEntries(catalogueType).forEach((entry) => {
        if (entry?.id) entriesByCatalogueId.set(entry.id, { ...entry, _catalogueType: catalogueType });
      });
    }
  }

  function resolveCatalogueEntry(linkKey) {
    if (!linkKey) return null;

    const aliasId = LINK_ALIASES[linkKey];
    if (aliasId && entriesByCatalogueId.has(aliasId)) {
      return entriesByCatalogueId.get(aliasId);
    }

    const swId = `sw-${linkKey}`;
    if (entriesByCatalogueId.has(swId)) {
      return entriesByCatalogueId.get(swId);
    }

    for (const entry of entriesByCatalogueId.values()) {
      if (linkId(entry) === linkKey) return entry;
    }

    return null;
  }

  function build() {
    entriesByCatalogueId.clear();

    if (!window.CatalogueStore && !window.CatalogueSeeds) {
      window.ENTITIES = window.ENTITIES || {};
      return window.ENTITIES;
    }

    mergeAllSeeds();
    indexEntries();

    const entities = {};
    for (const entry of entriesByCatalogueId.values()) {
      try {
        const type = entry._catalogueType;
        const convert = CONVERTERS[type];
        if (!convert) continue;
        const normalized = normalizeEntry(entry);
        const entity = convert(normalized);
        entity.type = TYPE_MAP[type];
        entities[entity.id] = entity;
      } catch (err) {
        console.warn("EntityRegistry: skipped entry", entry?.id, err);
      }
    }

    window.ENTITIES = entities;
    return entities;
  }

  function resolve(id) {
    if (!id) return null;
    if (window.ENTITIES?.[id]) return window.ENTITIES[id];

    if (!entriesByCatalogueId.size) indexEntries();

    const entry = resolveCatalogueEntry(id);
    if (!entry) return null;

    try {
      const type = entry._catalogueType;
      const convert = CONVERTERS[type];
      const entity = convert(normalizeEntry(entry));
      entity.type = TYPE_MAP[type];
      window.ENTITIES[id] = entity;
      return entity;
    } catch {
      return null;
    }
  }

  function getAll() {
    if (!window.ENTITIES || !Object.keys(window.ENTITIES).length) build();
    return window.ENTITIES || {};
  }

  function byType(type) {
    return Object.values(getAll()).filter((e) => e.type === type);
  }

  build();

  return { build, resolve, getAll, byType, linkId };
})();
