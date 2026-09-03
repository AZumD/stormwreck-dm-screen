(function () {
  "use strict";

  const i18n = window.AppI18n;
  if (!i18n?.isSwedish?.()) return;

  const TYPE_COPY = {
    pc: { title: "Rollpersonskatalog", subtitle: "Rollpersoner, rollformulär och kampanjkopplingar.", singular: "rollperson" },
    npc: { title: "NPC-katalog", subtitle: "Återkommande spelledarpersoner med statistik, utrustning och berättelsenoteringar.", singular: "NPC" },
    monster: { title: "Monsterkatalog", subtitle: "Varelser, stridsvärden, förmågor och encounter-anteckningar.", singular: "monster" },
    location: { title: "Platskatalog", subtitle: "Platser, kartor, personer och sådant som finns att upptäcka där.", singular: "plats" },
    item: { title: "Föremålskatalog", subtitle: "Utrustning, skatter, verktyg, ingredienser och andra föremål.", singular: "föremål" },
    race: { title: "Släkteskatalog", subtitle: "Spelbara släkten och deras särdrag.", singular: "släkte" },
    background: { title: "Bakgrundskatalog", subtitle: "Rollpersonsbakgrunder, grundegenskapsval, origin feats och berättelsekrokar.", singular: "bakgrund" },
    class: { title: "Klasskatalog", subtitle: "Klasser, subklasser, Hit Dice, färdigheter och klassförmågor.", singular: "klass" },
    spell: { title: "Besvärjelsekatalog", subtitle: "Besvärjelser, nivåer, komponenter och magireferenser.", singular: "besvärjelse" },
    skill: { title: "Färdighetskatalog", subtitle: "Färdigheter, grundegenskaper och vanliga användningar.", singular: "färdighet" },
    feature: { title: "Förmågekatalog", subtitle: "Klassförmågor, feats, traits och andra mekaniska förmågor.", singular: "förmåga" },
    rule: { title: "Regelkatalog", subtitle: "Snabba, sökbara fusklappar för reglerna du faktiskt behöver vid bordet.", singular: "regel" },
    source: { title: "Källkatalog", subtitle: "Böcker, moduler och andra källor som innehållet kommer från.", singular: "källa" },
    music: { title: "Musikkatalog", subtitle: "Musik och atmosfär för kampanjer och scener.", singular: "spår" }
  };

  const SECTION_TITLES = {
    Identity: "Identitet",
    Basics: "Grunder",
    Details: "Detaljer",
    Description: "Beskrivning",
    Notes: "Anteckningar",
    Rules: "Regler",
    Source: "Källa",
    Taxonomy: "Indelning",
    Relationships: "Relationer",
    "Character creation": "Skapa rollperson",
    Rule: "Regel",
    "Cheat sheet": "Fusklapp",
    "Find & connect": "Hitta och länka",
    Combat: "Strid",
    Stats: "Värden",
    Abilities: "Grundegenskaper",
    Magic: "Magi",
    Media: "Media"
  };

  const FIELD_LABELS = {
    name: "Namn",
    title: "Titel",
    source: "Källa",
    page: "Sida",
    rulesets: "Regelversion",
    summary: "Sammanfattning",
    description: "Beskrivning",
    notes: "Anteckningar",
    tags: "Taggar",
    category: "Kategori",
    entryKind: "Typ",
    level: "Nivå",
    class: "Klass",
    race: "Släkte",
    background: "Bakgrund",
    subclass: "Subklass",
    size: "Storlek",
    speed: "Förflyttning",
    languages: "Språk",
    senses: "Sinnen",
    traits: "Traits",
    rarity: "Sällsynthet",
    value: "Värde",
    weight: "Vikt",
    location: "Plats",
    role: "Roll",
    ac: "Rustningsklass (AC)",
    hp: "HP",
    hpCurrent: "HP nu",
    hpMax: "HP max",
    cr: "CR",
    xp: "XP",
    damageResistances: "Skademotstånd",
    damageImmunities: "Skadeimmunitet",
    conditionImmunities: "Tillståndsimmunitet",
    savingThrows: "Räddningsslag",
    skills: "Färdigheter",
    skillRefs: "Färdigheter",
    featureRefs: "Förmågor",
    spellRefs: "Besvärjelser",
    abilityScoreIncrease: "Grundegenskaper",
    abilityScoreOptions: "Val av grundegenskaper",
    originFeatRefs: "Origin feat",
    primaryAbility: "Primär grundegenskap",
    hitDie: "Hit Die",
    school: "Magiskola",
    castingTime: "Kasttid",
    range: "Räckvidd",
    components: "Komponenter",
    duration: "Varaktighet",
    concentration: "Koncentration",
    ritual: "Ritual",
    classes: "Klasser",
    defaultAbility: "Grundegenskap",
    typicalUses: "Vanliga användningar",
    exampleChecks: "Exempelslag",
    featureType: "Förmågetyp",
    levelPrerequisite: "Nivåkrav",
    grantedBy: "Ges av",
    usesRecharge: "Användningar / återhämtning",
    quickReference: "Snabbreferens",
    details: "Detaljer / SL-bedömning",
    editionNotes: "Versionsskillnader",
    relatedRefs: "Relaterade regler",
    keywords: "Sökord"
  };

  const PLACEHOLDERS = {
    "Search…": "Sök…",
    "Search skills…": "Sök färdigheter…",
    "Search features…": "Sök förmågor…",
    "Search spells…": "Sök besvärjelser…",
    "Search rules…": "Sök regler…",
    "Search feature catalogue…": "Sök i förmågekatalogen…",
    "Search rules, terms, situations…": "Sök regler, termer, situationer…"
  };

  function localizeField(field) {
    if (!field || typeof field !== "object") return;
    if (FIELD_LABELS[field.id]) field.label = FIELD_LABELS[field.id];
    if (field.placeholder && PLACEHOLDERS[field.placeholder]) field.placeholder = PLACEHOLDERS[field.placeholder];
    if (field.searchPlaceholder && PLACEHOLDERS[field.searchPlaceholder]) field.searchPlaceholder = PLACEHOLDERS[field.searchPlaceholder];
    if (field.hint === "2024 backgrounds can link their granted origin feat from the Feature Catalogue.") {
      field.hint = "Bakgrunder från 2024-reglerna kan länka sin origin feat från Förmågekatalogen.";
    }
  }

  Object.entries(window.CatalogueConfigs || {}).forEach(([type, config]) => {
    const copy = TYPE_COPY[type];
    if (copy) {
      config.title = copy.title;
      config.subtitle = copy.subtitle;
      config.newLabel = `Ny ${copy.singular}`;
      config.searchPlaceholder = `Sök ${type === "npc" ? "NPC:er" : copy.singular + "er"}…`;
    }
    (config.sections || []).forEach((section) => {
      if (SECTION_TITLES[section.title]) section.title = SECTION_TITLES[section.title];
      (section.fields || []).forEach(localizeField);
    });
    (config.facets || []).forEach((facet) => {
      if (FIELD_LABELS[facet.id]) facet.label = FIELD_LABELS[facet.id];
    });
  });

  const compendium = window.CompendiumApp;
  if (compendium) {
    Object.keys(compendium.LABELS || {}).forEach((type) => {
      compendium.LABELS[type] = i18n.t(`site.compendium.types.${type}`, compendium.LABELS[type]);
    });
    (compendium.GROUPS || []).forEach((group) => {
      group.label = i18n.t(`site.compendium.groups.${group.id}`, group.label);
    });
  }
})();
