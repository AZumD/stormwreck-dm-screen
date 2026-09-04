(function () {
  "use strict";

  const config = window.CatalogueConfigs?.monster;
  if (!config) return;

  // Some compact bestiary seed helpers identify ordinary animals by tag. Promote
  // that tag into the catalogue's primary taxonomy so they group under Beast
  // instead of falling into Uncategorized.
  (window.CatalogueSeeds?.monster || []).forEach((entry) => {
    if (!entry || entry.creatureType) return;
    if (Array.isArray(entry.tags) && entry.tags.includes("beast")) entry.creatureType = "Beast";
  });

  config.searchFields = Array.isArray(config.searchFields) ? config.searchFields : [];
  ["damageVulnerabilities", "damageResistances", "damageImmunities", "conditionImmunities"].forEach((field) => {
    if (!config.searchFields.includes(field)) config.searchFields.push(field);
  });

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
})();
