(function () {
  "use strict";

  const config = window.CatalogueConfigs?.item;
  if (!config) return;

  config.searchFields = Array.isArray(config.searchFields) ? config.searchFields : [];
  ["source", "attunement"].forEach((field) => {
    if (!config.searchFields.includes(field)) config.searchFields.push(field);
  });

  config.facets = Array.isArray(config.facets) ? config.facets : [];
  if (!config.facets.some((facet) => facet.id === "source")) {
    config.facets.push({ id: "source", label: "Source" });
  }

  const details = (config.sections || []).find((section) =>
    (section.fields || []).some((field) => field.id === "rarity")
  );

  if (details && !details.fields.some((field) => field.id === "source")) {
    const rarityIndex = details.fields.findIndex((field) => field.id === "rarity");
    details.fields.splice(rarityIndex >= 0 ? rarityIndex + 1 : details.fields.length, 0, {
      id: "source",
      label: "Source",
      type: "text",
      grid: "half",
      placeholder: "SRD 5.1, Stormwreck Isle…"
    });
  }

  config.defaults = config.defaults || {};
  if (!Object.prototype.hasOwnProperty.call(config.defaults, "source")) config.defaults.source = "";
})();
