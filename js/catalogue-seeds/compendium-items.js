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
  const NOTE = "Condensed SRD 5.1 table reference. See docs/OPEN-CONTENT.md for attribution.";

  function item(id, name, spec = {}) {
    const entry = {
      id,
      name,
      category: spec.category || "Other",
      itemType: spec.itemType || "",
      rarity: spec.rarity || "",
      source: SOURCE,
      value: spec.value || "",
      weight: spec.weight || "",
      attunement: Boolean(spec.attunement),
      tags: ["srd", ...(spec.tags || [])],
      description: spec.description || "",
      properties: spec.properties || "",
      notes: spec.notes ? `${spec.notes}\n\n${NOTE}` : NOTE
    };
    return { type: "item", id, entry };
  }

  function weapon(slug, name, category, value, weight, damage, properties, extra = {}) {
    return item(`item-srd-${slug}`, name, {
      category: "Weapon",
      itemType: category,
      value,
      weight,
      tags: ["weapon", category.toLowerCase().replace(/\s+/g, "-"), ...(extra.tags || [])],
      description: `Standard ${category.toLowerCase()} weapon from the SRD equipment list.`,
      properties: `${damage}${properties ? `; ${properties}` : ""}`
    });
  }

  function armor(slug, name, itemType, value, weight, properties, extra = {}) {
    return item(`item-srd-${slug}`, name, {
      category: "Armor & Shield",
      itemType,
      value,
      weight,
      tags: ["armor", ...(extra.tags || [])],
      description: `Standard ${itemType.toLowerCase()} from the SRD equipment list.`,
      properties
    });
  }

  function magic(slug, name, category, rarity, properties, extra = {}) {
    return item(`item-srd-${slug}`, name, {
      category,
      itemType: extra.itemType || (category === "Wondrous Item" ? "Wondrous item" : "Magic item"),
      rarity,
      attunement: Boolean(extra.attunement),
      tags: ["magic", ...(extra.tags || [])],
      description: extra.description || "Magic item from the SRD 5.1 reference set.",
      properties,
      value: extra.value || "",
      weight: extra.weight || ""
    });
  }

  const weapons = [
    weapon("club", "Club", "Simple melee", "1 sp", "2 lb.", "1d4 bludgeoning", "Light"),
    weapon("dagger", "Dagger", "Simple melee", "2 gp", "1 lb.", "1d4 piercing", "Finesse, light, thrown (20/60 ft.)"),
    weapon("greatclub", "Greatclub", "Simple melee", "2 sp", "10 lb.", "1d8 bludgeoning", "Two-handed"),
    weapon("handaxe", "Handaxe", "Simple melee", "5 gp", "2 lb.", "1d6 slashing", "Light, thrown (20/60 ft.)"),
    weapon("javelin", "Javelin", "Simple melee", "5 sp", "2 lb.", "1d6 piercing", "Thrown (30/120 ft.)"),
    weapon("light-hammer", "Light Hammer", "Simple melee", "2 gp", "2 lb.", "1d4 bludgeoning", "Light, thrown (20/60 ft.)"),
    weapon("mace", "Mace", "Simple melee", "5 gp", "4 lb.", "1d6 bludgeoning", ""),
    weapon("quarterstaff", "Quarterstaff", "Simple melee", "2 sp", "4 lb.", "1d6 bludgeoning", "Versatile (1d8)"),
    weapon("sickle", "Sickle", "Simple melee", "1 gp", "2 lb.", "1d4 slashing", "Light"),
    weapon("spear", "Spear", "Simple melee", "1 gp", "3 lb.", "1d6 piercing", "Thrown (20/60 ft.), versatile (1d8)"),
    weapon("light-crossbow", "Light Crossbow", "Simple ranged", "25 gp", "5 lb.", "1d8 piercing", "Ammunition (80/320 ft.), loading, two-handed"),
    weapon("dart", "Dart", "Simple ranged", "5 cp", "1/4 lb.", "1d4 piercing", "Finesse, thrown (20/60 ft.)"),
    weapon("shortbow", "Shortbow", "Simple ranged", "25 gp", "2 lb.", "1d6 piercing", "Ammunition (80/320 ft.), two-handed"),
    weapon("sling", "Sling", "Simple ranged", "1 sp", "", "1d4 bludgeoning", "Ammunition (30/120 ft.)"),
    weapon("battleaxe", "Battleaxe", "Martial melee", "10 gp", "4 lb.", "1d8 slashing", "Versatile (1d10)"),
    weapon("flail", "Flail", "Martial melee", "10 gp", "2 lb.", "1d8 bludgeoning", ""),
    weapon("glaive", "Glaive", "Martial melee", "20 gp", "6 lb.", "1d10 slashing", "Heavy, reach, two-handed"),
    weapon("greataxe", "Greataxe", "Martial melee", "30 gp", "7 lb.", "1d12 slashing", "Heavy, two-handed"),
    weapon("greatsword", "Greatsword", "Martial melee", "50 gp", "6 lb.", "2d6 slashing", "Heavy, two-handed"),
    weapon("halberd", "Halberd", "Martial melee", "20 gp", "6 lb.", "1d10 slashing", "Heavy, reach, two-handed"),
    weapon("lance", "Lance", "Martial melee", "10 gp", "6 lb.", "1d12 piercing", "Reach, special"),
    weapon("longsword", "Longsword", "Martial melee", "15 gp", "3 lb.", "1d8 slashing", "Versatile (1d10)"),
    weapon("maul", "Maul", "Martial melee", "10 gp", "10 lb.", "2d6 bludgeoning", "Heavy, two-handed"),
    weapon("morningstar", "Morningstar", "Martial melee", "15 gp", "4 lb.", "1d8 piercing", ""),
    weapon("pike", "Pike", "Martial melee", "5 gp", "18 lb.", "1d10 piercing", "Heavy, reach, two-handed"),
    weapon("rapier", "Rapier", "Martial melee", "25 gp", "2 lb.", "1d8 piercing", "Finesse"),
    weapon("scimitar", "Scimitar", "Martial melee", "25 gp", "3 lb.", "1d6 slashing", "Finesse, light"),
    weapon("shortsword", "Shortsword", "Martial melee", "10 gp", "2 lb.", "1d6 piercing", "Finesse, light"),
    weapon("trident", "Trident", "Martial melee", "5 gp", "4 lb.", "1d6 piercing", "Thrown (20/60 ft.), versatile (1d8)"),
    weapon("war-pick", "War Pick", "Martial melee", "5 gp", "2 lb.", "1d8 piercing", ""),
    weapon("warhammer", "Warhammer", "Martial melee", "15 gp", "2 lb.", "1d8 bludgeoning", "Versatile (1d10)"),
    weapon("whip", "Whip", "Martial melee", "2 gp", "3 lb.", "1d4 slashing", "Finesse, reach"),
    weapon("blowgun", "Blowgun", "Martial ranged", "10 gp", "1 lb.", "1 piercing", "Ammunition (25/100 ft.), loading"),
    weapon("hand-crossbow", "Hand Crossbow", "Martial ranged", "75 gp", "3 lb.", "1d6 piercing", "Ammunition (30/120 ft.), light, loading"),
    weapon("heavy-crossbow", "Heavy Crossbow", "Martial ranged", "50 gp", "18 lb.", "1d10 piercing", "Ammunition (100/400 ft.), heavy, loading, two-handed"),
    weapon("longbow", "Longbow", "Martial ranged", "50 gp", "2 lb.", "1d8 piercing", "Ammunition (150/600 ft.), heavy, two-handed"),
    weapon("net", "Net", "Martial ranged", "1 gp", "3 lb.", "Special", "Thrown (5/15 ft.), special")
  ];

  const armors = [
    armor("padded-armor", "Padded Armor", "Light armor", "5 gp", "8 lb.", "AC 11 + DEX modifier; disadvantage on Stealth"),
    armor("leather-armor", "Leather Armor", "Light armor", "10 gp", "10 lb.", "AC 11 + DEX modifier"),
    armor("studded-leather", "Studded Leather", "Light armor", "45 gp", "13 lb.", "AC 12 + DEX modifier"),
    armor("hide-armor", "Hide Armor", "Medium armor", "10 gp", "12 lb.", "AC 12 + DEX modifier (maximum +2)"),
    armor("chain-shirt", "Chain Shirt", "Medium armor", "50 gp", "20 lb.", "AC 13 + DEX modifier (maximum +2)"),
    armor("scale-mail", "Scale Mail", "Medium armor", "50 gp", "45 lb.", "AC 14 + DEX modifier (maximum +2); disadvantage on Stealth"),
    armor("breastplate", "Breastplate", "Medium armor", "400 gp", "20 lb.", "AC 14 + DEX modifier (maximum +2)"),
    armor("half-plate", "Half Plate", "Medium armor", "750 gp", "40 lb.", "AC 15 + DEX modifier (maximum +2); disadvantage on Stealth"),
    armor("ring-mail", "Ring Mail", "Heavy armor", "30 gp", "40 lb.", "AC 14; disadvantage on Stealth"),
    armor("chain-mail", "Chain Mail", "Heavy armor", "75 gp", "55 lb.", "AC 16; STR 13; disadvantage on Stealth"),
    armor("splint-armor", "Splint Armor", "Heavy armor", "200 gp", "60 lb.", "AC 17; STR 15; disadvantage on Stealth"),
    armor("plate-armor", "Plate Armor", "Heavy armor", "1,500 gp", "65 lb.", "AC 18; STR 15; disadvantage on Stealth"),
    armor("shield", "Shield", "Shield", "10 gp", "6 lb.", "+2 AC while wielded", { tags: ["shield"] })
  ];

  const gear = [
    item("item-srd-ball-bearings", "Ball Bearings (bag of 1,000)", { category: "Adventuring Gear", itemType: "Hazard / utility", value: "1 gp", weight: "2 lb.", tags: ["gear", "control"], properties: "Can be scattered across a 10-foot square to make footing treacherous; creatures moving through may need a DEX save or fall prone." }),
    item("item-srd-caltrops", "Caltrops (bag of 20)", { category: "Adventuring Gear", itemType: "Hazard / utility", value: "1 gp", weight: "2 lb.", tags: ["gear", "hazard"], properties: "Scatter across a 5-foot square; a creature entering carelessly risks piercing damage and a temporary speed reduction." }),
    item("item-srd-grappling-hook", "Grappling Hook", { category: "Adventuring Gear", itemType: "Climbing gear", value: "2 gp", weight: "4 lb.", tags: ["gear", "climbing"] }),
    item("item-srd-manacles", "Manacles", { category: "Adventuring Gear", itemType: "Restraint", value: "2 gp", weight: "6 lb.", tags: ["gear", "restraint"], properties: "Designed to bind a Small or Medium creature; escaping or breaking them requires a difficult check." }),
    item("item-srd-portable-ram", "Portable Ram", { category: "Adventuring Gear", itemType: "Tool", value: "4 gp", weight: "35 lb.", tags: ["gear", "doors"], properties: "Gives leverage when forcing doors; another creature can assist for an additional bonus." }),
    item("item-srd-spyglass", "Spyglass", { category: "Adventuring Gear", itemType: "Optical instrument", value: "1,000 gp", weight: "1 lb.", tags: ["gear", "exploration"], properties: "Viewed objects are magnified to roughly twice their apparent size." }),
    item("item-srd-acid-vial", "Acid (vial)", { category: "Consumable", itemType: "Alchemical", value: "25 gp", weight: "1 lb.", tags: ["consumable", "acid"], properties: "Can be thrown as an improvised ranged attack; on a hit the target takes 2d6 acid damage." }),
    item("item-srd-antitoxin", "Antitoxin (vial)", { category: "Consumable", itemType: "Medicine", value: "50 gp", tags: ["consumable", "poison"], properties: "After drinking it, gain advantage on saving throws against poison for 1 hour. No benefit to constructs or undead." }),
    item("item-srd-basic-poison", "Basic Poison (vial)", { category: "Consumable", itemType: "Poison", value: "100 gp", tags: ["consumable", "poison"], properties: "Coats one slashing or piercing weapon or up to three pieces of ammunition; a hit before it dries forces a CON save or deals extra poison damage." }),
    item("item-srd-healers-kit", "Healer's Kit", { category: "Tool & Kit", itemType: "Medical kit", value: "5 gp", weight: "3 lb.", tags: ["gear", "healing"], properties: "10 uses. Spend one use to stabilize a creature at 0 HP without a Wisdom (Medicine) check." }),
    item("item-srd-thieves-tools", "Thieves' Tools", { category: "Tool & Kit", itemType: "Tool set", value: "25 gp", weight: "1 lb.", tags: ["tools", "locks", "traps"], properties: "Picks, files, mirror, scissors and pliers used for locks and mechanical traps." }),
    item("item-srd-herbalism-kit", "Herbalism Kit", { category: "Tool & Kit", itemType: "Tool set", value: "5 gp", weight: "3 lb.", tags: ["tools", "herbalism", "healing"] }),
    item("item-srd-alchemists-supplies", "Alchemist's Supplies", { category: "Tool & Kit", itemType: "Artisan's tools", value: "50 gp", weight: "8 lb.", tags: ["tools", "alchemy"] }),
    item("item-srd-cartographers-tools", "Cartographer's Tools", { category: "Tool & Kit", itemType: "Artisan's tools", value: "15 gp", weight: "6 lb.", tags: ["tools", "maps", "exploration"] }),
    item("item-srd-navigators-tools", "Navigator's Tools", { category: "Tool & Kit", itemType: "Tool set", value: "25 gp", weight: "2 lb.", tags: ["tools", "navigation", "travel"] })
  ];

  const magicItems = [
    magic("adamantine-armor", "Adamantine Armor", "Armor & Shield", "Uncommon", "While worn, critical hits against you become normal hits.", { itemType: "Magic armor", tags: ["defense"] }),
    magic("amulet-of-health", "Amulet of Health", "Wondrous Item", "Rare", "While worn, your Constitution score is 19 unless it is already higher.", { attunement: true, tags: ["ability-score", "constitution"] }),
    magic("bag-of-holding", "Bag of Holding", "Container & Storage", "Uncommon", "Holds far more than its outside dimensions suggest. Extradimensional storage has dangerous interactions with similar spaces.", { itemType: "Wondrous container", tags: ["storage", "extradimensional"] }),
    magic("boots-of-speed", "Boots of Speed", "Wondrous Item", "Rare", "Activate as a bonus action to double walking speed and make opportunity attacks against you harder for up to 10 minutes total per day.", { attunement: true, tags: ["movement", "boots"] }),
    magic("bracers-of-defense", "Bracers of Defense", "Wondrous Item", "Rare", "+2 AC while wearing no armor and using no shield.", { attunement: true, tags: ["defense"] }),
    magic("brooch-of-shielding", "Brooch of Shielding", "Wondrous Item", "Uncommon", "Resistance to force damage and immunity to damage from magic missile.", { attunement: true, tags: ["defense", "force"] }),
    magic("broom-of-flying", "Broom of Flying", "Wondrous Item", "Uncommon", "A command word animates the broom as a flying mount; carrying capacity affects its flying speed.", { tags: ["flight", "mount"] }),
    magic("cloak-of-elvenkind", "Cloak of Elvenkind", "Wondrous Item", "Uncommon", "The hood helps you hide: observers have disadvantage to see you and you gain advantage on Stealth checks made to hide.", { attunement: true, tags: ["stealth", "cloak"] }),
    magic("cloak-of-protection", "Cloak of Protection", "Wondrous Item", "Uncommon", "+1 AC and +1 to saving throws while worn.", { attunement: true, tags: ["defense", "cloak"] }),
    magic("decanter-of-endless-water", "Decanter of Endless Water", "Wondrous Item", "Uncommon", "Produces controlled amounts of fresh or salt water, including a forceful geyser mode.", { tags: ["water", "utility"] }),
    magic("deck-of-illusions", "Deck of Illusions", "Wondrous Item", "Uncommon", "Throw a card to create a convincing illusory creature corresponding to the card; the illusion lasts until dismissed or disturbed.", { tags: ["illusion", "cards"] }),
    magic("driftglobe", "Driftglobe", "Wondrous Item", "Uncommon", "A floating glass orb that can shed light and can produce daylight once per day.", { tags: ["light", "utility"] }),
    magic("dust-of-disappearance", "Dust of Disappearance", "Consumable", "Uncommon", "One use can make nearby creatures and carried objects invisible for several minutes, ending early when a creature attacks or casts a spell.", { tags: ["consumable", "invisibility"] }),
    magic("elven-chain", "Elven Chain", "Armor & Shield", "Rare", "Magic chain shirt with a +1 AC bonus. You are considered proficient with it even if you lack medium-armor proficiency.", { itemType: "Magic armor", tags: ["armor", "elf"] }),
    magic("eyes-of-charming", "Eyes of Charming", "Wondrous Item", "Uncommon", "Spectacles with charges that can cast charm person; recharge each dawn.", { attunement: true, tags: ["charm", "charges"] }),
    magic("gauntlets-of-ogre-power", "Gauntlets of Ogre Power", "Wondrous Item", "Uncommon", "While worn, your Strength score is 19 unless it is already higher.", { attunement: true, tags: ["ability-score", "strength"] }),
    magic("gloves-of-missile-snaring", "Gloves of Missile Snaring", "Wondrous Item", "Uncommon", "Use your reaction to reduce damage from a ranged weapon attack you can see; sufficiently reduced damage lets you catch the missile.", { attunement: true, tags: ["defense", "reaction"] }),
    magic("goggles-of-night", "Goggles of Night", "Wondrous Item", "Uncommon", "Grants darkvision 60 ft., or extends existing darkvision by 60 ft.", { tags: ["darkvision", "exploration"] }),
    magic("hat-of-disguise", "Hat of Disguise", "Wondrous Item", "Uncommon", "Cast disguise self at will while wearing the hat; the spell ends if the hat is removed.", { attunement: true, tags: ["illusion", "disguise"] }),
    magic("headband-of-intellect", "Headband of Intellect", "Wondrous Item", "Uncommon", "While worn, your Intelligence score is 19 unless it is already higher.", { attunement: true, tags: ["ability-score", "intelligence"] }),
    magic("helm-of-telepathy", "Helm of Telepathy", "Wondrous Item", "Uncommon", "Read thoughts and communicate telepathically; can also attempt to implant a suggestion in a creature whose thoughts you are reading.", { attunement: true, tags: ["telepathy", "divination"] }),
    magic("immovable-rod", "Immovable Rod", "Wondrous Item", "Uncommon", "Press its button to lock the rod magically in place until released or overcome by extreme force.", { tags: ["utility", "control"] }),
    magic("lantern-of-revealing", "Lantern of Revealing", "Wondrous Item", "Uncommon", "While lit, invisible creatures and objects within its bright light become visible.", { tags: ["light", "invisibility"] }),
    magic("necklace-of-adaptation", "Necklace of Adaptation", "Wondrous Item", "Uncommon", "Lets you breathe normally in hostile environments and gives advantage on saves against harmful gases and vapors.", { attunement: true, tags: ["breathing", "environment"] }),
    magic("pearl-of-power", "Pearl of Power", "Wondrous Item", "Uncommon", "Once per day, a spellcaster can recover one expended spell slot of up to 3rd level.", { attunement: true, tags: ["spellcasting", "recovery"] }),
    magic("periapt-of-health", "Periapt of Health", "Wondrous Item", "Uncommon", "Immunity to contracting diseases while worn; an existing disease is suppressed rather than cured.", { tags: ["disease", "defense"] }),
    magic("ring-of-protection", "Ring of Protection", "Wondrous Item", "Rare", "+1 AC and +1 to saving throws while worn.", { attunement: true, itemType: "Ring", tags: ["ring", "defense"] }),
    magic("ring-of-swimming", "Ring of Swimming", "Wondrous Item", "Uncommon", "Grants a swimming speed of 40 ft. while worn.", { itemType: "Ring", tags: ["ring", "swimming"] }),
    magic("ring-of-water-walking", "Ring of Water Walking", "Wondrous Item", "Uncommon", "Lets you stand on and move across liquid surfaces as though they were solid ground.", { itemType: "Ring", tags: ["ring", "water"] }),
    magic("robe-of-useful-items", "Robe of Useful Items", "Wondrous Item", "Uncommon", "Covered in detachable patches that transform into useful mundane objects and a variable assortment of larger surprises.", { tags: ["utility", "patches"] }),
    magic("rope-of-climbing", "Rope of Climbing", "Wondrous Item", "Uncommon", "A light, strong rope that follows simple spoken commands to move, fasten itself, knot itself, or animate for easier climbing.", { tags: ["climbing", "utility"] }),
    magic("sentinel-shield", "Sentinel Shield", "Armor & Shield", "Uncommon", "While holding the shield, gain advantage on initiative rolls and Wisdom (Perception) checks.", { itemType: "Magic shield", tags: ["shield", "initiative", "perception"] }),
    magic("slippers-of-spider-climbing", "Slippers of Spider Climbing", "Wondrous Item", "Uncommon", "While worn with both hands free, gain a climbing speed equal to walking speed and move across ceilings without using your hands.", { attunement: true, tags: ["climbing", "movement"] }),
    magic("stone-of-good-luck", "Stone of Good Luck", "Wondrous Item", "Uncommon", "+1 to ability checks and saving throws while the stone is on your person.", { attunement: true, tags: ["luck", "saves", "checks"] }),
    magic("wand-of-magic-detection", "Wand of Magic Detection", "Wondrous Item", "Uncommon", "7 charges. Spend 1 charge to cast detect magic; regains charges each dawn and risks crumbling if emptied.", { itemType: "Wand", tags: ["wand", "charges", "detect-magic"] }),
    magic("wand-of-magic-missiles", "Wand of Magic Missiles", "Wondrous Item", "Uncommon", "7 charges. Spend charges to cast magic missile at increasing levels; regains charges each dawn and risks crumbling if emptied.", { itemType: "Wand", tags: ["wand", "charges", "damage"] }),
    magic("winged-boots", "Winged Boots", "Wondrous Item", "Uncommon", "Gain a flying speed equal to walking speed for a limited daily duration, spent in chunks and replenished over time.", { attunement: true, tags: ["flight", "boots"] }),
    magic("alchemy-jug", "Alchemy Jug", "Wondrous Item", "Uncommon", "Produces one selected liquid each day from a fixed menu ranging from water and oil to acid, poison, beer, honey and mayonnaise.", { tags: ["alchemy", "utility", "liquid"] }),
    magic("chime-of-opening", "Chime of Opening", "Wondrous Item", "Rare", "Has 10 uses. Strike it while pointing at a nearby locked or closed object to open one lock or fastening; the chime cracks after its final use.", { tags: ["locks", "charges"] }),
    magic("circlet-of-blasting", "Circlet of Blasting", "Wondrous Item", "Uncommon", "Once per day, cast scorching ray with a fixed attack bonus.", { tags: ["fire", "spellcasting"] }),
    magic("portable-hole", "Portable Hole", "Container & Storage", "Rare", "A folded cloth opens into an extradimensional cylindrical space. Combining it with another extradimensional container is catastrophically unsafe.", { itemType: "Wondrous container", tags: ["storage", "extradimensional"] }),
    magic("quiver-of-ehlonna", "Quiver of Ehlonna", "Container & Storage", "Uncommon", "Three extradimensional compartments hold large quantities of arrows, javelins, bows, spears and similar long objects while remaining easy to draw from.", { itemType: "Wondrous container", tags: ["storage", "ammunition"] }),
    magic("sending-stones", "Sending Stones", "Wondrous Item", "Uncommon", "A paired set; once per day, one stone can cast sending to the bearer of the other stone.", { tags: ["communication", "paired"] }),
    magic("potion-of-healing", "Potion of Healing", "Consumable", "Common", "Drink to regain 2d4 + 2 HP.", { itemType: "Potion", tags: ["potion", "healing", "consumable"] }),
    magic("potion-of-greater-healing", "Potion of Greater Healing", "Consumable", "Uncommon", "Drink to regain 4d4 + 4 HP.", { itemType: "Potion", tags: ["potion", "healing", "consumable"] }),
    magic("potion-of-superior-healing", "Potion of Superior Healing", "Consumable", "Rare", "Drink to regain 8d4 + 8 HP.", { itemType: "Potion", tags: ["potion", "healing", "consumable"] }),
    magic("potion-of-supreme-healing", "Potion of Supreme Healing", "Consumable", "Very Rare", "Drink to regain 10d4 + 20 HP.", { itemType: "Potion", tags: ["potion", "healing", "consumable"] }),
    magic("potion-of-climbing", "Potion of Climbing", "Consumable", "Common", "For 1 hour, gain a climbing speed equal to walking speed and advantage on Athletics checks made to climb.", { itemType: "Potion", tags: ["potion", "climbing", "consumable"] }),
    magic("potion-of-water-breathing", "Potion of Water Breathing", "Consumable", "Uncommon", "Breathe underwater for 1 hour after drinking.", { itemType: "Potion", tags: ["potion", "water", "consumable"] }),
    magic("potion-of-invisibility", "Potion of Invisibility", "Consumable", "Very Rare", "You and carried gear become invisible for 1 hour, ending early when you attack or cast a spell.", { itemType: "Potion", tags: ["potion", "invisibility", "consumable"] }),
    magic("potion-of-flying", "Potion of Flying", "Consumable", "Very Rare", "Gain a flying speed equal to walking speed for 1 hour and can hover.", { itemType: "Potion", tags: ["potion", "flight", "consumable"] }),
    magic("potion-of-speed", "Potion of Speed", "Consumable", "Very Rare", "Gain the effect of haste for 1 minute without concentration; normal haste lethargy follows.", { itemType: "Potion", tags: ["potion", "haste", "consumable"] }),
    magic("oil-of-slipperiness", "Oil of Slipperiness", "Consumable", "Uncommon", "Can coat a Medium creature or area; on a creature it grants freedom of movement for 8 hours, while on the ground it mimics grease.", { itemType: "Oil", tags: ["oil", "movement", "consumable"] }),
    magic("keoghtoms-ointment", "Keoghtom's Ointment", "Consumable", "Uncommon", "A dose restores 2d8 + 2 HP and ends poison and disease. A jar contains several doses.", { itemType: "Ointment", tags: ["healing", "poison", "disease", "consumable"] }),
    magic("dagger-of-venom", "Dagger of Venom", "Weapon", "Rare", "+1 magic dagger. Once per day, coat the blade in magical poison; the next hit can deal 2d10 poison on a failed CON save.", { itemType: "Magic dagger", tags: ["weapon", "poison"] }),
    magic("dragon-slayer", "Dragon Slayer", "Weapon", "Rare", "+1 magic sword. Against a dragon, a hit deals an extra 3d6 weapon damage.", { itemType: "Magic sword", tags: ["weapon", "dragon"] }),
    magic("flame-tongue", "Flame Tongue", "Weapon", "Rare", "A command ignites the blade, shedding light and adding 2d6 fire damage to hits until extinguished.", { itemType: "Magic sword", attunement: true, tags: ["weapon", "fire"] }),
    magic("frost-brand", "Frost Brand", "Weapon", "Very Rare", "Adds 1d6 cold damage, grants fire resistance while held, and can extinguish nonmagical flames nearby when drawn.", { itemType: "Magic sword", attunement: true, tags: ["weapon", "cold", "fire-resistance"] }),
    magic("giant-slayer", "Giant Slayer", "Weapon", "Rare", "+1 magic axe or sword. Hits against giants deal an extra 2d6 weapon damage and can knock a Large or smaller giant prone.", { itemType: "Magic axe or sword", tags: ["weapon", "giant"] }),
    magic("javelin-of-lightning", "Javelin of Lightning", "Weapon", "Uncommon", "Functions as a magic javelin. Once per day it can become a lightning bolt in a line to the target, damaging creatures along the path.", { itemType: "Magic javelin", tags: ["weapon", "lightning"] }),
    magic("mace-of-disruption", "Mace of Disruption", "Weapon", "Rare", "Deals extra radiant damage to fiends and undead; heavily wounded targets can be destroyed outright on a failed WIS save. Also sheds light on command.", { itemType: "Magic mace", attunement: true, tags: ["weapon", "radiant", "undead", "fiend"] }),
    magic("mace-of-smiting", "Mace of Smiting", "Weapon", "Rare", "+1 magic mace, stronger against constructs. Critical hits add substantial bludgeoning damage and may destroy a low-HP construct.", { itemType: "Magic mace", tags: ["weapon", "construct"] }),
    magic("mace-of-terror", "Mace of Terror", "Weapon", "Rare", "Has 3 charges. Spend a charge to emit a wave of terror that can frighten nearby creatures; regains charges each dawn.", { itemType: "Magic mace", attunement: true, tags: ["weapon", "fear", "charges"] }),
    magic("sun-blade", "Sun Blade", "Weapon", "Rare", "A radiant longsword-like blade that uses finesse, deals radiant damage, is especially effective against undead, and emits sunlight.", { itemType: "Magic sword", attunement: true, tags: ["weapon", "radiant", "undead", "sunlight"] }),
    magic("weapon-plus-1", "Weapon, +1", "Weapon", "Uncommon", "+1 to attack and damage rolls made with this magic weapon.", { itemType: "Magic weapon", tags: ["weapon", "+1"] }),
    magic("weapon-plus-2", "Weapon, +2", "Weapon", "Rare", "+2 to attack and damage rolls made with this magic weapon.", { itemType: "Magic weapon", tags: ["weapon", "+2"] }),
    magic("weapon-plus-3", "Weapon, +3", "Weapon", "Very Rare", "+3 to attack and damage rolls made with this magic weapon.", { itemType: "Magic weapon", tags: ["weapon", "+3"] }),
    magic("armor-plus-1", "Armor, +1", "Armor & Shield", "Rare", "+1 AC while wearing this magic armor.", { itemType: "Magic armor", tags: ["armor", "+1"] }),
    magic("armor-plus-2", "Armor, +2", "Armor & Shield", "Very Rare", "+2 AC while wearing this magic armor.", { itemType: "Magic armor", tags: ["armor", "+2"] }),
    magic("armor-plus-3", "Armor, +3", "Armor & Shield", "Legendary", "+3 AC while wearing this magic armor.", { itemType: "Magic armor", tags: ["armor", "+3"] }),
    magic("shield-plus-1", "Shield, +1", "Armor & Shield", "Uncommon", "+1 additional AC while wielding this magic shield, on top of the shield's normal bonus.", { itemType: "Magic shield", tags: ["shield", "+1"] }),
    magic("shield-plus-2", "Shield, +2", "Armor & Shield", "Rare", "+2 additional AC while wielding this magic shield, on top of the shield's normal bonus.", { itemType: "Magic shield", tags: ["shield", "+2"] }),
    magic("shield-plus-3", "Shield, +3", "Armor & Shield", "Very Rare", "+3 additional AC while wielding this magic shield, on top of the shield's normal bonus.", { itemType: "Magic shield", tags: ["shield", "+3"] })
  ];

  return [...weapons, ...armors, ...gear, ...magicItems];
});
