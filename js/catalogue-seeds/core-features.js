/**
 * Core feature catalogue seeds — reusable abilities (class, species, etc.).
 * Referenced by race/class entries via featureRefs and @feature: links.
 */
window.CatalogueSeeds = window.CatalogueSeeds || {};

window.CatalogueSeeds.feature = [
  {
    id: "feature-undead-fortitude",
    linkId: "undead-fortitude",
    name: "Undead Fortitude",
    featureType: "Monster trait",
    grantedBy: "",
    levelPrerequisite: "",
    source: "Monster Manual / Basic Rules",
    page: "",
    summary: "If reduced to 0 HP by non-radiant, non-crit damage, DC CON save to drop to 1 HP instead.",
    description:
      "If damage reduces the creature to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the creature drops to 1 hit point instead.",
    usesRecharge: "Passive (on dropping to 0 HP)",
    notes: "Common on zombies.",
    tags: ["monster", "undead", "rule"]
  },
  {
    id: "feature-slam",
    linkId: "slam",
    name: "Slam",
    featureType: "Monster action",
    grantedBy: "",
    levelPrerequisite: "",
    source: "Monster Manual / Basic Rules",
    page: "",
    summary: "Melee bludgeoning attack with the creature's slam.",
    description:
      "Melee Weapon Attack: proficiency + Strength to hit, reach 5 ft., one target.\nHit: bludgeoning damage based on the creature's stat block (often 1d6 + Strength modifier for Medium undead).",
    usesRecharge: "At will",
    notes: "Creature-specific attack bonus and damage live on the monster entry.",
    tags: ["monster", "action", "melee"]
  },
  {
    id: "feature-darkvision",
    linkId: "darkvision",
    name: "Darkvision",
    featureType: "Species feature",
    grantedBy: "",
    levelPrerequisite: "",
    source: "Player's Handbook",
    page: "",
    summary: "See in dim light as if bright; darkness as dim (usually 60 ft.).",
    description:
      "You can see in dim light within a stated range (commonly 60 feet) as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.",
    usesRecharge: "Passive",
    notes: "Exact range varies by ancestry (e.g. drow often 120 ft.).",
    tags: ["senses", "species"]
  },
  {
    id: "feature-fey-ancestry",
    linkId: "fey-ancestry",
    name: "Fey Ancestry",
    featureType: "Species feature",
    grantedBy: "@race:elf|Elf",
    levelPrerequisite: "",
    source: "Player's Handbook",
    page: "",
    summary: "Advantage vs being charmed; magic can't put you to sleep.",
    description:
      "You have advantage on saving throws against being charmed, and magic can't put you to sleep.",
    usesRecharge: "Passive",
    notes: "",
    tags: ["species", "elf"]
  },
  {
    id: "feature-keen-senses",
    linkId: "keen-senses",
    name: "Keen Senses",
    featureType: "Species feature",
    grantedBy: "@race:elf|Elf",
    levelPrerequisite: "",
    source: "Player's Handbook",
    page: "",
    summary: "Proficiency in the Perception skill.",
    description: "You have proficiency in the Perception skill.",
    usesRecharge: "Passive",
    notes: "",
    tags: ["species", "elf", "skill"]
  },
  {
    id: "feature-trance",
    linkId: "trance",
    name: "Trance",
    featureType: "Species feature",
    grantedBy: "@race:elf|Elf",
    levelPrerequisite: "",
    source: "Player's Handbook",
    page: "",
    summary: "Meditative rest instead of sleep (typically 4 hours).",
    description:
      "Elves don't need to sleep. Instead, they meditate deeply, remaining semiconscious, for a stated duration (commonly 4 hours a day). After resting in this way, you gain the same benefit that a human does from 8 hours of sleep.",
    usesRecharge: "Daily rest",
    notes: "",
    tags: ["species", "elf"]
  },
  {
    id: "feature-druidic",
    linkId: "druidic",
    name: "Druidic",
    featureType: "Class feature",
    grantedBy: "@class:druid|Druid",
    levelPrerequisite: "1",
    source: "Player's Handbook",
    page: "",
    summary: "Secret language of druids; leave hidden messages.",
    description:
      "You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages. You and others who know this language automatically spot such a message. Others spot the message's presence with a successful Wisdom (Perception) check but can't decipher it without magic.",
    usesRecharge: "Passive",
    notes: "",
    tags: ["class", "druid", "language"]
  },
  {
    id: "feature-spellcasting-druid",
    linkId: "spellcasting-druid",
    name: "Spellcasting (Druid)",
    featureType: "Class feature",
    grantedBy: "@class:druid|Druid",
    levelPrerequisite: "1",
    source: "Player's Handbook",
    page: "",
    summary: "Full Wisdom caster; prepare from the druid list; ritual casting.",
    description:
      "As a druid, you are a full spellcaster using Wisdom. You prepare spells from the full druid list, can cast rituals, and follow the class spell slot progression. Nonmetal armor/shields are a traditional restriction.",
    usesRecharge: "Spell slots / long rest",
    notes: "See class spellcasting notes for circle-specific details.",
    tags: ["class", "druid", "spellcasting"]
  },
  {
    id: "feature-wild-shape",
    linkId: "wild-shape",
    name: "Wild Shape",
    featureType: "Class feature",
    grantedBy: "@class:druid|Druid",
    levelPrerequisite: "2",
    source: "Player's Handbook",
    page: "",
    summary: "Magically assume the shape of a beast you have seen.",
    description:
      "Starting at 2nd level, you can use your action to magically assume the shape of a beast that you have seen before. You can use this feature twice, regaining expended uses when you finish a short or long rest. Your druid level determines the beasts you can transform into (CR limits, and later swimming/flying forms). You retain personality and alignment; your game statistics are replaced by the beast's, though you keep your mental ability scores, proficiency bonus, and certain class features as stated in the rules. You can stay in beast shape for a number of hours equal to half your druid level (rounded down).",
    usesRecharge: "2 / short or long rest (improves with Archdruid)",
    notes: "Circle of the Moon improves combat forms and CR.",
    tags: ["class", "druid", "transformation"]
  },
  {
    id: "feature-second-wind",
    linkId: "second-wind",
    name: "Second Wind",
    featureType: "Class feature",
    grantedBy: "@class:fighter|Fighter",
    levelPrerequisite: "1",
    source: "Player's Handbook",
    page: "",
    summary: "Bonus action to regain hit points.",
    description:
      "You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.",
    usesRecharge: "1 / short or long rest",
    notes: "",
    tags: ["class", "fighter", "healing"]
  },
  {
    id: "feature-action-surge",
    linkId: "action-surge",
    name: "Action Surge",
    featureType: "Class feature",
    grantedBy: "@class:fighter|Fighter",
    levelPrerequisite: "2",
    source: "Player's Handbook",
    page: "",
    summary: "Take one additional action on your turn.",
    description:
      "Starting at 2nd level, you can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn.",
    usesRecharge: "1 / short or long rest (2 at 17th)",
    notes: "",
    tags: ["class", "fighter", "combat"]
  },
  {
    id: "feature-sneak-attack",
    linkId: "sneak-attack",
    name: "Sneak Attack",
    featureType: "Class feature",
    grantedBy: "@class:rogue|Rogue",
    levelPrerequisite: "1",
    source: "Player's Handbook",
    page: "",
    summary: "Extra damage once per turn with finesse/ranged when you have advantage (or ally adjacent).",
    description:
      "Beginning at 1st level, you know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal extra damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or a ranged weapon. You don't need advantage if another enemy of the target is within 5 feet of it, that enemy isn't incapacitated, and you don't have disadvantage. Extra damage scales with rogue level.",
    usesRecharge: "1 / turn (when conditions met)",
    notes: "",
    tags: ["class", "rogue", "combat"]
  },
  {
    id: "feature-divine-smite",
    linkId: "divine-smite",
    name: "Divine Smite",
    featureType: "Class feature",
    grantedBy: "@class:paladin|Paladin",
    levelPrerequisite: "2",
    source: "Player's Handbook",
    page: "",
    summary: "Expend a spell slot to deal extra radiant damage on a melee hit.",
    description:
      "Starting at 2nd level, when you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target, in addition to the weapon's damage. The extra damage is 2d8 for a 1st-level slot, plus 1d8 for each slot level higher than 1st, to a maximum. The damage increases against undead or fiends as stated in the rules.",
    usesRecharge: "Spell slots",
    notes: "",
    tags: ["class", "paladin", "combat", "radiant"]
  }
];
