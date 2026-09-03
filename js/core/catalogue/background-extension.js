(function () {
  "use strict";

  const types = window.CatalogueTypes?.TYPES;
  if (Array.isArray(types) && !types.some((entry) => entry.id === "background")) {
    types.push({ id: "background", label: "Background", linkable: true, folder: "background-katalog" });
  }

  if (window.CatalogueConfigs) {
    window.CatalogueConfigs.background = {
      type: "background",
      title: "Background Catalogue",
      subtitle: "Character origins, revised ability options, origin feats, and story hooks.",
      newLabel: "New background",
      searchPlaceholder: "Search backgrounds…",
      listIcon: "◇",
      searchFields: [
        "name",
        "source",
        "rulesets",
        "abilityScoreOptions",
        "summary",
        "description",
        "notes"
      ],
      facets: [{ id: "source", label: "Source" }],
      groupBy: "source",
      groupLabels: { "": "Uncategorized" },
      listMeta: ["source", "rulesets"],
      sections: [
        {
          title: "Identity",
          fields: [
            { id: "name", label: "Name", type: "text", required: true, grid: "full" },
            { id: "source", label: "Source", type: "text", grid: "half" },
            { id: "rulesets", label: "Rulesets", type: "text", grid: "half", placeholder: "2014, 2024" }
          ]
        },
        {
          title: "Character creation",
          fields: [
            {
              id: "abilityScoreOptions",
              label: "Ability score options",
              type: "textarea",
              rows: 2,
              grid: "full"
            },
            {
              id: "originFeatRefs",
              label: "Origin feat",
              type: "list",
              refType: "feature",
              grid: "full",
              searchPlaceholder: "Search feature catalogue…",
              placeholder: "Link an origin feat…",
              hint: "2024 backgrounds can link their granted origin feat from the Feature Catalogue."
            }
          ]
        },
        {
          title: "Description",
          fields: [
            { id: "summary", label: "Summary", type: "textarea", rows: 2, grid: "full" },
            { id: "description", label: "Description", type: "textarea", rows: 4, grid: "full" },
            { id: "notes", label: "Notes", type: "textarea", rows: 3, grid: "full" }
          ]
        }
      ],
      defaults: {
        name: "Unnamed background",
        source: "",
        rulesets: "",
        abilityScoreOptions: "",
        originFeatRefs: [],
        summary: "",
        description: "",
        notes: ""
      }
    };
  }

  const compendium = window.CompendiumApp;
  if (!compendium) return;

  compendium.LABELS.background = "Backgrounds";

  const rules = compendium.GROUPS.find((group) => group.id === "rules");
  if (rules && !rules.types.includes("background")) {
    const raceIndex = rules.types.indexOf("race");
    rules.types.splice(raceIndex >= 0 ? raceIndex + 1 : rules.types.length, 0, "background");
  }

  if (!compendium.ALL_TYPES.includes("background")) {
    compendium.ALL_TYPES.push("background");
  }
})();
