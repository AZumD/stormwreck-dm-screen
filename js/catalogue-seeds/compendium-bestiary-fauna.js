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

  function beast(slug, name, spec = {}) {
    const id = `monster-${slug}`;
    return {
      type: "monster",
      id,
      entry: {
        id,
        name,
        size: spec.size || "Tiny",
        creatureType: spec.creatureType || "Beast",
        alignment: spec.alignment || "Unaligned",
        cr: String(spec.cr ?? "0"),
        xp: String(spec.xp ?? "10"),
        source: SOURCE,
        tags: ["srd", "bestiary", "beast", ...(spec.tags || [])],
        str: spec.str ?? 10,
        dex: spec.dex ?? 10,
        con: spec.con ?? 10,
        int: spec.int ?? 2,
        wis: spec.wis ?? 10,
        cha: spec.cha ?? 5,
        ac: String(spec.ac ?? "10"),
        hp: spec.hp || "1",
        speed: spec.speed || "30 ft.",
        savingThrows: spec.savingThrows || "",
        skills: spec.skills || "",
        damageVulnerabilities: spec.damageVulnerabilities || "",
        damageResistances: spec.damageResistances || "",
        damageImmunities: spec.damageImmunities || "",
        conditionImmunities: spec.conditionImmunities || "",
        senses: spec.senses || "Passive Perception 10",
        languages: spec.languages || "",
        skillRefs: [], traitRefs: [], actionRefs: [], bonusActionRefs: [], reactionRefs: [], legendaryActionRefs: [], spellRefs: [],
        traits: spec.traits || "",
        actions: spec.actions || "",
        bonusActions: "",
        reactions: "",
        legendaryActions: "",
        notes: spec.notes ? `${spec.notes}\n\n${NOTE}` : NOTE
      }
    };
  }

  return [
    beast("baboon", "Baboon", {
      size: "Small", cr: 0, xp: 10, ac: 12, hp: "3 (1d6)", speed: "30 ft., climb 30 ft.",
      str: 8, dex: 14, con: 11, int: 4, wis: 12, cha: 6,
      senses: "Passive Perception 11", traits: "Pack Tactics — advantage on an attack when an active ally is adjacent to the target.",
      actions: "Bite. +1 to hit; 1 (1d4−1) piercing.", tags: ["familiar-adjacent", "climber", "pack"]
    }),
    beast("badger", "Badger", {
      cr: 0, xp: 10, ac: 10, hp: "3 (1d4+1)", speed: "20 ft., burrow 5 ft.",
      str: 4, dex: 11, con: 12, int: 2, wis: 12, cha: 5,
      senses: "Darkvision 30 ft., passive Perception 11", traits: "Keen Smell — advantage on scent-based Perception checks.",
      actions: "Bite. +2 to hit; 1 piercing.", tags: ["burrower", "wild-shape"]
    }),
    beast("bat", "Bat", {
      cr: 0, xp: 10, ac: 12, hp: "1 (1d4−1)", speed: "5 ft., fly 30 ft.",
      str: 2, dex: 15, con: 8, int: 2, wis: 12, cha: 4,
      senses: "Blindsight 60 ft., passive Perception 11",
      traits: "Echolocation — no blindsight while deafened.\nKeen Hearing — advantage on hearing-based Perception checks.",
      actions: "Bite. +0 to hit; 1 piercing.", tags: ["familiar", "flying", "blindsight"]
    }),
    beast("cat", "Cat", {
      cr: 0, xp: 10, ac: 12, hp: "2 (1d4)", speed: "40 ft., climb 30 ft.",
      str: 3, dex: 15, con: 10, int: 3, wis: 12, cha: 7,
      skills: "Perception +3, Stealth +4", senses: "Passive Perception 13",
      traits: "Keen Smell — advantage on scent-based Perception checks.", actions: "Claws. +0 to hit; 1 slashing.",
      tags: ["familiar", "climber", "stealth"]
    }),
    beast("crab", "Crab", {
      cr: 0, xp: 10, ac: 11, hp: "2 (1d4)", speed: "20 ft., swim 20 ft.",
      str: 2, dex: 11, con: 10, int: 1, wis: 8, cha: 2, skills: "Stealth +2",
      senses: "Blindsight 30 ft., passive Perception 9", traits: "Amphibious — breathes air and water.",
      actions: "Claw. +0 to hit; 1 bludgeoning.", tags: ["familiar", "aquatic", "blindsight"]
    }),
    beast("deer", "Deer", {
      size: "Medium", cr: 0, xp: 10, ac: 13, hp: "4 (1d8)", speed: "50 ft.",
      str: 11, dex: 16, con: 11, int: 2, wis: 14, cha: 5, senses: "Passive Perception 12",
      actions: "Bite. +2 to hit; 2 (1d4) piercing.", tags: ["wild-shape", "fast"]
    }),
    beast("eagle", "Eagle", {
      size: "Small", cr: 0, xp: 10, ac: 12, hp: "3 (1d6)", speed: "10 ft., fly 60 ft.",
      str: 6, dex: 15, con: 10, int: 2, wis: 14, cha: 7, skills: "Perception +4", senses: "Passive Perception 14",
      traits: "Keen Sight — advantage on sight-based Perception checks.", actions: "Talons. +4 to hit; 4 (1d4+2) slashing.",
      tags: ["flying", "scout", "wild-shape"]
    }),
    beast("frog", "Frog", {
      cr: 0, xp: 0, ac: 11, hp: "1", speed: "20 ft., swim 20 ft.",
      str: 1, dex: 13, con: 8, int: 1, wis: 8, cha: 3, senses: "Darkvision 30 ft., passive Perception 9",
      traits: "Amphibious.\nStanding Leap — long jump up to 10 ft. and high jump up to 5 ft., with or without a running start.",
      actions: "No effective combat attack.", tags: ["familiar", "aquatic", "tiny"]
    }),
    beast("goat", "Goat", {
      size: "Medium", cr: 0, xp: 10, ac: 10, hp: "4 (1d8)", speed: "40 ft.",
      str: 12, dex: 10, con: 11, int: 2, wis: 10, cha: 5, senses: "Passive Perception 10",
      traits: "Charge — after moving 20 ft. straight toward a target, a ram hit deals 2 (1d4) extra bludgeoning and can knock the target prone (DC 10 STR).\nSure-Footed — advantage on STR/DEX saves against being knocked prone.",
      actions: "Ram. +3 to hit; 3 (1d4+1) bludgeoning.", tags: ["wild-shape", "charge"]
    }),
    beast("hawk", "Hawk", {
      cr: 0, xp: 10, ac: 13, hp: "1 (1d4−1)", speed: "10 ft., fly 60 ft.",
      str: 5, dex: 16, con: 8, int: 2, wis: 14, cha: 6, skills: "Perception +4", senses: "Passive Perception 14",
      traits: "Keen Sight — advantage on sight-based Perception checks.", actions: "Talons. +5 to hit; 1 slashing.", tags: ["familiar", "flying", "scout"]
    }),
    beast("hyena", "Hyena", {
      size: "Medium", cr: 0, xp: 10, ac: 11, hp: "5 (1d8+1)", speed: "50 ft.",
      str: 11, dex: 13, con: 12, int: 2, wis: 12, cha: 5, skills: "Perception +3", senses: "Passive Perception 13",
      traits: "Pack Tactics — advantage on an attack when an active ally is adjacent to the target.", actions: "Bite. +2 to hit; 3 (1d6) piercing.",
      tags: ["wild-shape", "pack", "fast"]
    }),
    beast("jackal", "Jackal", {
      size: "Small", cr: 0, xp: 10, ac: 12, hp: "3 (1d6)", speed: "40 ft.",
      str: 8, dex: 15, con: 11, int: 3, wis: 12, cha: 6, skills: "Perception +3", senses: "Passive Perception 13",
      traits: "Keen Hearing and Smell.\nPack Tactics — advantage on an attack when an active ally is adjacent to the target.",
      actions: "Bite. +1 to hit; 1 (1d4−1) piercing.", tags: ["wild-shape", "pack"]
    }),
    beast("lizard", "Lizard", {
      cr: 0, xp: 10, ac: 10, hp: "2 (1d4)", speed: "20 ft., climb 20 ft.",
      str: 2, dex: 11, con: 10, int: 1, wis: 8, cha: 3, senses: "Darkvision 30 ft., passive Perception 9",
      actions: "Bite. +0 to hit; 1 piercing.", tags: ["familiar", "climber"]
    }),
    beast("mule", "Mule", {
      size: "Medium", cr: "1/8", xp: 25, ac: 10, hp: "11 (2d8+2)", speed: "40 ft.",
      str: 14, dex: 10, con: 13, int: 2, wis: 10, cha: 5, senses: "Passive Perception 10",
      traits: "Beast of Burden — counts as Large for carrying capacity.\nSure-Footed — advantage on STR/DEX saves against being knocked prone.",
      actions: "Hooves. +2 to hit; 4 (1d4+2) bludgeoning.", tags: ["mount", "pack-animal"]
    }),
    beast("octopus", "Octopus", {
      size: "Small", cr: 0, xp: 10, ac: 12, hp: "3 (1d6)", speed: "5 ft., swim 30 ft.",
      str: 4, dex: 15, con: 11, int: 3, wis: 10, cha: 4, skills: "Perception +2, Stealth +4",
      senses: "Darkvision 30 ft., passive Perception 12",
      traits: "Hold Breath — up to 30 minutes.\nUnderwater Camouflage — advantage on Stealth while underwater.\nWater Breathing — breathes only underwater.",
      actions: "Tentacles. +4 to hit; 1 bludgeoning and target is grappled (escape DC 10).",
      tags: ["familiar", "aquatic", "grappler", "stealth"]
    }),
    beast("owl", "Owl", {
      cr: 0, xp: 10, ac: 11, hp: "1 (1d4−1)", speed: "5 ft., fly 60 ft.",
      str: 3, dex: 13, con: 8, int: 2, wis: 12, cha: 7, skills: "Perception +3, Stealth +3",
      senses: "Darkvision 120 ft., passive Perception 13",
      traits: "Flyby — flying out of an enemy's reach does not provoke opportunity attacks.\nKeen Hearing and Sight.",
      actions: "Talons. +3 to hit; 1 slashing.", tags: ["familiar", "flying", "scout", "flyby"]
    }),
    beast("pony", "Pony", {
      size: "Medium", cr: "1/8", xp: 25, ac: 10, hp: "11 (2d8+2)", speed: "40 ft.",
      str: 15, dex: 10, con: 13, int: 2, wis: 11, cha: 7, senses: "Passive Perception 10",
      actions: "Hooves. +4 to hit; 7 (2d4+2) bludgeoning.", tags: ["mount"]
    }),
    beast("quipper", "Quipper", {
      cr: 0, xp: 10, ac: 13, hp: "1", speed: "Swim 40 ft.",
      str: 2, dex: 16, con: 9, int: 1, wis: 7, cha: 2, senses: "Darkvision 60 ft., passive Perception 8",
      traits: "Water Breathing — breathes only underwater.", actions: "Bite. +5 to hit; 1 piercing.", tags: ["aquatic", "tiny"]
    }),
    beast("rat", "Rat", {
      cr: 0, xp: 10, ac: 10, hp: "1 (1d4−1)", speed: "20 ft.",
      str: 2, dex: 11, con: 9, int: 2, wis: 10, cha: 4, senses: "Darkvision 30 ft., passive Perception 10",
      traits: "Keen Smell — advantage on scent-based Perception checks.", actions: "Bite. +0 to hit; 1 piercing.", tags: ["familiar", "vermin"]
    }),
    beast("raven", "Raven", {
      cr: 0, xp: 10, ac: 12, hp: "1 (1d4−1)", speed: "10 ft., fly 50 ft.",
      str: 2, dex: 14, con: 8, int: 2, wis: 12, cha: 6, skills: "Perception +3", senses: "Passive Perception 13",
      traits: "Mimicry — can imitate simple sounds; recognizing the imitation requires a successful Insight check.",
      actions: "Beak. +4 to hit; 1 piercing.", tags: ["familiar", "flying", "mimicry"]
    }),
    beast("riding-horse", "Riding Horse", {
      size: "Large", cr: "1/4", xp: 50, ac: 10, hp: "13 (2d10+2)", speed: "60 ft.",
      str: 16, dex: 10, con: 12, int: 2, wis: 11, cha: 7, senses: "Passive Perception 10",
      actions: "Hooves. +5 to hit; 8 (2d4+3) bludgeoning.", tags: ["mount", "fast"]
    }),
    beast("scorpion", "Scorpion", {
      cr: 0, xp: 10, ac: 11, hp: "1", speed: "10 ft.",
      str: 2, dex: 11, con: 8, int: 1, wis: 8, cha: 2, senses: "Blindsight 10 ft., passive Perception 9",
      actions: "Sting. +2 to hit; 1 piercing plus 4 (1d8) poison, DC 9 CON for half poison.", tags: ["familiar", "poison", "blindsight"]
    }),
    beast("sea-horse", "Sea Horse", {
      cr: 0, xp: 0, ac: 11, hp: "1", speed: "Swim 20 ft.",
      str: 1, dex: 12, con: 8, int: 1, wis: 10, cha: 2, senses: "Passive Perception 10",
      traits: "Water Breathing — breathes only underwater.", actions: "No effective combat attack.", tags: ["aquatic", "tiny"]
    }),
    beast("spider", "Spider", {
      cr: 0, xp: 10, ac: 12, hp: "1", speed: "20 ft., climb 20 ft.",
      str: 2, dex: 14, con: 8, int: 1, wis: 10, cha: 2, skills: "Stealth +4", senses: "Darkvision 30 ft., passive Perception 10",
      traits: "Spider Climb — moves on walls and ceilings without checks.\nWeb Sense — knows the location of creatures touching the same web.\nWeb Walker — ignores web movement restrictions.",
      actions: "Bite. +4 to hit; 1 piercing plus 2 (1d4) poison, DC 9 CON for half poison.", tags: ["familiar", "climber", "web", "poison"]
    }),
    beast("vulture", "Vulture", {
      size: "Medium", cr: 0, xp: 10, ac: 10, hp: "5 (1d8+1)", speed: "10 ft., fly 50 ft.",
      str: 7, dex: 10, con: 13, int: 2, wis: 12, cha: 4, skills: "Perception +3", senses: "Passive Perception 13",
      traits: "Keen Sight and Smell.\nPack Tactics — advantage on an attack when an active ally is adjacent to the target.",
      actions: "Beak. +2 to hit; 2 (1d4) piercing.", tags: ["flying", "pack", "wild-shape"]
    }),
    beast("weasel", "Weasel", {
      cr: 0, xp: 10, ac: 13, hp: "1", speed: "30 ft.",
      str: 3, dex: 16, con: 8, int: 2, wis: 12, cha: 3, skills: "Perception +3, Stealth +5", senses: "Passive Perception 13",
      traits: "Keen Hearing and Smell.", actions: "Bite. +5 to hit; 1 piercing.", tags: ["familiar", "stealth"]
    }),
    beast("camel", "Camel", {
      size: "Large", cr: "1/8", xp: 25, ac: 9, hp: "15 (2d10+4)", speed: "50 ft.",
      str: 16, dex: 8, con: 14, int: 2, wis: 8, cha: 5, senses: "Passive Perception 9",
      actions: "Bite. +5 to hit; 2 (1d4) bludgeoning.", tags: ["mount", "desert"]
    }),
    beast("draft-horse", "Draft Horse", {
      size: "Large", cr: "1/4", xp: 50, ac: 10, hp: "19 (3d10+3)", speed: "40 ft.",
      str: 18, dex: 10, con: 12, int: 2, wis: 11, cha: 7, senses: "Passive Perception 10",
      actions: "Hooves. +6 to hit; 9 (2d4+4) bludgeoning.", tags: ["mount", "pack-animal"]
    }),
    beast("elk", "Elk", {
      size: "Large", cr: "1/4", xp: 50, ac: 10, hp: "13 (2d10+2)", speed: "50 ft.",
      str: 16, dex: 10, con: 12, int: 2, wis: 10, cha: 6, senses: "Passive Perception 10",
      traits: "Charge — after moving 20 ft. straight toward a target, a ram hit deals 7 (2d6) extra damage and can knock the target prone (DC 13 STR).",
      actions: "Ram. +5 to hit; 6 (1d6+3) bludgeoning.\nHooves. +5 to hit against a prone creature; 8 (2d4+3) bludgeoning.",
      tags: ["wild-shape", "charge", "fast"]
    }),
    beast("giant-frog", "Giant Frog", {
      size: "Medium", cr: "1/4", xp: 50, ac: 11, hp: "18 (4d8)", speed: "30 ft., swim 30 ft.",
      str: 12, dex: 13, con: 11, int: 2, wis: 10, cha: 3, senses: "Darkvision 30 ft., passive Perception 10",
      traits: "Amphibious.\nStanding Leap — long jump up to 20 ft. and high jump up to 10 ft., with or without a running start.",
      actions: "Bite. +3 to hit; 4 (1d6+1) piercing and a Small or smaller target is grappled and restrained (escape DC 11).\nSwallow. Bite a grappled Small or smaller target; on a hit it is swallowed, blinded and restrained and takes 5 (2d4) acid at the start of each frog turn.",
      tags: ["aquatic", "grappler", "wild-shape"]
    }),
    beast("giant-lizard", "Giant Lizard", {
      size: "Large", cr: "1/4", xp: 50, ac: 12, hp: "19 (3d10+3)", speed: "30 ft., climb 30 ft.",
      str: 15, dex: 12, con: 13, int: 2, wis: 10, cha: 5, senses: "Darkvision 30 ft., passive Perception 10",
      actions: "Bite. +4 to hit; 6 (1d8+2) piercing.", tags: ["climber", "wild-shape"]
    }),
    beast("giant-wolf-spider", "Giant Wolf Spider", {
      size: "Medium", cr: "1/4", xp: 50, ac: 13, hp: "11 (2d8+2)", speed: "40 ft., climb 40 ft.",
      str: 12, dex: 16, con: 13, int: 3, wis: 12, cha: 4, skills: "Perception +3, Stealth +7",
      senses: "Blindsight 10 ft., darkvision 60 ft., passive Perception 13",
      traits: "Spider Climb.\nWeb Sense.\nWeb Walker.",
      actions: "Bite. +3 to hit; 4 (1d6+1) piercing plus 7 (2d6) poison, DC 11 CON for half poison. A target reduced to 0 HP by the poison is stable but paralyzed for 1 hour.",
      tags: ["spider", "poison", "climber", "wild-shape"]
    }),
    beast("giant-boar", "Giant Boar", {
      size: "Large", cr: 2, xp: 450, ac: 12, hp: "42 (5d10+15)", speed: "40 ft.",
      str: 17, dex: 10, con: 16, int: 2, wis: 7, cha: 5, senses: "Passive Perception 8",
      traits: "Charge — after moving 20 ft. straight toward a target, a tusk hit deals 7 (2d6) extra slashing and can knock the target prone (DC 13 STR).\nRelentless (1/rest) — if damage would drop the boar to 0 HP, it drops to 1 HP instead.",
      actions: "Tusk. +5 to hit; 10 (2d6+3) slashing.", tags: ["charge", "brute", "wild-shape"]
    }),
    beast("giant-elk", "Giant Elk", {
      size: "Huge", cr: 2, xp: 450, ac: 14, hp: "42 (5d12+10)", speed: "60 ft.",
      str: 19, dex: 16, con: 14, int: 7, wis: 14, cha: 10, skills: "Perception +4", senses: "Passive Perception 14",
      languages: "Giant Elk; understands Common, Elvish, Sylvan",
      traits: "Charge — after moving 20 ft. straight toward a target, a ram hit deals 7 (2d6) extra damage and can knock the target prone (DC 14 STR).",
      actions: "Ram. +6 to hit; 11 (2d6+4) bludgeoning.\nHooves. +6 to hit against a prone creature; 22 (4d8+4) bludgeoning.",
      tags: ["charge", "fast", "wild-shape"]
    }),
    beast("giant-octopus", "Giant Octopus", {
      size: "Large", cr: 1, xp: 200, ac: 11, hp: "52 (8d10+8)", speed: "10 ft., swim 60 ft.",
      str: 17, dex: 13, con: 13, int: 4, wis: 10, cha: 4, skills: "Perception +4, Stealth +5",
      senses: "Darkvision 60 ft., passive Perception 14",
      traits: "Hold Breath — up to 1 hour.\nUnderwater Camouflage — advantage on Stealth while underwater.\nWater Breathing — breathes only underwater.",
      actions: "Tentacles. +5 to hit; 10 (2d6+3) bludgeoning and target is grappled and restrained (escape DC 16).\nInk Cloud (Recharges after a short or long rest). While underwater, release a 20-foot-radius cloud that heavily obscures the area for 1 minute, then move up to speed without provoking opportunity attacks.",
      tags: ["aquatic", "grappler", "stealth", "wild-shape"]
    }),
    beast("giant-vulture", "Giant Vulture", {
      size: "Large", cr: 1, xp: 200, ac: 10, hp: "22 (3d10+6)", speed: "10 ft., fly 60 ft.",
      str: 15, dex: 10, con: 15, int: 6, wis: 12, cha: 7, skills: "Perception +3", senses: "Passive Perception 13",
      languages: "Understands Common but cannot speak",
      traits: "Keen Sight and Smell.\nPack Tactics — advantage on an attack when an active ally is adjacent to the target.",
      actions: "Multiattack — one beak and one talons attack.\nBeak. +4 to hit; 7 (2d4+2) piercing.\nTalons. +4 to hit; 9 (2d6+2) slashing.",
      tags: ["flying", "pack", "wild-shape"]
    }),
    beast("reef-shark", "Reef Shark", {
      size: "Medium", cr: "1/2", xp: 100, ac: 12, hp: "22 (4d8+4)", speed: "Swim 40 ft.",
      str: 14, dex: 13, con: 13, int: 1, wis: 10, cha: 4, skills: "Perception +2",
      senses: "Blindsight 30 ft., passive Perception 12",
      traits: "Blood Frenzy — advantage on melee attacks against creatures that do not have all their HP.\nWater Breathing — breathes only underwater.",
      actions: "Bite. +4 to hit; 6 (1d8+2) piercing.", tags: ["aquatic", "blindsight", "wild-shape"]
    }),
    beast("giant-shark", "Giant Shark", {
      size: "Huge", cr: 5, xp: 1800, ac: 13, hp: "126 (11d12+55)", speed: "Swim 50 ft.",
      str: 23, dex: 11, con: 21, int: 1, wis: 10, cha: 5, skills: "Perception +3",
      senses: "Blindsight 60 ft., passive Perception 13",
      traits: "Blood Frenzy — advantage on melee attacks against creatures that do not have all their HP.\nWater Breathing — breathes only underwater.",
      actions: "Bite. +9 to hit; 22 (3d10+6) piercing.", tags: ["aquatic", "blindsight", "brute"]
    }),
    beast("killer-whale", "Killer Whale", {
      size: "Huge", cr: 3, xp: 700, ac: 12, hp: "90 (12d12+12)", speed: "Swim 60 ft.",
      str: 19, dex: 10, con: 13, int: 3, wis: 12, cha: 7, skills: "Perception +3",
      senses: "Blindsight 120 ft., passive Perception 13",
      traits: "Echolocation — no blindsight while deafened.\nHold Breath — up to 30 minutes.\nKeen Hearing — advantage on hearing-based Perception checks.",
      actions: "Bite. +6 to hit; 21 (5d6+4) piercing.", tags: ["aquatic", "blindsight", "brute"]
    }),
    beast("giant-sea-horse", "Giant Sea Horse", {
      size: "Large", cr: "1/2", xp: 100, ac: 13, hp: "16 (3d10)", speed: "Swim 40 ft.",
      str: 12, dex: 15, con: 11, int: 2, wis: 12, cha: 5, senses: "Passive Perception 11",
      traits: "Charge — after moving 20 ft. straight toward a target, a ram hit deals 7 (2d6) extra damage and can knock the target prone (DC 11 STR).\nWater Breathing — breathes only underwater.",
      actions: "Ram. +3 to hit; 4 (1d6+1) bludgeoning.", tags: ["aquatic", "charge", "wild-shape"]
    })
  ];
});
