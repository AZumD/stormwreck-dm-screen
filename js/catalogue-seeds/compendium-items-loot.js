(function (root, factory) {
  "use strict";

  const manifest = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = manifest;

  if (root) {
    root.CatalogueSeeds = root.CatalogueSeeds || {};
    const entries = manifest.map((seed) => seed.entry);
    const existing = Array.isArray(root.CatalogueSeeds.item) ? root.CatalogueSeeds.item : [];
    const ids = new Set(existing.map((entry) => entry?.id).filter(Boolean));
    root.CatalogueSeeds.item = existing.concat(entries.filter((entry) => !ids.has(entry.id)));
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const SOURCE = "SRD 5.1 (CC BY 4.0)";
  const NOTE = "SRD 5.1 treasure/trade reference. See docs/OPEN-CONTENT.md for attribution.";

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function entry(slug, name, spec = {}) {
    const id = `item-srd-${slug}`;
    return {
      type: "item",
      id,
      entry: {
        id,
        name,
        category: spec.category || "Treasure & Valuable",
        itemType: spec.itemType || "Valuable",
        rarity: "",
        source: SOURCE,
        value: spec.value || "",
        weight: spec.weight || "",
        attunement: false,
        tags: ["srd", ...(spec.tags || [])],
        description: spec.description || "Trade or treasure reference from the SRD.",
        properties: spec.properties || "",
        notes: NOTE
      }
    };
  }

  function trade(slug, name, value, weight = "1 lb.", extra = {}) {
    return entry(`trade-${slug}`, name, {
      category: "Trade Good",
      itemType: "Trade good",
      value,
      weight,
      tags: ["trade", ...(extra.tags || [])],
      description: extra.description || "Common trade good with a standard reference value."
    });
  }

  function gem(name, value) {
    return entry(`gem-${slugify(name)}`, name, {
      category: "Treasure & Valuable",
      itemType: "Gemstone",
      value,
      tags: ["treasure", "gemstone", `gem-${value.replace(/\s+/g, "-").toLowerCase()}`],
      description: `${value} gemstone from the SRD treasure tables.`
    });
  }

  const tradeGoods = [
    trade("wheat", "Wheat (1 lb.)", "1 cp", "1 lb.", { tags: ["food", "grain"] }),
    trade("flour", "Flour (1 lb.)", "2 cp", "1 lb.", { tags: ["food", "grain"] }),
    trade("salt", "Salt (1 lb.)", "5 cp", "1 lb.", { tags: ["food", "preservative"] }),
    trade("iron", "Iron (1 lb.)", "1 sp", "1 lb.", { tags: ["metal", "smithing"] }),
    trade("canvas", "Canvas (1 sq. yd.)", "1 sp", "", { tags: ["cloth", "textile"] }),
    trade("copper", "Copper (1 lb.)", "5 sp", "1 lb.", { tags: ["metal"] }),
    trade("cotton", "Cotton Cloth (1 sq. yd.)", "5 sp", "", { tags: ["cloth", "textile"] }),
    trade("ginger", "Ginger (1 lb.)", "1 gp", "1 lb.", { tags: ["spice", "food"] }),
    trade("cinnamon", "Cinnamon (1 lb.)", "2 gp", "1 lb.", { tags: ["spice", "food"] }),
    trade("pepper", "Pepper (1 lb.)", "2 gp", "1 lb.", { tags: ["spice", "food"] }),
    trade("cloves", "Cloves (1 lb.)", "3 gp", "1 lb.", { tags: ["spice", "food"] }),
    trade("silver", "Silver (1 lb.)", "5 gp", "1 lb.", { tags: ["metal", "precious"] }),
    trade("linen", "Linen (1 sq. yd.)", "5 gp", "", { tags: ["cloth", "textile"] }),
    trade("silk", "Silk (1 sq. yd.)", "10 gp", "", { tags: ["cloth", "textile", "luxury"] }),
    trade("saffron", "Saffron (1 lb.)", "15 gp", "1 lb.", { tags: ["spice", "luxury"] }),
    trade("gold", "Gold (1 lb.)", "50 gp", "1 lb.", { tags: ["metal", "precious"] }),
    trade("platinum", "Platinum (1 lb.)", "500 gp", "1 lb.", { tags: ["metal", "precious", "luxury"] })
  ];

  const gems10 = [
    "Azurite", "Banded Agate", "Blue Quartz", "Eye Agate", "Hematite", "Lapis Lazuli",
    "Malachite", "Moss Agate", "Obsidian", "Rhodochrosite", "Tiger Eye", "Turquoise"
  ].map((name) => gem(name, "10 gp"));

  const gems50 = [
    "Bloodstone", "Carnelian", "Chalcedony", "Chrysoprase", "Citrine", "Jasper",
    "Moonstone", "Onyx", "Quartz", "Sardonyx", "Star Rose Quartz", "Zircon"
  ].map((name) => gem(name, "50 gp"));

  const gems100 = [
    "Amber", "Amethyst", "Chrysoberyl", "Coral", "Garnet", "Jade", "Jet", "Pearl", "Spinel", "Tourmaline"
  ].map((name) => gem(name, "100 gp"));

  const gems500 = [
    "Alexandrite", "Aquamarine", "Black Pearl", "Blue Spinel", "Peridot", "Topaz"
  ].map((name) => gem(name, "500 gp"));

  const gems1000 = [
    "Black Opal", "Blue Sapphire", "Emerald", "Fire Opal", "Opal", "Star Ruby", "Star Sapphire", "Yellow Sapphire"
  ].map((name) => gem(name, "1,000 gp"));

  const gems5000 = [
    "Black Sapphire", "Diamond", "Jacinth", "Ruby"
  ].map((name) => gem(name, "5,000 gp"));

  return [...tradeGoods, ...gems10, ...gems50, ...gems100, ...gems500, ...gems1000, ...gems5000];
});
