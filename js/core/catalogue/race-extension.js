(function () {
  "use strict";

  const config = window.CatalogueConfigs?.race;
  if (!config) return;

  config.searchFields = Array.isArray(config.searchFields) ? config.searchFields : [];
  ["rulesets", "abilityScoreIncrease", "tags"].forEach((field) => {
    if (!config.searchFields.includes(field)) config.searchFields.push(field);
  });

  config.facets = Array.isArray(config.facets) ? config.facets : [];
  if (!config.facets.some((facet) => facet.id === "source")) {
    config.facets.push({ id: "source", label: "Source" });
  }

  const identity = (config.sections || []).find((section) =>
    (section.fields || []).some((field) => field.id === "source")
  );
  if (identity && !identity.fields.some((field) => field.id === "rulesets")) {
    const sourceIndex = identity.fields.findIndex((field) => field.id === "source");
    identity.fields.splice(sourceIndex >= 0 ? sourceIndex + 1 : identity.fields.length, 0, {
      id: "rulesets",
      label: "Rulesets",
      type: "list",
      grid: "half",
      placeholder: "2014, 2024…"
    });
  }

  const notes = (config.sections || []).find((section) =>
    (section.fields || []).some((field) => field.id === "notes")
  );
  if (notes && !notes.fields.some((field) => field.id === "tags")) {
    notes.fields.push({
      id: "tags",
      label: "Tags",
      type: "list",
      grid: "full",
      placeholder: "aquatic, flying, legacy…"
    });
  }

  config.defaults = config.defaults || {};
  if (!Array.isArray(config.defaults.rulesets)) config.defaults.rulesets = [];
  if (!Array.isArray(config.defaults.tags)) config.defaults.tags = [];
})();
