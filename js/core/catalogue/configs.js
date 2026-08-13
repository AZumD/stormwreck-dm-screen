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
          { id: "skills", label: "Skills", type: "textarea", rows: 3, grid: "half" },
          { id: "languages", label: "Languages", type: "textarea", rows: 2, grid: "full" }
        ]
      },
      {
        title: "Equipment",
        fields: [{ id: "equipment", label: "Gear & inventory", type: "list", grid: "full", placeholder: "Item name" }]
      },
      {
        title: "Features & spells",
        fields: [{ id: "featuresSpells", label: "Class features, spells, abilities", type: "textarea", rows: 6, grid: "full" }]
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
      skills: "",
      languages: "",
      equipment: [],
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
          { id: "speed", label: "Speed", type: "text", grid: "third" }
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
        title: "Equipment",
        fields: [{ id: "equipment", label: "Gear & inventory", type: "list", grid: "full", placeholder: "Item name" }]
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
      traits: "",
      ideals: "",
      bonds: "",
      flaws: "",
      equipment: [],
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
          { id: "itemType", label: "Type", type: "text", grid: "half", placeholder: "Weapon, wondrous item…" },
          { id: "rarity", label: "Rarity", type: "text", grid: "half", placeholder: "Common, rare, legendary…" },
          { id: "value", label: "Value", type: "text", grid: "half" },
          { id: "weight", label: "Weight", type: "text", grid: "half" },
          { id: "attunement", label: "Requires attunement", type: "checkbox", grid: "full" }
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
      itemType: "",
      rarity: "",
      value: "",
      weight: "",
      attunement: false,
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
          { id: "cr", label: "Challenge rating", type: "text", grid: "half" },
          { id: "xp", label: "XP", type: "text", grid: "half" }
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
          { id: "traits", label: "Traits", type: "textarea", rows: 4, grid: "full" },
          { id: "actions", label: "Actions", type: "textarea", rows: 5, grid: "full" },
          { id: "bonusActions", label: "Bonus actions", type: "textarea", rows: 3, grid: "full" },
          { id: "reactions", label: "Reactions", type: "textarea", rows: 3, grid: "full" },
          { id: "legendaryActions", label: "Legendary actions", type: "textarea", rows: 3, grid: "full" },
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
            uploadLabel: "Upload map",
            clearLabel: "Remove map",
            emptyLabel: "No map uploaded",
            hint: "Stored in this browser. Large files are resized automatically."
          },
          { id: "description", label: "Description", type: "textarea", rows: 5, grid: "full" }
        ]
      },
      {
        title: "Inhabitants & points of interest",
        fields: [
          { id: "npcs", label: "NPCs", type: "list", grid: "full", placeholder: "NPC name" },
          { id: "monsters", label: "Monsters", type: "list", grid: "full", placeholder: "Monster name" },
          { id: "itemsOfInterest", label: "Items of interest", type: "list", grid: "full", placeholder: "Item or feature" }
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
    title: "Race Catalogue",
    subtitle: "Ancestries and lineages with traits, speeds, and languages.",
    newLabel: "New race",
    searchPlaceholder: "Search races…",
    listIcon: "◇",
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
          { id: "size", label: "Size", type: "text", grid: "half", placeholder: "Medium, Small…" },
          { id: "speed", label: "Speed", type: "text", grid: "half", placeholder: "30 ft." },
          { id: "source", label: "Source", type: "text", grid: "half", placeholder: "PHB, homebrew…" },
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
      name: "Unnamed race",
      portrait: "",
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
    subtitle: "Classes with hit dice, proficiencies, and features.",
    newLabel: "New class",
    searchPlaceholder: "Search classes…",
    listIcon: "⬡",
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
          { id: "hitDie", label: "Hit die", type: "text", grid: "half", placeholder: "d8, d10…" },
          { id: "primaryAbility", label: "Primary ability", type: "text", grid: "half", placeholder: "Strength, Wisdom…" },
          { id: "source", label: "Source", type: "text", grid: "half", placeholder: "PHB, homebrew…" },
          { id: "summary", label: "Summary", type: "textarea", rows: 2, grid: "full" }
        ]
      },
      {
        title: "Proficiencies",
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
          { id: "spellcasting", label: "Spellcasting", type: "textarea", rows: 4, grid: "full" },
          { id: "subclasses", label: "Subclasses / archetypes", type: "list", grid: "full", placeholder: "Subclass name" }
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
      subclasses: [],
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
          { id: "classes", label: "Classes", type: "text", grid: "half", placeholder: "Wizard, Cleric…" },
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
    subtitle: "Reusable class, subclass, species, background, and other abilities.",
    newLabel: "New feature",
    searchPlaceholder: "Search features…",
    listIcon: "✱",
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
              "Other"
            ]
          },
          {
            id: "grantedBy",
            label: "Granted by",
            type: "text",
            grid: "half",
            placeholder: "@class:druid|Druid or @race:elf|Elf"
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
  }
};
