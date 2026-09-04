(function (root, factory) {
  "use strict";

  const manifest = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = manifest;
  }

  if (root) {
    root.CatalogueSeeds = root.CatalogueSeeds || {};
    const entries = manifest.map((seed) => seed.entry);
    const existing = Array.isArray(root.CatalogueSeeds.monster) ? root.CatalogueSeeds.monster : [];
    const ids = new Set(existing.map((entry) => entry?.id).filter(Boolean));
    root.CatalogueSeeds.monster = existing.concat(entries.filter((entry) => !ids.has(entry.id)));
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const SOURCE = "SRD 5.1 (CC BY 4.0)";
  const NOTE = "Condensed SRD 5.1 quick reference, reformatted for table use. See docs/OPEN-CONTENT.md for attribution.";

  function monster(id, name, spec) {
    const entry = {
      id,
      name,
      size: spec.size || "Medium",
      creatureType: spec.creatureType || "",
      alignment: spec.alignment || "",
      cr: String(spec.cr ?? ""),
      xp: String(spec.xp ?? ""),
      source: SOURCE,
      tags: ["srd", "bestiary", ...(spec.tags || [])],
      str: spec.str ?? 10,
      dex: spec.dex ?? 10,
      con: spec.con ?? 10,
      int: spec.int ?? 10,
      wis: spec.wis ?? 10,
      cha: spec.cha ?? 10,
      ac: String(spec.ac ?? ""),
      hp: spec.hp || "",
      speed: spec.speed || "",
      savingThrows: spec.savingThrows || "",
      skills: spec.skills || "",
      damageVulnerabilities: spec.damageVulnerabilities || "",
      damageResistances: spec.damageResistances || "",
      damageImmunities: spec.damageImmunities || "",
      conditionImmunities: spec.conditionImmunities || "",
      senses: spec.senses || "",
      languages: spec.languages || "",
      skillRefs: [],
      traitRefs: [],
      actionRefs: [],
      bonusActionRefs: [],
      reactionRefs: [],
      legendaryActionRefs: [],
      spellRefs: [],
      traits: spec.traits || "",
      actions: spec.actions || "",
      bonusActions: spec.bonusActions || "",
      reactions: spec.reactions || "",
      legendaryActions: spec.legendaryActions || "",
      notes: spec.notes ? `${spec.notes}\n\n${NOTE}` : NOTE
    };
    return { type: "monster", id, entry };
  }

  return [
    monster("monster-goblin", "Goblin", {
      size: "Small", creatureType: "Humanoid (goblinoid)", alignment: "Neutral evil", cr: "1/4", xp: 50,
      str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8, ac: 15, hp: "7 (2d6)", speed: "30 ft.",
      skills: "Stealth +6", senses: "Darkvision 60 ft., passive Perception 9", languages: "Common, Goblin",
      traits: "Nimble Escape — can Disengage or Hide as a bonus action.",
      actions: "Scimitar. +4 to hit, reach 5 ft.; 5 (1d6+2) slashing.\nShortbow. +4 to hit, range 80/320 ft.; 5 (1d6+2) piercing.",
      tags: ["goblinoid", "low-cr", "skirmisher"]
    }),
    monster("monster-kobold", "Kobold", {
      size: "Small", creatureType: "Humanoid (kobold)", alignment: "Lawful evil", cr: "1/8", xp: 25,
      str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8, ac: 12, hp: "5 (2d6-2)", speed: "30 ft.",
      senses: "Darkvision 60 ft., passive Perception 8", languages: "Common, Draconic",
      traits: "Pack Tactics — advantage on attacks when an active ally is beside the target.\nSunlight Sensitivity — bright sunlight hampers sight-based attacks and Perception.",
      actions: "Dagger. +4 to hit, reach 5 ft.; 4 (1d4+2) piercing.\nSling. +4 to hit, range 30/120 ft.; 4 (1d4+2) bludgeoning.",
      tags: ["kobold", "low-cr", "pack"]
    }),
    monster("monster-bandit", "Bandit", {
      creatureType: "Humanoid (any)", alignment: "Any non-lawful", cr: "1/8", xp: 25,
      str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10, ac: 12, hp: "11 (2d8+2)", speed: "30 ft.",
      senses: "Passive Perception 10", languages: "Any one language",
      actions: "Scimitar. +3 to hit, reach 5 ft.; 4 (1d6+1) slashing.\nLight Crossbow. +3 to hit, range 80/320 ft.; 5 (1d8+1) piercing.",
      tags: ["humanoid", "low-cr", "npc-template"]
    }),
    monster("monster-bandit-captain", "Bandit Captain", {
      creatureType: "Humanoid (any)", alignment: "Any non-lawful", cr: 2, xp: 450,
      str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14, ac: 15, hp: "65 (10d8+20)", speed: "30 ft.",
      savingThrows: "STR +4, DEX +5, WIS +2", skills: "Athletics +4, Deception +4", senses: "Passive Perception 10", languages: "Any two languages",
      actions: "Multiattack — three melee attacks: two scimitar and one dagger.\nScimitar. +5 to hit; 6 (1d6+3) slashing.\nDagger. +5 to hit, reach 5 ft. or range 20/60 ft.; 5 (1d4+3) piercing.",
      reactions: "Parry — add 2 AC against one visible melee attack that would hit.",
      tags: ["humanoid", "leader", "npc-template"]
    }),
    monster("monster-cultist", "Cultist", {
      creatureType: "Humanoid (any)", alignment: "Any non-good", cr: "1/8", xp: 25,
      str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10, ac: 12, hp: "9 (2d8)", speed: "30 ft.",
      skills: "Deception +2, Religion +2", senses: "Passive Perception 10", languages: "Any one language",
      traits: "Dark Devotion — advantage on saving throws against being charmed or frightened.",
      actions: "Scimitar. +3 to hit, reach 5 ft.; 4 (1d6+1) slashing.",
      tags: ["humanoid", "cult", "low-cr", "npc-template"]
    }),
    monster("monster-cult-fanatic", "Cult Fanatic", {
      creatureType: "Humanoid (any)", alignment: "Any non-good", cr: 2, xp: 450,
      str: 11, dex: 14, con: 12, int: 10, wis: 13, cha: 14, ac: 13, hp: "33 (6d8+6)", speed: "30 ft.",
      skills: "Deception +4, Persuasion +4, Religion +2", senses: "Passive Perception 11", languages: "Any one language",
      traits: "Dark Devotion — advantage against charm and fear.\nSpellcasting — 4th-level Wisdom caster (save DC 11, +3 spell attack). Typical spells: light, sacred flame, thaumaturgy; command, inflict wounds, shield of faith; hold person, spiritual weapon.",
      actions: "Multiattack — two dagger attacks.\nDagger. +4 to hit, reach 5 ft. or range 20/60 ft.; 4 (1d4+2) piercing.",
      tags: ["humanoid", "cult", "spellcaster", "npc-template"]
    }),
    monster("monster-skeleton", "Skeleton", {
      creatureType: "Undead", alignment: "Lawful evil", cr: "1/4", xp: 50,
      str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5, ac: 13, hp: "13 (2d8+4)", speed: "30 ft.",
      damageVulnerabilities: "Bludgeoning", damageImmunities: "Poison", conditionImmunities: "Exhaustion, poisoned",
      senses: "Darkvision 60 ft., passive Perception 9", languages: "Understands languages it knew in life; cannot speak",
      actions: "Shortsword. +4 to hit; 5 (1d6+2) piercing.\nShortbow. +4 to hit, range 80/320 ft.; 5 (1d6+2) piercing.",
      tags: ["undead", "low-cr"]
    }),
    monster("monster-wolf", "Wolf", {
      size: "Medium", creatureType: "Beast", alignment: "Unaligned", cr: "1/4", xp: 50,
      str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6, ac: 13, hp: "11 (2d8+2)", speed: "40 ft.",
      skills: "Perception +3, Stealth +4", senses: "Passive Perception 13",
      traits: "Keen Hearing and Smell — advantage on relevant Perception checks.\nPack Tactics — advantage when an active ally is beside the target.",
      actions: "Bite. +4 to hit; 7 (2d4+2) piercing. A creature hit must pass DC 11 STR save or fall prone.",
      tags: ["beast", "pack", "low-cr"]
    }),
    monster("monster-giant-rat", "Giant Rat", {
      size: "Small", creatureType: "Beast", alignment: "Unaligned", cr: "1/8", xp: 25,
      str: 7, dex: 15, con: 11, int: 2, wis: 10, cha: 4, ac: 12, hp: "7 (2d6)", speed: "30 ft.",
      senses: "Darkvision 60 ft., passive Perception 10",
      traits: "Keen Smell — advantage on scent-based Perception.\nPack Tactics — advantage when an active ally is beside the target.",
      actions: "Bite. +4 to hit; 4 (1d4+2) piercing.",
      tags: ["beast", "vermin", "low-cr"]
    }),
    monster("monster-swarm-of-rats", "Swarm of Rats", {
      size: "Medium", creatureType: "Swarm of Tiny beasts", alignment: "Unaligned", cr: "1/4", xp: 50,
      str: 9, dex: 11, con: 9, int: 2, wis: 10, cha: 3, ac: 10, hp: "24 (7d8-7)", speed: "30 ft.",
      damageResistances: "Bludgeoning, piercing, slashing", conditionImmunities: "Charmed, frightened, grappled, paralyzed, petrified, prone, restrained, stunned",
      senses: "Darkvision 30 ft., passive Perception 10",
      traits: "Keen Smell.\nSwarm — can share another creature's space, squeeze through Tiny openings, and cannot regain HP or gain temporary HP.",
      actions: "Bites. +2 to hit; 7 (2d6) piercing, or 3 (1d6) while the swarm is at half HP or fewer.",
      tags: ["beast", "swarm", "vermin"]
    }),
    monster("monster-giant-spider", "Giant Spider", {
      size: "Large", creatureType: "Beast", alignment: "Unaligned", cr: 1, xp: 200,
      str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4, ac: 14, hp: "26 (4d10+4)", speed: "30 ft., climb 30 ft.",
      skills: "Stealth +7", senses: "Blindsight 10 ft., darkvision 60 ft., passive Perception 10",
      traits: "Spider Climb — moves on walls and ceilings without checks.\nWeb Sense — knows the location of creatures touching the same web.\nWeb Walker — ignores web movement restrictions.",
      actions: "Bite. +5 to hit; 7 (1d8+3) piercing plus 9 (2d8) poison, DC 11 CON for half poison. If poison drops a target to 0 HP, it is stable but paralyzed for 1 hour.\nWeb (Recharge 5–6). +5 to hit, range 30/60 ft.; target restrained. Escape DC 12 STR; web AC 10, HP 5, vulnerable to fire.",
      tags: ["beast", "spider", "control"]
    }),
    monster("monster-bugbear", "Bugbear", {
      creatureType: "Humanoid (goblinoid)", alignment: "Chaotic evil", cr: 1, xp: 200,
      str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9, ac: 16, hp: "27 (5d8+5)", speed: "30 ft.",
      skills: "Stealth +6, Survival +2", senses: "Darkvision 60 ft., passive Perception 10", languages: "Common, Goblin",
      traits: "Brute — melee weapon hits roll one extra weapon damage die.\nSurprise Attack — once on the first round, a hit against a surprised target deals an extra 7 (2d6) damage.",
      actions: "Morningstar. +4 to hit; 11 (2d8+2) piercing.\nJavelin. +4 to hit, reach 5 ft. or range 30/120 ft.; 9 (2d6+2) piercing in melee, 5 (1d6+2) at range.",
      tags: ["goblinoid", "ambusher"]
    }),
    monster("monster-hobgoblin", "Hobgoblin", {
      creatureType: "Humanoid (goblinoid)", alignment: "Lawful evil", cr: "1/2", xp: 100,
      str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9, ac: 18, hp: "11 (2d8+2)", speed: "30 ft.",
      senses: "Darkvision 60 ft., passive Perception 10", languages: "Common, Goblin",
      traits: "Martial Advantage — once per turn, deal an extra 7 (2d6) damage when an active ally is within 5 ft. of the target.",
      actions: "Longsword. +3 to hit; 5 (1d8+1) slashing, or 6 (1d10+1) two-handed.\nLongbow. +3 to hit, range 150/600 ft.; 5 (1d8+1) piercing.",
      tags: ["goblinoid", "soldier"]
    }),
    monster("monster-orc", "Orc", {
      creatureType: "Humanoid (orc)", alignment: "Chaotic evil", cr: "1/2", xp: 100,
      str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10, ac: 13, hp: "15 (2d8+6)", speed: "30 ft.",
      skills: "Intimidation +2", senses: "Darkvision 60 ft., passive Perception 10", languages: "Common, Orc",
      traits: "Aggressive — as a bonus action, move up to speed toward a hostile creature that can be seen or heard, ending closer to it.",
      actions: "Greataxe. +5 to hit; 9 (1d12+3) slashing.\nJavelin. +5 to hit, reach 5 ft. or range 30/120 ft.; 6 (1d6+3) piercing.",
      tags: ["orc", "brute", "low-cr"]
    }),
    monster("monster-ogre", "Ogre", {
      size: "Large", creatureType: "Giant", alignment: "Chaotic evil", cr: 2, xp: 450,
      str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7, ac: 11, hp: "59 (7d10+21)", speed: "40 ft.",
      senses: "Darkvision 60 ft., passive Perception 8", languages: "Common, Giant",
      actions: "Greatclub. +6 to hit; 13 (2d8+4) bludgeoning.\nJavelin. +6 to hit, reach 5 ft. or range 30/120 ft.; 11 (2d6+4) piercing.",
      tags: ["giant", "brute"]
    }),
    monster("monster-dire-wolf", "Dire Wolf", {
      size: "Large", creatureType: "Beast", alignment: "Unaligned", cr: 1, xp: 200,
      str: 17, dex: 15, con: 15, int: 3, wis: 12, cha: 7, ac: 14, hp: "37 (5d10+10)", speed: "50 ft.",
      skills: "Perception +3, Stealth +4", senses: "Passive Perception 13",
      traits: "Keen Hearing and Smell.\nPack Tactics — advantage when an active ally is beside the target.",
      actions: "Bite. +5 to hit; 10 (2d6+3) piercing. A creature hit must pass DC 13 STR save or fall prone.",
      tags: ["beast", "wolf", "pack"]
    }),
    monster("monster-giant-eagle", "Giant Eagle", {
      size: "Large", creatureType: "Beast", alignment: "Neutral good", cr: 1, xp: 200,
      str: 16, dex: 17, con: 13, int: 8, wis: 14, cha: 10, ac: 13, hp: "26 (4d10+4)", speed: "10 ft., fly 80 ft.",
      skills: "Perception +4", senses: "Passive Perception 14", languages: "Giant Eagle; understands Common and Auran",
      traits: "Keen Sight — advantage on sight-based Perception checks.",
      actions: "Multiattack — one beak and one talons attack.\nBeak. +5 to hit; 6 (1d6+3) piercing.\nTalons. +5 to hit; 10 (2d6+3) slashing.",
      tags: ["beast", "flying"]
    }),
    monster("monster-giant-toad", "Giant Toad", {
      size: "Large", creatureType: "Beast", alignment: "Unaligned", cr: 1, xp: 200,
      str: 15, dex: 13, con: 13, int: 2, wis: 10, cha: 3, ac: 11, hp: "39 (6d10+6)", speed: "20 ft., swim 40 ft.",
      senses: "Darkvision 30 ft., passive Perception 10",
      traits: "Amphibious — breathes air and water.\nStanding Leap — long jump up to 20 ft. and high jump up to 10 ft., with or without a running start.",
      actions: "Bite. +4 to hit; 7 (1d10+2) piercing plus 5 (1d10) poison; Medium or smaller target is grappled and restrained (escape DC 13).\nSwallow. Bite a grappled Medium or smaller target; on hit it is swallowed, blinded and restrained, with total cover from outside, and takes 10 (3d6) acid at the start of each toad turn.",
      tags: ["beast", "aquatic", "grappler"]
    }),
    monster("monster-animated-armor", "Animated Armor", {
      creatureType: "Construct", alignment: "Unaligned", cr: 1, xp: 200,
      str: 14, dex: 11, con: 13, int: 1, wis: 3, cha: 1, ac: 18, hp: "33 (6d8+6)", speed: "25 ft.",
      damageImmunities: "Poison, psychic", conditionImmunities: "Blinded, charmed, deafened, exhaustion, frightened, paralyzed, petrified, poisoned",
      senses: "Blindsight 60 ft. (blind beyond), passive Perception 6",
      traits: "Antimagic Susceptibility — incapacitated inside antimagic and can be shut down by dispel magic.\nFalse Appearance — motionless armor is indistinguishable from ordinary armor.",
      actions: "Multiattack — two slam attacks.\nSlam. +4 to hit; 5 (1d6+2) bludgeoning.",
      tags: ["construct", "guardian"]
    }),
    monster("monster-flying-sword", "Flying Sword", {
      size: "Small", creatureType: "Construct", alignment: "Unaligned", cr: "1/4", xp: 50,
      str: 12, dex: 15, con: 11, int: 1, wis: 5, cha: 1, ac: 17, hp: "17 (5d6)", speed: "Fly 50 ft. (hover)",
      damageImmunities: "Poison, psychic", conditionImmunities: "Blinded, charmed, deafened, exhaustion, frightened, paralyzed, petrified, poisoned",
      senses: "Blindsight 60 ft. (blind beyond), passive Perception 7",
      traits: "Antimagic Susceptibility.\nFalse Appearance — while motionless, resembles an ordinary sword.",
      actions: "Longsword. +3 to hit; 5 (1d8+1) slashing.",
      tags: ["construct", "flying", "guardian"]
    }),
    monster("monster-mimic", "Mimic", {
      creatureType: "Monstrosity (shapechanger)", alignment: "Neutral", cr: 2, xp: 450,
      str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8, ac: 12, hp: "58 (9d8+18)", speed: "15 ft.",
      skills: "Stealth +5", damageImmunities: "Acid", conditionImmunities: "Prone", senses: "Darkvision 60 ft., passive Perception 11",
      traits: "Shapechanger — can assume the appearance of an object or return to amorphous form.\nAdhesive — creatures touching the mimic while it is an object can become stuck (escape DC 13).\nGrappler — advantage on attacks against creatures adhered to it.\nFalse Appearance — motionless object form looks ordinary.",
      actions: "Pseudopod. +5 to hit; 7 (1d8+3) bludgeoning and may trigger Adhesive.\nBite. +5 to hit; 7 (1d8+3) piercing plus 4 (1d8) acid.",
      tags: ["monstrosity", "shapechanger", "ambusher"]
    }),
    monster("monster-gelatinous-cube", "Gelatinous Cube", {
      size: "Large", creatureType: "Ooze", alignment: "Unaligned", cr: 2, xp: 450,
      str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1, ac: 6, hp: "84 (8d10+40)", speed: "15 ft.",
      conditionImmunities: "Blinded, charmed, deafened, exhaustion, frightened, prone", senses: "Blindsight 60 ft. (blind beyond), passive Perception 8",
      traits: "Ooze Cube — fills its space and can move through creature spaces; creatures can enter it.\nTransparent — an unmoving cube is hard to notice until a creature is almost on top of it.",
      actions: "Pseudopod. +4 to hit; 10 (3d6) acid.\nEngulf. Moves through creature spaces; DC 12 DEX to avoid. Failure causes 10 (3d6) acid and the creature is engulfed. Engulfed creatures are restrained, cannot breathe, and take 21 (6d6) acid at the start of the cube's turns until they escape.",
      tags: ["ooze", "dungeon", "control"]
    }),
    monster("monster-harpy", "Harpy", {
      creatureType: "Monstrosity", alignment: "Chaotic evil", cr: 1, xp: 200,
      str: 12, dex: 13, con: 12, int: 7, wis: 10, cha: 13, ac: 11, hp: "38 (7d8+7)", speed: "20 ft., fly 40 ft.",
      senses: "Passive Perception 10", languages: "Common",
      traits: "Luring Song — humanoids and giants that hear the song within 300 ft. must pass DC 11 WIS or become charmed and compelled to approach. Damage allows another save; success grants 24-hour immunity.",
      actions: "Multiattack — one claws and one club attack.\nClaws. +3 to hit; 6 (2d4+1) slashing.\nClub. +3 to hit; 3 (1d4+1) bludgeoning.",
      tags: ["monstrosity", "flying", "charm"]
    }),
    monster("monster-giant-scorpion", "Giant Scorpion", {
      size: "Large", creatureType: "Beast", alignment: "Unaligned", cr: 3, xp: 700,
      str: 15, dex: 13, con: 15, int: 1, wis: 9, cha: 3, ac: 15, hp: "52 (7d10+14)", speed: "40 ft.",
      senses: "Blindsight 60 ft., passive Perception 9",
      actions: "Multiattack — two claws and one sting.\nClaw. +4 to hit; 6 (1d8+2) bludgeoning and target is grappled (escape DC 12); one target per claw.\nSting. +4 to hit; 7 (1d10+2) piercing plus 22 (4d10) poison, DC 12 CON for half poison.",
      tags: ["beast", "poison", "grappler"]
    }),
    monster("monster-specter", "Specter", {
      creatureType: "Undead", alignment: "Chaotic evil", cr: 1, xp: 200,
      str: 1, dex: 14, con: 11, int: 10, wis: 10, cha: 11, ac: 12, hp: "22 (5d8)", speed: "Fly 50 ft. (hover)",
      damageResistances: "Acid, cold, fire, lightning, thunder; bludgeoning, piercing, slashing from nonmagical attacks",
      damageImmunities: "Necrotic, poison", conditionImmunities: "Charmed, exhaustion, grappled, paralyzed, petrified, poisoned, prone, restrained, unconscious",
      senses: "Darkvision 60 ft., passive Perception 10", languages: "Understands languages it knew in life; cannot speak",
      traits: "Incorporeal Movement — moves through creatures and objects as difficult terrain, taking force damage if it ends inside an object.\nSunlight Sensitivity — sunlight imposes disadvantage on attacks and sight-based Perception.",
      actions: "Life Drain. +4 to hit; 10 (3d6) necrotic. DC 10 CON or target's maximum HP is reduced by damage taken until long rest; a creature reduced to 0 maximum HP dies.",
      tags: ["undead", "incorporeal"]
    }),
    monster("monster-wight", "Wight", {
      creatureType: "Undead", alignment: "Neutral evil", cr: 3, xp: 700,
      str: 15, dex: 14, con: 16, int: 10, wis: 13, cha: 15, ac: 14, hp: "45 (6d8+18)", speed: "30 ft.",
      skills: "Perception +3, Stealth +4", damageResistances: "Necrotic; bludgeoning, piercing, slashing from nonmagical attacks not made with silvered weapons",
      damageImmunities: "Poison", conditionImmunities: "Exhaustion, poisoned", senses: "Darkvision 60 ft., passive Perception 13", languages: "Languages it knew in life",
      traits: "Sunlight Sensitivity — sunlight imposes disadvantage on attacks and sight-based Perception.",
      actions: "Multiattack — two longsword or two longbow attacks; one longsword attack can be replaced by Life Drain.\nLife Drain. +4 to hit; 5 (1d6+2) necrotic. DC 13 CON or maximum HP is reduced by damage until long rest; humanoids slain this way can rise as zombies under the wight's control.\nLongsword. +4 to hit; 6 (1d8+2) slashing, or 7 (1d10+2) two-handed.\nLongbow. +4 to hit, range 150/600 ft.; 6 (1d8+2) piercing.",
      tags: ["undead", "commander"]
    }),
    monster("monster-troll", "Troll", {
      size: "Large", creatureType: "Giant", alignment: "Chaotic evil", cr: 5, xp: 1800,
      str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7, ac: 15, hp: "84 (8d10+40)", speed: "30 ft.",
      skills: "Perception +2", senses: "Darkvision 60 ft., passive Perception 12", languages: "Giant",
      traits: "Keen Smell.\nRegeneration — regains 10 HP at the start of its turn unless it took acid or fire damage since its previous turn; it dies only when starting a turn at 0 HP without regenerating.",
      actions: "Multiattack — one bite and two claws.\nBite. +7 to hit; 7 (1d6+4) piercing.\nClaw. +7 to hit; 11 (2d6+4) slashing.",
      tags: ["giant", "regeneration", "brute"]
    }),
    monster("monster-owlbear", "Owlbear", {
      size: "Large", creatureType: "Monstrosity", alignment: "Unaligned", cr: 3, xp: 700,
      str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7, ac: 13, hp: "59 (7d10+21)", speed: "40 ft.",
      skills: "Perception +3", senses: "Darkvision 60 ft., passive Perception 13",
      traits: "Keen Sight and Smell — advantage on sight- and scent-based Perception checks.",
      actions: "Multiattack — one beak and one claws attack.\nBeak. +7 to hit; 10 (1d10+5) piercing.\nClaws. +7 to hit; 14 (2d8+5) slashing.",
      tags: ["monstrosity", "brute", "wilderness"]
    }),

    monster("monster-young-black-dragon", "Young Black Dragon", {
      size: "Large", creatureType: "Dragon", alignment: "Chaotic evil", cr: 7, xp: 2900,
      str: 19, dex: 14, con: 17, int: 12, wis: 11, cha: 15, ac: 18, hp: "127 (15d10+45)", speed: "40 ft., fly 80 ft., swim 40 ft.",
      savingThrows: "DEX +5, CON +6, WIS +3, CHA +5", skills: "Perception +6, Stealth +5", damageImmunities: "Acid",
      senses: "Blindsight 30 ft., darkvision 120 ft., passive Perception 16", languages: "Common, Draconic",
      traits: "Amphibious — breathes air and water.",
      actions: "Multiattack — one bite and two claws.\nBite. +7 to hit; 2d10+4 piercing plus 1d8 acid.\nClaw. +7 to hit; 11 (2d6+4) slashing.\nAcid Breath (Recharge 5–6). 30-ft. line, 5 ft. wide; DC 14 DEX, 49 (11d8) acid, half on success.",
      tags: ["dragon", "chromatic", "acid", "young"]
    }),
    monster("monster-young-white-dragon", "Young White Dragon", {
      size: "Large", creatureType: "Dragon", alignment: "Chaotic evil", cr: 6, xp: 2300,
      str: 18, dex: 10, con: 18, int: 6, wis: 11, cha: 12, ac: 17, hp: "133 (14d10+56)", speed: "40 ft., burrow 20 ft., fly 80 ft., swim 40 ft.",
      savingThrows: "DEX +3, CON +7, WIS +3, CHA +4", skills: "Perception +6, Stealth +3", damageImmunities: "Cold",
      senses: "Blindsight 30 ft., darkvision 120 ft., passive Perception 16", languages: "Common, Draconic",
      traits: "Ice Walk — moves across and climbs icy surfaces without checks or extra movement; ice-based difficult terrain costs no extra movement.",
      actions: "Multiattack — one bite and two claws.\nBite. +7 to hit; 2d10+4 piercing plus 1d8 cold.\nClaw. +7 to hit; 11 (2d6+4) slashing.\nCold Breath (Recharge 5–6). 30-ft. cone; DC 15 CON, 45 (10d8) cold, half on success.",
      tags: ["dragon", "chromatic", "cold", "young"]
    }),
    monster("monster-young-green-dragon", "Young Green Dragon", {
      size: "Large", creatureType: "Dragon", alignment: "Lawful evil", cr: 8, xp: 3900,
      str: 19, dex: 12, con: 17, int: 16, wis: 13, cha: 15, ac: 18, hp: "136 (16d10+48)", speed: "40 ft., fly 80 ft., swim 40 ft.",
      savingThrows: "DEX +4, CON +6, WIS +4, CHA +5", skills: "Deception +5, Perception +7, Stealth +4", damageImmunities: "Poison", conditionImmunities: "Poisoned",
      senses: "Blindsight 30 ft., darkvision 120 ft., passive Perception 17", languages: "Common, Draconic",
      traits: "Amphibious — breathes air and water.",
      actions: "Multiattack — one bite and two claws.\nBite. +7 to hit; 2d10+4 piercing plus 1d6 poison.\nClaw. +7 to hit; 11 (2d6+4) slashing.\nPoison Breath (Recharge 5–6). 30-ft. cone; DC 14 CON, 42 (12d6) poison, half on success.",
      tags: ["dragon", "chromatic", "poison", "young"]
    }),
    monster("monster-young-blue-dragon", "Young Blue Dragon", {
      size: "Large", creatureType: "Dragon", alignment: "Lawful evil", cr: 9, xp: 5000,
      str: 21, dex: 10, con: 19, int: 14, wis: 13, cha: 17, ac: 18, hp: "152 (16d10+64)", speed: "40 ft., burrow 20 ft., fly 80 ft.",
      savingThrows: "DEX +4, CON +8, WIS +5, CHA +7", skills: "Perception +9, Stealth +4", damageImmunities: "Lightning",
      senses: "Blindsight 30 ft., darkvision 120 ft., passive Perception 19", languages: "Common, Draconic",
      actions: "Multiattack — one bite and two claws.\nBite. +9 to hit; 2d10+5 piercing plus 1d10 lightning.\nClaw. +9 to hit; 12 (2d6+5) slashing.\nLightning Breath (Recharge 5–6). 60-ft. line, 5 ft. wide; DC 16 DEX, 66 (12d10) lightning, half on success.",
      tags: ["dragon", "chromatic", "lightning", "young"]
    }),
    monster("monster-young-red-dragon", "Young Red Dragon", {
      size: "Large", creatureType: "Dragon", alignment: "Chaotic evil", cr: 10, xp: 5900,
      str: 23, dex: 10, con: 21, int: 14, wis: 11, cha: 19, ac: 18, hp: "178 (17d10+85)", speed: "40 ft., climb 40 ft., fly 80 ft.",
      savingThrows: "DEX +4, CON +9, WIS +4, CHA +8", skills: "Perception +8, Stealth +4", damageImmunities: "Fire",
      senses: "Blindsight 30 ft., darkvision 120 ft., passive Perception 18", languages: "Common, Draconic",
      actions: "Multiattack — one bite and two claws.\nBite. +10 to hit; 2d10+6 piercing plus 1d6 fire.\nClaw. +10 to hit; 13 (2d6+6) slashing.\nFire Breath (Recharge 5–6). 30-ft. cone; DC 17 DEX, 56 (16d6) fire, half on success.",
      tags: ["dragon", "chromatic", "fire", "young"]
    })
  ];
});