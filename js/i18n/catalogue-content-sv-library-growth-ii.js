(function () {
  "use strict";

  const api = window.CatalogueContentI18n;
  if (!api) return;

  const NPC_ALIASES = {
    "monster-commoner": ["vanlig person", "allmoge", "civil"],
    "monster-guard": ["vakt", "stadsvakt"],
    "monster-acolyte": ["akolyt", "prästlärling"],
    "monster-noble": ["adlig", "adelsman", "adel"],
    "monster-tribal-warrior": ["stamkrigare", "krigare"],
    "monster-scout": ["spejare", "spanare"],
    "monster-thug": ["ligist", "bus", "slagskämpe"],
    "monster-spy": ["spion", "agent"],
    "monster-berserker": ["bärsärk", "krigare"],
    "monster-priest": ["präst", "helare"],
    "monster-druid": ["druid", "naturmagiker"],
    "monster-knight": ["riddare"],
    "monster-veteran": ["veteran", "soldat"],
    "monster-gladiator": ["gladiator", "arenakämpe"],
    "monster-mage": ["magiker", "trollkarl"],
    "monster-assassin": ["lönnmördare", "mördare"],
    "monster-archmage": ["ärkemagiker", "ärkeförtrollare", "magiker"]
  };

  api.register("monster", Object.fromEntries(
    Object.entries(NPC_ALIASES).map(([id, aliases]) => [id, { aliases, sv: {} }])
  ));

  const LOOT_WORDS = {
    wheat: ["vete"], flour: ["mjöl"], salt: ["salt"], iron: ["järn"], canvas: ["kanvas", "segelduk"],
    copper: ["koppar"], cotton: ["bomull"], ginger: ["ingefära"], cinnamon: ["kanel"], pepper: ["peppar"],
    cloves: ["kryddnejlika", "nejlika"], silver: ["silver"], linen: ["linne"], silk: ["siden", "silke"],
    saffron: ["saffran"], gold: ["guld"], platinum: ["platina"],
    azurite: ["azurit"], agate: ["agat"], quartz: ["kvarts"], hematite: ["hematit"], lapis: ["lapis lazuli"],
    malachite: ["malakit"], obsidian: ["obsidian"], turquoise: ["turkos"], bloodstone: ["blodsten"],
    carnelian: ["karneol"], chalcedony: ["kalcedon"], chrysoprase: ["krysopras"], citrine: ["citrin"],
    jasper: ["jaspis"], moonstone: ["månsten"], onyx: ["onyx"], sardonyx: ["sardonyx"], zircon: ["zirkon"],
    amber: ["bärnsten"], amethyst: ["ametist"], chrysoberyl: ["krysoberyll"], coral: ["korall"],
    garnet: ["granat"], jade: ["jade"], jet: ["gagat"], pearl: ["pärla"], spinel: ["spinell"],
    tourmaline: ["turmalin"], alexandrite: ["alexandrit"], aquamarine: ["akvamarin"], peridot: ["peridot"],
    topaz: ["topas"], opal: ["opal"], sapphire: ["safir"], emerald: ["smaragd"], ruby: ["rubin"],
    diamond: ["diamant"], jacinth: ["hyacint"]
  };

  function aliasesFor(entry) {
    const lower = String(entry?.name || "").toLowerCase();
    const aliases = [];
    Object.entries(LOOT_WORDS).forEach(([word, translations]) => {
      if (lower.includes(word)) aliases.push(...translations);
    });
    if (entry?.category === "Trade Good") aliases.push("handelsvara", "handelsgods");
    if (entry?.itemType === "Gemstone") aliases.push("ädelsten", "juvel", "skatt");
    if (entry?.category === "Treasure & Valuable") aliases.push("skatt", "värdesak");
    return [...new Set(aliases)];
  }

  const records = {};
  (window.CatalogueSeeds?.item || []).forEach((entry) => {
    const id = String(entry?.id || "");
    if (!id.startsWith("item-srd-trade-") && !id.startsWith("item-srd-gem-")) return;
    records[id] = { aliases: aliasesFor(entry), sv: {} };
  });
  api.register("item", records);
})();
