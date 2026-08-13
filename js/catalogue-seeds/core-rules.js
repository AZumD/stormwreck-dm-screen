/**
 * Core race & class catalogue seeds (5e-style reference starters).
 * Merged into localStorage on first open (missing IDs only).
 * Campaign-agnostic — safe to load alongside Stormwreck seeds.
 */
window.CatalogueSeeds = window.CatalogueSeeds || {};

window.CatalogueSeeds.race = [
  {
    id: "race-dwarf",
    name: "Dwarf",
    size: "Medium",
    speed: "25 ft.",
    source: "Core rules",
    summary: "Stout folk of stone and forge — hardy, traditional, and hard to poison.",
    abilityScoreIncrease: "CON +2 (hill: WIS +1; mountain: STR +2 — pick subrace)",
    traits:
      "Darkvision 60 ft.\nDwarven Resilience — advantage on saves vs poison; resistance to poison damage.\nDwarven Combat Training — battleaxe, handaxe, light hammer, warhammer.\nTool Proficiency — smith, brewer, or mason tools.\nStonecunning — History checks related to stonework use double proficiency.\nHill: Dwarven Toughness (+1 HP per level).\nMountain: Medium armor proficiency.",
    languages: "Common, Dwarvish",
    senses: "Darkvision 60 ft.",
    notes: "Subraces commonly used: hill dwarf, mountain dwarf."
  },
  {
    id: "race-elf",
    name: "Elf",
    size: "Medium",
    speed: "30 ft.",
    source: "Core rules",
    summary: "Graceful folk of keen senses and long lives — trance instead of sleep.",
    abilityScoreIncrease: "DEX +2 (high: INT +1; wood: WIS +1; drow: CHA +1 — pick subrace)",
    featureRefs: [
      "@feature:darkvision|Darkvision",
      "@feature:keen-senses|Keen Senses",
      "@feature:fey-ancestry|Fey Ancestry",
      "@feature:trance|Trance"
    ],
    traits:
      "Subrace extras:\nHigh: cantrip, Extra Language, Elf Weapon Training.\nWood: Fleet of Foot (35 ft.), Mask of the Wild, Elf Weapon Training.\nDrow: Superior Darkvision 120 ft., Sunlight Sensitivity, Drow Magic, Drow Weapon Training.",
    languages: "Common, Elvish",
    senses: "Darkvision 60 ft. (drow 120 ft.)",
    notes: "Subraces commonly used: high elf, wood elf, drow."
  },
  {
    id: "race-halfling",
    name: "Halfling",
    size: "Small",
    speed: "25 ft.",
    source: "Core rules",
    summary: "Small, lucky wanderers — brave when it counts, hard to pin down.",
    abilityScoreIncrease: "DEX +2 (lightfoot: CHA +1; stout: CON +1)",
    traits:
      "Lucky — reroll natural 1s on attack rolls, ability checks, and saving throws (must use new roll).\nBrave — advantage on saves vs frightened.\nHalfling Nimbleness — move through the space of any creature larger than you.\nLightfoot: Naturally Stealthy (hide behind a creature one size larger).\nStout: Stout Resilience (poison advantage + resistance).",
    languages: "Common, Halfling",
    senses: "",
    notes: "Subraces commonly used: lightfoot, stout."
  },
  {
    id: "race-human",
    name: "Human",
    size: "Medium",
    speed: "30 ft.",
    source: "Core rules",
    summary: "Versatile and ambitious — the most adaptable of the common folk.",
    abilityScoreIncrease: "All abilities +1 (variant: two +1s, one skill, one feat)",
    traits:
      "Standard: +1 to each ability score; one extra language.\nVariant (if allowed): +1 to two abilities, proficiency in one skill, one feat.",
    languages: "Common + one of your choice",
    senses: "",
    notes: "Ask whether the table uses standard or variant humans."
  },
  {
    id: "race-dragonborn",
    name: "Dragonborn",
    size: "Medium",
    speed: "30 ft.",
    source: "Core rules",
    summary: "Draconic humanoids with breath weapons and elemental resistance.",
    abilityScoreIncrease: "STR +2, CHA +1",
    traits:
      "Draconic Ancestry — choose a dragon type (damage type for breath & resistance).\nBreath Weapon — action; 15-ft cone or 30-ft line (by ancestry); DEX save; 2d6 then scales with level; 1/rest.\nDamage Resistance — matching ancestry damage type.",
    languages: "Common, Draconic",
    senses: "",
    notes: "Ancestry table: acid, lightning, fire, poison, or cold depending on color."
  },
  {
    id: "race-gnome",
    name: "Gnome",
    size: "Small",
    speed: "25 ft.",
    source: "Core rules",
    summary: "Small inventors and illusionists — curious, clever, and hard to charm.",
    abilityScoreIncrease: "INT +2 (forest: DEX +1; rock: CON +1)",
    traits:
      "Darkvision 60 ft.\nGnome Cunning — advantage on INT/WIS/CHA saves vs magic.\nForest: Natural Illusionist (minor illusion), Speak with Small Beasts.\nRock: Artificer's Lore, Tinker (tiny clockwork devices).",
    languages: "Common, Gnomish",
    senses: "Darkvision 60 ft.",
    notes: "Subraces commonly used: forest gnome, rock gnome."
  },
  {
    id: "race-half-elf",
    name: "Half-Elf",
    size: "Medium",
    speed: "30 ft.",
    source: "Core rules",
    summary: "Caught between two worlds — charismatic and adaptable.",
    abilityScoreIncrease: "CHA +2; two other abilities +1 each",
    traits:
      "Darkvision 60 ft.\nFey Ancestry — advantage vs charmed; magic can't put you to sleep.\nSkill Versatility — proficiency in two skills of your choice.",
    languages: "Common, Elvish + one of your choice",
    senses: "Darkvision 60 ft.",
    notes: ""
  },
  {
    id: "race-half-orc",
    name: "Half-Orc",
    size: "Medium",
    speed: "30 ft.",
    source: "Core rules",
    summary: "Fierce survivors marked by orcish endurance and relentless grit.",
    abilityScoreIncrease: "STR +2, CON +1",
    traits:
      "Darkvision 60 ft.\nMenacing — Intimidation proficiency.\nRelentless Endurance — once per long rest, drop to 1 HP instead of 0.\nSavage Attacks — extra damage die on critical melee weapon hits.",
    languages: "Common, Orc",
    senses: "Darkvision 60 ft.",
    notes: ""
  },
  {
    id: "race-tiefling",
    name: "Tiefling",
    size: "Medium",
    speed: "30 ft.",
    source: "Core rules",
    summary: "Infernal heritage shows in horns, tails, and innate fire magic.",
    abilityScoreIncrease: "CHA +2, INT +1",
    traits:
      "Darkvision 60 ft.\nHellish Resistance — fire resistance.\nInfernal Legacy — thaumaturgy; at 3rd hellish rebuke (1/long rest); at 5th darkness (1/long rest); CHA spellcasting.",
    languages: "Common, Infernal",
    senses: "Darkvision 60 ft.",
    notes: ""
  }
];

window.CatalogueSeeds.class = [
  {
    id: "class-barbarian",
    name: "Barbarian",
    hitDie: "d12",
    primaryAbility: "Strength",
    source: "Core rules",
    summary: "Primal warriors who channel rage into devastating melee power.",
    savingThrows: "Strength, Constitution",
    armorProficiencies: "Light armor, medium armor, shields",
    weaponProficiencies: "Simple weapons, martial weapons",
    toolProficiencies: "",
    skillChoices: "Choose 2 from Animal Handling, Athletics, Intimidation, Nature, Perception, Survival",
    features:
      "1 — Rage, Unarmored Defense\n2 — Reckless Attack, Danger Sense\n3 — Primal Path\n5 — Extra Attack, Fast Movement\n7 — Feral Instinct\n9 — Brutal Critical\n11 — Relentless Rage\n13+ — path features & Brutal Critical improvements",
    spellcasting: "",
    subclasses: ["Path of the Berserker", "Path of the Totem Warrior"],
    notes: "Best when unarmored or lightly armored; rage resists bludgeoning/piercing/slashing while active."
  },
  {
    id: "class-bard",
    name: "Bard",
    hitDie: "d8",
    primaryAbility: "Charisma",
    source: "Core rules",
    summary: "Magical entertainers who inspire allies and weave spells through performance.",
    savingThrows: "Dexterity, Charisma",
    armorProficiencies: "Light armor",
    weaponProficiencies: "Simple weapons, hand crossbows, longswords, rapiers, shortswords",
    toolProficiencies: "Three musical instruments",
    skillChoices: "Choose any 3 skills",
    features:
      "1 — Spellcasting, Bardic Inspiration (d6)\n2 — Jack of All Trades, Song of Rest\n3 — Bard College, Expertise\n5 — Font of Inspiration\n6 — Countercharm / college feature\n10 — Magical Secrets\n20 — Superior Inspiration",
    spellcasting: "Full caster (CHA). Ritual casting. Magical Secrets at 10/14/18.",
    subclasses: ["College of Lore", "College of Valor"],
    notes: ""
  },
  {
    id: "class-cleric",
    name: "Cleric",
    hitDie: "d8",
    primaryAbility: "Wisdom",
    source: "Core rules",
    summary: "Divine agents who heal, protect, and channel their deity's domain power.",
    savingThrows: "Wisdom, Charisma",
    armorProficiencies: "Light armor, medium armor, shields",
    weaponProficiencies: "Simple weapons",
    toolProficiencies: "",
    skillChoices: "Choose 2 from History, Insight, Medicine, Persuasion, Religion",
    features:
      "1 — Spellcasting, Divine Domain\n2 — Channel Divinity (1/rest), Domain feature\n5 — Destroy Undead (CR 1/2)\n6 — Domain feature / Channel Divinity (2)\n8 — Domain feature / Destroy Undead improvement\n10 — Divine Intervention\n17+ — Domain & Destroy Undead scaling",
    spellcasting: "Full caster (WIS). Prepare from full cleric list each day. Domain spells always prepared.",
    subclasses: ["Life Domain", "Light Domain", "Nature Domain", "Tempest Domain", "Trickery Domain", "War Domain", "Knowledge Domain"],
    notes: "Domain choice drives armor/weapon extras and Channel Divinity options."
  },
  {
    id: "class-druid",
    name: "Druid",
    hitDie: "d8",
    primaryAbility: "Wisdom",
    source: "Core rules",
    summary: "Wardens of nature who shapeshift and call on primal magic.",
    savingThrows: "Intelligence, Wisdom",
    armorProficiencies: "Light armor, medium armor, shields (nonmetal)",
    weaponProficiencies: "Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears",
    toolProficiencies: "Herbalism kit",
    skillChoices: "Choose 2 from the listed skill options",
    skillRefs: [
      "@skill:arcana|Arcana",
      "@skill:animal-handling|Animal Handling",
      "@skill:insight|Insight",
      "@skill:medicine|Medicine",
      "@skill:nature|Nature",
      "@skill:perception|Perception",
      "@skill:religion|Religion",
      "@skill:survival|Survival"
    ],
    featureRefs: [
      "@feature:druidic|Druidic",
      "@feature:spellcasting-druid|Spellcasting (Druid)",
      "@feature:wild-shape|Wild Shape"
    ],
    features:
      "1 — @feature:druidic|Druidic, @feature:spellcasting-druid|Spellcasting (Druid)\n2 — @feature:wild-shape|Wild Shape, Druid Circle\n4 — Wild Shape improvement\n6+ — circle features\n18 — Timeless Body, Beast Spells\n20 — Archdruid",
    spellcasting: "Full caster (WIS). Prepare from full druid list. Ritual casting. No metal armor/shields by tradition.",
    subclasses: ["Circle of the Land", "Circle of the Moon"],
    notes: "Wild Shape CR and swim/fly forms unlock by level / circle."
  },
  {
    id: "class-fighter",
    name: "Fighter",
    hitDie: "d10",
    primaryAbility: "Strength or Dexterity",
    source: "Core rules",
    summary: "Masters of arms and armor — reliable damage and battlefield control.",
    savingThrows: "Strength, Constitution",
    armorProficiencies: "All armor, shields",
    weaponProficiencies: "Simple weapons, martial weapons",
    toolProficiencies: "",
    skillChoices: "Choose 2 from the listed skill options",
    skillRefs: [
      "@skill:acrobatics|Acrobatics",
      "@skill:animal-handling|Animal Handling",
      "@skill:athletics|Athletics",
      "@skill:history|History",
      "@skill:insight|Insight",
      "@skill:intimidation|Intimidation",
      "@skill:perception|Perception",
      "@skill:survival|Survival"
    ],
    featureRefs: ["@feature:second-wind|Second Wind", "@feature:action-surge|Action Surge"],
    features:
      "1 — Fighting Style, @feature:second-wind|Second Wind\n2 — @feature:action-surge|Action Surge (1)\n3 — Martial Archetype\n5 — Extra Attack\n9 — Indomitable\n11 — Extra Attack (2)\n13+ — Indomitable & archetype improvements\n20 — Extra Attack (3)",
    spellcasting: "Eldritch Knight only (INT, 1/3 caster).",
    subclasses: ["Champion", "Battle Master", "Eldritch Knight"],
    notes: ""
  },
  {
    id: "class-monk",
    name: "Monk",
    hitDie: "d8",
    primaryAbility: "Dexterity & Wisdom",
    source: "Core rules",
    summary: "Martial artists who turn ki into speed, strikes, and supernatural movement.",
    savingThrows: "Strength, Dexterity",
    armorProficiencies: "None",
    weaponProficiencies: "Simple weapons, shortswords",
    toolProficiencies: "One artisan tool or musical instrument",
    skillChoices: "Choose 2 from Acrobatics, Athletics, History, Insight, Religion, Stealth",
    features:
      "1 — Unarmored Defense, Martial Arts\n2 — Ki, Unarmored Movement\n3 — Monastic Tradition, Deflect Missiles\n5 — Extra Attack, Stunning Strike\n6 — Ki-Empowered Strikes / tradition\n7 — Evasion, Stillness of Mind\n10 — Purity of Body\n13 — Tongue of the Sun and Moon\n14 — Diamond Soul\n18 — Empty Body\n20 — Perfect Self",
    spellcasting: "Way of the Four Elements only (limited elemental disciplines).",
    subclasses: ["Way of the Open Hand", "Way of Shadow", "Way of the Four Elements"],
    notes: "Martial Arts die and Unarmored Movement scale with level."
  },
  {
    id: "class-paladin",
    name: "Paladin",
    hitDie: "d10",
    primaryAbility: "Strength & Charisma",
    source: "Core rules",
    summary: "Oath-bound warriors who smite foes and heal with divine power.",
    savingThrows: "Wisdom, Charisma",
    armorProficiencies: "All armor, shields",
    weaponProficiencies: "Simple weapons, martial weapons",
    toolProficiencies: "",
    skillChoices: "Choose 2 from Athletics, Insight, Intimidation, Medicine, Persuasion, Religion",
    featureRefs: ["@feature:divine-smite|Divine Smite"],
    features:
      "1 — Divine Sense, Lay on Hands\n2 — Fighting Style, Spellcasting, @feature:divine-smite|Divine Smite\n3 — Divine Health, Sacred Oath\n5 — Extra Attack\n6 — Aura of Protection\n10 — Aura of Courage\n11 — Improved Divine Smite\n14 — Cleansing Touch\nOath features at 3/7/15/20",
    spellcasting: "Half caster (CHA). Prepare from paladin list. Oath spells always prepared.",
    subclasses: ["Oath of Devotion", "Oath of the Ancients", "Oath of Vengeance"],
    notes: "Divine Smite spends spell slots for radiant damage on hit."
  },
  {
    id: "class-ranger",
    name: "Ranger",
    hitDie: "d10",
    primaryAbility: "Dexterity & Wisdom",
    source: "Core rules",
    summary: "Wilderness hunters who track prey and fight with steel or spells.",
    savingThrows: "Strength, Dexterity",
    armorProficiencies: "Light armor, medium armor, shields",
    weaponProficiencies: "Simple weapons, martial weapons",
    toolProficiencies: "",
    skillChoices: "Choose 3 from Animal Handling, Athletics, Insight, Investigation, Nature, Perception, Stealth, Survival",
    features:
      "1 — Favored Enemy, Natural Explorer\n2 — Fighting Style, Spellcasting\n3 — Ranger Archetype, Primeval Awareness\n5 — Extra Attack\n8 — Land's Stride\n10 — Hide in Plain Sight\n14 — Vanish\n18 — Feral Senses\n20 — Foe Slayer",
    spellcasting: "Half caster (WIS). Known spells (not prepared).",
    subclasses: ["Hunter", "Beast Master"],
    notes: "Optional class features / revised ranger exist at many tables — ask the DM."
  },
  {
    id: "class-rogue",
    name: "Rogue",
    hitDie: "d8",
    primaryAbility: "Dexterity",
    source: "Core rules",
    summary: "Skilled infiltrators who strike from advantage and excel at expertise.",
    savingThrows: "Dexterity, Intelligence",
    armorProficiencies: "Light armor",
    weaponProficiencies: "Simple weapons, hand crossbows, longswords, rapiers, shortswords",
    toolProficiencies: "Thieves' tools",
    skillChoices: "Choose 4 from Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Performance, Persuasion, Sleight of Hand, Stealth",
    featureRefs: ["@feature:sneak-attack|Sneak Attack"],
    features:
      "1 — Expertise, @feature:sneak-attack|Sneak Attack, Thieves' Cant\n2 — Cunning Action\n3 — Roguish Archetype\n5 — Uncanny Dodge\n6 — Expertise\n7 — Evasion\n11 — Reliable Talent\n14 — Blindsense\n15 — Slippery Mind\n18 — Elusive\n20 — Stroke of Luck",
    spellcasting: "Arcane Trickster only (INT, 1/3 caster).",
    subclasses: ["Thief", "Assassin", "Arcane Trickster"],
    notes: "Sneak Attack dice scale with level; need finesse/ranged + advantage or ally within 5 ft."
  },
  {
    id: "class-sorcerer",
    name: "Sorcerer",
    hitDie: "d6",
    primaryAbility: "Charisma",
    source: "Core rules",
    summary: "Innate spellcasters who twist magic with metamagic and sorcerous origin.",
    savingThrows: "Constitution, Charisma",
    armorProficiencies: "None",
    weaponProficiencies: "Daggers, darts, slings, quarterstaffs, light crossbows",
    toolProficiencies: "",
    skillChoices: "Choose 2 from Arcana, Deception, Insight, Intimidation, Persuasion, Religion",
    features:
      "1 — Spellcasting, Sorcerous Origin\n2 — Font of Magic (sorcery points)\n3 — Metamagic\n6+ — origin features\n20 — Sorcerous Restoration",
    spellcasting: "Full caster (CHA). Known spells. Sorcery points fuel metamagic and slot conversion.",
    subclasses: ["Draconic Bloodline", "Wild Magic"],
    notes: ""
  },
  {
    id: "class-warlock",
    name: "Warlock",
    hitDie: "d8",
    primaryAbility: "Charisma",
    source: "Core rules",
    summary: "Pact-bound casters with few slots that refresh on a short rest — plus invocations.",
    savingThrows: "Wisdom, Charisma",
    armorProficiencies: "Light armor",
    weaponProficiencies: "Simple weapons",
    toolProficiencies: "",
    skillChoices: "Choose 2 from Arcana, Deception, History, Intimidation, Investigation, Nature, Religion",
    features:
      "1 — Otherworldly Patron, Pact Magic\n2 — Eldritch Invocations\n3 — Pact Boon\n6+ — patron features\n11 — Mystic Arcanum (6th)\n17 — Mystic Arcanum (9th)\n20 — Eldritch Master",
    spellcasting: "Pact Magic (CHA). Few slots, all at same level, recover on short rest. Invocations expand options.",
    subclasses: ["The Archfey", "The Fiend", "The Great Old One"],
    notes: "Pact Boons: Chain, Blade, or Tome."
  },
  {
    id: "class-wizard",
    name: "Wizard",
    hitDie: "d6",
    primaryAbility: "Intelligence",
    source: "Core rules",
    summary: "Scholarly casters who prepare from a spellbook and specialize by arcane tradition.",
    savingThrows: "Intelligence, Wisdom",
    armorProficiencies: "None",
    weaponProficiencies: "Daggers, darts, slings, quarterstaffs, light crossbows",
    toolProficiencies: "",
    skillChoices: "Choose 2 from Arcana, History, Insight, Investigation, Medicine, Religion",
    features:
      "1 — Spellcasting, Arcane Recovery\n2 — Arcane Tradition\n6+ — tradition features\n18 — Spell Mastery\n20 — Signature Spells",
    spellcasting: "Full caster (INT). Spellbook; prepare INT mod + wizard level spells each day. Ritual casting from book.",
    subclasses: [
      "School of Abjuration",
      "School of Conjuration",
      "School of Divination",
      "School of Enchantment",
      "School of Evocation",
      "School of Illusion",
      "School of Necromancy",
      "School of Transmutation"
    ],
    notes: "Copying spells into the book costs time and gold; Arcane Recovery restores slots on a short rest (1/day)."
  }
];
