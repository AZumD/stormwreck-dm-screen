/**
 * One-shot migration: catalogue taxonomy (item category/tags, class subclasses,
 * race subspecies, location types, monster source/tags).
 * Run: node test/migrate-catalogue-taxonomy.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const now = Date.now();

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const ITEM_TAXONOMY = {
  "sw-moonstone-key": { category: "Adventuring Gear", tags: ["quest", "magic", "Stormwreck Isle"] },
  "sw-heart-cap-mushrooms": {
    category: "Ingredient & Material",
    tags: ["alchemy", "quest", "Stormwreck Isle"]
  },
  "sw-cartographers-tools": { category: "Tool & Kit", tags: ["nautical", "Stormwreck Isle"] },
  "sw-captains-compass": { category: "Adventuring Gear", tags: ["nautical", "Stormwreck Isle"] },
  "sw-cursed-captains-chest": {
    category: "Container & Storage",
    tags: ["nautical", "magic", "cursed", "Stormwreck Isle"]
  },
  "sw-poisoned-dart-trap": { category: "Hazard & Trap", tags: ["nautical", "Stormwreck Isle"] },
  "sw-sparkrender-hoard": {
    category: "Collection & Hoard",
    tags: ["dragon", "treasure", "Stormwreck Isle"]
  },
  "sw-mylas-equipment": { category: "Collection & Hoard", tags: ["shop", "Stormwreck Isle"] },
  "sw-alchemists-fire": { category: "Consumable", tags: ["alchemy", "Stormwreck Isle"] },
  "sw-aleitha-brastos-portrait": {
    category: "Trinket & Curio",
    tags: ["nautical", "Stormwreck Isle"]
  },
  "sw-aleithas-braid": { category: "Trinket & Curio", tags: ["nautical", "Stormwreck Isle"] },
  "sw-backpack": { category: "Container & Storage", tags: ["Stormwreck Isle"] },
  "sw-battleaxe-plus-one": { category: "Weapon", tags: ["magic", "Stormwreck Isle"] },
  "sw-bedroll": { category: "Adventuring Gear", tags: ["Stormwreck Isle"] },
  "sw-bloodstone": { category: "Treasure & Valuable", tags: ["gem", "Stormwreck Isle"] },
  "sw-blue-jasper": { category: "Treasure & Valuable", tags: ["gem", "Stormwreck Isle"] },
  "sw-boots-of-elvenkind": { category: "Wondrous Item", tags: ["magic", "Stormwreck Isle"] },
  "sw-captains-journal": { category: "Document & Lore", tags: ["nautical", "Stormwreck Isle"] },
  "sw-compass-rose-dagger": { category: "Weapon", tags: ["nautical", "Stormwreck Isle"] },
  "sw-crowbar": { category: "Adventuring Gear", tags: ["Stormwreck Isle"] },
  "sw-dragon-bone-candlestick": {
    category: "Trinket & Curio",
    tags: ["dragon", "art", "Stormwreck Isle"]
  },
  "sw-elixir-of-health": { category: "Consumable", tags: ["magic", "potion", "Stormwreck Isle"] },
  "sw-fine-wine": { category: "Trade Good", tags: ["Stormwreck Isle"] },
  "sw-fire-snake-obsidian": {
    category: "Ingredient & Material",
    tags: ["elemental", "Stormwreck Isle"]
  },
  "sw-gold-bracelet": { category: "Treasure & Valuable", tags: ["jewelry", "Stormwreck Isle"] },
  "sw-gold-hoop-earring": { category: "Treasure & Valuable", tags: ["jewelry", "Stormwreck Isle"] },
  "sw-hammer": { category: "Adventuring Gear", tags: ["Stormwreck Isle"] },
  "sw-healers-kit": { category: "Tool & Kit", tags: ["medical", "Stormwreck Isle"] },
  "sw-hempen-rope": { category: "Adventuring Gear", tags: ["Stormwreck Isle"] },
  "sw-herb-black-rose": {
    category: "Ingredient & Material",
    tags: ["alchemy", "poison", "Stormwreck Isle"]
  },
  "sw-herb-bloodkeep": { category: "Ingredient & Material", tags: ["alchemy", "Stormwreck Isle"] },
  "sw-herb-mageroyal": { category: "Ingredient & Material", tags: ["alchemy", "Stormwreck Isle"] },
  "sw-herb-silverleaf": { category: "Ingredient & Material", tags: ["alchemy", "Stormwreck Isle"] },
  "sw-herbalism-kit": { category: "Tool & Kit", tags: ["alchemy", "Stormwreck Isle"] },
  "sw-masons-tools": { category: "Tool & Kit", tags: ["Stormwreck Isle"] },
  "sw-mother-of-pearl-lute": { category: "Tool & Kit", tags: ["instrument", "Stormwreck Isle"] },
  "sw-oil-flask": { category: "Consumable", tags: ["Stormwreck Isle"] },
  "sw-owlbear-whistle": { category: "Trinket & Curio", tags: ["Stormwreck Isle"] },
  "sw-pale-blue-quartz": { category: "Treasure & Valuable", tags: ["gem", "Stormwreck Isle"] },
  "sw-piton": { category: "Adventuring Gear", tags: ["Stormwreck Isle"] },
  "sw-potion-lightning-resistance": {
    category: "Consumable",
    tags: ["magic", "potion", "Stormwreck Isle"]
  },
  "sw-potion-of-healing": { category: "Consumable", tags: ["magic", "potion", "Stormwreck Isle"] },
  "sw-rations": { category: "Consumable", tags: ["Stormwreck Isle"] },
  "sw-ruby-morel": {
    category: "Ingredient & Material",
    tags: ["alchemy", "magic", "Stormwreck Isle"]
  },
  "sw-sack-of-cloves": { category: "Trade Good", tags: ["Stormwreck Isle"] },
  "sw-scholars-journal": { category: "Document & Lore", tags: ["Stormwreck Isle"] },
  "sw-silver-bar": { category: "Trade Good", tags: ["Stormwreck Isle"] },
  "sw-spell-scroll-command": { category: "Consumable", tags: ["magic", "scroll", "Stormwreck Isle"] },
  "sw-spell-scroll-hold-person": {
    category: "Consumable",
    tags: ["magic", "scroll", "Stormwreck Isle"]
  },
  "sw-thieves-tools": { category: "Tool & Kit", tags: ["Stormwreck Isle"] },
  "sw-tiger-eye": { category: "Treasure & Valuable", tags: ["gem", "Stormwreck Isle"] },
  "sw-tinderbox": { category: "Adventuring Gear", tags: ["Stormwreck Isle"] },
  "sw-tinkers-tools": { category: "Tool & Kit", tags: ["Stormwreck Isle"] },
  "sw-torch": { category: "Adventuring Gear", tags: ["Stormwreck Isle"] },
  "sw-waterskin": { category: "Container & Storage", tags: ["Stormwreck Isle"] },
  "sw-wind-spore": {
    category: "Ingredient & Material",
    tags: ["alchemy", "magic", "Stormwreck Isle"]
  },
  "sw-bark-berry-trail-ration": {
    category: "Consumable",
    tags: ["rations", "survival", "Stormwreck Isle"]
  },
  "sw-small-game-snare": {
    category: "Adventuring Gear",
    tags: ["survival", "hunting", "Stormwreck Isle"]
  },
  "sw-waxed-hide-shelter": {
    category: "Adventuring Gear",
    tags: ["camping", "survival", "Stormwreck Isle"]
  },
  "sw-woven-travel-bag": {
    category: "Container & Storage",
    tags: ["survival", "Stormwreck Isle"]
  }
};

const LOCATION_TAXONOMY = {
  "sw-stormwreck-isle": {
    locationType: "Island",
    parentLocationRef: "",
    tags: ["Sword Coast", "Stormwreck Isle"]
  },
  "sw-dragons-rest": {
    locationType: "Settlement",
    parentLocationRef: "@location:sw-stormwreck-isle|Stormwreck Isle",
    tags: ["cloister", "sanctuary", "Stormwreck Isle"]
  },
  "sw-beach-harbor": {
    locationType: "Landmark",
    parentLocationRef: "@location:sw-dragons-rest|Dragon's Rest",
    tags: ["coastal", "harbor", "Stormwreck Isle"]
  },
  "sw-seagrow-caves": {
    locationType: "Cave",
    parentLocationRef: "@location:sw-stormwreck-isle|Stormwreck Isle",
    tags: ["myconid", "elemental", "Stormwreck Isle"]
  },
  "sw-compass-rose": {
    locationType: "Ruin",
    parentLocationRef: "@location:sw-stormwreck-isle|Stormwreck Isle",
    tags: ["shipwreck", "cursed", "nautical", "Stormwreck Isle"]
  },
  "sw-clifftop-observatory": {
    locationType: "Ruin",
    parentLocationRef: "@location:sw-stormwreck-isle|Stormwreck Isle",
    tags: ["dragon", "observatory", "Stormwreck Isle"]
  }
};

/** @type {{ id: string, name: string, parentId: string, parentName: string, summary: string }[]} */
const SUBCLASSES = [
  {
    id: "subclass-barbarian-berserker",
    name: "Path of the Berserker",
    parentId: "class-barbarian",
    parentName: "Barbarian",
    summary: "Frenzied rage for reckless offense at the cost of exhaustion."
  },
  {
    id: "subclass-barbarian-totem-warrior",
    name: "Path of the Totem Warrior",
    parentId: "class-barbarian",
    parentName: "Barbarian",
    summary: "Spirit totems grant defensive, offensive, or utility benefits while raging."
  },
  {
    id: "subclass-bard-lore",
    name: "College of Lore",
    parentId: "class-bard",
    parentName: "Bard",
    summary: "Cutting Words and Magical Secrets — versatile knowledge and spell theft."
  },
  {
    id: "subclass-bard-valor",
    name: "College of Valor",
    parentId: "class-bard",
    parentName: "Bard",
    summary: "Martial college with Combat Inspiration, armor, and Extra Attack."
  },
  {
    id: "subclass-cleric-life",
    name: "Life Domain",
    parentId: "class-cleric",
    parentName: "Cleric",
    summary: "Supreme healing domain — Disciple of Life and Preserve Life."
  },
  {
    id: "subclass-cleric-light",
    name: "Light Domain",
    parentId: "class-cleric",
    parentName: "Cleric",
    summary: "Radiant and fire magic with Warding Flare."
  },
  {
    id: "subclass-cleric-nature",
    name: "Nature Domain",
    parentId: "class-cleric",
    parentName: "Cleric",
    summary: "Druid cantrip and heavy armor options tied to nature deities."
  },
  {
    id: "subclass-cleric-tempest",
    name: "Tempest Domain",
    parentId: "class-cleric",
    parentName: "Cleric",
    summary: "Thunder and lightning domain with Wrath of the Storm."
  },
  {
    id: "subclass-cleric-trickery",
    name: "Trickery Domain",
    parentId: "class-cleric",
    parentName: "Cleric",
    summary: "Illusion and deception — Blessing of the Trickster and Invoke Duplicity."
  },
  {
    id: "subclass-cleric-war",
    name: "War Domain",
    parentId: "class-cleric",
    parentName: "Cleric",
    summary: "Martial cleric with War Priest bonus attacks and Divine Strike."
  },
  {
    id: "subclass-cleric-knowledge",
    name: "Knowledge Domain",
    parentId: "class-cleric",
    parentName: "Cleric",
    summary: "Expertise in knowledge skills and Read Thoughts Channel Divinity."
  },
  {
    id: "subclass-druid-land",
    name: "Circle of the Land",
    parentId: "class-druid",
    parentName: "Druid",
    summary: "Terrain spell lists, Natural Recovery, and Land's Stride."
  },
  {
    id: "subclass-druid-moon",
    name: "Circle of the Moon",
    parentId: "class-druid",
    parentName: "Druid",
    summary: "Combat Wild Shape into stronger beasts and later elemental forms."
  },
  {
    id: "subclass-fighter-champion",
    name: "Champion",
    parentId: "class-fighter",
    parentName: "Fighter",
    summary: "Improved Critical and reliable athletic prowess."
  },
  {
    id: "subclass-fighter-battle-master",
    name: "Battle Master",
    parentId: "class-fighter",
    parentName: "Fighter",
    summary: "Maneuvers fueled by superiority dice for battlefield control."
  },
  {
    id: "subclass-fighter-eldritch-knight",
    name: "Eldritch Knight",
    parentId: "class-fighter",
    parentName: "Fighter",
    summary: "1/3 wizard spellcasting bonded to weapons."
  },
  {
    id: "subclass-monk-open-hand",
    name: "Way of the Open Hand",
    parentId: "class-monk",
    parentName: "Monk",
    summary: "Flurry control effects and Quivering Palm."
  },
  {
    id: "subclass-monk-shadow",
    name: "Way of Shadow",
    parentId: "class-monk",
    parentName: "Monk",
    summary: "Shadow arts teleportation and darkness magic."
  },
  {
    id: "subclass-monk-four-elements",
    name: "Way of the Four Elements",
    parentId: "class-monk",
    parentName: "Monk",
    summary: "Spend ki on elemental disciplines resembling spells."
  },
  {
    id: "subclass-paladin-devotion",
    name: "Oath of Devotion",
    parentId: "class-paladin",
    parentName: "Paladin",
    summary: "Sacred Weapon and Turn the Unholy — classic righteous knight."
  },
  {
    id: "subclass-paladin-ancients",
    name: "Oath of the Ancients",
    parentId: "class-paladin",
    parentName: "Paladin",
    summary: "Nature-bound oath with Nature's Wrath and Aura of Warding."
  },
  {
    id: "subclass-paladin-vengeance",
    name: "Oath of Vengeance",
    parentId: "class-paladin",
    parentName: "Paladin",
    summary: "Hunter of wrongdoers — Vow of Enmity and Relentless Avenger."
  },
  {
    id: "subclass-ranger-hunter",
    name: "Hunter",
    parentId: "class-ranger",
    parentName: "Ranger",
    summary: "Choose Colossus Slayer, Giant Killer, or Horde Breaker features."
  },
  {
    id: "subclass-ranger-beast-master",
    name: "Beast Master",
    parentId: "class-ranger",
    parentName: "Ranger",
    summary: "Bonded beast companion that fights beside you."
  },
  {
    id: "subclass-rogue-thief",
    name: "Thief",
    parentId: "class-rogue",
    parentName: "Rogue",
    summary: "Fast Hands and Second-Story Work for infiltration."
  },
  {
    id: "subclass-rogue-assassin",
    name: "Assassin",
    parentId: "class-rogue",
    parentName: "Rogue",
    summary: "Assassinate on surprised foes; disguise and poison tools."
  },
  {
    id: "subclass-rogue-arcane-trickster",
    name: "Arcane Trickster",
    parentId: "class-rogue",
    parentName: "Rogue",
    summary: "1/3 wizard spellcasting focused on enchantment and illusion."
  },
  {
    id: "subclass-sorcerer-draconic",
    name: "Draconic Bloodline",
    parentId: "class-sorcerer",
    parentName: "Sorcerer",
    summary: "Draconic resilience, Elemental Affinity, and dragon wings."
  },
  {
    id: "subclass-sorcerer-wild-magic",
    name: "Wild Magic",
    parentId: "class-sorcerer",
    parentName: "Sorcerer",
    summary: "Wild Magic Surge table and Tides of Chaos."
  },
  {
    id: "subclass-warlock-archfey",
    name: "The Archfey",
    parentId: "class-warlock",
    parentName: "Warlock",
    summary: "Fey patron — Fey Presence and misty escape options."
  },
  {
    id: "subclass-warlock-fiend",
    name: "The Fiend",
    parentId: "class-warlock",
    parentName: "Warlock",
    summary: "Fiendish patron — Dark One's Blessing temporary HP."
  },
  {
    id: "subclass-warlock-great-old-one",
    name: "The Great Old One",
    parentId: "class-warlock",
    parentName: "Warlock",
    summary: "Alien patron — telepathy and thought-warping features."
  },
  {
    id: "subclass-wizard-abjuration",
    name: "School of Abjuration",
    parentId: "class-wizard",
    parentName: "Wizard",
    summary: "Arcane Ward absorbs damage; abjuration specialists."
  },
  {
    id: "subclass-wizard-conjuration",
    name: "School of Conjuration",
    parentId: "class-wizard",
    parentName: "Wizard",
    summary: "Minor Conjuration and Benign Transposition."
  },
  {
    id: "subclass-wizard-divination",
    name: "School of Divination",
    parentId: "class-wizard",
    parentName: "Wizard",
    summary: "Portent dice rewrite rolls; third eye senses."
  },
  {
    id: "subclass-wizard-enchantment",
    name: "School of Enchantment",
    parentId: "class-wizard",
    parentName: "Wizard",
    summary: "Hypnotic Gaze and instinctive charm defenses."
  },
  {
    id: "subclass-wizard-evocation",
    name: "School of Evocation",
    parentId: "class-wizard",
    parentName: "Wizard",
    summary: "Sculpt Spells and empowered blast damage."
  },
  {
    id: "subclass-wizard-illusion",
    name: "School of Illusion",
    parentId: "class-wizard",
    parentName: "Wizard",
    summary: "Improved minor illusion and malleable illusions."
  },
  {
    id: "subclass-wizard-necromancy",
    name: "School of Necromancy",
    parentId: "class-wizard",
    parentName: "Wizard",
    summary: "Grim Harvest and undead thrall control."
  },
  {
    id: "subclass-wizard-transmutation",
    name: "School of Transmutation",
    parentId: "class-wizard",
    parentName: "Wizard",
    summary: "Transmuter's Stone and shapechanging mastery."
  },
  {
    id: "subclass-artificer-alchemist",
    name: "Alchemist",
    parentId: "class-artificer",
    parentName: "Artificer",
    summary: "Experimental elixirs and restorative/alchemical spells."
  },
  {
    id: "subclass-artificer-armorer",
    name: "Armorer",
    parentId: "class-artificer",
    parentName: "Artificer",
    summary: "Powered armor models (Guardian / Infiltrator)."
  },
  {
    id: "subclass-artificer-artillerist",
    name: "Artillerist",
    parentId: "class-artificer",
    parentName: "Artificer",
    summary: "Eldritch Cannon companion for battlefield firepower."
  },
  {
    id: "subclass-artificer-battle-smith",
    name: "Battle Smith",
    parentId: "class-artificer",
    parentName: "Artificer",
    summary: "Steel Defender companion and battle-ready infusions."
  }
];

const SUBSPECIES = [
  {
    id: "subspecies-dwarf-hill",
    name: "Hill Dwarf",
    parentId: "race-dwarf",
    parentName: "Dwarf",
    abilityScoreIncrease: "WIS +1 (plus Dwarf CON +2)",
    traits: "Dwarven Toughness — your hit point maximum increases by 1, and it increases by 1 every time you gain a level.",
    summary: "Hill dwarves favor wisdom and tough constitutions.",
    speed: "25 ft.",
    size: "Medium",
    senses: "Darkvision 60 ft.",
    languages: "Common, Dwarvish"
  },
  {
    id: "subspecies-dwarf-mountain",
    name: "Mountain Dwarf",
    parentId: "race-dwarf",
    parentName: "Dwarf",
    abilityScoreIncrease: "STR +2 (plus Dwarf CON +2)",
    traits: "Dwarven Armor Training — proficiency with light and medium armor.",
    summary: "Mountain dwarves are stronger and trained in armor from youth.",
    speed: "25 ft.",
    size: "Medium",
    senses: "Darkvision 60 ft.",
    languages: "Common, Dwarvish"
  },
  {
    id: "subspecies-elf-high",
    name: "High Elf",
    parentId: "race-elf",
    parentName: "Elf",
    abilityScoreIncrease: "INT +1 (plus Elf DEX +2)",
    traits:
      "Elf Weapon Training — longsword, shortsword, shortbow, longbow.\nCantrip — one wizard cantrip (INT).\nExtra Language — one extra language of your choice.",
    summary: "High elves blend martial tradition with arcane study.",
    speed: "30 ft.",
    size: "Medium",
    senses: "Darkvision 60 ft.",
    languages: "Common, Elvish + one of your choice"
  },
  {
    id: "subspecies-elf-wood",
    name: "Wood Elf",
    parentId: "race-elf",
    parentName: "Elf",
    abilityScoreIncrease: "WIS +1 (plus Elf DEX +2)",
    traits:
      "Elf Weapon Training — longsword, shortsword, shortbow, longbow.\nFleet of Foot — base walking speed 35 ft.\nMask of the Wild — hide when lightly obscured by natural phenomena.",
    summary: "Wood elves move swiftly and vanish into natural cover.",
    speed: "35 ft.",
    size: "Medium",
    senses: "Darkvision 60 ft.",
    languages: "Common, Elvish"
  },
  {
    id: "subspecies-elf-drow",
    name: "Drow (Dark Elf)",
    parentId: "race-elf",
    parentName: "Elf",
    abilityScoreIncrease: "CHA +1 (plus Elf DEX +2)",
    traits:
      "Superior Darkvision — 120 ft.\nSunlight Sensitivity — disadvantage on attacks and Perception (sight) in sunlight.\nDrow Magic — dancing lights; at 3rd faerie fire 1/long rest; at 5th darkness 1/long rest (CHA).\nDrow Weapon Training — rapiers, shortswords, hand crossbows.",
    summary: "Underdark elves with superior darkvision and innate magic.",
    speed: "30 ft.",
    size: "Medium",
    senses: "Darkvision 120 ft.",
    languages: "Common, Elvish"
  },
  {
    id: "subspecies-halfling-lightfoot",
    name: "Lightfoot Halfling",
    parentId: "race-halfling",
    parentName: "Halfling",
    abilityScoreIncrease: "CHA +1 (plus Halfling DEX +2)",
    traits: "Naturally Stealthy — you can attempt to hide behind a creature that is at least one size larger than you.",
    summary: "Lightfoots are especially stealthy and charismatic.",
    speed: "25 ft.",
    size: "Small",
    senses: "",
    languages: "Common, Halfling"
  },
  {
    id: "subspecies-halfling-stout",
    name: "Stout Halfling",
    parentId: "race-halfling",
    parentName: "Halfling",
    abilityScoreIncrease: "CON +1 (plus Halfling DEX +2)",
    traits:
      "Stout Resilience — advantage on saving throws against poison, and resistance to poison damage.",
    summary: "Stout halflings share some dwarven hardiness against poison.",
    speed: "25 ft.",
    size: "Small",
    senses: "",
    languages: "Common, Halfling"
  },
  {
    id: "subspecies-gnome-forest",
    name: "Forest Gnome",
    parentId: "race-gnome",
    parentName: "Gnome",
    abilityScoreIncrease: "DEX +1 (plus Gnome INT +2)",
    traits:
      "Natural Illusionist — minor illusion cantrip (INT).\nSpeak with Small Beasts — communicate simple ideas with Small or smaller beasts.",
    summary: "Forest gnomes lean into illusion and kinship with small beasts.",
    speed: "25 ft.",
    size: "Small",
    senses: "Darkvision 60 ft.",
    languages: "Common, Gnomish"
  },
  {
    id: "subspecies-gnome-rock",
    name: "Rock Gnome",
    parentId: "race-gnome",
    parentName: "Gnome",
    abilityScoreIncrease: "CON +1 (plus Gnome INT +2)",
    traits:
      "Artificer's Lore — double proficiency on History checks related to magic items, alchemical objects, or technological devices.\nTinker — spend 1 hour and 10 gp to create a Tiny clockwork device (Clockwork Toy, Fire Starter, or Music Box).",
    summary: "Rock gnomes invent tiny devices and excel with magical technology.",
    speed: "25 ft.",
    size: "Small",
    senses: "Darkvision 60 ft.",
    languages: "Common, Gnomish"
  }
];

const RACE_PARENT_UPDATES = {
  "race-dwarf": {
    entryKind: "species",
    abilityScoreIncrease: "CON +2 (see subspecies for additional ASI)",
    traits:
      "Darkvision 60 ft.\nDwarven Resilience — advantage on saves vs poison; resistance to poison damage.\nDwarven Combat Training — battleaxe, handaxe, light hammer, warhammer.\nTool Proficiency — smith, brewer, or mason tools.\nStonecunning — History checks related to stonework use double proficiency.",
    notes: "Choose a subspecies: Hill Dwarf or Mountain Dwarf.",
    subspeciesRefs: [
      "@race:subspecies-dwarf-hill|Hill Dwarf",
      "@race:subspecies-dwarf-mountain|Mountain Dwarf"
    ]
  },
  "race-elf": {
    entryKind: "species",
    abilityScoreIncrease: "DEX +2 (see subspecies for additional ASI)",
    traits: "Base elf traits via featureRefs. Subspecies add weapon training, magic, or speed options.",
    senses: "Darkvision 60 ft. (drow: 120 ft. — see subspecies)",
    notes: "Choose a subspecies: High Elf, Wood Elf, or Drow.",
    subspeciesRefs: [
      "@race:subspecies-elf-high|High Elf",
      "@race:subspecies-elf-wood|Wood Elf",
      "@race:subspecies-elf-drow|Drow (Dark Elf)"
    ]
  },
  "race-halfling": {
    entryKind: "species",
    abilityScoreIncrease: "DEX +2 (see subspecies for additional ASI)",
    traits:
      "Lucky — reroll natural 1s on attack rolls, ability checks, and saving throws (must use new roll).\nBrave — advantage on saves vs frightened.\nHalfling Nimbleness — move through the space of any creature larger than you.",
    notes: "Choose a subspecies: Lightfoot or Stout.",
    subspeciesRefs: [
      "@race:subspecies-halfling-lightfoot|Lightfoot Halfling",
      "@race:subspecies-halfling-stout|Stout Halfling"
    ]
  },
  "race-gnome": {
    entryKind: "species",
    abilityScoreIncrease: "INT +2 (see subspecies for additional ASI)",
    traits:
      "Darkvision 60 ft.\nGnome Cunning — advantage on INT/WIS/CHA saves vs magic.",
    notes: "Choose a subspecies: Forest Gnome or Rock Gnome.",
    subspeciesRefs: [
      "@race:subspecies-gnome-forest|Forest Gnome",
      "@race:subspecies-gnome-rock|Rock Gnome"
    ]
  },
  "race-human": { entryKind: "species", subspeciesRefs: [] },
  "race-dragonborn": { entryKind: "species", subspeciesRefs: [] },
  "race-half-elf": { entryKind: "species", subspeciesRefs: [] },
  "race-half-orc": { entryKind: "species", subspeciesRefs: [] },
  "race-tiefling": { entryKind: "species", subspeciesRefs: [] }
};

function subclassRefsFor(parentId) {
  return SUBCLASSES.filter((s) => s.parentId === parentId).map(
    (s) => `@class:${s.id}|${s.name}`
  );
}

function inferItemTaxonomy(data) {
  const mapped = ITEM_TAXONOMY[data.id];
  if (mapped) return mapped;
  const type = String(data.itemType || "").toLowerCase();
  const name = String(data.name || "").toLowerCase();
  const blob = `${type} ${name}`;
  const tags = ["Stormwreck Isle"];
  let category = "Other";
  if (/weapon|vapen|dagger|dolk|axe|yxa|sword|bow|crossbow/.test(blob)) category = "Weapon";
  else if (/armor|armour|shield|rustning|sköld/.test(blob)) category = "Armor & Shield";
  else if (/ammunition|arrow|bolt|pil/.test(blob)) category = "Ammunition";
  else if (/trap|fälla|hazard/.test(blob)) category = "Hazard & Trap";
  else if (/tool|kit|verktyg|instrument|tools/.test(blob)) category = "Tool & Kit";
  else if (/potion|dryck|consumable|förbruk|scroll|pergament|proviant|ration|rations|oil|flask|elixir|jerky|torkkött/.test(blob))
    category = "Consumable";
  else if (/herb|ört|ingredient|råmaterial|svamp|mushroom|material|obsidian|mineral/.test(blob))
    category = "Ingredient & Material";
  else if (/wondrous|magiskt föremål|boots|stövlar/.test(blob)) category = "Wondrous Item";
  else if (/gem|ädelsten|jewelry|smycke|treasure|treasure|guld|silver/.test(blob) && /bar|tacka|bracelet|örhänge|earring/.test(blob))
    category = "Treasure & Valuable";
  else if (/gem|ädelsten|jewelry|smycke|konstföremål|candlestick|ljusstake/.test(blob))
    category = "Treasure & Valuable";
  else if (/document|journal|loggbok|dokument|portrait|porträtt/.test(blob)) category = "Document & Lore";
  else if (/container|chest|backpack|ryggsäck|väska|waterskin|vattenskinn|behållare|kärl/.test(blob))
    category = "Container & Storage";
  else if (/trade|handelsvara|clove|krydda|wine|vin/.test(blob)) category = "Trade Good";
  else if (/trinket|kuriosa|whistle|vissel|braid|hårfläta/.test(blob)) category = "Trinket & Curio";
  else if (/hoard|shop inventory|collection/.test(blob)) category = "Collection & Hoard";
  else if (/gear|utrustning|key|rope|torch|bedroll|hammer|crowbar|piton|tinder|snare|fälla|shelter|skydd|camping|jakt/.test(blob))
    category = "Adventuring Gear";
  return { category, tags };
}

function migrateItems() {
  const dir = path.join(root, "data/catalogues/item");
  let updated = 0;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const filePath = path.join(dir, file);
    const data = readJson(filePath);
    const tax = inferItemTaxonomy(data);
    let changed = false;
    if (!data.category) {
      data.category = tax.category;
      changed = true;
    }
    if (!Array.isArray(data.tags) || data.tags.length === 0) {
      data.tags = [...tax.tags];
      changed = true;
    }
    if (changed) {
      data.updatedAt = now;
      writeJson(filePath, data);
      updated++;
    }
  }
  console.log(`Items updated: ${updated}`);
}

function migrateLocations() {
  const dir = path.join(root, "data/catalogues/location");
  let updated = 0;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const filePath = path.join(dir, file);
    const data = readJson(filePath);
    const tax = LOCATION_TAXONOMY[data.id];
    if (!tax) {
      console.warn("No taxonomy for location", data.id);
      continue;
    }
    let changed = false;
    if (!data.locationType) {
      data.locationType = tax.locationType;
      changed = true;
    }
    if (tax.parentLocationRef && !data.parentLocationRef) {
      data.parentLocationRef = tax.parentLocationRef;
      changed = true;
    }
    if (!Array.isArray(data.tags) || data.tags.length === 0) {
      data.tags = [...tax.tags];
      changed = true;
    }
    if (changed) {
      data.updatedAt = now;
      writeJson(filePath, data);
      updated++;
    }
  }
  console.log(`Locations updated: ${updated}`);
}

function migrateMonsters() {
  const dir = path.join(root, "data/catalogues/monster");
  let updated = 0;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const filePath = path.join(dir, file);
    const data = readJson(filePath);
    let changed = false;
    if (!data.source) {
      data.source = "Stormwreck Isle";
      changed = true;
    }
    if (!Array.isArray(data.tags)) {
      data.tags = [];
      changed = true;
    }
    if (changed) {
      data.updatedAt = now;
      writeJson(filePath, data);
      updated++;
    }
  }
  console.log(`Monsters updated: ${updated}`);
}

function migrateClassesAndSubclasses() {
  const dir = path.join(root, "data/catalogues/class");
  ensureDir(dir);

  for (const sc of SUBCLASSES) {
    const filePath = path.join(dir, `${sc.id}.json`);
    const entry = {
      id: sc.id,
      name: sc.name,
      entryKind: "subclass",
      parentClassRef: `@class:${sc.parentId}|${sc.parentName}`,
      source: sc.parentId === "class-artificer" ? "Tasha's Cauldron of Everything" : "Core rules",
      summary: sc.summary,
      featureRefs: [],
      features: "",
      spellcasting: "",
      notes: "",
      updatedAt: now
    };
    writeJson(filePath, entry);
  }

  let updated = 0;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f.startsWith("class-"))) {
    const filePath = path.join(dir, file);
    const data = readJson(filePath);
    if (data.entryKind === "subclass") continue;
    data.entryKind = "class";
    data.subclassRefs = subclassRefsFor(data.id);
    delete data.subclasses;
    data.updatedAt = now;
    writeJson(filePath, data);
    updated++;
  }
  console.log(`Base classes updated: ${updated}; subclasses written: ${SUBCLASSES.length}`);
}

function migrateRacesAndSubspecies() {
  const dir = path.join(root, "data/catalogues/race");
  ensureDir(dir);

  for (const ss of SUBSPECIES) {
    const filePath = path.join(dir, `${ss.id}.json`);
    writeJson(filePath, {
      id: ss.id,
      name: ss.name,
      entryKind: "subspecies",
      parentSpeciesRef: `@race:${ss.parentId}|${ss.parentName}`,
      size: ss.size,
      speed: ss.speed,
      source: "Core rules",
      summary: ss.summary,
      abilityScoreIncrease: ss.abilityScoreIncrease,
      featureRefs: [],
      traits: ss.traits,
      languages: ss.languages,
      senses: ss.senses,
      notes: "",
      updatedAt: now
    });
  }

  let updated = 0;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f.startsWith("race-"))) {
    const filePath = path.join(dir, file);
    const data = readJson(filePath);
    const patch = RACE_PARENT_UPDATES[data.id];
    if (!patch) {
      data.entryKind = data.entryKind || "species";
      if (!Array.isArray(data.subspeciesRefs)) data.subspeciesRefs = [];
    } else {
      Object.assign(data, patch);
    }
    data.updatedAt = now;
    writeJson(filePath, data);
    updated++;
  }
  console.log(`Races updated: ${updated}; subspecies written: ${SUBSPECIES.length}`);
}

function jsString(value) {
  return JSON.stringify(value);
}

function writeCoreRulesSeed() {
  const raceSeedPath = path.join(root, "data/catalogues/race");
  const classSeedPath = path.join(root, "data/catalogues/class");

  const raceIds = [
    "race-dwarf",
    "race-elf",
    "race-halfling",
    "race-human",
    "race-dragonborn",
    "race-gnome",
    "race-half-elf",
    "race-half-orc",
    "race-tiefling",
    ...SUBSPECIES.map((s) => s.id)
  ];

  const classIds = [
    "class-barbarian",
    "class-bard",
    "class-cleric",
    "class-druid",
    "class-fighter",
    "class-monk",
    "class-paladin",
    "class-ranger",
    "class-rogue",
    "class-sorcerer",
    "class-warlock",
    "class-wizard",
    ...SUBCLASSES.filter((s) => s.parentId !== "class-artificer").map((s) => s.id)
  ];

  function loadEntries(dir, ids) {
    return ids.map((id) => {
      const data = readJson(path.join(dir, `${id}.json`));
      const clone = { ...data };
      delete clone.updatedAt;
      delete clone.portrait;
      return clone;
    });
  }

  const races = loadEntries(raceSeedPath, raceIds);
  const classes = loadEntries(classSeedPath, classIds);

  // Preserve elf featureRefs from original seed shape if present on disk
  const header = `/**
 * Core race & class catalogue seeds (5e-style reference starters).
 * Merged into localStorage on first open (missing IDs only).
 * Campaign-agnostic — safe to load alongside Stormwreck seeds.
 *
 * Taxonomy: species/subspecies (@race:), class/subclass (@class:).
 */
window.CatalogueSeeds = window.CatalogueSeeds || {};

`;

  function emitArray(name, entries) {
    const body = entries
      .map((entry) => "  " + JSON.stringify(entry, null, 2).replace(/\n/g, "\n  "))
      .join(",\n");
    return `window.CatalogueSeeds.${name} = [\n${body}\n];\n`;
  }

  const out =
    header +
    emitArray("race", races) +
    "\n" +
    emitArray("class", classes);

  fs.writeFileSync(path.join(root, "js/catalogue-seeds/core-rules.js"), out, "utf8");
  console.log(`core-rules.js written (${races.length} race, ${classes.length} class entries)`);
}

function patchStormwreckSeeds() {
  const filePath = path.join(root, "js/catalogue-seeds/stormwreck-isle.js");
  let src = fs.readFileSync(filePath, "utf8");

  function findObjectEnd(fromIdx) {
    // Match closing of a seed object: `    },` or final `    }` before `  ]`
    const slice = src.slice(fromIdx);
    const withComma = slice.search(/\n    \},/);
    const finalObj = slice.search(/\n    \}\n  \]/);
    if (withComma < 0) return finalObj;
    if (finalObj < 0) return withComma;
    return Math.min(withComma, finalObj);
  }

  function injectFields(id, fields) {
    const idToken = `id: "${id}"`;
    const idx = src.indexOf(idToken);
    if (idx < 0) {
      console.warn("Seed entry not found:", id);
      return;
    }
    const endMatch = findObjectEnd(idx);
    if (endMatch < 0) {
      console.warn("Could not find object end for", id);
      return;
    }
    let block = src.slice(idx, idx + endMatch);
    for (const [key, value] of Object.entries(fields)) {
      const keyRe = new RegExp(`\\b${key}\\s*:`);
      if (keyRe.test(block)) continue;
      const anchor =
        block.match(/\n(\s*itemType:\s*[^\n]+,)/) ||
        block.match(/\n(\s*creatureType:\s*[^\n]+,)/) ||
        block.match(/\n(\s*mapImage:\s*[^\n]+,)/) ||
        block.match(/\n(\s*name:\s*[^\n]+,)/);
      const insert = `\n      ${key}: ${jsString(value)},`;
      if (anchor) {
        block = block.replace(anchor[0], anchor[0] + insert);
      } else {
        block += insert;
      }
    }
    src = src.slice(0, idx) + block + src.slice(idx + endMatch);
  }

  for (const [id, tax] of Object.entries(ITEM_TAXONOMY)) {
    if (!src.includes(`id: "${id}"`)) continue;
    injectFields(id, { category: tax.category, tags: tax.tags });
  }

  for (const [id, tax] of Object.entries(LOCATION_TAXONOMY)) {
    if (!src.includes(`id: "${id}"`)) continue;
    injectFields(id, {
      locationType: tax.locationType,
      parentLocationRef: tax.parentLocationRef,
      tags: tax.tags
    });
  }

  const monsterIds = [
    "sw-sparkrender",
    "sw-zombie",
    "sw-stirge",
    "sw-merrow",
    "sw-ghoul",
    "sw-myconid",
    "sw-spore-servant-octopus",
    "sw-violet-fungus"
  ];
  for (const id of monsterIds) {
    injectFields(id, { source: "Stormwreck Isle", tags: [] });
  }

  fs.writeFileSync(filePath, src, "utf8");
  console.log("stormwreck-isle.js patched");
}

function optionalSpellClassRefs() {
  const dir = path.join(root, "data/catalogues/spell");
  if (!fs.existsSync(dir)) return;
  let updated = 0;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const filePath = path.join(dir, file);
    const data = readJson(filePath);
    if (!Array.isArray(data.classRefs)) {
      data.classRefs = [];
      data.updatedAt = now;
      writeJson(filePath, data);
      updated++;
    }
  }
  console.log(`Spell JSON classRefs filled: ${updated}`);
}

function runMigration() {
  migrateItems();
  migrateLocations();
  migrateMonsters();
  migrateClassesAndSubclasses();
  migrateRacesAndSubspecies();
  writeCoreRulesSeed();
  patchStormwreckSeeds();
  optionalSpellClassRefs();
  console.log("Migration complete.");
}

if (require.main === module) {
  runMigration();
}

module.exports = { migrateItems, inferItemTaxonomy, ITEM_TAXONOMY };