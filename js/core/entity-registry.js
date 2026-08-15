/** Build campaign ENTITIES from global catalogues (localStorage) */
window.EntityRegistry = (function () {
  "use strict";

  const TYPE_MAP = window.CatalogueTypes?.typeMap?.() || {
    npc: "npc",
    monster: "monster",
    item: "item",
    location: "location",
    pc: "pc",
    race: "race",
    class: "class",
    spell: "spell",
    skill: "skill",
    feature: "feature"
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

  const ID_PREFIX_RE =
    /^(?:skill|feature|race|class|spell|pc|item|monster|npc|location)-(.+)$/;

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
      featuredIn: asArray(entry.featuredIn),
      subclasses: asArray(entry.subclasses),
      featureRefs: asArray(entry.featureRefs),
      skillRefs: asArray(entry.skillRefs),
      traitRefs: asArray(entry.traitRefs),
      actionRefs: asArray(entry.actionRefs),
      bonusActionRefs: asArray(entry.bonusActionRefs),
      reactionRefs: asArray(entry.reactionRefs),
      legendaryActionRefs: asArray(entry.legendaryActionRefs),
      tags: asArray(entry.tags)
    };
  }

  function linkId(entry) {
    if (entry.linkId) return entry.linkId;
    if (entry.id?.startsWith("sw-")) return entry.id.slice(3);
    const prefixed = String(entry.id || "").match(ID_PREFIX_RE);
    if (prefixed) return prefixed[1];
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

  /**
   * Normalize a stored ref into @type:id|Label for markdownLite / replaceLinks.
   * Unresolvable bare strings stay plain text (no broken links).
   */
  function formatRefMarkdown(raw, defaultType) {
    const text = String(raw || "").trim();
    if (!text) return "";

    let type = "";
    let id = "";
    let label = "";

    const at = text.match(/^@([\w-]+):([\w-]+)(?:\|(.+))?$/);
    if (at) {
      type = at[1];
      id = at[2];
      label = (at[3] || "").trim();
    } else {
      const typed = text.match(/^([\w-]+):([\w-]+)(?:\|(.+))?$/);
      if (typed) {
        type = typed[1];
        id = typed[2];
        label = (typed[3] || "").trim();
      } else if (defaultType) {
        type = defaultType;
        id = text;
      } else {
        id = text;
      }
    }

    const cached = window.ENTITIES?.[id] || null;
    if (!entriesByCatalogueId.size) {
      try {
        indexEntries();
      } catch {
        /* index may not be ready yet */
      }
    }
    const catalogueEntry = resolveCatalogueEntry(id);
    if (!cached && !catalogueEntry) {
      return label || text;
    }

    const linkType =
      type ||
      cached?.type ||
      defaultType ||
      TYPE_MAP[catalogueEntry?._catalogueType] ||
      "feature";
    const linkKey = cached?.id || (catalogueEntry ? linkId(catalogueEntry) : id);
    const display = label || cached?.name || catalogueEntry?.name || id;
    return `@${linkType}:${linkKey}|${display}`;
  }

  function refsBlock(label, refs, defaultType) {
    if (!refs?.length) return "";
    const lines = refs
      .map((r) => formatRefMarkdown(r, defaultType))
      .filter(Boolean)
      .map((line) => `- ${line}`);
    if (!lines.length) return "";
    return `**${label}:**\n${lines.join("\n")}`;
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
      refsBlock("Skills", entry.skillRefs, "skill"),
      refsBlock("Traits", entry.traitRefs, "feature"),
      refsBlock("Actions", entry.actionRefs, "feature"),
      refsBlock("Bonus Actions", entry.bonusActionRefs, "feature"),
      refsBlock("Reactions", entry.reactionRefs, "feature"),
      refsBlock("Legendary Actions", entry.legendaryActionRefs, "feature"),
      entry.traits && `**Trait notes:**\n${entry.traits}`,
      entry.actions && `**Action notes:**\n${entry.actions}`,
      entry.bonusActions && `**Bonus Action notes:**\n${entry.bonusActions}`,
      entry.reactions && `**Reaction notes:**\n${entry.reactions}`,
      entry.legendaryActions && `**Legendary Action notes:**\n${entry.legendaryActions}`,
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

  function pcToEntity(entry) {
    const id = linkId(entry);
    const bits = [entry.class, entry.level ? `Level ${entry.level}` : "", entry.race].filter(Boolean);
    const details = joinBlocks([
      entry.featuresSpells && `**Features & spells:**\n${entry.featuresSpells}`,
      entry.equipment.length && `**Equipment:**\n${entry.equipment.map((i) => `- ${i}`).join("\n")}`,
      entry.backstory && `**Backstory:**\n${entry.backstory}`,
      entry.notes && `**Notes:**\n${entry.notes}`
    ]);
    return {
      id,
      catalogueId: entry.id,
      type: "pc",
      name: asString(entry.name) || id,
      summary: bits.join(" · ") || asString(entry.playerName),
      portrait: asString(entry.portrait),
      stats: pickStats({
        Class: entry.class,
        Level: entry.level,
        Race: entry.race,
        AC: entry.ac,
        HP: entry.hpMax ? `${entry.hpCurrent ?? "—"}/${entry.hpMax}` : entry.hpCurrent,
        Speed: entry.speed,
        Campaign: entry.activeCampaign,
        Location: entry.location
      }),
      details,
      tags: [entry.class, entry.race, entry.activeCampaign].filter(Boolean)
    };
  }

  function raceToEntity(entry) {
    const id = linkId(entry);
    const details = joinBlocks([
      entry.summary,
      entry.abilityScoreIncrease && `**Ability scores:** ${entry.abilityScoreIncrease}`,
      refsBlock("Features", entry.featureRefs, "feature"),
      entry.traits && `**Traits:**\n${entry.traits}`,
      entry.languages && `**Languages:** ${entry.languages}`,
      entry.senses && `**Senses:** ${entry.senses}`,
      entry.notes && `**Notes:**\n${entry.notes}`
    ]);
    return {
      id,
      catalogueId: entry.id,
      type: "race",
      name: asString(entry.name) || id,
      summary: [entry.size, entry.speed].filter(Boolean).join(" · ") || asString(entry.summary).slice(0, 120),
      portrait: asString(entry.portrait),
      stats: pickStats({
        Size: entry.size,
        Speed: entry.speed,
        Source: entry.source
      }),
      details,
      tags: [entry.size, entry.source].filter(Boolean)
    };
  }

  function classToEntity(entry) {
    const id = linkId(entry);
    const details = joinBlocks([
      entry.summary,
      refsBlock("Skill options", entry.skillRefs, "skill"),
      entry.skillChoices && `**Skill choices:** ${entry.skillChoices}`,
      refsBlock("Features", entry.featureRefs, "feature"),
      entry.features && `**Features by level:**\n${entry.features}`,
      entry.spellcasting && `**Spellcasting:**\n${entry.spellcasting}`,
      entry.subclasses?.length && `**Subclasses:**\n${entry.subclasses.map((s) => `- ${s}`).join("\n")}`,
      entry.notes && `**Notes:**\n${entry.notes}`
    ]);
    return {
      id,
      catalogueId: entry.id,
      type: "class",
      name: asString(entry.name) || id,
      summary: [entry.hitDie, entry.primaryAbility].filter(Boolean).join(" · ") || asString(entry.summary).slice(0, 120),
      portrait: asString(entry.portrait),
      stats: pickStats({
        "Hit die": entry.hitDie,
        "Primary ability": entry.primaryAbility,
        Saves: entry.savingThrows,
        Source: entry.source
      }),
      details,
      tags: [entry.hitDie, entry.primaryAbility, entry.source].filter(Boolean)
    };
  }

  function spellToEntity(entry) {
    const id = linkId(entry);
    const levelLabel =
      entry.level === "0" || String(entry.level).toLowerCase() === "cantrip"
        ? "Cantrip"
        : asString(entry.level);
    const details = joinBlocks([
      entry.summary,
      entry.description && `**Effect:**\n${entry.description}`,
      entry.higherLevels && `**At higher levels:**\n${entry.higherLevels}`,
      entry.notes && `**Notes:**\n${entry.notes}`
    ]);
    return {
      id,
      catalogueId: entry.id,
      type: "spell",
      name: asString(entry.name) || id,
      summary: [levelLabel !== "Cantrip" ? `Level ${levelLabel}` : "Cantrip", entry.school]
        .filter(Boolean)
        .join(" · "),
      portrait: asString(entry.portrait),
      stats: pickStats({
        Level: levelLabel,
        School: entry.school,
        Casting: entry.castingTime,
        Range: entry.range,
        Components: entry.components,
        Duration: entry.duration,
        Classes: entry.classes,
        Ritual: entry.ritual ? "Yes" : "",
        Concentration: entry.concentration ? "Yes" : ""
      }),
      details,
      tags: [levelLabel, entry.school, entry.classes, entry.source].filter(Boolean)
    };
  }

  function skillToEntity(entry) {
    const id = linkId(entry);
    const details = joinBlocks([
      entry.description,
      entry.typicalUses && `**Typical uses:**\n${entry.typicalUses}`,
      entry.exampleChecks && `**Example checks:**\n${entry.exampleChecks}`,
      entry.notes && `**Personal notes:**\n${entry.notes}`,
      entry.tags?.length && `**Tags:** ${entry.tags.join(", ")}`
    ]);
    const sourceLine = [entry.source, entry.page ? `p. ${entry.page}` : ""].filter(Boolean).join(", ");
    return {
      id,
      catalogueId: entry.id,
      type: "skill",
      name: asString(entry.name) || id,
      summary: asString(entry.summary || entry.description).slice(0, 140),
      stats: pickStats({
        "Default ability": entry.defaultAbility,
        Source: sourceLine
      }),
      details,
      tags: [...asArray(entry.tags), entry.defaultAbility, entry.source].filter(Boolean)
    };
  }

  function featureToEntity(entry) {
    const id = linkId(entry);
    const details = joinBlocks([
      entry.grantedBy && `**Granted by:** ${entry.grantedBy}`,
      entry.description,
      entry.usesRecharge && `**Uses / recharge:** ${entry.usesRecharge}`,
      entry.notes && `**Personal notes:**\n${entry.notes}`,
      entry.tags?.length && `**Tags:** ${entry.tags.join(", ")}`
    ]);
    const sourceLine = [entry.source, entry.page ? `p. ${entry.page}` : ""].filter(Boolean).join(", ");
    return {
      id,
      catalogueId: entry.id,
      type: "feature",
      name: asString(entry.name) || id,
      summary: asString(entry.summary || entry.description).slice(0, 140),
      stats: pickStats({
        Type: entry.featureType,
        Level: entry.levelPrerequisite,
        Source: sourceLine
      }),
      details,
      tags: [...asArray(entry.tags), entry.featureType, entry.source].filter(Boolean)
    };
  }

  const CONVERTERS = {
    npc: npcToEntity,
    monster: monsterToEntity,
    item: itemToEntity,
    location: locationToEntity,
    pc: pcToEntity,
    race: raceToEntity,
    class: classToEntity,
    spell: spellToEntity,
    skill: skillToEntity,
    feature: featureToEntity
  };

  /** Register or replace a converter for a catalogue type (future types). */
  function register(type, converter) {
    if (!type || typeof converter !== "function") return false;
    CONVERTERS[type] = converter;
    TYPE_MAP[type] = TYPE_MAP[type] || type;
    return true;
  }

  const entriesByCatalogueId = new Map();

  async function mergeAllSeeds() {
    if (!window.CatalogueSeeds || !window.CatalogueStore) return;
    for (const type of Object.keys(TYPE_MAP)) {
      if (window.CatalogueSeeds[type]?.length) {
        try {
          await window.CatalogueStore.mergeSeeds(type, window.CatalogueSeeds[type]);
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

  async function build() {
    entriesByCatalogueId.clear();

    if (!window.CatalogueStore && !window.CatalogueSeeds) {
      window.ENTITIES = window.ENTITIES || {};
      return window.ENTITIES;
    }

    await mergeAllSeeds();
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

  return { build, resolve, getAll, byType, linkId, register, formatRefMarkdown, TYPE_MAP, CONVERTERS };
})();
