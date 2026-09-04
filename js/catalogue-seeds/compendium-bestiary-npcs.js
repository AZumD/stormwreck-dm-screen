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
  const NOTE = "Condensed SRD 5.1 NPC quick reference, reformatted for table use. See docs/OPEN-CONTENT.md for attribution.";

  function npc(slug, name, spec = {}) {
    const id = `monster-${slug}`;
    return {
      type: "monster",
      id,
      entry: {
        id,
        name,
        size: "Medium",
        creatureType: spec.creatureType || "Humanoid (any)",
        alignment: spec.alignment || "Any alignment",
        cr: String(spec.cr ?? "0"),
        xp: String(spec.xp ?? "10"),
        source: SOURCE,
        tags: ["srd", "bestiary", "humanoid", "npc-template", ...(spec.tags || [])],
        str: spec.str ?? 10,
        dex: spec.dex ?? 10,
        con: spec.con ?? 10,
        int: spec.int ?? 10,
        wis: spec.wis ?? 10,
        cha: spec.cha ?? 10,
        ac: String(spec.ac ?? "10"),
        hp: spec.hp || "4 (1d8)",
        speed: spec.speed || "30 ft.",
        savingThrows: spec.savingThrows || "",
        skills: spec.skills || "",
        damageVulnerabilities: "",
        damageResistances: spec.damageResistances || "",
        damageImmunities: spec.damageImmunities || "",
        conditionImmunities: spec.conditionImmunities || "",
        senses: spec.senses || "Passive Perception 10",
        languages: spec.languages || "Any one language",
        skillRefs: [], traitRefs: [], actionRefs: [], bonusActionRefs: [], reactionRefs: [], legendaryActionRefs: [], spellRefs: [],
        traits: spec.traits || "",
        actions: spec.actions || "",
        bonusActions: spec.bonusActions || "",
        reactions: spec.reactions || "",
        legendaryActions: "",
        notes: NOTE
      }
    };
  }

  return [
    npc("commoner", "Commoner", {
      cr: 0, xp: 10, ac: 10, hp: "4 (1d8)",
      actions: "Club. +2 to hit; 2 (1d4) bludgeoning.", tags: ["civilian", "low-cr"]
    }),
    npc("guard", "Guard", {
      cr: "1/8", xp: 25, ac: 16, hp: "11 (2d8+2)", str: 13, dex: 12, con: 12, wis: 11,
      skills: "Perception +2", senses: "Passive Perception 12",
      actions: "Spear. +3 to hit; 4 (1d6+1) piercing, or 5 (1d8+1) two-handed; range 20/60 ft.",
      tags: ["soldier", "watch", "low-cr"]
    }),
    npc("acolyte", "Acolyte", {
      cr: "1/4", xp: 50, ac: 10, hp: "9 (2d8)", wis: 14, cha: 11,
      skills: "Medicine +4, Religion +2", senses: "Passive Perception 12", languages: "Any two languages",
      traits: "Spellcasting — 1st-level Wisdom caster (save DC 12, +4 spell attack). Typical spells: light, sacred flame, thaumaturgy; bless, cure wounds, sanctuary.",
      actions: "Club. +2 to hit; 2 (1d4) bludgeoning.", tags: ["divine", "spellcaster", "low-cr"]
    }),
    npc("noble", "Noble", {
      cr: "1/8", xp: 25, ac: 15, hp: "9 (2d8)", str: 11, dex: 12, con: 11, int: 12, wis: 14, cha: 16,
      skills: "Deception +5, Insight +4, Persuasion +5", senses: "Passive Perception 12", languages: "Any two languages",
      actions: "Rapier. +3 to hit; 5 (1d8+1) piercing.",
      reactions: "Parry — add 2 AC against one visible melee attack that would hit.", tags: ["social", "leader", "low-cr"]
    }),
    npc("tribal-warrior", "Tribal Warrior", {
      cr: "1/8", xp: 25, ac: 12, hp: "11 (2d8+2)", str: 13, dex: 11, con: 12, int: 8, wis: 11, cha: 8,
      traits: "Pack Tactics — advantage on an attack when an active ally is adjacent to the target.",
      actions: "Spear. +3 to hit; 4 (1d6+1) piercing, or 5 (1d8+1) two-handed; range 20/60 ft.", tags: ["warrior", "pack", "low-cr"]
    }),
    npc("scout", "Scout", {
      cr: "1/2", xp: 100, ac: 13, hp: "16 (3d8+3)", str: 11, dex: 14, con: 12, int: 11, wis: 13, cha: 11,
      skills: "Nature +4, Perception +5, Stealth +6, Survival +5", senses: "Passive Perception 15", languages: "Any one language",
      traits: "Keen Hearing and Sight — advantage on hearing- and sight-based Perception checks.",
      actions: "Multiattack — two melee attacks or two ranged attacks.\nShortsword. +4 to hit; 5 (1d6+2) piercing.\nLongbow. +4 to hit, range 150/600 ft.; 6 (1d8+2) piercing.", tags: ["ranger", "scout", "archer"]
    }),
    npc("thug", "Thug", {
      cr: "1/2", xp: 100, ac: 11, hp: "32 (5d8+10)", str: 15, dex: 11, con: 14, wis: 10, cha: 11,
      skills: "Intimidation +2", senses: "Passive Perception 10",
      traits: "Pack Tactics — advantage on an attack when an active ally is adjacent to the target.",
      actions: "Multiattack — two melee attacks.\nMace. +4 to hit; 5 (1d6+2) bludgeoning.\nHeavy Crossbow. +2 to hit, range 100/400 ft.; 5 (1d10) piercing.", tags: ["criminal", "brute", "pack"]
    }),
    npc("spy", "Spy", {
      cr: 1, xp: 200, ac: 12, hp: "27 (6d8)", str: 10, dex: 15, con: 10, int: 12, wis: 14, cha: 16,
      skills: "Deception +5, Insight +4, Investigation +5, Perception +6, Persuasion +5, Sleight of Hand +4, Stealth +4",
      senses: "Passive Perception 16", languages: "Any two languages",
      traits: "Cunning Action — Dash, Disengage, or Hide as a bonus action.\nSneak Attack (1/turn) — deal an extra 7 (2d6) damage when attacking with advantage or when an active ally is adjacent to the target.",
      actions: "Multiattack — two melee attacks.\nShortsword. +4 to hit; 5 (1d6+2) piercing.\nHand Crossbow. +4 to hit, range 30/120 ft.; 5 (1d6+2) piercing.", tags: ["rogue", "stealth", "social"]
    }),
    npc("berserker", "Berserker", {
      cr: 2, xp: 450, ac: 13, hp: "67 (9d8+27)", str: 16, dex: 12, con: 17, int: 9, wis: 11, cha: 9,
      traits: "Reckless — at the start of its turn, gain advantage on melee STR attacks this turn; attacks against it then have advantage until its next turn.",
      actions: "Greataxe. +5 to hit; 9 (1d12+3) slashing.", tags: ["warrior", "brute", "reckless"]
    }),
    npc("priest", "Priest", {
      cr: 2, xp: 450, ac: 13, hp: "27 (5d8+5)", con: 12, int: 13, wis: 16, cha: 13,
      skills: "Medicine +7, Persuasion +3, Religion +4", senses: "Passive Perception 13", languages: "Any two languages",
      traits: "Divine Eminence — as a bonus action, expend a spell slot so the next melee hit before the end of the turn deals extra radiant damage.\nSpellcasting — 5th-level Wisdom caster (save DC 13, +5 spell attack). Typical spells include cure wounds, guiding bolt, sanctuary, lesser restoration, spiritual weapon, dispel magic, and spirit guardians.",
      actions: "Mace. +2 to hit; 3 (1d6) bludgeoning.", tags: ["divine", "spellcaster", "healer"]
    }),
    npc("druid", "Druid", {
      cr: 2, xp: 450, ac: 11, hp: "27 (5d8+5)", dex: 12, con: 13, int: 12, wis: 15, cha: 11,
      skills: "Medicine +4, Nature +3, Perception +4", senses: "Passive Perception 14", languages: "Druidic plus any two languages",
      traits: "Spellcasting — 4th-level Wisdom caster (save DC 12, +4 spell attack). Typical spells: druidcraft, produce flame, shillelagh; entangle, longstrider, speak with animals, thunderwave; animal messenger, barkskin.",
      actions: "Quarterstaff. +2 to hit; 3 (1d6) bludgeoning, or 4 (1d8) two-handed.", tags: ["primal", "spellcaster", "nature"]
    }),
    npc("knight", "Knight", {
      cr: 3, xp: 700, ac: 18, hp: "52 (8d8+16)", str: 16, dex: 11, con: 14, int: 11, wis: 11, cha: 15,
      savingThrows: "CON +4, WIS +2", senses: "Passive Perception 10", languages: "Any one language",
      traits: "Brave — advantage on saving throws against being frightened.",
      actions: "Multiattack — two greatsword attacks.\nGreatsword. +5 to hit; 10 (2d6+3) slashing.\nHeavy Crossbow. +2 to hit, range 100/400 ft.; 5 (1d10) piercing.\nLeadership (1/rest) — for 1 minute, allies within 30 ft. who can hear the knight add 1d4 to attack rolls and saving throws.",
      reactions: "Parry — add 2 AC against one visible melee attack that would hit.", tags: ["soldier", "leader", "armored"]
    }),
    npc("veteran", "Veteran", {
      cr: 3, xp: 700, ac: 17, hp: "58 (9d8+18)", str: 16, dex: 13, con: 14, int: 10, wis: 11, cha: 10,
      skills: "Athletics +5, Perception +2", senses: "Passive Perception 12", languages: "Any one language",
      actions: "Multiattack — two longsword attacks and one shortsword attack.\nLongsword. +5 to hit; 7 (1d8+3) slashing, or 8 (1d10+3) two-handed.\nShortsword. +5 to hit; 6 (1d6+3) piercing.\nHeavy Crossbow. +3 to hit, range 100/400 ft.; 6 (1d10+1) piercing.", tags: ["soldier", "martial", "armored"]
    }),
    npc("gladiator", "Gladiator", {
      cr: 5, xp: 1800, ac: 16, hp: "112 (15d8+45)", str: 18, dex: 15, con: 16, int: 10, wis: 12, cha: 15,
      savingThrows: "STR +7, DEX +5, CON +6", skills: "Athletics +10, Intimidation +5", senses: "Passive Perception 11", languages: "Any one language",
      traits: "Brave — advantage on saves against being frightened.\nBrute — melee weapon hits deal one extra weapon damage die.",
      actions: "Multiattack — three melee attacks or two ranged attacks.\nSpear. +7 to hit; 11 (2d6+4) piercing, or 13 (2d8+4) two-handed; range 20/60 ft.\nShield Bash. +7 to hit; 9 (2d4+4) bludgeoning and target must pass DC 15 STR or fall prone.",
      reactions: "Parry — add 3 AC against one visible melee attack that would hit.", tags: ["warrior", "arena", "brute"]
    }),
    npc("mage", "Mage", {
      cr: 6, xp: 2300, ac: 12, hp: "40 (9d8)", str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11,
      savingThrows: "INT +6, WIS +4", skills: "Arcana +6, History +6", senses: "Passive Perception 11", languages: "Any four languages",
      traits: "Spellcasting — 9th-level Intelligence caster (save DC 14, +6 spell attack). Typical combat loadout includes fire bolt, mage armor, magic missile, shield, misty step, counterspell, fireball, greater invisibility, and cone of cold.",
      actions: "Dagger. +5 to hit; 4 (1d4+2) piercing.", tags: ["arcane", "spellcaster", "boss-support"]
    }),
    npc("assassin", "Assassin", {
      cr: 8, xp: 3900, ac: 15, hp: "78 (12d8+24)", str: 11, dex: 16, con: 14, int: 13, wis: 11, cha: 10,
      savingThrows: "DEX +6, INT +4", skills: "Acrobatics +6, Deception +3, Perception +3, Stealth +9", senses: "Passive Perception 13", languages: "Thieves' Cant plus any two languages",
      damageResistances: "Poison",
      traits: "Assassinate — advantage on attacks against creatures that have not acted yet in the encounter; hits against surprised creatures are critical hits.\nEvasion — successful DEX saves against half-damage effects deal no damage; failures deal half.\nSneak Attack (1/turn) — deal an extra 14 (4d6) damage when conditions are met.",
      actions: "Multiattack — two shortsword attacks.\nShortsword. +6 to hit; 6 (1d6+3) piercing plus 24 (7d6) poison, DC 15 CON for half poison.\nLight Crossbow. +6 to hit, range 80/320 ft.; 7 (1d8+3) piercing plus the same poison rider.", tags: ["rogue", "stealth", "poison", "elite"]
    }),
    npc("archmage", "Archmage", {
      cr: 12, xp: 8400, ac: 12, hp: "99 (18d8+18)", str: 10, dex: 14, con: 12, int: 20, wis: 15, cha: 16,
      savingThrows: "INT +9, WIS +6", skills: "Arcana +13, History +13", senses: "Passive Perception 12", languages: "Any six languages",
      damageResistances: "Damage from spells while protected by stoneskin or similar magic, depending on prepared defenses",
      traits: "Magic Resistance — advantage on saving throws against spells and other magical effects.\nSpellcasting — 18th-level Intelligence caster (save DC 17, +9 spell attack). Typical high-impact options include counterspell, fireball, banishment, cone of cold, globe of invulnerability, teleport, mind blank, and time stop.",
      actions: "Dagger. +6 to hit; 4 (1d4+2) piercing.", tags: ["arcane", "spellcaster", "elite", "boss"]
    })
  ];
});
