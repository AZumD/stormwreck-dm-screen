"use strict";

/**
 * Background entries used by the expanded Character Creator. These are concise,
 * original summaries rather than reproduced sourcebook rules text.
 */

const ABILITY_NAMES = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma"
};

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function featRef(name) {
  if (!name) return "";
  const label = String(name).replace(/\|/g, "/");
  return `@feature:feature-feat-${slugify(name)}|${label}`;
}

const BACKGROUNDS = [
  { name: "Acolyte", rules: ["2014", "2024"], abilities: ["int", "wis", "cha"], feat: "Magic Initiate (Cleric)", source: "Core", description: "You served a temple, faith, cult, or sacred institution before the road called." },
  { name: "Anthropologist", rules: ["2014", "2024"], legacy2024: true, source: "Tomb of Annihilation", description: "You learned by living among unfamiliar peoples and studying cultures from the inside." },
  { name: "Archaeologist", rules: ["2014", "2024"], legacy2024: true, source: "Tomb of Annihilation", description: "You dig through ruins, dead languages, old traps, and the consequences of touching ancient things." },
  { name: "Artisan", rules: ["2024"], abilities: ["str", "dex", "int"], feat: "Crafter", source: "Core", description: "You learned a trade and built useful things long before adventuring became the worse career choice." },
  { name: "Astral Drifter", rules: ["2014", "2024"], legacy2024: true, source: "Spelljammer", description: "You spent years wandering the Astral Sea and returned with impossible distances behind your eyes." },
  { name: "Charlatan", rules: ["2014", "2024"], abilities: ["dex", "con", "cha"], feat: "Skilled", source: "Core", description: "You survived by selling confidence, lies, disguises, schemes, and exactly the story people wanted." },
  { name: "City Watch", rules: ["2014", "2024"], legacy2024: true, source: "SCAG", description: "You kept order in crowded streets and learned how cities hide trouble in plain sight." },
  { name: "Clan Crafter", rules: ["2014", "2024"], legacy2024: true, source: "SCAG", description: "Your craft is tied to a clan tradition, professional reputation, and generations of exacting standards." },
  { name: "Cloistered Scholar", rules: ["2014", "2024"], legacy2024: true, source: "SCAG", description: "You lived among books, archives, teachers, and the dangerous assumption that knowledge behaves." },
  { name: "Courtier", rules: ["2014", "2024"], legacy2024: true, source: "SCAG", description: "You learned power from hallways, etiquette, whispered favors, and knowing who truly controls a room." },
  { name: "Criminal", rules: ["2014", "2024"], abilities: ["dex", "con", "int"], feat: "Alert", source: "Core", description: "You made a living outside the law and learned the value of contacts, exits, and suspicion." },
  { name: "Entertainer", rules: ["2014", "2024"], abilities: ["str", "dex", "cha"], feat: "Musician", source: "Core", description: "You lived by holding an audience, whether through music, drama, spectacle, or dangerous stunts." },
  { name: "Faceless", rules: ["2014", "2024"], legacy2024: true, source: "Avernus", description: "You cultivated a second identity and learned what a mask can do that a name cannot." },
  { name: "Far Traveler", rules: ["2014", "2024"], legacy2024: true, source: "SCAG", description: "You come from somewhere distant enough that even ordinary habits make you an outsider here." },
  { name: "Farmer", rules: ["2024"], abilities: ["str", "con", "wis"], feat: "Tough", source: "Core", description: "Hard work, weather, animals, and stubborn routine taught you endurance before monsters ever did." },
  { name: "Feylost", rules: ["2014", "2024"], legacy2024: true, source: "Witchlight", description: "You vanished into the Feywild and came back carrying habits, memories, or companions that never quite left." },
  { name: "Folk Hero", rules: ["2014", "2024"], legacy2024: true, source: "Legacy Core", description: "Ordinary people already know your name because once, when it mattered, you stood up." },
  { name: "Guard", rules: ["2024"], abilities: ["str", "int", "wis"], feat: "Alert", source: "Core", description: "You spent long hours watching for trouble and learned that danger usually arrives before permission." },
  { name: "Guide", rules: ["2024"], abilities: ["dex", "con", "wis"], feat: "Magic Initiate (Druid)", source: "Core", description: "You got people through hostile places by reading terrain, weather, tracks, and bad decisions." },
  { name: "Guild Artisan", rules: ["2014", "2024"], legacy2024: true, source: "Legacy Core", description: "A guild trained your hands, guarded your trade, and connected you to a wider professional network." },
  { name: "Haunted One", rules: ["2014", "2024"], legacy2024: true, source: "Ravenloft", description: "Something terrible happened, and whatever survived it still walks around wearing your name." },
  { name: "Hermit", rules: ["2014", "2024"], abilities: ["con", "wis", "cha"], feat: "Healer", source: "Core", description: "You withdrew from ordinary society for contemplation, survival, revelation, or simply blessed silence." },
  { name: "House Agent", rules: ["2014", "2024"], legacy2024: true, source: "Eberron", description: "You worked for one of Eberron's dragonmarked houses, where business and power are often the same thing." },
  { name: "Inheritor", rules: ["2014", "2024"], legacy2024: true, source: "SCAG", description: "Something important was left to you, along with the attention, burden, or enemies attached to it." },
  { name: "Knight of the Order", rules: ["2014", "2024"], legacy2024: true, source: "SCAG", description: "You belong to an order whose vows, reputation, and obligations follow you into every adventure." },
  { name: "Mercenary Veteran", rules: ["2014", "2024"], legacy2024: true, source: "SCAG", description: "You learned war as paid work: marching, contracts, logistics, violence, and who actually survives campaigns." },
  { name: "Merchant", rules: ["2024"], abilities: ["con", "int", "cha"], feat: "Lucky", source: "Core", description: "You bought, sold, bargained, traveled, and learned that every road eventually becomes a marketplace." },
  { name: "Noble", rules: ["2014", "2024"], abilities: ["str", "int", "cha"], feat: "Skilled", source: "Core", description: "You were raised around status, expectation, etiquette, and the machinery that protects privilege." },
  { name: "Outlander", rules: ["2014", "2024"], legacy2024: true, source: "Legacy Core", description: "You grew up beyond settled comfort and learned to read the land before reading a room." },
  { name: "Sage", rules: ["2014", "2024"], abilities: ["con", "int", "wis"], feat: "Magic Initiate (Wizard)", source: "Core", description: "Research was your trade, curiosity your vice, and obscure information your favorite kind of weapon." },
  { name: "Sailor", rules: ["2014", "2024"], abilities: ["str", "dex", "wis"], feat: "Tavern Brawler", source: "Core", description: "You worked decks, ropes, storms, ports, and crews where competence matters more than speeches." },
  { name: "Scribe", rules: ["2024"], abilities: ["dex", "int", "wis"], feat: "Skilled", source: "Core", description: "You copied, recorded, translated, and preserved information until the written word became a craft." },
  { name: "Soldier", rules: ["2014", "2024"], abilities: ["str", "dex", "con"], feat: "Savage Attacker", source: "Core", description: "Military life taught you discipline, violence, hierarchy, and the practical reality of keeping comrades alive." },
  { name: "Urban Bounty Hunter", rules: ["2014", "2024"], legacy2024: true, source: "SCAG", description: "You tracked people through alleys, taverns, rumors, and debts instead of forests and footprints." },
  { name: "Urchin", rules: ["2014", "2024"], legacy2024: true, source: "Legacy Core", description: "You learned the city from street level, surviving through speed, observation, and knowing where not to be." },
  { name: "Wayfarer", rules: ["2024"], abilities: ["dex", "wis", "cha"], feat: "Lucky", source: "Core", description: "You survived by moving from place to place, reading people and opportunities faster than maps." },
  { name: "Wildspacer", rules: ["2014", "2024"], legacy2024: true, source: "Spelljammer", description: "You worked aboard spelljamming vessels where vacuum, monsters, and impossible skies count as occupational hazards." },
  { name: "Witchlight Hand", rules: ["2014", "2024"], legacy2024: true, source: "Witchlight", description: "You worked the Witchlight Carnival, surrounded by fey spectacle, strange coworkers, and stranger customers." }
];

module.exports = BACKGROUNDS.map((background) => {
  const id = `background-${slugify(background.name)}`;
  return {
    type: "background",
    id,
    entry: {
      id,
      type: "background",
      name: background.name,
      entryKind: "background",
      source: background.source,
      rulesets: background.rules,
      abilityScoreOptions: (background.abilities || []).map((ability) => ABILITY_NAMES[ability] || ability),
      originFeatRefs: background.feat ? [featRef(background.feat)] : [],
      summary: background.description,
      description: background.description,
      notes: background.legacy2024
        ? "Legacy background available in the creator's 2024-compatible pool; adapt its revised build details as needed."
        : "",
      tags: ["background", "character-creator", "expanded"]
    }
  };
});
