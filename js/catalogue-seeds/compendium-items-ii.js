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
  const NOTE = "Condensed SRD 5.1 equipment reference. See docs/OPEN-CONTENT.md for attribution.";

  function item(slug, name, spec = {}) {
    const id = `item-srd-${slug}`;
    return {
      type: "item",
      id,
      entry: {
        id,
        name,
        category: spec.category || "Adventuring Gear",
        itemType: spec.itemType || "Gear",
        rarity: spec.rarity || "",
        source: SOURCE,
        value: spec.value || "",
        weight: spec.weight || "",
        attunement: false,
        tags: ["srd", ...(spec.tags || ["gear"])],
        description: spec.description || "Standard adventuring equipment from the SRD.",
        properties: spec.properties || "",
        notes: NOTE
      }
    };
  }

  const ammunition = [
    item("arrows-20", "Arrows (20)", { category: "Ammunition", itemType: "Arrows", value: "1 gp", weight: "1 lb.", tags: ["ammunition", "bow"] }),
    item("blowgun-needles-50", "Blowgun Needles (50)", { category: "Ammunition", itemType: "Blowgun needles", value: "1 gp", weight: "1 lb.", tags: ["ammunition", "blowgun"] }),
    item("crossbow-bolts-20", "Crossbow Bolts (20)", { category: "Ammunition", itemType: "Bolts", value: "1 gp", weight: "1½ lb.", tags: ["ammunition", "crossbow"] }),
    item("sling-bullets-20", "Sling Bullets (20)", { category: "Ammunition", itemType: "Sling bullets", value: "4 cp", weight: "1½ lb.", tags: ["ammunition", "sling"] })
  ];

  const gear = [
    item("backpack", "Backpack", { value: "2 gp", weight: "5 lb.", itemType: "Container", tags: ["gear", "container", "travel"], properties: "Capacity: 1 cubic foot / 30 lb. of gear." }),
    item("bedroll", "Bedroll", { value: "1 gp", weight: "7 lb.", itemType: "Camp gear", tags: ["gear", "camp", "sleep"] }),
    item("bell", "Bell", { value: "1 gp", itemType: "Signal gear", tags: ["gear", "signal"] }),
    item("blanket", "Blanket", { value: "5 sp", weight: "3 lb.", itemType: "Camp gear", tags: ["gear", "camp", "warmth"] }),
    item("block-and-tackle", "Block and Tackle", { value: "1 gp", weight: "5 lb.", itemType: "Rigging", tags: ["gear", "lifting", "rope"], properties: "A pulley set that gives mechanical advantage when hoisting heavy loads." }),
    item("bottle-glass", "Bottle, Glass", { category: "Container & Storage", value: "2 gp", weight: "2 lb.", itemType: "Bottle", tags: ["container", "liquid"], properties: "Capacity: 1½ pints of liquid." }),
    item("bucket", "Bucket", { category: "Container & Storage", value: "5 cp", weight: "2 lb.", itemType: "Bucket", tags: ["container", "liquid"], properties: "Capacity: 3 gallons of liquid or ½ cubic foot of solids." }),
    item("candle", "Candle", { value: "1 cp", itemType: "Light source", tags: ["gear", "light", "consumable"], properties: "Burns for 1 hour, shedding bright light in a 5-foot radius and dim light for another 5 feet." }),
    item("case-crossbow-bolt", "Case, Crossbow Bolt", { category: "Container & Storage", value: "1 gp", weight: "1 lb.", itemType: "Ammunition case", tags: ["container", "ammunition", "crossbow"], properties: "Holds up to 20 crossbow bolts." }),
    item("case-map-scroll", "Case, Map or Scroll", { category: "Container & Storage", value: "1 gp", weight: "1 lb.", itemType: "Document case", tags: ["container", "maps", "documents"], properties: "Protective cylindrical case for rolled papers, maps, or scrolls." }),
    item("chain-10-ft", "Chain (10 ft.)", { value: "5 gp", weight: "10 lb.", itemType: "Restraint / rigging", tags: ["gear", "chain", "restraint"], properties: "A sturdy iron chain suitable for securing loads or restraints." }),
    item("chalk", "Chalk (1 piece)", { value: "1 cp", itemType: "Writing / marking", tags: ["gear", "marking", "dungeon"] }),
    item("chest", "Chest", { category: "Container & Storage", value: "5 gp", weight: "25 lb.", itemType: "Chest", tags: ["container", "storage"], properties: "Capacity: 12 cubic feet / 300 lb. of gear." }),
    item("climbers-kit", "Climber's Kit", { value: "25 gp", weight: "12 lb.", itemType: "Climbing gear", tags: ["gear", "climbing", "safety"], properties: "Includes pitons, boot tips, gloves and a harness. Can be anchored to limit a fall while climbing." }),
    item("clothes-common", "Clothes, Common", { value: "5 sp", weight: "3 lb.", itemType: "Clothing", tags: ["gear", "clothing"] }),
    item("clothes-costume", "Clothes, Costume", { value: "5 gp", weight: "4 lb.", itemType: "Clothing", tags: ["gear", "clothing", "disguise"] }),
    item("clothes-fine", "Clothes, Fine", { value: "15 gp", weight: "6 lb.", itemType: "Clothing", tags: ["gear", "clothing", "social"] }),
    item("clothes-travelers", "Clothes, Traveler's", { value: "2 gp", weight: "4 lb.", itemType: "Clothing", tags: ["gear", "clothing", "travel"] }),
    item("component-pouch", "Component Pouch", { value: "25 gp", weight: "2 lb.", itemType: "Spellcasting gear", tags: ["gear", "spellcasting", "components"], properties: "Watertight belt pouch with compartments for material spell components that have no listed cost." }),
    item("crowbar", "Crowbar", { value: "2 gp", weight: "5 lb.", itemType: "Tool", tags: ["gear", "leverage", "doors"], properties: "Provides leverage when brute force is useful; the DM may grant advantage on appropriate Strength checks." }),
    item("fishing-tackle", "Fishing Tackle", { value: "1 gp", weight: "4 lb.", itemType: "Fishing gear", tags: ["gear", "fishing", "survival"], properties: "Rod, silk line, corkwood bobbers, hooks, sinkers, velvet lures and narrow netting." }),
    item("flask-tankard", "Flask or Tankard", { category: "Container & Storage", value: "2 cp", weight: "1 lb.", itemType: "Drinking vessel", tags: ["container", "liquid"], properties: "Capacity: 1 pint of liquid." }),
    item("hammer", "Hammer", { value: "1 gp", weight: "3 lb.", itemType: "Tool", tags: ["gear", "hammer", "camp"] }),
    item("hammer-sledge", "Hammer, Sledge", { value: "2 gp", weight: "10 lb.", itemType: "Heavy tool", tags: ["gear", "hammer", "demolition"] }),
    item("holy-water", "Holy Water (flask)", { category: "Consumable", value: "25 gp", weight: "1 lb.", itemType: "Sacred consumable", tags: ["consumable", "holy", "undead", "fiend"], properties: "Can be splashed or thrown. Particularly harmful to fiends and undead." }),
    item("hourglass", "Hourglass", { value: "25 gp", weight: "1 lb.", itemType: "Timekeeping", tags: ["gear", "time"] }),
    item("hunting-trap", "Hunting Trap", { category: "Hazard & Trap", value: "5 gp", weight: "25 lb.", itemType: "Mechanical trap", tags: ["gear", "trap", "hunting"], properties: "A pressure-triggered toothed ring on a chain. A creature stepping on it risks piercing damage and being restrained until freed." }),
    item("ink-bottle", "Ink (1 oz. bottle)", { value: "10 gp", itemType: "Writing supply", tags: ["gear", "writing"] }),
    item("ink-pen", "Ink Pen", { value: "2 cp", itemType: "Writing supply", tags: ["gear", "writing"] }),
    item("jug-pitcher", "Jug or Pitcher", { category: "Container & Storage", value: "2 cp", weight: "4 lb.", itemType: "Jug", tags: ["container", "liquid"], properties: "Capacity: 1 gallon of liquid." }),
    item("ladder-10-ft", "Ladder (10 ft.)", { value: "1 sp", weight: "25 lb.", itemType: "Climbing gear", tags: ["gear", "climbing"] }),
    item("lamp", "Lamp", { value: "5 sp", weight: "1 lb.", itemType: "Light source", tags: ["gear", "light", "oil"], properties: "Burns oil for 6 hours per pint, shedding bright light in a 15-foot radius and dim light for another 30 feet." }),
    item("lantern-bullseye", "Lantern, Bullseye", { value: "10 gp", weight: "2 lb.", itemType: "Light source", tags: ["gear", "light", "oil"], properties: "Burns oil for 6 hours per pint. Projects bright light in a 60-foot cone and dim light for another 60 feet." }),
    item("lantern-hooded", "Lantern, Hooded", { value: "5 gp", weight: "2 lb.", itemType: "Light source", tags: ["gear", "light", "oil"], properties: "Burns oil for 6 hours per pint. Bright light 30 ft. and dim light 30 ft. farther; hooding reduces it to dim light in 5 ft." }),
    item("lock", "Lock", { value: "10 gp", weight: "1 lb.", itemType: "Security", tags: ["gear", "lock", "security"], properties: "Comes with a key. A creature proficient with thieves' tools can attempt to pick it; the DM sets the DC for unusual locks." }),
    item("magnifying-glass", "Magnifying Glass", { value: "100 gp", itemType: "Optical instrument", tags: ["gear", "investigation", "fire"], properties: "Useful for inspecting small objects and, in bright sunlight, can focus light to ignite tinder." }),
    item("mess-kit", "Mess Kit", { value: "2 sp", weight: "1 lb.", itemType: "Camp gear", tags: ["gear", "camp", "cooking"] }),
    item("mirror-steel", "Mirror, Steel", { value: "5 gp", weight: "½ lb.", itemType: "Mirror", tags: ["gear", "mirror", "dungeon"] }),
    item("oil-flask", "Oil (flask)", { category: "Consumable", value: "1 sp", weight: "1 lb.", itemType: "Fuel / incendiary", tags: ["consumable", "oil", "fire", "light"], properties: "Fuels lamps and lanterns. Can also be splashed or thrown and ignited to create a short-lived fire hazard." }),
    item("paper-sheet", "Paper (one sheet)", { category: "Document & Lore", value: "2 sp", itemType: "Writing material", tags: ["document", "writing"] }),
    item("parchment-sheet", "Parchment (one sheet)", { category: "Document & Lore", value: "1 sp", itemType: "Writing material", tags: ["document", "writing"] }),
    item("perfume-vial", "Perfume (vial)", { value: "5 gp", itemType: "Personal item", tags: ["gear", "social", "scent"] }),
    item("pick-miners", "Pick, Miner's", { value: "2 gp", weight: "10 lb.", itemType: "Heavy tool", tags: ["gear", "mining", "excavation"] }),
    item("piton", "Piton", { value: "5 cp", weight: "¼ lb.", itemType: "Climbing gear", tags: ["gear", "climbing", "rigging"] }),
    item("pole-10-ft", "Pole (10 ft.)", { value: "5 cp", weight: "7 lb.", itemType: "Exploration gear", tags: ["gear", "dungeon", "reach"] }),
    item("pot-iron", "Pot, Iron", { category: "Container & Storage", value: "2 gp", weight: "10 lb.", itemType: "Cook pot", tags: ["container", "cooking", "camp"], properties: "Capacity: 1 gallon." }),
    item("pouch", "Pouch", { category: "Container & Storage", value: "5 sp", weight: "1 lb.", itemType: "Pouch", tags: ["container", "belt"], properties: "Capacity: roughly ⅕ cubic foot / 6 lb. of gear." }),
    item("quiver", "Quiver", { category: "Container & Storage", value: "1 gp", weight: "1 lb.", itemType: "Ammunition container", tags: ["container", "ammunition", "bow"], properties: "Holds up to 20 arrows." }),
    item("rations-1-day", "Rations (1 day)", { category: "Consumable", value: "5 sp", weight: "2 lb.", itemType: "Food", tags: ["consumable", "food", "travel"] }),
    item("robes", "Robes", { value: "1 gp", weight: "4 lb.", itemType: "Clothing", tags: ["gear", "clothing"] }),
    item("rope-hempen-50-ft", "Rope, Hempen (50 ft.)", { value: "1 gp", weight: "10 lb.", itemType: "Rope", tags: ["gear", "rope", "climbing", "rigging"] }),
    item("rope-silk-50-ft", "Rope, Silk (50 ft.)", { value: "10 gp", weight: "5 lb.", itemType: "Rope", tags: ["gear", "rope", "climbing", "rigging"] }),
    item("sack", "Sack", { category: "Container & Storage", value: "1 cp", weight: "½ lb.", itemType: "Sack", tags: ["container", "storage"], properties: "Capacity: 1 cubic foot / 30 lb. of gear." }),
    item("scale-merchants", "Scale, Merchant's", { value: "5 gp", weight: "3 lb.", itemType: "Measuring tool", tags: ["gear", "trade", "measurement"] }),
    item("sealing-wax", "Sealing Wax", { value: "5 sp", itemType: "Writing supply", tags: ["gear", "writing", "documents"] }),
    item("shovel", "Shovel", { value: "2 gp", weight: "5 lb.", itemType: "Tool", tags: ["gear", "excavation", "camp"] }),
    item("signal-whistle", "Signal Whistle", { value: "5 cp", itemType: "Signal gear", tags: ["gear", "signal"] }),
    item("signet-ring", "Signet Ring", { category: "Trinket & Curio", value: "5 gp", itemType: "Personal seal", tags: ["social", "documents", "identity"] }),
    item("soap", "Soap", { value: "2 cp", itemType: "Personal item", tags: ["gear", "hygiene"] }),
    item("spellbook", "Spellbook", { category: "Document & Lore", value: "50 gp", weight: "3 lb.", itemType: "Arcane book", tags: ["document", "spellcasting", "wizard"], properties: "A blank spellbook suitable for a wizard's recorded spells." }),
    item("iron-spikes-10", "Iron Spikes (10)", { value: "1 gp", weight: "5 lb.", itemType: "Exploration gear", tags: ["gear", "dungeon", "doors", "climbing"] }),
    item("tent-two-person", "Tent, Two-Person", { value: "2 gp", weight: "20 lb.", itemType: "Camp gear", tags: ["gear", "camp", "shelter"] }),
    item("tinderbox", "Tinderbox", { value: "5 sp", weight: "1 lb.", itemType: "Fire-starting gear", tags: ["gear", "fire", "camp"], properties: "Flint, fire steel and tinder used to light fires, torches and similar combustibles." }),
    item("torch", "Torch", { value: "1 cp", weight: "1 lb.", itemType: "Light source", tags: ["gear", "light", "fire", "consumable"], properties: "Burns for 1 hour, shedding bright light in a 20-foot radius and dim light for another 20 feet." }),
    item("vial", "Vial", { category: "Container & Storage", value: "1 gp", itemType: "Small bottle", tags: ["container", "liquid", "alchemy"], properties: "Capacity: 4 ounces of liquid." }),
    item("waterskin", "Waterskin", { category: "Container & Storage", value: "2 sp", weight: "5 lb. (full)", itemType: "Water container", tags: ["container", "water", "travel"], properties: "Capacity: 4 pints of liquid." }),
    item("whetstone", "Whetstone", { value: "1 cp", weight: "1 lb.", itemType: "Maintenance gear", tags: ["gear", "weapon", "maintenance"] })
  ];

  const tools = [
    item("brewers-supplies", "Brewer's Supplies", { category: "Tool & Kit", itemType: "Artisan's tools", value: "20 gp", weight: "9 lb.", tags: ["tools", "artisan", "brewing"] }),
    item("calligraphers-supplies", "Calligrapher's Supplies", { category: "Tool & Kit", itemType: "Artisan's tools", value: "10 gp", weight: "5 lb.", tags: ["tools", "artisan", "writing"] }),
    item("carpenters-tools", "Carpenter's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "8 gp", weight: "6 lb.", tags: ["tools", "artisan", "woodworking"] }),
    item("cobblers-tools", "Cobbler's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "5 gp", weight: "5 lb.", tags: ["tools", "artisan", "leather"] }),
    item("cooks-utensils", "Cook's Utensils", { category: "Tool & Kit", itemType: "Artisan's tools", value: "1 gp", weight: "8 lb.", tags: ["tools", "artisan", "cooking"] }),
    item("glassblowers-tools", "Glassblower's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "30 gp", weight: "5 lb.", tags: ["tools", "artisan", "glass"] }),
    item("jewelers-tools", "Jeweler's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "25 gp", weight: "2 lb.", tags: ["tools", "artisan", "jewelry"] }),
    item("leatherworkers-tools", "Leatherworker's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "5 gp", weight: "5 lb.", tags: ["tools", "artisan", "leather"] }),
    item("masons-tools", "Mason's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "10 gp", weight: "8 lb.", tags: ["tools", "artisan", "stone"] }),
    item("painters-supplies", "Painter's Supplies", { category: "Tool & Kit", itemType: "Artisan's tools", value: "10 gp", weight: "5 lb.", tags: ["tools", "artisan", "painting"] }),
    item("potters-tools", "Potter's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "10 gp", weight: "3 lb.", tags: ["tools", "artisan", "pottery"] }),
    item("smiths-tools", "Smith's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "20 gp", weight: "8 lb.", tags: ["tools", "artisan", "smithing", "metal"] }),
    item("tinkers-tools", "Tinker's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "50 gp", weight: "10 lb.", tags: ["tools", "artisan", "repair"] }),
    item("weavers-tools", "Weaver's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "1 gp", weight: "5 lb.", tags: ["tools", "artisan", "textile"] }),
    item("woodcarvers-tools", "Woodcarver's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "1 gp", weight: "5 lb.", tags: ["tools", "artisan", "woodworking"] }),
    item("disguise-kit", "Disguise Kit", { category: "Tool & Kit", itemType: "Kit", value: "25 gp", weight: "3 lb.", tags: ["tools", "disguise", "social"] }),
    item("forgery-kit", "Forgery Kit", { category: "Tool & Kit", itemType: "Kit", value: "15 gp", weight: "5 lb.", tags: ["tools", "forgery", "documents"] }),
    item("gaming-dice", "Gaming Set, Dice", { category: "Tool & Kit", itemType: "Gaming set", value: "1 sp", tags: ["tools", "gaming", "dice"] }),
    item("gaming-cards", "Gaming Set, Playing Cards", { category: "Tool & Kit", itemType: "Gaming set", value: "5 sp", tags: ["tools", "gaming", "cards"] }),
    item("poisoners-kit", "Poisoner's Kit", { category: "Tool & Kit", itemType: "Kit", value: "50 gp", weight: "2 lb.", tags: ["tools", "poison", "alchemy"] })
  ];

  const instruments = [
    item("bagpipes", "Bagpipes", { category: "Tool & Kit", itemType: "Musical instrument", value: "30 gp", weight: "6 lb.", tags: ["instrument", "music"] }),
    item("drum", "Drum", { category: "Tool & Kit", itemType: "Musical instrument", value: "6 gp", weight: "3 lb.", tags: ["instrument", "music"] }),
    item("dulcimer", "Dulcimer", { category: "Tool & Kit", itemType: "Musical instrument", value: "25 gp", weight: "10 lb.", tags: ["instrument", "music"] }),
    item("flute", "Flute", { category: "Tool & Kit", itemType: "Musical instrument", value: "2 gp", weight: "1 lb.", tags: ["instrument", "music"] }),
    item("lute", "Lute", { category: "Tool & Kit", itemType: "Musical instrument", value: "35 gp", weight: "2 lb.", tags: ["instrument", "music"] }),
    item("lyre", "Lyre", { category: "Tool & Kit", itemType: "Musical instrument", value: "30 gp", weight: "2 lb.", tags: ["instrument", "music"] }),
    item("horn", "Horn", { category: "Tool & Kit", itemType: "Musical instrument", value: "3 gp", weight: "2 lb.", tags: ["instrument", "music", "signal"] }),
    item("pan-flute", "Pan Flute", { category: "Tool & Kit", itemType: "Musical instrument", value: "12 gp", weight: "2 lb.", tags: ["instrument", "music"] }),
    item("shawm", "Shawm", { category: "Tool & Kit", itemType: "Musical instrument", value: "2 gp", weight: "1 lb.", tags: ["instrument", "music"] }),
    item("viol", "Viol", { category: "Tool & Kit", itemType: "Musical instrument", value: "30 gp", weight: "1 lb.", tags: ["instrument", "music"] })
  ];

  const foci = [
    item("arcane-focus-crystal", "Arcane Focus, Crystal", { itemType: "Arcane focus", value: "10 gp", weight: "1 lb.", tags: ["spellcasting", "focus", "arcane"] }),
    item("arcane-focus-orb", "Arcane Focus, Orb", { itemType: "Arcane focus", value: "20 gp", weight: "3 lb.", tags: ["spellcasting", "focus", "arcane"] }),
    item("arcane-focus-rod", "Arcane Focus, Rod", { itemType: "Arcane focus", value: "10 gp", weight: "2 lb.", tags: ["spellcasting", "focus", "arcane"] }),
    item("arcane-focus-staff", "Arcane Focus, Staff", { itemType: "Arcane focus", value: "5 gp", weight: "4 lb.", tags: ["spellcasting", "focus", "arcane"] }),
    item("arcane-focus-wand", "Arcane Focus, Wand", { itemType: "Arcane focus", value: "10 gp", weight: "1 lb.", tags: ["spellcasting", "focus", "arcane"] }),
    item("druidic-focus-mistletoe", "Druidic Focus, Sprig of Mistletoe", { itemType: "Druidic focus", value: "1 gp", tags: ["spellcasting", "focus", "druid", "nature"] }),
    item("druidic-focus-totem", "Druidic Focus, Totem", { itemType: "Druidic focus", value: "1 gp", tags: ["spellcasting", "focus", "druid", "nature"] }),
    item("druidic-focus-wooden-staff", "Druidic Focus, Wooden Staff", { itemType: "Druidic focus", value: "5 gp", weight: "4 lb.", tags: ["spellcasting", "focus", "druid", "nature"] }),
    item("druidic-focus-yew-wand", "Druidic Focus, Yew Wand", { itemType: "Druidic focus", value: "10 gp", weight: "1 lb.", tags: ["spellcasting", "focus", "druid", "nature"] }),
    item("holy-symbol-amulet", "Holy Symbol, Amulet", { itemType: "Holy symbol", value: "5 gp", weight: "1 lb.", tags: ["spellcasting", "focus", "divine", "holy"] }),
    item("holy-symbol-emblem", "Holy Symbol, Emblem", { itemType: "Holy symbol", value: "5 gp", tags: ["spellcasting", "focus", "divine", "holy"] }),
    item("holy-symbol-reliquary", "Holy Symbol, Reliquary", { itemType: "Holy symbol", value: "5 gp", weight: "2 lb.", tags: ["spellcasting", "focus", "divine", "holy"] })
  ];

  const tack = [
    item("bit-and-bridle", "Bit and Bridle", { itemType: "Tack", value: "2 gp", weight: "1 lb.", tags: ["mount", "tack", "travel"] }),
    item("feed-1-day", "Feed (1 day)", { category: "Consumable", itemType: "Animal feed", value: "5 cp", weight: "10 lb.", tags: ["mount", "food", "travel"] }),
    item("saddle-exotic", "Saddle, Exotic", { itemType: "Saddle", value: "60 gp", weight: "40 lb.", tags: ["mount", "tack"] }),
    item("saddle-military", "Saddle, Military", { itemType: "Saddle", value: "20 gp", weight: "30 lb.", tags: ["mount", "tack", "combat"] }),
    item("saddle-pack", "Saddle, Pack", { itemType: "Saddle", value: "5 gp", weight: "15 lb.", tags: ["mount", "tack", "cargo"] }),
    item("saddle-riding", "Saddle, Riding", { itemType: "Saddle", value: "10 gp", weight: "25 lb.", tags: ["mount", "tack", "travel"] }),
    item("saddlebags", "Saddlebags", { category: "Container & Storage", itemType: "Mount storage", value: "4 gp", weight: "8 lb.", tags: ["mount", "container", "travel"] })
  ];

  const vehicles = [
    item("carriage", "Carriage", { category: "Adventuring Gear", itemType: "Land vehicle", value: "100 gp", weight: "600 lb.", tags: ["vehicle", "land", "travel"] }),
    item("cart", "Cart", { category: "Adventuring Gear", itemType: "Land vehicle", value: "15 gp", weight: "200 lb.", tags: ["vehicle", "land", "cargo"] }),
    item("chariot", "Chariot", { category: "Adventuring Gear", itemType: "Land vehicle", value: "250 gp", weight: "100 lb.", tags: ["vehicle", "land", "combat"] }),
    item("sled", "Sled", { category: "Adventuring Gear", itemType: "Land vehicle", value: "20 gp", weight: "300 lb.", tags: ["vehicle", "land", "snow"] }),
    item("wagon", "Wagon", { category: "Adventuring Gear", itemType: "Land vehicle", value: "35 gp", weight: "400 lb.", tags: ["vehicle", "land", "cargo", "travel"] })
  ];

  const packs = [
    item("burglars-pack", "Burglar's Pack", { category: "Collection & Hoard", itemType: "Equipment pack", value: "16 gp", tags: ["pack", "starter-gear", "stealth"], properties: "Backpack; ball bearings; string; bell; candles; crowbar; hammer; pitons; hooded lantern; oil; rations; tinderbox; waterskin; hempen rope." }),
    item("diplomats-pack", "Diplomat's Pack", { category: "Collection & Hoard", itemType: "Equipment pack", value: "39 gp", tags: ["pack", "starter-gear", "social"], properties: "Chest; map/scroll cases; fine clothes; ink and pen; lamp; oil; paper; perfume; sealing wax; soap." }),
    item("dungeoneers-pack", "Dungeoneer's Pack", { category: "Collection & Hoard", itemType: "Equipment pack", value: "12 gp", tags: ["pack", "starter-gear", "dungeon"], properties: "Backpack; crowbar; hammer; pitons; torches; tinderbox; rations; waterskin; hempen rope." }),
    item("entertainers-pack", "Entertainer's Pack", { category: "Collection & Hoard", itemType: "Equipment pack", value: "40 gp", tags: ["pack", "starter-gear", "performance"], properties: "Backpack; bedroll; costumes; candles; rations; waterskin; disguise kit." }),
    item("explorers-pack", "Explorer's Pack", { category: "Collection & Hoard", itemType: "Equipment pack", value: "10 gp", tags: ["pack", "starter-gear", "travel"], properties: "Backpack; bedroll; mess kit; tinderbox; torches; rations; waterskin; hempen rope." }),
    item("priests-pack", "Priest's Pack", { category: "Collection & Hoard", itemType: "Equipment pack", value: "19 gp", tags: ["pack", "starter-gear", "divine"], properties: "Backpack; blanket; candles; tinderbox; alms box; incense; censer; vestments; rations; waterskin." }),
    item("scholars-pack", "Scholar's Pack", { category: "Collection & Hoard", itemType: "Equipment pack", value: "40 gp", tags: ["pack", "starter-gear", "scholar"], properties: "Backpack; book of lore; ink and pen; parchment; sand; small knife." })
  ];

  return [...ammunition, ...gear, ...tools, ...instruments, ...foci, ...tack, ...vehicles, ...packs];
});
