(function (root, factory) {
  "use strict";

  const manifest = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = manifest;
  }

  if (root) {
    root.CatalogueSeeds = root.CatalogueSeeds || {};
    const byType = new Map();
    manifest.forEach((seed) => {
      if (!seed?.type || !seed?.entry?.id) return;
      if (!byType.has(seed.type)) byType.set(seed.type, []);
      byType.get(seed.type).push(seed.entry);
    });
    byType.forEach((entries, type) => {
      const existing = Array.isArray(root.CatalogueSeeds[type]) ? root.CatalogueSeeds[type] : [];
      const ids = new Set(existing.map((entry) => entry?.id).filter(Boolean));
      root.CatalogueSeeds[type] = existing.concat(entries.filter((entry) => !ids.has(entry.id)));
    });
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const SPECIES_NOTE = "Compendium expansion summary. This entry intentionally paraphrases the playable concept instead of reproducing sourcebook rules text.";
  const FLEX_ASI = "Uses the flexible ability-score model in its later 5e presentation; use background-based increases when adapting to 2024 rules.";

  function species(id, name, source, summary, extra = {}) {
    return {
      type: "race",
      id,
      entry: {
        id,
        name,
        entryKind: "species",
        source,
        size: extra.size || "Medium",
        speed: extra.speed || "30 ft.",
        summary,
        description: summary,
        rulesets: extra.rulesets || ["2014", "2024"],
        abilityScoreIncrease: extra.abilityScoreIncrease || FLEX_ASI,
        featureRefs: [],
        traits: extra.traits || "",
        languages: extra.languages || "",
        senses: extra.senses || "",
        notes: extra.notes || SPECIES_NOTE,
        tags: ["species", "compendium-expansion", ...(extra.tags || [])]
      }
    };
  }

  function lineage(id, name, parentId, parentName, source, summary, extra = {}) {
    return {
      type: "race",
      id,
      entry: {
        id,
        name,
        entryKind: "subspecies",
        parentSpeciesRef: `@race:${parentId}|${parentName}`,
        source,
        size: extra.size || "Small or Medium",
        speed: extra.speed || "30 ft.",
        summary,
        description: summary,
        rulesets: extra.rulesets || ["2014", "2024"],
        abilityScoreIncrease: extra.abilityScoreIncrease || FLEX_ASI,
        featureRefs: [],
        traits: extra.traits || "",
        languages: extra.languages || "",
        senses: extra.senses || "",
        notes: extra.notes || SPECIES_NOTE,
        tags: ["subspecies", "lineage", "compendium-expansion", ...(extra.tags || [])]
      }
    };
  }

  return [
    species(
      "race-grung",
      "Grung",
      "One Grung Above",
      "Small, brightly colored frogfolk whose arboreal agility and toxic skin make them memorable wilderness adventurers.",
      {
        size: "Small",
        speed: "25 ft., climb 25 ft.",
        rulesets: ["2014"],
        abilityScoreIncrease: "Original presentation uses fixed ability increases; use an appropriate flexible or background-based model when adapting to newer rules.",
        traits: "Amphibious climber with poison immunity, poisonous skin, powerful jumping ability, and a biological need for regular access to water.",
        languages: "Grung",
        tags: ["frog", "poison", "climber"]
      }
    ),
    species(
      "race-kender",
      "Kender",
      "Dragonlance",
      "Small wanderers from Krynn, famous for fearless curiosity, quick hands, social boldness, and a talent for getting under an enemy's skin.",
      {
        size: "Small",
        traits: "Fear-resistant, nimble wanderer with a supernatural knack for taunting foes and producing unexpectedly useful odds and ends.",
        tags: ["dragonlance", "krynn", "fearless"]
      }
    ),
    species(
      "race-locathah",
      "Locathah",
      "Locathah Rising",
      "Aquatic fishfolk adapted to life beneath the waves, physically hardy but dependent on regular immersion in water.",
      {
        speed: "30 ft., swim 30 ft.",
        rulesets: ["2014"],
        abilityScoreIncrease: "Original presentation uses fixed ability increases; use an appropriate flexible or background-based model when adapting to newer rules.",
        traits: "Amphibious swimmer with natural defenses, strong aquatic instincts, and limited tolerance for remaining dry for long stretches.",
        languages: "Aquan, Common",
        tags: ["aquatic", "swimmer"]
      }
    ),
    species(
      "race-verdan",
      "Verdan",
      "Acquisitions Incorporated",
      "Mutable goblinoid-descended people transformed by chaotic magic, notable for telepathic sensitivity and bodies that continue changing as they mature.",
      {
        size: "Small; becomes Medium later",
        rulesets: ["2014"],
        abilityScoreIncrease: "Original presentation uses fixed ability increases; use an appropriate flexible or background-based model when adapting to newer rules.",
        traits: "Unusually mutable physiology, limited telepathic communication, strong social intuition, and rapid restorative resilience.",
        languages: "Common, Goblin + one of your choice",
        tags: ["goblinoid", "telepathy", "mutable"]
      }
    ),

    lineage(
      "subspecies-genasi-air",
      "Air Genasi",
      "race-genasi",
      "Genasi",
      "MotM",
      "Genasi aligned with elemental air, carrying restless mobility, storm-touched magic, and an instinctive relationship with breath and wind.",
      {
        speed: "35 ft.",
        traits: "Air-aspected elemental resilience and innate wind or lightning-flavored magic; unusually comfortable where breath and altitude would trouble others.",
        tags: ["genasi", "elemental", "air"]
      }
    ),
    lineage(
      "subspecies-genasi-earth",
      "Earth Genasi",
      "race-genasi",
      "Genasi",
      "MotM",
      "Earth-aligned genasi whose magic expresses stone, grounded endurance, and effortless movement across difficult terrain.",
      {
        traits: "Earth-aspected resilience, terrain affinity, and innate protective or stealth-oriented magic tied to stone and soil.",
        tags: ["genasi", "elemental", "earth"]
      }
    ),
    lineage(
      "subspecies-genasi-fire",
      "Fire Genasi",
      "race-genasi",
      "Genasi",
      "MotM",
      "Fire-aligned genasi with heat in their blood, resistance to flame, darkvision, and innate fire magic.",
      {
        traits: "Fire resistance, darkvision, and innate flame-themed spellcasting that grows as the character advances.",
        senses: "Darkvision 60 ft.",
        tags: ["genasi", "elemental", "fire"]
      }
    ),
    lineage(
      "subspecies-genasi-water",
      "Water Genasi",
      "race-genasi",
      "Genasi",
      "MotM",
      "Water-aligned genasi equally comfortable above and below the surface, with aquatic movement and magic shaped by tides and flowing water.",
      {
        speed: "30 ft., swim 30 ft.",
        traits: "Amphibious, resistant to acid, naturally capable in water, and gifted with innate water-themed magic.",
        tags: ["genasi", "elemental", "water", "aquatic"]
      }
    ),

    lineage(
      "subspecies-shifter-beasthide",
      "Beasthide Shifter",
      "race-shifter",
      "Shifter",
      "Eberron / MotM",
      "A shifter lineage whose transformation emphasizes thick hide, stubborn endurance, and surviving the hit that should have dropped you.",
      {
        traits: "Shifting favors temporary durability and stronger physical defenses.",
        tags: ["shifter", "defense", "durability"]
      }
    ),
    lineage(
      "subspecies-shifter-longtooth",
      "Longtooth Shifter",
      "race-shifter",
      "Shifter",
      "Eberron / MotM",
      "A predatory shifter lineage whose transformation brings powerful jaws and close-quarters aggression to the surface.",
      {
        traits: "Shifting emphasizes a natural bite and offensive pressure in melee.",
        tags: ["shifter", "melee", "natural-weapon"]
      }
    ),
    lineage(
      "subspecies-shifter-swiftstride",
      "Swiftstride Shifter",
      "race-shifter",
      "Shifter",
      "Eberron / MotM",
      "A quick-footed shifter lineage built around speed, evasive repositioning, and keeping exactly the wrong distance from an enemy.",
      {
        traits: "Shifting increases mobility and rewards slipping away from enemies at the right moment.",
        tags: ["shifter", "speed", "movement"]
      }
    ),
    lineage(
      "subspecies-shifter-wildhunt",
      "Wildhunt Shifter",
      "race-shifter",
      "Shifter",
      "Eberron / MotM",
      "A keen-sensed shifter lineage focused on tracking, awareness, and refusing to give nearby enemies an easy opening.",
      {
        traits: "Shifting sharpens awareness and makes the character unusually difficult to catch off guard in close quarters.",
        tags: ["shifter", "senses", "tracking"]
      }
    ),

    lineage(
      "subspecies-tiefling-abyssal",
      "Abyssal Tiefling",
      "race-tiefling",
      "Tiefling",
      "Core / 2024 rules",
      "A tiefling legacy touched by the Abyss, expressing itself through poison resistance and corrosive or debilitating innate magic.",
      {
        rulesets: ["2024"],
        traits: "Abyssal fiendish legacy centered on poison resilience and innate magic with a toxic, wasting character.",
        tags: ["tiefling", "fiend", "abyssal", "2024"]
      }
    ),
    lineage(
      "subspecies-tiefling-chthonic",
      "Chthonic Tiefling",
      "race-tiefling",
      "Tiefling",
      "Core / 2024 rules",
      "A tiefling legacy connected to lower-planar powers of death and shadow, carrying necrotic resilience and grave-touched magic.",
      {
        rulesets: ["2024"],
        traits: "Chthonic fiendish legacy centered on necrotic resilience and innate magic associated with death, shadow, and weakening foes.",
        tags: ["tiefling", "fiend", "chthonic", "2024"]
      }
    ),
    lineage(
      "subspecies-tiefling-infernal",
      "Infernal Tiefling",
      "race-tiefling",
      "Tiefling",
      "Core / 2024 rules",
      "The classic hell-touched tiefling legacy, marked by fire resistance and innate infernal magic.",
      {
        rulesets: ["2024"],
        traits: "Infernal fiendish legacy centered on fire resilience and innate magic drawn from the Hells.",
        tags: ["tiefling", "fiend", "infernal", "2024"]
      }
    ),

    lineage(
      "subspecies-aasimar-protector",
      "Protector Aasimar",
      "race-aasimar",
      "Aasimar",
      "Volo's Guide",
      "A legacy aasimar expression whose celestial revelation manifests as radiant wings and an overtly guardian-like presence.",
      {
        rulesets: ["2014"],
        traits: "Legacy celestial transformation focused on flight and radiant power.",
        notes: "Legacy 2014 aasimar sublineage from an older presentation. Later aasimar rules consolidate these transformations differently.",
        tags: ["aasimar", "celestial", "legacy", "flight"]
      }
    ),
    lineage(
      "subspecies-aasimar-scourge",
      "Scourge Aasimar",
      "race-aasimar",
      "Aasimar",
      "Volo's Guide",
      "A legacy aasimar expression that turns celestial power outward as a dangerous aura of searing radiance.",
      {
        rulesets: ["2014"],
        traits: "Legacy celestial transformation focused on a close-range radiant aura that is dangerous even to its wielder.",
        notes: "Legacy 2014 aasimar sublineage from an older presentation. Later aasimar rules consolidate these transformations differently.",
        tags: ["aasimar", "celestial", "legacy", "radiant"]
      }
    ),
    lineage(
      "subspecies-aasimar-fallen",
      "Fallen Aasimar",
      "race-aasimar",
      "Aasimar",
      "Volo's Guide",
      "A legacy aasimar expression shadowed by severed or corrupted celestial influence, manifesting as a terrifying necrotic revelation.",
      {
        rulesets: ["2014"],
        traits: "Legacy celestial transformation focused on fear and necrotic power.",
        notes: "Legacy 2014 aasimar sublineage from an older presentation. Later aasimar rules consolidate these transformations differently.",
        tags: ["aasimar", "celestial", "legacy", "necrotic"]
      }
    )
  ];
});
