(function () {
  "use strict";

  const config = window.CatalogueConfigs?.monster;
  if (!config) return;

  function creatureFamily(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const swarm = text.match(/^Swarm of Tiny\s+(.+)$/i);
    if (swarm) return "Beast";
    return text.replace(/\s*\([^)]*\)\s*$/, "").trim();
  }

  // Promote compact beast tags into the primary taxonomy and derive a stable
  // family for grouping. This keeps Humanoid (goblinoid), Humanoid (any), etc.
  // together instead of exploding the sidebar into dozens of tiny groups.
  (window.CatalogueSeeds?.monster || []).forEach((entry) => {
    if (!entry) return;
    if (!entry.creatureType && Array.isArray(entry.tags) && entry.tags.includes("beast")) {
      entry.creatureType = "Beast";
    }
    entry.creatureFamily = creatureFamily(entry.creatureType);
  });

  config.groupBy = "creatureFamily";
  config.groupOrder = [
    "Aberration",
    "Beast",
    "Celestial",
    "Construct",
    "Dragon",
    "Elemental",
    "Fey",
    "Fiend",
    "Giant",
    "Humanoid",
    "Monstrosity",
    "Ooze",
    "Plant",
    "Undead"
  ];

  config.searchFields = Array.isArray(config.searchFields) ? config.searchFields : [];
  ["creatureFamily", "damageVulnerabilities", "damageResistances", "damageImmunities", "conditionImmunities"].forEach((field) => {
    if (!config.searchFields.includes(field)) config.searchFields.push(field);
  });

  config.facets = Array.isArray(config.facets) ? config.facets : [];
  const typeFacet = config.facets.find((facet) => facet.id === "creatureType");
  if (typeFacet) {
    typeFacet.id = "creatureFamily";
    typeFacet.label = "Family";
  } else if (!config.facets.some((facet) => facet.id === "creatureFamily")) {
    config.facets.unshift({ id: "creatureFamily", label: "Family" });
  }

  const combat = (config.sections || []).find((section) =>
    (section.fields || []).some((field) => field.id === "damageResistances")
  );

  if (combat && !combat.fields.some((field) => field.id === "damageVulnerabilities")) {
    const resistanceIndex = combat.fields.findIndex((field) => field.id === "damageResistances");
    const field = {
      id: "damageVulnerabilities",
      label: "Damage vulnerabilities",
      type: "text",
      grid: "half"
    };
    combat.fields.splice(resistanceIndex >= 0 ? resistanceIndex : combat.fields.length, 0, field);
  }

  config.defaults = config.defaults || {};
  if (!Object.prototype.hasOwnProperty.call(config.defaults, "damageVulnerabilities")) {
    config.defaults.damageVulnerabilities = "";
  }
  if (!Object.prototype.hasOwnProperty.call(config.defaults, "creatureFamily")) {
    config.defaults.creatureFamily = "";
  }
})();
