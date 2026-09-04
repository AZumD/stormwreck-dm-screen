(function () {
  "use strict";

  const api = window.CatalogueContentI18n;
  if (!api) return;

  const MONSTER_IDS = new Set([
    "monster-ape", "monster-black-bear", "monster-brown-bear", "monster-polar-bear", "monster-boar",
    "monster-panther", "monster-lion", "monster-tiger", "monster-giant-hyena", "monster-giant-bat",
    "monster-giant-owl", "monster-giant-goat", "monster-giant-crab", "monster-crocodile", "monster-giant-crocodile",
    "monster-constrictor-snake", "monster-giant-constrictor-snake", "monster-poisonous-snake", "monster-giant-poisonous-snake",
    "monster-warhorse", "monster-mastiff", "monster-giant-badger", "monster-giant-weasel", "monster-giant-centipede",
    "monster-giant-fire-beetle", "monster-stirge", "monster-cockatrice", "monster-basilisk", "monster-griffon",
    "monster-hippogriff", "monster-rust-monster", "monster-gargoyle", "monster-ankheg", "monster-ettercap",
    "monster-phase-spider", "monster-shadow", "monster-mummy", "monster-ghost", "monster-fire-elemental",
    "monster-air-elemental", "monster-earth-elemental", "monster-water-elemental", "monster-minotaur", "monster-dryad",
    "monster-satyr", "monster-sprite", "monster-imp", "monster-hell-hound"
  ]);

  const MONSTER_ALIASES = {
    "monster-ape": ["apa"],
    "monster-black-bear": ["svartbjörn", "björn"],
    "monster-brown-bear": ["brunbjörn", "björn"],
    "monster-polar-bear": ["isbjörn", "björn"],
    "monster-boar": ["vildsvin", "svin"],
    "monster-panther": ["panter", "kattdjur"],
    "monster-lion": ["lejon", "kattdjur"],
    "monster-tiger": ["tiger", "kattdjur"],
    "monster-giant-hyena": ["jättehyena", "hyena"],
    "monster-giant-bat": ["jättefladdermus", "fladdermus"],
    "monster-giant-owl": ["jätteuggla", "uggla"],
    "monster-giant-goat": ["jätteget", "get"],
    "monster-giant-crab": ["jättekrabba", "krabba"],
    "monster-crocodile": ["krokodil"],
    "monster-giant-crocodile": ["jättekrokodil", "krokodil"],
    "monster-constrictor-snake": ["boaorm", "orm", "kramorm"],
    "monster-giant-constrictor-snake": ["jätteboa", "jätteorm", "orm"],
    "monster-poisonous-snake": ["giftorm", "orm"],
    "monster-giant-poisonous-snake": ["jättegiftorm", "giftorm", "orm"],
    "monster-warhorse": ["stridshäst", "krigshäst", "häst"],
    "monster-mastiff": ["mastiff", "hund"],
    "monster-giant-badger": [" jättegrävling", "grävling"],
    "monster-giant-weasel": ["jättevessla", "vessla"],
    "monster-giant-centipede": ["jättetusenfoting", "tusenfoting"],
    "monster-giant-fire-beetle": ["jätteeldskalbagge", "skalbagge"],
    "monster-stirge": ["stirge", "blodsugare"],
    "monster-cockatrice": ["kokatris", "förstening"],
    "monster-basilisk": ["basilisk", "förstening"],
    "monster-griffon": ["grip", "griffon"],
    "monster-hippogriff": ["hippogriff"],
    "monster-rust-monster": ["rostmonster", "metall"],
    "monster-gargoyle": ["gargoyl", "stenstaty"],
    "monster-ankheg": ["ankheg", "grävare", "syra"],
    "monster-ettercap": ["ettercap", "spindel", "nät"],
    "monster-phase-spider": ["fasspindel", "spindel", "eterisk"],
    "monster-shadow": ["skugga", "odöd"],
    "monster-mummy": ["mumie", "odöd"],
    "monster-ghost": ["spöke", "ande", "odöd"],
    "monster-fire-elemental": ["eldelementar", "elementar", "eld"],
    "monster-air-elemental": ["luftelementar", "elementar", "luft"],
    "monster-earth-elemental": ["jordelementar", "elementar", "jord"],
    "monster-water-elemental": ["vattenelementar", "elementar", "vatten"],
    "monster-minotaur": ["minotaur", "labyrint"],
    "monster-dryad": ["dryad", "skogsväsen"],
    "monster-satyr": ["satyr", "skogsväsen"],
    "monster-sprite": ["sprite", "älva", "fé"],
    "monster-imp": ["imp", "smådjävul", "djävul"],
    "monster-hell-hound": ["helveteshund", "eldhund", "fiend"]
  };

  const WORDS = {
    armor: ["rustning"], shield: ["sköld"], sword: ["svärd"], dagger: ["dolk"], axe: ["yxa"],
    hammer: ["hammare"], mace: ["stridsklubba"], bow: ["båge"], crossbow: ["armborst"], spear: ["spjut"],
    javelin: ["kastspjut"], club: ["klubba"], whip: ["piska"], net: ["nät"], poison: ["gift"], venom: ["gift"],
    potion: ["dryck", "potion"], healing: ["läkning", "healing"], health: ["hälsa"], protection: ["skydd"],
    strength: ["styrka"], intellect: ["intelligens"], luck: ["tur"], water: ["vatten"], climbing: ["klättring"],
    flying: ["flygning"], speed: ["hastighet"], invisibility: ["osynlighet"], light: ["ljus"], fire: ["eld"],
    frost: ["frost", "kyla"], lightning: ["blixt"], dragon: ["drake"], giant: ["jätte"], magic: ["magi"],
    detection: ["upptäcka", "detektering"], holding: ["förvaring"], rope: ["rep"], boots: ["stövlar"],
    gloves: ["handskar"], goggles: ["glasögon"], hat: ["hatt"], helm: ["hjälm"], ring: ["ring"],
    cloak: ["mantel"], wand: ["stav", "trollstav"], stone: ["sten"], pearl: ["pärla"], bag: ["väska"],
    rod: ["stav"], lantern: ["lykta"], necklace: ["halsband"], amulet: ["amulett"], bracers: ["armskenor"],
    broom: ["kvast"], deck: ["kortlek"], dust: ["stoft"], oil: ["olja"], chime: ["klockspel"],
    hole: ["hål"], quiver: ["koger"], sending: ["sändning", "meddelande"], alchemy: ["alkemi"]
  };

  function generatedAliases(name) {
    const lower = String(name || "").toLowerCase();
    const aliases = [];
    Object.entries(WORDS).forEach(([word, translated]) => {
      if (lower.includes(word)) aliases.push(...translated);
    });
    return [...new Set(aliases)];
  }

  const monsterRecords = {};
  (window.CatalogueSeeds?.monster || []).forEach((entry) => {
    if (!MONSTER_IDS.has(entry?.id)) return;
    monsterRecords[entry.id] = {
      aliases: MONSTER_ALIASES[entry.id] || [],
      sv: {}
    };
  });
  api.register("monster", monsterRecords);

  const itemRecords = {};
  (window.CatalogueSeeds?.item || []).forEach((entry) => {
    if (!String(entry?.id || "").startsWith("item-srd-")) return;
    const aliases = generatedAliases(entry.name);
    if (entry.category === "Weapon") aliases.push("vapen");
    if (entry.category === "Armor & Shield") aliases.push("rustning", "sköld");
    if (entry.category === "Consumable") aliases.push("förbrukningsvara");
    if (entry.category === "Wondrous Item") aliases.push("magiskt föremål");
    if (entry.category === "Tool & Kit") aliases.push("verktyg");
    itemRecords[entry.id] = { aliases: [...new Set(aliases)], sv: {} };
  });
  api.register("item", itemRecords);
})();
