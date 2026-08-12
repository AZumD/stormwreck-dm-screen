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
  }
};
