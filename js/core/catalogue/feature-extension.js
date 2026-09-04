(function () {
  "use strict";

  const config = window.CatalogueConfigs?.feature;
  if (!config) return;

  config.groupOrder = [
    "Class feature",
    "Subclass feature",
    "Species feature",
    "Background feature",
    "Origin Feat",
    "Feat",
    "Monster trait",
    "Monster action",
    "Monster bonus action",
    "Monster reaction",
    "Legendary action",
    "Other"
  ];

  const featureTypeField = (config.sections || [])
    .flatMap((section) => section.fields || [])
    .find((field) => field.id === "featureType");

  if (featureTypeField && Array.isArray(featureTypeField.options) && !featureTypeField.options.includes("Origin Feat")) {
    const featIndex = featureTypeField.options.indexOf("Feat");
    featureTypeField.options.splice(featIndex >= 0 ? featIndex : featureTypeField.options.length, 0, "Origin Feat");
  }
})();
