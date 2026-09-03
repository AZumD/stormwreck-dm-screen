(function () {
  "use strict";

  if (window.RuleCatalogueExtension?.installed) return;

  const state = {
    config: false,
    converter: false,
    compendium: false,
    i18n: false,
    seedsMerged: false,
    rebuilding: false,
    attempts: 0
  };

  function asArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (value == null || String(value).trim() === "") return [];
    return [String(value).trim()];
  }

  function pickStats(obj) {
    const out = {};
    Object.entries(obj || {}).forEach(([key, value]) => {
      if (value != null && String(value).trim() !== "") out[key] = String(value);
    });
    return out;
  }

  function relatedBlock(refs) {
    const list = asArray(refs);
    if (!list.length) return "";
    return `**Related rules:**\n${list.map((ref) => `- ${ref}`).join("\n")}`;
  }

  function ruleToEntity(entry) {
    const id = String(entry?.id || "").trim();
    const name = String(entry?.name || id || "Rule");
    const blocks = [
      entry.quickReference && `**Quick reference**\n${entry.quickReference}`,
      entry.details,
      entry.editionNotes && `**Edition notes**\n${entry.editionNotes}`,
      relatedBlock(entry.relatedRefs),
      entry.notes && `**Notes**\n${entry.notes}`
    ].filter(Boolean);

    return {
      id,
      catalogueId: id,
      type: "rule",
      name,
      summary: String(entry.summary || entry.quickReference || "").slice(0, 180),
      stats: pickStats({ Category: entry.category, Rulesets: entry.rulesets }),
      details: blocks.join("\n\n"),
      tags: [
        ...asArray(entry.tags),
        ...asArray(entry.keywords),
        entry.category,
        entry.rulesets,
        entry.summary
      ].filter(Boolean)
    };
  }

  function installConfig() {
    if (state.config) return true;
    if (!window.CatalogueConfigs) return false;

    window.CatalogueConfigs.rule = {
      type: "rule",
      title: "Rules Catalogue",
      subtitle: "Fast, searchable cheat sheets for the rules you actually reach for during play.",
      newLabel: "New rule",
      searchPlaceholder: "Search rules, terms, situations…",
      listIcon: "§",
      searchFields: [
        "name",
        "summary",
        "category",
        "rulesets",
        "quickReference",
        "details",
        "editionNotes",
        "tags",
        "keywords",
        "relatedRefs",
        "notes"
      ],
      facets: [
        { id: "category", label: "Category" },
        { id: "rulesets", label: "Ruleset" }
      ],
      groupBy: "category",
      groupLabels: { "": "Uncategorized" },
      listMeta: ["category", "rulesets"],
      sections: [
        {
          title: "Rule",
          fields: [
            { id: "name", label: "Name", type: "text", required: true, grid: "full" },
            {
              id: "category",
              label: "Category",
              type: "select",
              grid: "half",
              options: [
                "Core Mechanics",
                "Abilities",
                "Combat",
                "Movement",
                "Conditions",
                "Magic",
                "Rest & Recovery",
                "Exploration",
                "Other"
              ]
            },
            {
              id: "rulesets",
              label: "Ruleset",
              type: "select",
              grid: "half",
              options: ["2014 / 2024", "2014 vs 2024", "2014", "2024"]
            },
            { id: "summary", label: "One-line summary", type: "textarea", rows: 2, grid: "full" }
          ]
        },
        {
          title: "Cheat sheet",
          fields: [
            {
              id: "quickReference",
              label: "Quick reference",
              type: "textarea",
              rows: 8,
              grid: "full",
              placeholder: "The table-facing answer: numbers, action cost, common procedure, exceptions…"
            },
            {
              id: "details",
              label: "Details / adjudication",
              type: "textarea",
              rows: 6,
              grid: "full",
              placeholder: "Useful nuance, edge cases, and DM guidance."
            },
            {
              id: "editionNotes",
              label: "Edition notes",
              type: "textarea",
              rows: 4,
              grid: "full",
              placeholder: "Only when 2014 and 2024 meaningfully differ."
            }
          ]
        },
        {
          title: "Find & connect",
          fields: [
            {
              id: "tags",
              label: "Search aliases / tags",
              type: "list",
              grid: "full",
              placeholder: "constitution, con, concentration…",
              hint: "Add the words you are likely to type while running the game."
            },
            {
              id: "relatedRefs",
              label: "Related rules",
              type: "list",
              refType: "rule",
              grid: "full",
              searchPlaceholder: "Search rules…",
              placeholder: "Link another rule…"
            },
            { id: "notes", label: "Personal notes", type: "textarea", rows: 3, grid: "full" }
          ]
        }
      ],
      defaults: {
        name: "Unnamed rule",
        category: "Core Mechanics",
        rulesets: "2014 / 2024",
        summary: "",
        quickReference: "",
        details: "",
        editionNotes: "",
        tags: [],
        relatedRefs: [],
        notes: ""
      }
    };

    state.config = true;
    return true;
  }

  function installConverter() {
    if (state.converter) return true;
    if (!window.EntityRegistry?.register) return false;
    window.EntityRegistry.register("rule", ruleToEntity);
    state.converter = true;
    return true;
  }

  function installCompendium() {
    if (state.compendium) return true;
    const compendium = window.CompendiumApp;
    if (!compendium) return false;

    compendium.LABELS.rule = "Rules";
    const rules = compendium.GROUPS.find((group) => group.id === "rules");
    if (rules && !rules.types.includes("rule")) rules.types.unshift("rule");
    if (!compendium.ALL_TYPES.includes("rule")) compendium.ALL_TYPES.push("rule");

    state.compendium = true;
    return true;
  }

  function installI18n() {
    if (state.i18n) return true;
    if (!window.I18N) return false;
    window.I18N.typeLabels = window.I18N.typeLabels || {};
    window.I18N.typeLabels.rule = "Rule";
    state.i18n = true;
    return true;
  }

  async function mergeSeedsAndRebuild() {
    if (state.seedsMerged || state.rebuilding) return state.seedsMerged;
    if (!window.CatalogueSeeds?.rule?.length) return false;
    if (!window.CatalogueStore?.mergeSeeds || !window.EntityRegistry?.build) return false;
    if (window.CatalogueStore.isReady && !window.CatalogueStore.isReady()) return false;

    state.rebuilding = true;
    try {
      await window.CatalogueStore.mergeSeeds("rule", window.CatalogueSeeds.rule);
      await window.EntityRegistry.build();
      state.seedsMerged = true;
      return true;
    } catch (err) {
      console.warn("Rules catalogue seed merge failed", err);
      return false;
    } finally {
      state.rebuilding = false;
    }
  }

  function install() {
    installConfig();
    installConverter();
    installCompendium();
    installI18n();
    void mergeSeedsAndRebuild();

    return state.config && state.converter && state.i18n;
  }

  install();

  const timer = setInterval(() => {
    state.attempts += 1;
    const coreReady = install();
    if ((coreReady && state.seedsMerged) || state.attempts > 240) clearInterval(timer);
  }, 50);

  window.RuleCatalogueExtension = {
    installed: true,
    install,
    ruleToEntity,
    state
  };
})();
