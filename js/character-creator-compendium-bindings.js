(function () {
  "use strict";

  const SKILLS = [
    "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History",
    "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception",
    "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"
  ];

  const CLASS_SKILLS = {
    Artificer: { count: 2, skills: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Perception", "Sleight of Hand"] },
    Barbarian: { count: 2, skills: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"] },
    Bard: { count: 3, skills: "*" },
    Cleric: { count: 2, skills: ["History", "Insight", "Medicine", "Persuasion", "Religion"] },
    Druid: { count: 2, skills: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"] },
    Fighter: { count: 2, skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"] },
    Monk: { count: 2, skills: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"] },
    Paladin: { count: 2, skills: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"] },
    Ranger: { count: 3, skills: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
    Rogue: { count: 4, skills: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"] },
    Sorcerer: { count: 2, skills: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"] },
    Warlock: { count: 2, skills: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"] },
    Wizard: { count: 2, skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"] }
  };

  function slugify(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[’']/g, "-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function catalogueId(type, name) {
    const safeType = String(type || "").toLowerCase();
    const slug = slugify(name);
    if (safeType === "feature") return `feature-${slug}`;
    return `${safeType}-${slug}`;
  }

  function featId(name) {
    return `feature-feat-${slugify(name)}`;
  }

  function ref(type, name) {
    return `@${type}:${catalogueId(type, name)}|${String(name || "").replace(/\|/g, "/")}`;
  }

  function featRef(name) {
    return `@feature:${featId(name)}|${String(name || "").replace(/\|/g, "/")}`;
  }

  function skillsForClass(className) {
    const config = CLASS_SKILLS[className];
    if (!config) return { count: 0, skills: [] };
    return {
      count: config.count,
      skills: config.skills === "*" ? SKILLS.slice() : config.skills.slice()
    };
  }

  window.StormwreckCharacterCreatorCompendium = {
    SKILLS,
    CLASS_SKILLS,
    slugify,
    catalogueId,
    featId,
    ref,
    featRef,
    skillsForClass
  };
})();