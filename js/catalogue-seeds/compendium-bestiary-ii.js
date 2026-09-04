(function (root, factory) {
  "use strict";

  const manifest = factory();

  if (typeof module !== "undefined" && module.exports) module.exports = manifest;

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
    return {
      type: "monster",
      id,
      entry: {
        id,
        name,
        size: spec.size || "Medium",
        creatureType: spec.creatureType || "",
        alignment: spec.alignment || "Unaligned",
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
        skillRefs: [], traitRefs: [], actionRefs: [], bonusActionRefs: [], reactionRefs: [], legendaryActionRefs: [], spellRefs: [],
        traits: spec.traits || "",
        actions: spec.actions || "",
        bonusActions: spec.bonusActions || "",
        reactions: spec.reactions || "",
        legendaryActions: spec.legendaryActions || "",
        notes: spec.notes ? `${spec.notes}\n\n${NOTE}` : NOTE
      }
    };
  }

  return [
    monster("monster-ape", "Ape", {
      cr: "1/2", xp: 100, ac: 12, hp: "19 (3d8+6)", speed: "30 ft., climb 30 ft.",
      str: 16, dex: 14, con: 14, int: 6, wis: 12, cha: 7,
      skills: "Athletics +5, Perception +3", senses: "Passive Perception 13",
      actions: "Multiattack — two fist attacks.\nFist. +5 to hit; 6 (1d6+3) bludgeoning.\nRock. +5 to hit, range 25/50 ft.; 6 (1d6+3) bludgeoning.",
      tags: ["beast", "climber"]
    }),
    monster("monster-black-bear", "Black Bear", {
      cr: "1/2", xp: 100, ac: 11, hp: "19 (3d8+6)", speed: "40 ft., climb 30 ft.",
      str: 15, dex: 10, con: 14, int: 2, wis: 12, cha: 7,
      skills: "Perception +3", senses: "Passive Perception 13",
      traits: "Keen Smell — advantage on scent-based Perception checks.",
      actions: "Multiattack — one bite and one claws attack.\nBite. +3 to hit; 5 (1d6+2) piercing.\nClaws. +3 to hit; 7 (2d4+2) slashing.",
      tags: ["beast", "bear"]
    }),
    monster("monster-brown-bear", "Brown Bear", {
      size: "Large", cr: 1, xp: 200, ac: 11, hp: "34 (4d10+12)", speed: "40 ft., climb 30 ft.",
      str: 19, dex: 10, con: 16, int: 2, wis: 13, cha: 7,
      skills: "Perception +3", senses: "Passive Perception 13",
      traits: "Keen Smell — advantage on scent-based Perception checks.",
      actions: "Multiattack — one bite and one claws attack.\nBite. +5 to hit; 8 (1d8+4) piercing.\nClaws. +5 to hit; 11 (2d6+4) slashing.",
      tags: ["beast", "bear"]
    }),
    monster("monster-polar-bear", "Polar Bear", {
      size: "Large", cr: 2, xp: 450, ac: 12, hp: "42 (5d10+15)", speed: "40 ft., swim 30 ft.",
      str: 20, dex: 10, con: 16, int: 2, wis: 13, cha: 7,
      skills: "Perception +3", senses: "Passive Perception 13",
      traits: "Keen Smell — advantage on scent-based Perception checks.",
      actions: "Multiattack — one bite and one claws attack.\nBite. +7 to hit; 9 (1d8+5) piercing.\nClaws. +7 to hit; 12 (2d6+5) slashing.",
      tags: ["beast", "bear", "swimmer"]
    }),
    monster("monster-boar", "Boar", {
      cr: "1/4", xp: 50, ac: 11, hp: "11 (2d8+2)", speed: "40 ft.",
      str: 13, dex: 11, con: 12, int: 2, wis: 9, cha: 5,
      senses: "Passive Perception 9",
      traits: "Charge — after moving 20 ft. straight toward a target, a tusk hit deals 3 (1d6) extra slashing and can knock it prone (DC 11 STR).\nRelentless (1/rest) — if damage would drop the boar to 0 HP, it drops to 1 HP instead.",
      actions: "Tusk. +3 to hit; 4 (1d6+1) slashing.",
      tags: ["beast", "charge"]
    }),
    monster("monster-panther", "Panther", {
      cr: "1/4", xp: 50, ac: 12, hp: "13 (3d8)", speed: "50 ft., climb 40 ft.",
      str: 14, dex: 15, con: 10, int: 3, wis: 14, cha: 7,
      skills: "Perception +4, Stealth +6", senses: "Passive Perception 14",
      traits: "Keen Smell.\nPounce — after moving 20 ft. straight toward a creature, a claw hit can knock it prone (DC 12 STR), enabling a bonus-action bite.",
      actions: "Bite. +4 to hit; 5 (1d6+2) piercing.\nClaw. +4 to hit; 4 (1d4+2) slashing.",
      tags: ["beast", "cat", "ambusher"]
    }),
    monster("monster-lion", "Lion", {
      size: "Large", cr: 1, xp: 200, ac: 12, hp: "26 (4d10+4)", speed: "50 ft.",
      str: 17, dex: 15, con: 13, int: 3, wis: 12, cha: 8,
      skills: "Perception +3, Stealth +6", senses: "Passive Perception 13",
      traits: "Keen Smell.\nPack Tactics.\nPounce — after a 20-ft. straight move, a claw hit can knock a creature prone (DC 13 STR), enabling a bonus-action bite.\nRunning Leap — long jump up to 25 ft. with a 10-ft. run.",
      actions: "Bite. +5 to hit; 7 (1d8+3) piercing.\nClaw. +5 to hit; 6 (1d6+3) slashing.",
      tags: ["beast", "cat", "pack"]
    }),
    monster("monster-tiger", "Tiger", {
      size: "Large", cr: 1, xp: 200, ac: 12, hp: "37 (5d10+10)", speed: "40 ft.",
      str: 17, dex: 15, con: 14, int: 3, wis: 12, cha: 8,
      skills: "Perception +3, Stealth +6", senses: "Passive Perception 13",
      traits: "Keen Smell.\nPounce — after moving 20 ft. straight toward a creature, a claw hit can knock it prone (DC 13 STR), enabling a bonus-action bite.",
      actions: "Bite. +5 to hit; 8 (1d10+3) piercing.\nClaw. +5 to hit; 7 (1d8+3) slashing.",
      tags: ["beast", "cat", "ambusher"]
    }),
    monster("monster-giant-hyena", "Giant Hyena", {
      size: "Large", cr: 1, xp: 200, ac: 12, hp: "45 (6d10+12)", speed: "50 ft.",
      str: 16, dex: 14, con: 14, int: 2, wis: 12, cha: 7,
      skills: "Perception +3", senses: "Passive Perception 13",
      traits: "Rampage — after reducing a creature to 0 HP with a melee attack, move up to half speed and make a bite attack as a bonus action.",
      actions: "Bite. +5 to hit; 10 (2d6+3) piercing.",
      tags: ["beast", "hyena", "brute"]
    }),
    monster("monster-giant-bat", "Giant Bat", {
      size: "Large", cr: "1/4", xp: 50, ac: 13, hp: "22 (4d10)", speed: "10 ft., fly 60 ft.",
      str: 15, dex: 16, con: 11, int: 2, wis: 12, cha: 6,
      skills: "Perception +3", senses: "Blindsight 60 ft., passive Perception 13",
      traits: "Echolocation — no blindsight while deafened.\nKeen Hearing — advantage on hearing-based Perception checks.",
      actions: "Bite. +4 to hit; 5 (1d6+2) piercing.",
      tags: ["beast", "flying", "blindsight"]
    }),
    monster("monster-giant-owl", "Giant Owl", {
      size: "Large", cr: "1/4", xp: 50, ac: 12, hp: "19 (3d10+3)", speed: "5 ft., fly 60 ft.",
      str: 13, dex: 15, con: 12, int: 8, wis: 13, cha: 10,
      skills: "Perception +5, Stealth +4", senses: "Darkvision 120 ft., passive Perception 15", languages: "Giant Owl; understands Common, Elvish, Sylvan",
      traits: "Flyby — does not provoke opportunity attacks when flying out of an enemy's reach.\nKeen Hearing and Sight.",
      actions: "Talons. +3 to hit; 8 (2d6+1) slashing.",
      tags: ["beast", "flying", "scout"]
    }),
    monster("monster-giant-goat", "Giant Goat", {
      size: "Large", cr: "1/2", xp: 100, ac: 11, hp: "19 (3d10+3)", speed: "40 ft.",
      str: 17, dex: 11, con: 12, int: 3, wis: 12, cha: 6, senses: "Passive Perception 11",
      traits: "Charge — after moving 20 ft. straight toward a target, a ram hit deals 5 (2d4) extra bludgeoning and can knock it prone (DC 13 STR).\nSure-Footed — advantage on STR/DEX saves against being knocked prone.",
      actions: "Ram. +5 to hit; 8 (2d4+3) bludgeoning.",
      tags: ["beast", "mountain", "charge"]
    }),
    monster("monster-giant-crab", "Giant Crab", {
      cr: "1/8", xp: 25, ac: 15, hp: "13 (3d8)", speed: "30 ft., swim 30 ft.",
      str: 13, dex: 15, con: 11, int: 1, wis: 9, cha: 3,
      skills: "Stealth +4", senses: "Blindsight 30 ft., passive Perception 9",
      traits: "Amphibious — breathes air and water.",
      actions: "Claw. +3 to hit; 4 (1d6+1) bludgeoning and target is grappled (escape DC 11). Two claws can hold two targets.",
      tags: ["beast", "aquatic", "grappler"]
    }),
    monster("monster-crocodile", "Crocodile", {
      size: "Large", cr: "1/2", xp: 100, ac: 12, hp: "19 (3d10+3)", speed: "20 ft., swim 30 ft.",
      str: 15, dex: 10, con: 13, int: 2, wis: 10, cha: 5,
      skills: "Stealth +2", senses: "Passive Perception 10",
      traits: "Hold Breath — up to 15 minutes.",
      actions: "Bite. +4 to hit; 7 (1d10+2) piercing. Target is grappled (escape DC 12) and restrained while grappled; the crocodile cannot bite another target.",
      tags: ["beast", "aquatic", "grappler"]
    }),
    monster("monster-giant-crocodile", "Giant Crocodile", {
      size: "Huge", cr: 5, xp: 1800, ac: 14, hp: "85 (9d12+27)", speed: "30 ft., swim 50 ft.",
      str: 21, dex: 9, con: 17, int: 2, wis: 10, cha: 7,
      skills: "Stealth +5", senses: "Passive Perception 10",
      traits: "Hold Breath — up to 30 minutes.",
      actions: "Multiattack — one bite and one tail attack against different targets.\nBite. +8 to hit; 21 (3d10+5) piercing; target is grappled and restrained (escape DC 16).\nTail. +8 to hit; 14 (2d8+5) bludgeoning and target must pass DC 16 STR or fall prone.",
      tags: ["beast", "aquatic", "grappler", "huge"]
    }),
    monster("monster-constrictor-snake", "Constrictor Snake", {
      size: "Large", cr: "1/4", xp: 50, ac: 12, hp: "13 (2d10+2)", speed: "30 ft., swim 30 ft.",
      str: 15, dex: 14, con: 12, int: 1, wis: 10, cha: 3,
      senses: "Blindsight 10 ft., passive Perception 10",
      actions: "Bite. +4 to hit; 5 (1d6+2) piercing.\nConstrict. +4 to hit; 6 (1d8+2) bludgeoning and target is grappled and restrained (escape DC 14).",
      tags: ["beast", "snake", "grappler"]
    }),
    monster("monster-giant-constrictor-snake", "Giant Constrictor Snake", {
      size: "Huge", cr: 2, xp: 450, ac: 12, hp: "60 (8d12+8)", speed: "30 ft., swim 30 ft.",
      str: 19, dex: 14, con: 12, int: 1, wis: 10, cha: 3,
      skills: "Perception +2", senses: "Blindsight 10 ft., passive Perception 12",
      actions: "Bite. +6 to hit; 11 (2d6+4) piercing.\nConstrict. +6 to hit; 13 (2d8+4) bludgeoning and target is grappled and restrained (escape DC 16).",
      tags: ["beast", "snake", "grappler", "huge"]
    }),
    monster("monster-poisonous-snake", "Poisonous Snake", {
      size: "Tiny", cr: "1/8", xp: 25, ac: 13, hp: "2 (1d4)", speed: "30 ft., swim 30 ft.",
      str: 2, dex: 16, con: 11, int: 1, wis: 10, cha: 3,
      senses: "Blindsight 10 ft., passive Perception 10",
      actions: "Bite. +5 to hit; 1 piercing plus 5 (2d4) poison, DC 10 CON for half poison.",
      tags: ["beast", "snake", "poison"]
    }),
    monster("monster-giant-poisonous-snake", "Giant Poisonous Snake", {
      cr: "1/4", xp: 50, ac: 14, hp: "11 (2d8+2)", speed: "30 ft., swim 30 ft.",
      str: 10, dex: 18, con: 13, int: 2, wis: 10, cha: 3,
      skills: "Perception +2", senses: "Blindsight 10 ft., passive Perception 12",
      actions: "Bite. +6 to hit; 6 (1d4+4) piercing plus 10 (3d6) poison, DC 11 CON for half poison.",
      tags: ["beast", "snake", "poison"]
    }),
    monster("monster-warhorse", "Warhorse", {
      size: "Large", cr: "1/2", xp: 100, ac: 11, hp: "19 (3d10+3)", speed: "60 ft.",
      str: 18, dex: 12, con: 13, int: 2, wis: 12, cha: 7, senses: "Passive Perception 11",
      traits: "Trampling Charge — after moving 20 ft. straight toward a target, a hooves hit can knock it prone (DC 14 STR), enabling a bonus-action hooves attack.",
      actions: "Hooves. +6 to hit; 11 (2d6+4) bludgeoning.",
      tags: ["beast", "mount", "charge"]
    }),
    monster("monster-mastiff", "Mastiff", {
      cr: "1/8", xp: 25, ac: 12, hp: "5 (1d8+1)", speed: "40 ft.",
      str: 13, dex: 14, con: 12, int: 3, wis: 12, cha: 7,
      skills: "Perception +3", senses: "Passive Perception 13",
      traits: "Keen Hearing and Smell.",
      actions: "Bite. +3 to hit; 4 (1d6+1) piercing. Target must pass DC 11 STR or fall prone.",
      tags: ["beast", "dog", "companion"]
    }),
    monster("monster-giant-badger", "Giant Badger", {
      cr: "1/4", xp: 50, ac: 10, hp: "13 (2d8+4)", speed: "30 ft., burrow 10 ft.",
      str: 13, dex: 10, con: 15, int: 2, wis: 12, cha: 5,
      senses: "Darkvision 30 ft., passive Perception 11",
      traits: "Keen Smell — advantage on scent-based Perception checks.",
      actions: "Multiattack — one bite and one claws attack.\nBite. +3 to hit; 4 (1d6+1) piercing.\nClaws. +3 to hit; 6 (2d4+1) slashing.",
      tags: ["beast", "burrower"]
    }),
    monster("monster-giant-weasel", "Giant Weasel", {
      cr: "1/8", xp: 25, ac: 13, hp: "9 (2d8)", speed: "40 ft.",
      str: 11, dex: 16, con: 10, int: 4, wis: 12, cha: 5,
      skills: "Perception +3, Stealth +5", senses: "Darkvision 60 ft., passive Perception 13",
      traits: "Keen Hearing and Smell.",
      actions: "Bite. +5 to hit; 5 (1d4+3) piercing.",
      tags: ["beast", "stealth"]
    }),
    monster("monster-giant-centipede", "Giant Centipede", {
      size: "Small", cr: "1/4", xp: 50, ac: 13, hp: "4 (1d6+1)", speed: "30 ft., climb 30 ft.",
      str: 5, dex: 14, con: 12, int: 1, wis: 7, cha: 3,
      senses: "Blindsight 30 ft., passive Perception 8",
      actions: "Bite. +4 to hit; 4 (1d4+2) piercing plus 10 (3d6) poison, DC 11 CON. If the poison reduces a target to 0 HP, it is stable but poisoned and paralyzed for 1 hour.",
      tags: ["beast", "vermin", "poison", "climber"]
    }),
    monster("monster-giant-fire-beetle", "Giant Fire Beetle", {
      size: "Small", cr: 0, xp: 10, ac: 13, hp: "4 (1d6+1)", speed: "30 ft.",
      str: 8, dex: 10, con: 12, int: 1, wis: 7, cha: 3,
      senses: "Blindsight 30 ft., passive Perception 8",
      traits: "Illumination — luminous glands shed bright light 10 ft. and dim light 10 ft. farther; the glow persists for 1d6 days after removal.",
      actions: "Bite. +1 to hit; 2 (1d6-1) slashing.",
      tags: ["beast", "vermin", "light"]
    }),
    monster("monster-stirge", "Stirge", {
      size: "Tiny", cr: "1/8", xp: 25, ac: 14, hp: "2 (1d4)", speed: "10 ft., fly 40 ft.",
      str: 4, dex: 16, con: 11, int: 2, wis: 8, cha: 6,
      senses: "Darkvision 60 ft., passive Perception 9",
      actions: "Blood Drain. +5 to hit; 5 (1d4+3) piercing and the stirge attaches. While attached it automatically drains 5 (1d4+3) HP at the start of its turns, detaching after draining 10 HP or when removed.",
      tags: ["beast", "flying", "blood"]
    }),
    monster("monster-cockatrice", "Cockatrice", {
      size: "Small", creatureType: "Monstrosity", cr: "1/2", xp: 100, ac: 11, hp: "27 (6d6+6)", speed: "20 ft., fly 40 ft.",
      str: 6, dex: 12, con: 12, int: 2, wis: 13, cha: 5,
      senses: "Darkvision 60 ft., passive Perception 11",
      actions: "Bite. +3 to hit; 3 (1d4+1) piercing. Target must pass DC 11 CON or begin turning to stone; a second failed save before the end of its next turn petrifies it for 24 hours.",
      tags: ["monstrosity", "flying", "petrification"]
    }),
    monster("monster-basilisk", "Basilisk", {
      creatureType: "Monstrosity", cr: 3, xp: 700, ac: 15, hp: "52 (8d8+16)", speed: "20 ft.",
      str: 16, dex: 8, con: 15, int: 2, wis: 8, cha: 7,
      senses: "Darkvision 60 ft., passive Perception 9",
      traits: "Petrifying Gaze — a creature that starts its turn within 30 ft. and meets the basilisk's gaze must make DC 12 CON saves or become restrained and then petrified. A creature can avert its eyes, sacrificing vision of the basilisk until its next turn.",
      actions: "Bite. +5 to hit; 10 (2d6+3) piercing plus 7 (2d6) poison.",
      tags: ["monstrosity", "petrification"]
    }),
    monster("monster-griffon", "Griffon", {
      size: "Large", creatureType: "Monstrosity", cr: 2, xp: 450, ac: 12, hp: "59 (7d10+21)", speed: "30 ft., fly 80 ft.",
      str: 18, dex: 15, con: 16, int: 2, wis: 13, cha: 8,
      skills: "Perception +5", senses: "Darkvision 60 ft., passive Perception 15",
      traits: "Keen Sight — advantage on sight-based Perception checks.",
      actions: "Multiattack — one beak and one claws attack.\nBeak. +6 to hit; 8 (1d8+4) piercing.\nClaws. +6 to hit; 11 (2d6+4) slashing.",
      tags: ["monstrosity", "flying", "mount"]
    }),
    monster("monster-hippogriff", "Hippogriff", {
      size: "Large", creatureType: "Monstrosity", cr: 1, xp: 200, ac: 11, hp: "19 (3d10+3)", speed: "40 ft., fly 60 ft.",
      str: 17, dex: 13, con: 13, int: 2, wis: 12, cha: 8,
      skills: "Perception +5", senses: "Passive Perception 15",
      traits: "Keen Sight — advantage on sight-based Perception checks.",
      actions: "Multiattack — one beak and one claws attack.\nBeak. +5 to hit; 8 (1d10+3) piercing.\nClaws. +5 to hit; 10 (2d6+3) slashing.",
      tags: ["monstrosity", "flying", "mount"]
    }),
    monster("monster-rust-monster", "Rust Monster", {
      creatureType: "Monstrosity", cr: "1/2", xp: 100, ac: 14, hp: "27 (5d8+5)", speed: "40 ft.",
      str: 13, dex: 12, con: 13, int: 2, wis: 13, cha: 6,
      senses: "Darkvision 60 ft., passive Perception 11",
      traits: "Iron Scent — pinpoints ferrous metal within 30 ft.\nRust Metal — nonmagical ferrous weapons that hit the monster can corrode and lose damage effectiveness.",
      actions: "Bite. +3 to hit; 5 (1d8+1) piercing.\nAntennae. Corrodes one visible nonmagical ferrous metal object within 5 ft.; armor/shields lose AC and weapons lose damage until destroyed at -5.",
      tags: ["monstrosity", "equipment-damage"]
    }),
    monster("monster-gargoyle", "Gargoyle", {
      creatureType: "Elemental", alignment: "Chaotic evil", cr: 2, xp: 450, ac: 15, hp: "52 (7d8+21)", speed: "30 ft., fly 60 ft.",
      str: 15, dex: 11, con: 16, int: 6, wis: 11, cha: 7,
      damageResistances: "Bludgeoning, piercing, slashing from nonmagical attacks not made with adamantine weapons", damageImmunities: "Poison", conditionImmunities: "Exhaustion, petrified, poisoned",
      senses: "Darkvision 60 ft., passive Perception 10", languages: "Terran",
      traits: "False Appearance — while motionless, indistinguishable from an ordinary stone statue.",
      actions: "Multiattack — one bite and one claws attack.\nBite. +4 to hit; 5 (1d6+2) piercing.\nClaws. +4 to hit; 5 (1d6+2) slashing.",
      tags: ["elemental", "flying", "guardian"]
    }),
    monster("monster-ankheg", "Ankheg", {
      size: "Large", creatureType: "Monstrosity", cr: 2, xp: 450, ac: 14, hp: "39 (6d10+6)", speed: "30 ft., burrow 10 ft.",
      str: 17, dex: 11, con: 13, int: 1, wis: 13, cha: 6,
      senses: "Darkvision 60 ft., tremorsense 60 ft., passive Perception 11",
      actions: "Bite. +5 to hit; 10 (2d6+3) slashing plus 3 (1d6) acid; Large or smaller target is grappled (escape DC 13).\nAcid Spray (Recharge 6). 30-ft. line, 5 ft. wide; DC 13 DEX, 10 (3d6) acid, half on success.",
      tags: ["monstrosity", "burrower", "acid"]
    }),
    monster("monster-ettercap", "Ettercap", {
      creatureType: "Monstrosity", alignment: "Neutral evil", cr: 2, xp: 450, ac: 13, hp: "44 (8d8+8)", speed: "30 ft., climb 30 ft.",
      str: 14, dex: 15, con: 13, int: 7, wis: 12, cha: 8,
      skills: "Perception +3, Stealth +4, Survival +3", senses: "Darkvision 60 ft., passive Perception 13",
      traits: "Spider Climb.\nWeb Sense.\nWeb Walker.",
      actions: "Multiattack — one bite and one claws attack.\nBite. +4 to hit; 6 (1d8+2) piercing plus 4 (1d8) poison, DC 11 CON for half poison.\nClaws. +4 to hit; 7 (2d4+2) slashing.\nWeb (Recharge 5–6). +4 to hit, range 30/60 ft.; target restrained, escape DC 11 STR.",
      tags: ["monstrosity", "spider", "web"]
    }),
    monster("monster-phase-spider", "Phase Spider", {
      size: "Large", creatureType: "Monstrosity", cr: 3, xp: 700, ac: 13, hp: "32 (5d10+5)", speed: "30 ft., climb 30 ft.",
      str: 15, dex: 15, con: 12, int: 6, wis: 10, cha: 6,
      skills: "Stealth +6", senses: "Darkvision 60 ft., passive Perception 10",
      traits: "Ethereal Jaunt — shift between the Ethereal Plane and Material Plane as a bonus action.\nSpider Climb.\nWeb Walker.",
      actions: "Bite. +4 to hit; 7 (1d10+2) piercing plus 18 (4d8) poison, DC 11 CON for half. A target reduced to 0 HP by the poison is stable but poisoned and paralyzed for 1 hour.",
      tags: ["monstrosity", "spider", "ethereal", "poison"]
    }),
    monster("monster-shadow", "Shadow", {
      creatureType: "Undead", alignment: "Chaotic evil", cr: "1/2", xp: 100, ac: 12, hp: "16 (3d8+3)", speed: "40 ft.",
      str: 6, dex: 14, con: 13, int: 6, wis: 10, cha: 8,
      skills: "Stealth +4", damageVulnerabilities: "Radiant", damageResistances: "Acid, cold, fire, lightning, thunder; bludgeoning, piercing, slashing from nonmagical attacks", damageImmunities: "Necrotic, poison", conditionImmunities: "Exhaustion, frightened, grappled, paralyzed, petrified, poisoned, prone, restrained",
      senses: "Darkvision 60 ft., passive Perception 10",
      traits: "Amorphous.\nShadow Stealth — Hide as a bonus action in dim light or darkness.\nSunlight Weakness — disadvantage on attacks, checks and saves in sunlight.",
      actions: "Strength Drain. +4 to hit; 9 (2d6+2) necrotic and target's STR score is reduced by 1d4 until a rest. A creature dies if reduced to STR 0.",
      tags: ["undead", "incorporeal", "strength-drain"]
    }),
    monster("monster-mummy", "Mummy", {
      creatureType: "Undead", alignment: "Lawful evil", cr: 3, xp: 700, ac: 11, hp: "58 (9d8+18)", speed: "20 ft.",
      str: 16, dex: 8, con: 15, int: 6, wis: 10, cha: 12,
      savingThrows: "WIS +2", damageVulnerabilities: "Fire", damageResistances: "Bludgeoning, piercing, slashing from nonmagical attacks", damageImmunities: "Necrotic, poison", conditionImmunities: "Charmed, exhaustion, frightened, paralyzed, poisoned",
      senses: "Darkvision 60 ft., passive Perception 10", languages: "Languages it knew in life",
      actions: "Multiattack — one Dreadful Glare and one Rotting Fist.\nRotting Fist. +5 to hit; 10 (2d6+3) bludgeoning plus 10 (3d6) necrotic; DC 12 CON or contract mummy rot.\nDreadful Glare. One visible creature within 60 ft.; DC 11 WIS or frightened until end of mummy's next turn; a severe failure also paralyzes for that duration.",
      tags: ["undead", "curse", "fear"]
    }),
    monster("monster-ghost", "Ghost", {
      creatureType: "Undead", alignment: "Any alignment", cr: 4, xp: 1100, ac: 11, hp: "45 (10d8)", speed: "0 ft., fly 40 ft. (hover)",
      str: 7, dex: 13, con: 10, int: 10, wis: 12, cha: 17,
      savingThrows: "WIS +4, CHA +6", damageResistances: "Acid, fire, lightning, thunder; bludgeoning, piercing, slashing from nonmagical attacks", damageImmunities: "Cold, necrotic, poison", conditionImmunities: "Charmed, exhaustion, frightened, grappled, paralyzed, petrified, poisoned, prone, restrained",
      senses: "Darkvision 60 ft., passive Perception 11", languages: "Languages it knew in life",
      traits: "Ethereal Sight.\nIncorporeal Movement — can pass through creatures and objects as difficult terrain.",
      actions: "Withering Touch. +5 to hit; 17 (4d6+3) necrotic.\nEtherealness — shift between the Material and Ethereal Planes.\nHorrifying Visage — nearby non-undead creatures make DC 13 WIS or become frightened and may age.\nPossession (Recharge 6). DC 13 CHA; possess one humanoid within 5 ft. until expelled.",
      tags: ["undead", "incorporeal", "possession"]
    }),
    monster("monster-fire-elemental", "Fire Elemental", {
      size: "Large", creatureType: "Elemental", alignment: "Neutral", cr: 5, xp: 1800, ac: 13, hp: "102 (12d10+36)", speed: "50 ft.",
      str: 10, dex: 17, con: 16, int: 6, wis: 10, cha: 7,
      damageResistances: "Bludgeoning, piercing, slashing from nonmagical attacks", damageImmunities: "Fire, poison", conditionImmunities: "Exhaustion, grappled, paralyzed, petrified, poisoned, prone, restrained, unconscious",
      senses: "Darkvision 60 ft., passive Perception 10", languages: "Ignan",
      traits: "Fire Form — can move through creature spaces, igniting creatures it touches; flammable objects catch fire.\nIllumination.\nWater Susceptibility — cold water damages it.",
      actions: "Multiattack — two touch attacks.\nTouch. +6 to hit; 10 (2d6+3) fire and target catches fire, taking 5 (1d10) fire at the start of its turns until extinguished.",
      tags: ["elemental", "fire"]
    }),
    monster("monster-air-elemental", "Air Elemental", {
      size: "Large", creatureType: "Elemental", alignment: "Neutral", cr: 5, xp: 1800, ac: 15, hp: "90 (12d10+24)", speed: "0 ft., fly 90 ft. (hover)",
      str: 14, dex: 20, con: 14, int: 6, wis: 10, cha: 6,
      damageResistances: "Lightning, thunder; bludgeoning, piercing, slashing from nonmagical attacks", damageImmunities: "Poison", conditionImmunities: "Exhaustion, grappled, paralyzed, petrified, poisoned, prone, restrained, unconscious",
      senses: "Darkvision 60 ft., passive Perception 10", languages: "Auran",
      traits: "Air Form — can enter hostile creature spaces and squeeze through 1-inch gaps without squeezing.",
      actions: "Multiattack — two slam attacks.\nSlam. +8 to hit; 14 (2d8+5) bludgeoning.\nWhirlwind (Recharge 4–6). Creatures in its space make DC 13 STR; failure deals 15 (3d8+2) bludgeoning, flings the target up to 20 ft. and knocks it prone.",
      tags: ["elemental", "air", "flying"]
    }),
    monster("monster-earth-elemental", "Earth Elemental", {
      size: "Large", creatureType: "Elemental", alignment: "Neutral", cr: 5, xp: 1800, ac: 17, hp: "126 (12d10+60)", speed: "30 ft., burrow 30 ft.",
      str: 20, dex: 8, con: 20, int: 5, wis: 10, cha: 5,
      damageVulnerabilities: "Thunder", damageResistances: "Bludgeoning, piercing, slashing from nonmagical attacks", damageImmunities: "Poison", conditionImmunities: "Exhaustion, paralyzed, petrified, poisoned, unconscious",
      senses: "Darkvision 60 ft., tremorsense 60 ft., passive Perception 10", languages: "Terran",
      traits: "Earth Glide — burrows through nonmagical earth and stone without disturbing it.\nSiege Monster — double damage to objects and structures.",
      actions: "Multiattack — two slam attacks.\nSlam. +8 to hit; 14 (2d8+5) bludgeoning.",
      tags: ["elemental", "earth", "burrower"]
    }),
    monster("monster-water-elemental", "Water Elemental", {
      size: "Large", creatureType: "Elemental", alignment: "Neutral", cr: 5, xp: 1800, ac: 14, hp: "114 (12d10+48)", speed: "30 ft., swim 90 ft.",
      str: 18, dex: 14, con: 18, int: 5, wis: 10, cha: 8,
      damageResistances: "Acid; bludgeoning, piercing, slashing from nonmagical attacks", damageImmunities: "Poison", conditionImmunities: "Exhaustion, grappled, paralyzed, petrified, poisoned, prone, restrained, unconscious",
      senses: "Darkvision 60 ft., passive Perception 10", languages: "Aquan",
      traits: "Water Form — can enter hostile creature spaces and squeeze through 1-inch gaps without squeezing.\nFreeze — cold damage slows it temporarily.",
      actions: "Multiattack — two slam attacks.\nSlam. +7 to hit; 13 (2d8+4) bludgeoning.\nWhelm (Recharge 4–6). Creatures in its space make DC 15 STR; failure deals 13 (2d8+4) bludgeoning and can leave targets grappled, restrained and unable to breathe.",
      tags: ["elemental", "water", "aquatic"]
    }),
    monster("monster-minotaur", "Minotaur", {
      size: "Large", creatureType: "Monstrosity", alignment: "Chaotic evil", cr: 3, xp: 700, ac: 14, hp: "76 (9d10+27)", speed: "40 ft.",
      str: 18, dex: 11, con: 16, int: 6, wis: 16, cha: 9,
      skills: "Perception +7", senses: "Darkvision 60 ft., passive Perception 17", languages: "Abyssal",
      traits: "Charge — after moving 10 ft. straight toward a target, a gore hit deals 9 (2d8) extra piercing and can shove it away (DC 14 STR).\nLabyrinthine Recall — perfectly recalls paths traveled.\nReckless — can gain advantage on melee attacks for the turn at the cost of attacks against it having advantage.",
      actions: "Greataxe. +6 to hit; 17 (2d12+4) slashing.\nGore. +6 to hit; 13 (2d8+4) piercing.",
      tags: ["monstrosity", "maze", "charge"]
    }),
    monster("monster-dryad", "Dryad", {
      creatureType: "Fey", alignment: "Neutral", cr: 1, xp: 200, ac: 11, hp: "22 (5d8)", speed: "30 ft.",
      str: 10, dex: 12, con: 11, int: 14, wis: 15, cha: 18,
      skills: "Perception +4, Stealth +5", senses: "Darkvision 60 ft., passive Perception 14", languages: "Elvish, Sylvan",
      traits: "Innate Spellcasting (CHA, save DC 14) — at will druidcraft; 3/day entangle, goodberry; 1/day barkskin, pass without trace, shillelagh.\nMagic Resistance.\nSpeak with Beasts and Plants.\nTree Stride — move between nearby Large or larger living trees.",
      actions: "Club. +2 to hit; 2 (1d4) bludgeoning, or +6 to hit and 8 (1d8+4) with shillelagh.\nFey Charm. One humanoid or beast within 30 ft.; DC 14 WIS or charmed, potentially for 24 hours.",
      tags: ["fey", "forest", "spellcaster"]
    }),
    monster("monster-satyr", "Satyr", {
      creatureType: "Fey", alignment: "Chaotic neutral", cr: "1/2", xp: 100, ac: 14, hp: "31 (7d8)", speed: "40 ft.",
      str: 12, dex: 16, con: 11, int: 12, wis: 10, cha: 14,
      skills: "Perception +2, Performance +6, Stealth +5", senses: "Passive Perception 12", languages: "Common, Elvish, Sylvan",
      traits: "Magic Resistance — advantage on saves against spells and other magical effects.",
      actions: "Ram. +3 to hit; 6 (2d4+1) bludgeoning.\nShortsword. +5 to hit; 6 (1d6+3) piercing.\nShortbow. +5 to hit, range 80/320 ft.; 6 (1d6+3) piercing.",
      tags: ["fey", "forest"]
    }),
    monster("monster-sprite", "Sprite", {
      size: "Tiny", creatureType: "Fey", alignment: "Neutral good", cr: "1/4", xp: 50, ac: 15, hp: "2 (1d4)", speed: "10 ft., fly 40 ft.",
      str: 3, dex: 18, con: 10, int: 14, wis: 13, cha: 11,
      skills: "Perception +3, Stealth +8", senses: "Passive Perception 13", languages: "Common, Elvish, Sylvan",
      actions: "Longsword. +2 to hit; 1 slashing.\nShortbow. +6 to hit, range 40/160 ft.; 1 piercing plus poison, DC 10 CON; a badly failed save can knock the target unconscious.\nHeart Sight. Learns a touched creature's emotional state and alignment on a failed DC 10 CHA save.\nInvisibility. Turns invisible until attacking, casting a spell, or ending it.",
      tags: ["fey", "tiny", "flying", "invisibility"]
    }),
    monster("monster-imp", "Imp", {
      size: "Tiny", creatureType: "Fiend (devil, shapechanger)", alignment: "Lawful evil", cr: 1, xp: 200, ac: 13, hp: "10 (3d4+3)", speed: "20 ft., fly 40 ft.",
      str: 6, dex: 17, con: 13, int: 11, wis: 12, cha: 14,
      skills: "Deception +4, Insight +3, Persuasion +4, Stealth +5", damageResistances: "Cold; bludgeoning, piercing, slashing from nonmagical attacks not made with silvered weapons", damageImmunities: "Fire, poison", conditionImmunities: "Poisoned",
      senses: "Darkvision 120 ft., passive Perception 11", languages: "Infernal, Common",
      traits: "Shapechanger — raven, rat, spider or true form.\nDevil's Sight — magical darkness does not impede darkvision.\nMagic Resistance.",
      actions: "Sting. +5 to hit; 5 (1d4+3) piercing plus 10 (3d6) poison, DC 11 CON for half poison.\nInvisibility. Turns invisible until it attacks or loses concentration.",
      tags: ["fiend", "devil", "flying", "invisibility"]
    }),
    monster("monster-hell-hound", "Hell Hound", {
      creatureType: "Fiend", alignment: "Lawful evil", cr: 3, xp: 700, ac: 15, hp: "45 (7d8+14)", speed: "50 ft.",
      str: 17, dex: 12, con: 14, int: 6, wis: 13, cha: 6,
      skills: "Perception +5", damageImmunities: "Fire", senses: "Darkvision 60 ft., passive Perception 15", languages: "Understands Infernal but cannot speak",
      traits: "Keen Hearing and Smell.\nPack Tactics.",
      actions: "Bite. +5 to hit; 7 (1d8+3) piercing.\nFire Breath (Recharge 5–6). 15-ft. cone; DC 12 DEX, 21 (6d6) fire, half on success.",
      tags: ["fiend", "fire", "pack"]
    })
  ];
});
