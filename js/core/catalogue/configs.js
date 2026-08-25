/** Field configs and default entry shapes per catalogue type */
window.CatalogueConfigs = {
  pc: {
    type: "pc",
    title: "PC Catalogue",
    subtitle: "Player characters with full sheets, gear, and notes.",
    newLabel: "New PC",
    searchPlaceholder: "Search PCs…",
    listIcon: "⚔",
    sections: [
      {
        title: "Identity",
        fields: [
          { id: "name", label: "Character name", type: "text", required: true, grid: "full" },
          {
            id: "portrait",
            label: "Portrait",
            type: "image",
            kind: "portrait",
            grid: "full",
            uploadLabel: "Upload portrait",
            clearLabel: "Remove portrait",
            emptyLabel: "No portrait uploaded",
            hint: "Stored in this browser. Large files are resized automatically."
          },
          { id: "class", label: "Class", type: "text", grid: "half" },
          { id: "level", label: "Level", type: "number", grid: "half" },
          { id: "race", label: "Race", type: "text", grid: "half" },
          { id: "background", label: "Background", type: "text", grid: "half" },
          { id: "alignment", label: "Alignment", type: "text", grid: "half" },
          { id: "playerName", label: "Player", type: "text", grid: "half" }
        ]
      },
      {
        title: "Campaign placement",
        fields: [
          { id: "activeCampaign", label: "Active campaign", type: "text", grid: "half" },
          { id: "location", label: "Location", type: "text", grid: "half" }
        ]
      },
      {
        title: "Ability scores",
        fields: [
          { id: "str", label: "STR", type: "number", grid: "sixth" },
          { id: "dex", label: "DEX", type: "number", grid: "sixth" },
          { id: "con", label: "CON", type: "number", grid: "sixth" },
          { id: "int", label: "INT", type: "number", grid: "sixth" },
          { id: "wis", label: "WIS", type: "number", grid: "sixth" },
          { id: "cha", label: "CHA", type: "number", grid: "sixth" }
        ]
      },
      {
        title: "Combat",
        fields: [
          { id: "ac", label: "Armor Class", type: "number", grid: "third" },
          { id: "hpCurrent", label: "HP (current)", type: "number", grid: "third" },
          { id: "hpMax", label: "HP (max)", type: "number", grid: "third" },
          { id: "speed", label: "Speed", type: "text", grid: "half" },
          { id: "initiative", label: "Initiative", type: "text", grid: "half" },
          { id: "proficiencyBonus", label: "Proficiency", type: "text", grid: "half" },
          { id: "hitDice", label: "Hit dice", type: "text", grid: "half" }
        ]
      },
      {
        title: "Proficiencies & skills",
        fields: [
          { id: "savingThrows", label: "Saving throws", type: "textarea", rows: 2, grid: "half" },
          {
            id: "skillRefs",
            label: "Skills",
            type: "list",
            refType: "skill",
            grid: "full",
            searchPlaceholder: "Search skill catalogue…",
            placeholder: "Custom skill note…",
            hint: "Link skills from the Skill Catalogue. Custom lines stay as plain text."
          },
          {
            id: "skills",
            label: "Skill notes (freeform)",
            type: "textarea",
            rows: 2,
            grid: "full",
            placeholder: "Optional extras — proficiency bonuses, expertise, etc."
          },
          { id: "languages", label: "Languages", type: "textarea", rows: 2, grid: "full" }
        ]
      },
      {
        title: "Equipment & inventory",
        fields: [
          {
            id: "equipment",
            label: "Equipment",
            type: "list",
            refType: "item",
            grid: "full",
            searchPlaceholder: "Search item catalogue…",
            placeholder: "Custom worn/ready item…",
            hint: "Worn or ready-to-hand gear (weapons, armor, held items). Linked to the Item Catalogue."
          },
          {
            id: "inventory",
            label: "Inventory",
            type: "list",
            refType: "item",
            grid: "full",
            searchPlaceholder: "Search item catalogue…",
            placeholder: "Custom carried item…",
            hint: "Carried pack / stored goods. Linked to the Item Catalogue."
          }
        ]
      },
      {
        title: "Features & spells",
        fields: [
          {
            id: "featureRefs",
            label: "Features",
            type: "list",
            refType: "feature",
            grid: "full",
            searchPlaceholder: "Search feature catalogue…",
            placeholder: "Custom feature…",
            hint: "Class features, feats, and other abilities from the Feature Catalogue."
          },
          {
            id: "spellRefs",
            label: "Spells",
            type: "list",
            refType: "spell",
            grid: "full",
            searchPlaceholder: "Search spell catalogue…",
            placeholder: "Custom spell…",
            hint: "Prepared or known spells from the Spell Catalogue."
          },
          {
            id: "featuresSpells",
            label: "Ability notes (freeform)",
            type: "textarea",
            rows: 3,
            grid: "full",
            placeholder: "Optional freeform notes that are not catalogue links."
          }
        ]
      },
      {
        title: "Story & notes",
        fields: [
          { id: "backstory", label: "Backstory", type: "textarea", rows: 5, grid: "full" },
          { id: "notes", label: "Notes of interest", type: "textarea", rows: 5, grid: "full" }
        ]
      }
    ],
    defaults: {
      name: "Unnamed PC",
      portrait: "",
      class: "",
      level: 1,
      race: "",
      background: "",
      alignment: "",
      playerName: "",
      activeCampaign: "",
      location: "",
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
      ac: 10,
      hpCurrent: 1,
      hpMax: 1,
      speed: "30 ft.",
      initiative: "",
      proficiencyBonus: "+2",
      hitDice: "1d8",
      savingThrows: "",
      skillRefs: [],
      skills: "",
      languages: "",
      equipment: [],
      inventory: [],
      featureRefs: [],
      spellRefs: [],
      featuresSpells: "",
      backstory: "",
      notes: ""
    }
  },

  npc: {
    type: "npc",
    title: "NPC Catalogue",
    subtitle: "Recurring characters with stats, gear, and story notes.",
    newLabel: "New NPC",
    searchPlaceholder: "Search NPCs…",
    listIcon: "👤",
    sections: [
      {
        title: "Identity",
        fields: [
          { id: "name", label: "Name", type: "text", required: true, grid: "full" },
          {
            id: "portrait",
            label: "Portrait",
            type: "image",
            kind: "portrait",
            grid: "full",
            uploadLabel: "Upload portrait",
            clearLabel: "Remove portrait",
            emptyLabel: "No portrait uploaded",
            hint: "Stored in this browser. Large files are resized automatically."
          },
          { id: "role", label: "Role / title", type: "text", grid: "half" },
          { id: "race", label: "Race", type: "text", grid: "half" },
          { id: "alignment", label: "Alignment", type: "text", grid: "half" },
          { id: "age", label: "Age", type: "text", grid: "half" }
        ]
      },
      {
        title: "Campaign placement",
        fields: [
          { id: "activeCampaign", label: "Active campaign", type: "text", grid: "half" },
          { id: "location", label: "Location", type: "text", grid: "half" }
        ]
      },
      {
        title: "Ability scores",
        fields: [
          { id: "str", label: "STR", type: "number", grid: "sixth" },
          { id: "dex", label: "DEX", type: "number", grid: "sixth" },
          { id: "con", label: "CON", type: "number", grid: "sixth" },
          { id: "int", label: "INT", type: "number", grid: "sixth" },
          { id: "wis", label: "WIS", type: "number", grid: "sixth" },
          { id: "cha", label: "CHA", type: "number", grid: "sixth" }
        ]
      },
      {
        title: "Combat",
        fields: [
          { id: "ac", label: "Armor Class", type: "text", grid: "third" },
          { id: "hp", label: "Hit Points", type: "text", grid: "third" },
          { id: "speed", label: "Speed", type: "text", grid: "third" },
          {
            id: "combatConditions",
            label: "Combat conditions",
            type: "text",
            grid: "full",
            placeholder: "poisoned, prone…"
          },
          {
            id: "combatInitiative",
            label: "Combat initiative",
            type: "text",
            grid: "third",
            placeholder: "0 = not in turn order"
          }
        ]
      },
      {
        title: "Personality",
        fields: [
          { id: "traits", label: "Traits", type: "textarea", rows: 2, grid: "half" },
          { id: "ideals", label: "Ideals", type: "textarea", rows: 2, grid: "half" },
          { id: "bonds", label: "Bonds", type: "textarea", rows: 2, grid: "half" },
          { id: "flaws", label: "Flaws", type: "textarea", rows: 2, grid: "half" }
        ]
      },
      {
        title: "Skills, features & spells",
        fields: [
          {
            id: "skillRefs",
            label: "Skills",
            type: "list",
            refType: "skill",
            grid: "full",
            searchPlaceholder: "Search skill catalogue…",
            placeholder: "Custom skill…",
            hint: "Link skills from the Skill Catalogue."
          },
          {
            id: "featureRefs",
            label: "Features",
            type: "list",
            refType: "feature",
            grid: "full",
            searchPlaceholder: "Search feature catalogue…",
            placeholder: "Custom feature…",
            hint: "Traits and abilities from the Feature Catalogue."
          },
          {
            id: "spellRefs",
            label: "Spells",
            type: "list",
            refType: "spell",
            grid: "full",
            searchPlaceholder: "Search spell catalogue…",
            placeholder: "Custom spell…",
            hint: "Spells from the Spell Catalogue."
          }
        ]
      },
      {
        title: "Equipment & inventory",
        fields: [
          {
            id: "equipment",
            label: "Equipment",
            type: "list",
            refType: "item",
            grid: "full",
            searchPlaceholder: "Search item catalogue…",
            placeholder: "Custom worn/ready item…",
            hint: "Worn or ready-to-hand gear. Linked to the Item Catalogue."
          },
          {
            id: "inventory",
            label: "Inventory",
            type: "list",
            refType: "item",
            grid: "full",
            searchPlaceholder: "Search item catalogue…",
            placeholder: "Custom carried item…",
            hint: "Carried pack / stored goods. Linked to the Item Catalogue."
          }
        ]
      },
      {
        title: "Story & notes",
        fields: [
          { id: "summary", label: "Summary", type: "textarea", rows: 3, grid: "full" },
          { id: "backstory", label: "Backstory", type: "textarea", rows: 5, grid: "full" },
          { id: "notes", label: "Notes of interest", type: "textarea", rows: 5, grid: "full" }
        ]
      }
    ],
    defaults: {
      name: "Unnamed NPC",
      portrait: "",
      role: "",
      race: "",
      alignment: "",
      age: "",
      activeCampaign: "",
      location: "",
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
      ac: "",
      hp: "",
      speed: "",
      combatConditions: "",
      combatInitiative: "0",
      traits: "",
      ideals: "",
      bonds: "",
      flaws: "",
      skillRefs: [],
      featureRefs: [],
      spellRefs: [],
      equipment: [],
      inventory: [],
      summary: "",
      backstory: "",
      notes: ""
    }
  },

  item: {
    type: "item",
    title: "Item Catalogue",
    subtitle: "Magic items, gear, loot, and curios.",
    newLabel: "New item",
    searchPlaceholder: "Search items…",
    listIcon: "✦",
    searchFields: ["name", "category", "itemType", "rarity", "tags", "description", "properties", "notes", "value"],
    facets: [
      { id: "category", label: "Category" },
      { id: "rarity", label: "Rarity" }
    ],
    groupBy: "category",
    groupOrder: [
      "Weapon",
      "Armor & Shield",
      "Ammunition",
      "Adventuring Gear",
      "Tool & Kit",
      "Consumable",
      "Ingredient & Material",
      "Wondrous Item",
      "Treasure & Valuable",
      "Document & Lore",
      "Container & Storage",
      "Trade Good",
      "Trinket & Curio",
      "Junk & Salvage",
      "Hazard & Trap",
      "Collection & Hoard",
      "Other"
    ],
    groupLabels: { "": "Uncategorized" },
    listMeta: ["category", "itemType", "rarity"],
    sections: [
      {
        title: "Item details",
        fields: [
          { id: "name", label: "Name", type: "text", required: true, grid: "full" },
          {
            id: "portrait",
            label: "Portrait / image",
            type: "image",
            kind: "portrait",
            grid: "full",
            uploadLabel: "Upload image",
            clearLabel: "Remove image",
            emptyLabel: "No image uploaded",
            hint: "Stored in this browser. Large files are resized automatically."
          },
          {
            id: "category",
            label: "Category",
            type: "select",
            grid: "half",
            options: [
              "",
              "Weapon",
              "Armor & Shield",
              "Ammunition",
              "Adventuring Gear",
              "Tool & Kit",
              "Consumable",
              "Ingredient & Material",
              "Wondrous Item",
              "Treasure & Valuable",
              "Document & Lore",
              "Container & Storage",
              "Trade Good",
              "Trinket & Curio",
              "Junk & Salvage",
              "Hazard & Trap",
              "Collection & Hoard",
              "Other"
            ]
          },
          {
            id: "itemType",
            label: "Subtype / type detail",
            type: "text",
            grid: "half",
            placeholder: "Longsword, herbalism kit, quest key…"
          },
          {
            id: "rarity",
            label: "Rarity",
            type: "select",
            grid: "half",
            options: ["", "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact", "Unique", "Varies"]
          },
          { id: "value", label: "Value", type: "text", grid: "half" },
          { id: "weight", label: "Weight", type: "text", grid: "half" },
          { id: "attunement", label: "Requires attunement", type: "checkbox", grid: "half" },
          {
            id: "tags",
            label: "Tags",
            type: "list",
            grid: "full",
            placeholder: "quest, magic, alchemy, Stormwreck Isle…"
          }
        ]
      },
      {
        title: "Description",
        fields: [
          { id: "description", label: "Description", type: "textarea", rows: 5, grid: "full" },
          { id: "properties", label: "Properties & mechanics", type: "textarea", rows: 4, grid: "full" },
          { id: "notes", label: "Notes", type: "textarea", rows: 3, grid: "full" }
        ]
      }
    ],
    defaults: {
      name: "Unnamed item",
      portrait: "",
      category: "",
      itemType: "",
      rarity: "",
      value: "",
      weight: "",
      attunement: false,
      tags: [],
      description: "",
      properties: "",
      notes: ""
    }
  },

  monster: {
    type: "monster",
    title: "Monster Catalogue",
    subtitle: "Stat blocks, abilities, and encounter notes.",
    newLabel: "New monster",
    searchPlaceholder: "Search monsters…",
    listIcon: "☠",
    searchFields: [
      "name",
      "creatureType",
      "size",
      "cr",
      "alignment",
      "source",
      "tags",
      "traits",
      "actions",
      "notes"
    ],
    facets: [
      { id: "creatureType", label: "Type" },
      { id: "cr", label: "CR" },
      { id: "size", label: "Size" },
      { id: "source", label: "Source" }
    ],
    groupBy: "creatureType",
    groupLabels: { "": "Uncategorized" },
    listMeta: ["size", "creatureType", "cr"],
    sections: [
      {
        title: "Identity",
        fields: [
          { id: "name", label: "Name", type: "text", required: true, grid: "full" },
          {
            id: "portrait",
            label: "Portrait / token",
            type: "image",
            kind: "portrait",
            grid: "full",
            uploadLabel: "Upload portrait",
            clearLabel: "Remove portrait",
            emptyLabel: "No portrait uploaded",
            hint: "Stored in this browser. Large files are resized automatically."
          },
          { id: "size", label: "Size", type: "text", grid: "third" },
          { id: "creatureType", label: "Type", type: "text", grid: "third", placeholder: "Humanoid, dragon…" },
          { id: "alignment", label: "Alignment", type: "text", grid: "third" },
          { id: "cr", label: "Challenge rating", type: "text", grid: "third" },
          { id: "xp", label: "XP", type: "text", grid: "third" },
          { id: "source", label: "Source", type: "text", grid: "third", placeholder: "Stormwreck Isle, MM…" },
          {
            id: "tags",
            label: "Tags",
            type: "list",
            grid: "full",
            placeholder: "undead, coastal, boss…"
          }
        ]
      },
      {
        title: "Ability scores",
        fields: [
          { id: "str", label: "STR", type: "number", grid: "sixth" },
          { id: "dex", label: "DEX", type: "number", grid: "sixth" },
          { id: "con", label: "CON", type: "number", grid: "sixth" },
          { id: "int", label: "INT", type: "number", grid: "sixth" },
          { id: "wis", label: "WIS", type: "number", grid: "sixth" },
          { id: "cha", label: "CHA", type: "number", grid: "sixth" }
        ]
      },
      {
        title: "Combat stats",
        fields: [
          { id: "ac", label: "Armor Class", type: "text", grid: "third" },
          { id: "hp", label: "Hit Points", type: "text", grid: "third" },
          { id: "speed", label: "Speed", type: "text", grid: "third" },
          { id: "savingThrows", label: "Saving throws", type: "text", grid: "half" },
          { id: "skills", label: "Skills", type: "text", grid: "half" },
          { id: "damageResistances", label: "Damage resistances", type: "text", grid: "half" },
          { id: "damageImmunities", label: "Damage immunities", type: "text", grid: "half" },
          { id: "conditionImmunities", label: "Condition immunities", type: "text", grid: "half" },
          { id: "senses", label: "Senses", type: "text", grid: "half" },
          { id: "languages", label: "Languages", type: "text", grid: "full" }
        ]
      },
      {
        title: "Abilities",
        fields: [
          {
            id: "skillRefs",
            label: "Skills (catalogue links)",
            type: "list",
            grid: "full",
            refType: "skill",
            searchPlaceholder: "Search skill catalogue…",
            placeholder: "perception or custom skill text",
            hint: "Search and link skills from the Skill Catalogue."
          },
          {
            id: "traitRefs",
            label: "Traits (catalogue links)",
            type: "list",
            grid: "full",
            refType: "feature",
            searchPlaceholder: "Search feature catalogue…",
            placeholder: "undead-fortitude or custom trait",
            hint: "Monster traits from the Feature Catalogue."
          },
          {
            id: "actionRefs",
            label: "Actions (catalogue links)",
            type: "list",
            grid: "full",
            refType: "feature",
            searchPlaceholder: "Search feature catalogue…",
            placeholder: "slam or custom action",
            hint: "Shared actions from the Feature Catalogue."
          },
          {
            id: "bonusActionRefs",
            label: "Bonus actions (catalogue links)",
            type: "list",
            grid: "full",
            refType: "feature",
            searchPlaceholder: "Search feature catalogue…",
            placeholder: "@feature:…",
            hint: "Bonus actions from the Feature Catalogue."
          },
          {
            id: "reactionRefs",
            label: "Reactions (catalogue links)",
            type: "list",
            grid: "full",
            refType: "feature",
            searchPlaceholder: "Search feature catalogue…",
            placeholder: "@feature:…",
            hint: "Reactions from the Feature Catalogue."
          },
          {
            id: "legendaryActionRefs",
            label: "Legendary actions (catalogue links)",
            type: "list",
            grid: "full",
            refType: "feature",
            searchPlaceholder: "Search feature catalogue…",
            placeholder: "@feature:…",
            hint: "Legendary actions from the Feature Catalogue."
          },
          {
            id: "spellRefs",
            label: "Spells (catalogue links)",
            type: "list",
            grid: "full",
            refType: "spell",
            searchPlaceholder: "Search spell catalogue…",
            placeholder: "Custom spell…",
            hint: "Innate or prepared spells from the Spell Catalogue."
          },
          {
            id: "traits",
            label: "Traits (freeform / creature notes)",
            type: "textarea",
            rows: 3,
            grid: "full",
            placeholder: "Optional prose. Prefer Trait links above for reusable rules. @feature:id|Name works here."
          },
          {
            id: "actions",
            label: "Actions (freeform / creature notes)",
            type: "textarea",
            rows: 4,
            grid: "full",
            placeholder: "Creature-specific attack lines, etc. Link shared actions above."
          },
          { id: "bonusActions", label: "Bonus actions (freeform)", type: "textarea", rows: 2, grid: "full" },
          { id: "reactions", label: "Reactions (freeform)", type: "textarea", rows: 2, grid: "full" },
          { id: "legendaryActions", label: "Legendary actions (freeform)", type: "textarea", rows: 2, grid: "full" },
          { id: "notes", label: "Notes", type: "textarea", rows: 3, grid: "full" }
        ]
      }
    ],
    defaults: {
      name: "Unnamed monster",
      portrait: "",
      size: "Medium",
      creatureType: "",
      alignment: "",
      cr: "",
      xp: "",
      source: "",
      tags: [],
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
      ac: "",
      hp: "",
      speed: "",
      savingThrows: "",
      skills: "",
      damageResistances: "",
      damageImmunities: "",
      conditionImmunities: "",
      senses: "",
      languages: "",
      skillRefs: [],
      traitRefs: [],
      actionRefs: [],
      bonusActionRefs: [],
      reactionRefs: [],
      legendaryActionRefs: [],
      spellRefs: [],
      traits: "",
      actions: "",
      bonusActions: "",
      reactions: "",
      legendaryActions: "",
      notes: ""
    }
  },

  location: {
    type: "location",
    title: "Location Catalogue",
    subtitle: "Places, maps, inhabitants, and campaign links.",
    newLabel: "New location",
    searchPlaceholder: "Search locations…",
    listIcon: "⌖",
    searchFields: [
      "name",
      "locationType",
      "parentLocationRef",
      "tags",
      "description",
      "notes",
      "featuredIn",
      "npcs",
      "monsters",
      "itemsOfInterest"
    ],
    facets: [
      { id: "locationType", label: "Type" }
    ],
    groupBy: "locationType",
    groupOrder: [
      "Region",
      "Island",
      "Settlement",
      "District",
      "Building",
      "Room / Area",
      "Dungeon",
      "Cave",
      "Ruin",
      "Wilderness",
      "Landmark",
      "Other"
    ],
    groupLabels: { "": "Uncategorized" },
    listMeta: ["locationType"],
    sections: [
      {
        title: "Overview",
        fields: [
          { id: "name", label: "Name", type: "text", required: true, grid: "full" },
          {
            id: "mapImage",
            label: "Map image",
            type: "image",
            kind: "map",
            grid: "full",
            uploadLabel: "Upload map image",
            clearLabel: "Remove map",
            emptyLabel: "No map uploaded",
            hint: "Simple raster map. For grid/measure tools, import UVTT below instead."
          },
          {
            id: "mapCalibration",
            label: "UVTT / calibrated map",
            type: "uvtt",
            grid: "full",
            uploadLabel: "Import UVTT / dd2vtt",
            clearLabel: "Remove UVTT calibration",
            emptyLabel: "No UVTT imported",
            hint: "Embeds grid + map image on this location. Requires npm start. Used by campaign maps when this location is added."
          },
          {
            id: "locationType",
            label: "Location type",
            type: "select",
            grid: "half",
            options: [
              "",
              "Region",
              "Island",
              "Settlement",
              "District",
              "Building",
              "Room / Area",
              "Dungeon",
              "Cave",
              "Ruin",
              "Wilderness",
              "Landmark",
              "Other"
            ]
          },
          {
            id: "parentLocationRef",
            label: "Parent location",
            type: "text",
            grid: "half",
            refType: "location",
            placeholder: "@location:sw-dragons-rest|Dragon's Rest"
          },
          {
            id: "tags",
            label: "Tags",
            type: "list",
            grid: "full",
            placeholder: "coastal, sacred, dungeon…"
          },
          { id: "description", label: "Description", type: "textarea", rows: 5, grid: "full" }
        ]
      },
      {
        title: "Inhabitants & points of interest",
        fields: [
          {
            id: "npcs",
            label: "NPCs",
            type: "list",
            grid: "full",
            refType: "npc",
            placeholder: "@npc:sw-tarak|Tarak or plain name"
          },
          {
            id: "monsters",
            label: "Monsters",
            type: "list",
            grid: "full",
            refType: "monster",
            placeholder: "@monster:sw-ghoul|Ghoul or plain name"
          },
          {
            id: "itemsOfInterest",
            label: "Items of interest",
            type: "list",
            grid: "full",
            refType: "item",
            placeholder: "@item:sw-captains-compass|Captain's Compass or plain text"
          }
        ]
      },
      {
        title: "Campaign links",
        fields: [
          { id: "featuredIn", label: "Featured in (campaigns)", type: "list", grid: "full", placeholder: "Campaign name" },
          { id: "notes", label: "Notes", type: "textarea", rows: 4, grid: "full" }
        ]
      }
    ],
    defaults: {
      name: "Unnamed location",
      mapImage: "",
      mapCalibration: null,
      locationType: "",
      parentLocationRef: "",
      tags: [],
      description: "",
      npcs: [],
      monsters: [],
      itemsOfInterest: [],
      featuredIn: [],
      notes: ""
    }
  },

  race: {
    type: "race",
    title: "Species Catalogue",
    subtitle: "Species and subspecies with traits, speeds, and languages.",
    newLabel: "New species",
    searchPlaceholder: "Search species…",
    listIcon: "◇",
    searchFields: [
      "name",
      "entryKind",
      "parentSpeciesRef",
      "size",
      "speed",
      "source",
      "summary",
      "traits",
      "languages",
      "notes"
    ],
    facets: [
      {
        id: "entryKind",
        label: "Kind",
        options: [
          { value: "species", label: "Species" },
          { value: "subspecies", label: "Subspecies" }
        ]
      }
    ],
    groupBy: "entryKind",
    groupOrder: ["species", "subspecies"],
    groupLabels: {
      species: "Species",
      subspecies: "Subspecies",
      "": "Uncategorized"
    },
    entryKindLabels: {
      species: "Species",
      subspecies: "Subspecies"
    },
    listMeta: ["entryKind", "size", "speed"],
    sections: [
      {
        title: "Identity",
        fields: [
          { id: "name", label: "Name", type: "text", required: true, grid: "full" },
          {
            id: "portrait",
            label: "Portrait",
            type: "image",
            kind: "portrait",
            grid: "full",
            uploadLabel: "Upload portrait",
            clearLabel: "Remove portrait",
            emptyLabel: "No portrait uploaded",
            hint: "Stored in this browser. Large files are resized automatically."
          },
          {
            id: "entryKind",
            label: "Entry kind",
            type: "select",
            grid: "half",
            options: [
              { value: "species", label: "Species" },
              { value: "subspecies", label: "Subspecies" }
            ]
          },
          { id: "source", label: "Source", type: "text", grid: "half", placeholder: "PHB, homebrew…" },
          {
            id: "parentSpeciesRef",
            label: "Parent species",
            type: "text",
            grid: "full",
            refType: "race",
            placeholder: "@race:race-elf|Elf",
            showWhen: { field: "entryKind", equals: "subspecies" }
          },
          {
            id: "subspeciesRefs",
            label: "Subspecies",
            type: "list",
            grid: "full",
            refType: "race",
            placeholder: "@race:subspecies-elf-high|High Elf",
            showWhen: { field: "entryKind", equals: "species" }
          },
          { id: "size", label: "Size", type: "text", grid: "half", placeholder: "Medium, Small…" },
          { id: "speed", label: "Speed", type: "text", grid: "half", placeholder: "30 ft." },
          { id: "summary", label: "Summary", type: "textarea", rows: 2, grid: "full" }
        ]
      },
      {
        title: "Traits",
        fields: [
          { id: "abilityScoreIncrease", label: "Ability score increase", type: "textarea", rows: 2, grid: "full" },
          {
            id: "featureRefs",
            label: "Features",
            type: "list",
            refType: "feature",
            grid: "full",
            placeholder: "feature:darkvision or @feature:darkvision|Darkvision"
          },
          { id: "traits", label: "Traits (notes)", type: "textarea", rows: 6, grid: "full" },
          { id: "languages", label: "Languages", type: "textarea", rows: 2, grid: "half" },
          { id: "senses", label: "Senses", type: "textarea", rows: 2, grid: "half", placeholder: "Darkvision 60 ft…" }
        ]
      },
      {
        title: "Notes",
        fields: [{ id: "notes", label: "Notes", type: "textarea", rows: 4, grid: "full" }]
      }
    ],
    defaults: {
      name: "Unnamed species",
      portrait: "",
      entryKind: "species",
      parentSpeciesRef: "",
      subspeciesRefs: [],
      size: "Medium",
      speed: "30 ft.",
      source: "",
      summary: "",
      abilityScoreIncrease: "",
      featureRefs: [],
      traits: "",
      languages: "",
      senses: "",
      notes: ""
    }
  },

  class: {
    type: "class",
    title: "Class Catalogue",
    subtitle: "Classes and subclasses with hit dice, proficiencies, and features.",
    newLabel: "New class",
    searchPlaceholder: "Search classes…",
    listIcon: "⬡",
    searchFields: [
      "name",
      "entryKind",
      "parentClassRef",
      "hitDie",
      "primaryAbility",
      "source",
      "summary",
      "features",
      "notes"
    ],
    facets: [
      {
        id: "entryKind",
        label: "Kind",
        options: [
          { value: "class", label: "Classes" },
          { value: "subclass", label: "Subclasses" }
        ]
      }
    ],
    groupBy: "entryKind",
    groupOrder: ["class", "subclass"],
    groupLabels: {
      class: "Classes",
      subclass: "Subclasses",
      "": "Uncategorized"
    },
    entryKindLabels: {
      class: "Class",
      subclass: "Subclass"
    },
    listMeta: ["entryKind", "hitDie", "primaryAbility"],
    sections: [
      {
        title: "Identity",
        fields: [
          { id: "name", label: "Name", type: "text", required: true, grid: "full" },
          {
            id: "portrait",
            label: "Portrait",
            type: "image",
            kind: "portrait",
            grid: "full",
            uploadLabel: "Upload portrait",
            clearLabel: "Remove portrait",
            emptyLabel: "No portrait uploaded",
            hint: "Stored in this browser. Large files are resized automatically."
          },
          {
            id: "entryKind",
            label: "Entry kind",
            type: "select",
            grid: "half",
            options: [
              { value: "class", label: "Class" },
              { value: "subclass", label: "Subclass" }
            ]
          },
          { id: "source", label: "Source", type: "text", grid: "half", placeholder: "PHB, homebrew…" },
          {
            id: "parentClassRef",
            label: "Parent class",
            type: "text",
            grid: "full",
            refType: "class",
            placeholder: "@class:class-barbarian|Barbarian",
            showWhen: { field: "entryKind", equals: "subclass" }
          },
          {
            id: "subclassRefs",
            label: "Subclasses",
            type: "list",
            grid: "full",
            refType: "class",
            placeholder: "@class:subclass-barbarian-berserker|Path of the Berserker",
            showWhen: { field: "entryKind", equals: "class" }
          },
          {
            id: "hitDie",
            label: "Hit die",
            type: "text",
            grid: "half",
            placeholder: "d8, d10…",
            showWhen: { field: "entryKind", notEquals: "subclass" }
          },
          {
            id: "primaryAbility",
            label: "Primary ability",
            type: "text",
            grid: "half",
            placeholder: "Strength, Wisdom…",
            showWhen: { field: "entryKind", notEquals: "subclass" }
          },
          { id: "summary", label: "Summary", type: "textarea", rows: 2, grid: "full" }
        ]
      },
      {
        title: "Proficiencies",
        showWhen: { field: "entryKind", notEquals: "subclass" },
        fields: [
          { id: "savingThrows", label: "Saving throws", type: "text", grid: "full" },
          { id: "armorProficiencies", label: "Armor", type: "textarea", rows: 2, grid: "half" },
          { id: "weaponProficiencies", label: "Weapons", type: "textarea", rows: 2, grid: "half" },
          { id: "toolProficiencies", label: "Tools", type: "textarea", rows: 2, grid: "half" },
          {
            id: "skillChoices",
            label: "Skill choices (rules text)",
            type: "textarea",
            rows: 2,
            grid: "full",
            placeholder: "Choose 2 from…"
          },
          {
            id: "skillRefs",
            label: "Skill options",
            type: "list",
            refType: "skill",
            grid: "full",
            placeholder: "skill:nature or @skill:nature|Nature"
          }
        ]
      },
      {
        title: "Features & spellcasting",
        fields: [
          {
            id: "featureRefs",
            label: "Feature references",
            type: "list",
            refType: "feature",
            grid: "full",
            placeholder: "feature:wild-shape or @feature:wild-shape|Wild Shape"
          },
          {
            id: "features",
            label: "Features by level",
            type: "textarea",
            rows: 8,
            grid: "full",
            placeholder: "1 — @feature:druidic|Druidic, @feature:spellcasting|Spellcasting\n2 — @feature:wild-shape|Wild Shape"
          },
          { id: "spellcasting", label: "Spellcasting", type: "textarea", rows: 4, grid: "full" }
        ]
      },
      {
        title: "Notes",
        fields: [{ id: "notes", label: "Notes", type: "textarea", rows: 4, grid: "full" }]
      }
    ],
    defaults: {
      name: "Unnamed class",
      portrait: "",
      entryKind: "class",
      parentClassRef: "",
      subclassRefs: [],
      hitDie: "",
      primaryAbility: "",
      source: "",
      summary: "",
      savingThrows: "",
      armorProficiencies: "",
      weaponProficiencies: "",
      toolProficiencies: "",
      skillChoices: "",
      skillRefs: [],
      featureRefs: [],
      features: "",
      spellcasting: "",
      notes: ""
    }
  },

  spell: {
    type: "spell",
    title: "Spell Catalogue",
    subtitle: "Spells with level, school, casting details, and effects.",
    newLabel: "New spell",
    searchPlaceholder: "Search spells…",
    listIcon: "✧",
    searchFields: ["name", "level", "school", "source", "classes", "classRefs", "summary", "description", "notes"],
    facets: [
      { id: "level", label: "Level" },
      { id: "school", label: "School" },
      { id: "source", label: "Source" }
    ],
    groupBy: "level",
    groupLabels: { "": "Uncategorized", "0": "Cantrips", Cantrip: "Cantrips" },
    listMeta: ["level", "school"],
    sections: [
      {
        title: "Identity",
        fields: [
          { id: "name", label: "Name", type: "text", required: true, grid: "full" },
          {
            id: "portrait",
            label: "Illustration",
            type: "image",
            kind: "portrait",
            grid: "full",
            uploadLabel: "Upload image",
            clearLabel: "Remove image",
            emptyLabel: "No image uploaded",
            hint: "Stored in this browser. Large files are resized automatically."
          },
          { id: "level", label: "Level", type: "text", grid: "half", placeholder: "Cantrip, 1, 2…" },
          { id: "school", label: "School", type: "text", grid: "half", placeholder: "Evocation, Illusion…" },
          { id: "source", label: "Source", type: "text", grid: "half", placeholder: "Core rules, homebrew…" },
          { id: "classes", label: "Classes (legacy text)", type: "text", grid: "half", placeholder: "Wizard, Cleric…" },
          {
            id: "classRefs",
            label: "Class references",
            type: "list",
            grid: "full",
            refType: "class",
            placeholder: "@class:class-wizard|Wizard"
          },
          { id: "ritual", label: "Ritual", type: "checkbox", grid: "half" },
          { id: "concentration", label: "Concentration", type: "checkbox", grid: "half" }
        ]
      },
      {
        title: "Casting",
        fields: [
          { id: "castingTime", label: "Casting time", type: "text", grid: "half", placeholder: "1 action" },
          { id: "range", label: "Range", type: "text", grid: "half", placeholder: "60 feet" },
          { id: "components", label: "Components", type: "text", grid: "half", placeholder: "V, S, M (…)" },
          { id: "duration", label: "Duration", type: "text", grid: "half", placeholder: "Instantaneous" }
        ]
      },
      {
        title: "Effect",
        fields: [
          { id: "summary", label: "Summary", type: "textarea", rows: 2, grid: "full" },
          { id: "description", label: "Description", type: "textarea", rows: 8, grid: "full" },
          { id: "higherLevels", label: "At higher levels", type: "textarea", rows: 3, grid: "full" },
          { id: "notes", label: "Notes", type: "textarea", rows: 3, grid: "full" }
        ]
      }
    ],
    defaults: {
      name: "Unnamed spell",
      portrait: "",
      level: "1",
      school: "",
      source: "",
      classes: "",
      classRefs: [],
      ritual: false,
      concentration: false,
      castingTime: "1 action",
      range: "",
      components: "V, S",
      duration: "Instantaneous",
      summary: "",
      description: "",
      higherLevels: "",
      notes: ""
    }
  },

  skill: {
    type: "skill",
    title: "Skill Catalogue",
    subtitle: "Ability checks, typical uses, and personal notes.",
    newLabel: "New skill",
    searchPlaceholder: "Search skills…",
    listIcon: "◎",
    searchFields: ["name", "defaultAbility", "source", "summary", "description", "tags", "notes"],
    facets: [{ id: "defaultAbility", label: "Ability" }],
    groupBy: "defaultAbility",
    groupLabels: { "": "Uncategorized" },
    listMeta: ["defaultAbility"],
    sections: [
      {
        title: "Identity",
        fields: [
          { id: "name", label: "Name", type: "text", required: true, grid: "full" },
          {
            id: "defaultAbility",
            label: "Default ability",
            type: "text",
            grid: "half",
            placeholder: "Intelligence, Wisdom…"
          },
          { id: "source", label: "Source / book", type: "text", grid: "half", placeholder: "Player's Handbook…" },
          { id: "page", label: "Page", type: "text", grid: "half", placeholder: "175" },
          { id: "summary", label: "Short summary", type: "textarea", rows: 2, grid: "full" }
        ]
      },
      {
        title: "Details",
        fields: [
          { id: "description", label: "Description", type: "textarea", rows: 6, grid: "full" },
          { id: "typicalUses", label: "Typical uses", type: "textarea", rows: 4, grid: "full" },
          { id: "exampleChecks", label: "Example checks", type: "textarea", rows: 4, grid: "full" }
        ]
      },
      {
        title: "Notes & tags",
        fields: [
          { id: "notes", label: "Personal notes", type: "textarea", rows: 4, grid: "full" },
          { id: "tags", label: "Tags", type: "list", grid: "full", placeholder: "exploration, knowledge…" }
        ]
      }
    ],
    defaults: {
      name: "Unnamed skill",
      defaultAbility: "",
      source: "",
      page: "",
      summary: "",
      description: "",
      typicalUses: "",
      exampleChecks: "",
      notes: "",
      tags: []
    }
  },

  feature: {
    type: "feature",
    title: "Feature Catalogue",
    subtitle: "Reusable abilities — class, species, monster traits/actions, and more.",
    newLabel: "New feature",
    searchPlaceholder: "Search features…",
    listIcon: "✱",
    searchFields: ["name", "featureType", "grantedBy", "source", "summary", "description", "tags", "notes"],
    facets: [
      { id: "featureType", label: "Type" },
      { id: "source", label: "Source" }
    ],
    groupBy: "featureType",
    groupLabels: { "": "Uncategorized" },
    listMeta: ["featureType", "levelPrerequisite"],
    sections: [
      {
        title: "Identity",
        fields: [
          { id: "name", label: "Name", type: "text", required: true, grid: "full" },
          {
            id: "featureType",
            label: "Feature type",
            type: "select",
            grid: "half",
            options: [
              "Class feature",
              "Subclass feature",
              "Species feature",
              "Background feature",
              "Feat",
              "Monster trait",
              "Monster action",
              "Monster bonus action",
              "Monster reaction",
              "Legendary action",
              "Other"
            ]
          },
          {
            id: "grantedBy",
            label: "Granted by",
            type: "text",
            grid: "half",
            placeholder: "@class:class-druid|Druid or @race:race-elf|Elf"
          },
          {
            id: "levelPrerequisite",
            label: "Level / prerequisite",
            type: "text",
            grid: "half",
            placeholder: "2, or prerequisite text"
          },
          { id: "source", label: "Source / book", type: "text", grid: "half", placeholder: "Player's Handbook…" },
          { id: "page", label: "Page", type: "text", grid: "half", placeholder: "66" },
          { id: "summary", label: "Short summary", type: "textarea", rows: 2, grid: "full" }
        ]
      },
      {
        title: "Rules",
        fields: [
          { id: "description", label: "Full rules / details", type: "textarea", rows: 10, grid: "full" },
          {
            id: "usesRecharge",
            label: "Uses / recharge",
            type: "textarea",
            rows: 2,
            grid: "full",
            placeholder: "1/rest, proficiency bonus / long rest…"
          }
        ]
      },
      {
        title: "Notes & tags",
        fields: [
          { id: "notes", label: "Personal notes", type: "textarea", rows: 4, grid: "full" },
          { id: "tags", label: "Tags", type: "list", grid: "full", placeholder: "transformation, combat…" }
        ]
      }
    ],
    defaults: {
      name: "Unnamed feature",
      featureType: "Class feature",
      grantedBy: "",
      levelPrerequisite: "",
      source: "",
      page: "",
      summary: "",
      description: "",
      usesRecharge: "",
      notes: "",
      tags: []
    }
  },

  music: {
    type: "music",
    title: "Music Catalogue",
    subtitle: "Long-form ambience, creature atmosphere, and battle music for Pocket Bard.",
    newLabel: "+ Upload track",
    searchPlaceholder: "Search tracks…",
    listIcon: "♪",
    searchFields: ["title", "name", "kind", "category", "tags", "notes", "audio.originalFilename"],
    facets: [
      {
        id: "kind",
        label: "Kind",
        options: [
          { value: "ambience", label: "Ambience" },
          { value: "creature", label: "Creature" },
          { value: "music", label: "Music" }
        ]
      }
    ],
    groupBy: "kind",
    groupOrder: ["ambience", "creature", "music"],
    groupLabels: {
      ambience: "Ambience",
      creature: "Creature",
      music: "Music",
      "": "Uncategorized"
    },
    listMeta: ["category", "tags", "_duration", "_loop"],
    sections: [
      {
        title: "Track",
        fields: [
          { id: "title", label: "Title", type: "text", required: true, grid: "full" },
          {
            id: "audio",
            label: "Audio file",
            type: "audio",
            grid: "full",
            uploadLabel: "Choose MP3",
            replaceLabel: "Replace MP3",
            hint: "MP3 only for now. Stored outside the repo (local data volume or S3 bucket)."
          },
          {
            id: "kind",
            label: "Kind",
            type: "select",
            grid: "half",
            options: [
              { value: "ambience", label: "Ambience" },
              { value: "creature", label: "Creature" },
              { value: "music", label: "Music" }
            ]
          },
          {
            id: "category",
            label: "Category",
            type: "text",
            grid: "half",
            placeholder: "coastal, combat, undead…"
          },
          {
            id: "tags",
            label: "Tags",
            type: "list",
            grid: "full",
            placeholder: "dark, cave, calm, loop, stormwreck…"
          },
          {
            id: "defaultVolume",
            label: "Default volume (0–1)",
            type: "number",
            grid: "half",
            placeholder: "0.7"
          },
          {
            id: "loopByDefault",
            label: "Loop by default",
            type: "checkbox",
            grid: "half"
          }
        ]
      },
      {
        title: "Notes",
        fields: [
          {
            id: "notes",
            label: "Description / notes",
            type: "textarea",
            rows: 4,
            grid: "full",
            placeholder: "When to use this track, mood, source…"
          }
        ]
      }
    ],
    defaults: {
      title: "Untitled track",
      name: "Untitled track",
      kind: "ambience",
      category: "",
      tags: [],
      notes: "",
      defaultVolume: 0.7,
      loopByDefault: true,
      audio: null
    }
  }
};
