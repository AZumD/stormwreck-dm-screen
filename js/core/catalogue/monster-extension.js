(function () {
  "use strict";

  const config = window.CatalogueConfigs?.monster;
  if (!config) return;

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
