(function () {
  "use strict";

  const CLASSES = [
    { name: "Artificer", primary: "Intelligence", complexity: "High", caster: true, rules: ["2014", "2024"], source: "Eberron", description: "A magical engineer who turns tools, inventions, and crafted wonders into a spellcasting arsenal." },
    { name: "Barbarian", primary: "Strength", complexity: "Low", caster: false, rules: ["2014", "2024"], source: "Core", description: "A ferocious frontline warrior who turns fury, toughness, and raw momentum into staying power." },
    { name: "Bard", primary: "Charisma", complexity: "High", caster: true, rules: ["2014", "2024"], source: "Core", description: "A versatile performer and spellcaster who solves problems with magic, skill, and audacity." },
    { name: "Cleric", primary: "Wisdom", complexity: "Average", caster: true, rules: ["2014", "2024"], source: "Core", description: "A divine spellcaster who channels sacred power into healing, protection, and battlefield control." },
    { name: "Druid", primary: "Wisdom", complexity: "High", caster: true, rules: ["2014", "2024"], source: "Core", description: "A primal spellcaster tied to nature, transformation, weather, beasts, and the old wild places." },
    { name: "Fighter", primary: "Strength / Dexterity", complexity: "Average", caster: false, rules: ["2014", "2024"], source: "Core", description: "A weapon specialist built around reliable attacks, tactical flexibility, and sheer martial competence." },
    { name: "Monk", primary: "Dexterity / Wisdom", complexity: "High", caster: false, rules: ["2014", "2024"], source: "Core", description: "A mobile martial artist who weaponizes speed, discipline, precision, and supernatural focus." },
    { name: "Paladin", primary: "Strength / Charisma", complexity: "Average", caster: true, rules: ["2014", "2024"], source: "Core", description: "An oath-bound champion blending heavy armor, healing, divine magic, and explosive melee strikes." },
    { name: "Ranger", primary: "Dexterity / Wisdom", complexity: "Average", caster: true, rules: ["2014", "2024"], source: "Core", description: "A wilderness hunter combining martial skill, tracking, exploration tricks, and primal magic." },
    { name: "Rogue", primary: "Dexterity", complexity: "Average", caster: false, rules: ["2014", "2024"], source: "Core", description: "A precision specialist who thrives on mobility, expertise, dirty tricks, and perfectly timed attacks." },
    { name: "Sorcerer", primary: "Charisma", complexity: "High", caster: true, rules: ["2014", "2024"], source: "Core", description: "An instinctive spellcaster whose magic comes from within and bends through raw supernatural talent." },
    { name: "Warlock", primary: "Charisma", complexity: "High", caster: true, rules: ["2014", "2024"], source: "Core", description: "An occult spellcaster empowered by a pact, strange gifts, and highly customizable eldritch tricks." },
    { name: "Wizard", primary: "Intelligence", complexity: "High", caster: true, rules: ["2014", "2024"], source: "Core", description: "A scholarly spellcaster with the broadest magical toolbox and a spellbook full of answers." }
  ];

  const SPECIES = [
    { name: "Aarakocra", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Birdfolk of high places, naturally airborne and happiest when the horizon is wide open." },
    { name: "Aasimar", rules: ["2014", "2024"], flexible2014: true, source: "Core / MotM", description: "Mortals touched by celestial power, carrying radiant gifts and an unmistakable otherworldly spark." },
    { name: "Astral Elf", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Spelljammer", description: "Elves shaped by the timeless Astral Sea, gifted with strange memory and star-born magic." },
    { name: "Autognome", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Spelljammer", description: "Small mechanical people built by rock gnomes, equal parts construct, curiosity, and stubborn personality." },
    { name: "Bugbear", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Long-limbed goblinoids who mix surprising stealth with reach, muscle, and ambush instincts." },
    { name: "Centaur", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Swift fey-touched nomads with equine bodies, powerful movement, and a natural charge into danger." },
    { name: "Changeling", rules: ["2014", "2024"], flexible2014: true, source: "Eberron / MotM", description: "Natural shape-shifters who can rewrite their face and body as easily as changing clothes." },
    { name: "Deep Gnome", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Subterranean gnomes hardened by the Underdark, cautious, elusive, and difficult to fool." },
    { name: "Dhampir", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Ravenloft", description: "Half-vampiric wanderers balancing mortal identity against an eerie hunger and predatory gifts." },
    { name: "Dragonborn", rules: ["2014", "2024"], bonus2014: { str: 2, cha: 1 }, source: "Core", description: "Proud draconic humanoids whose ancestry manifests through elemental breath and supernatural resilience." },
    { name: "Dwarf", rules: ["2014", "2024"], bonus2014: { con: 2 }, source: "Core", description: "Stout, enduring folk with deep traditions, darkvision, and a talent for surviving what should hurt." },
    { name: "Eladrin", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Feywild elves whose moods echo the seasons and whose magic lets them step through space." },
    { name: "Elf", rules: ["2014", "2024"], bonus2014: { dex: 2 }, source: "Core", description: "Graceful, long-lived people with keen senses, fey ancestry, and lineages steeped in magic." },
    { name: "Fairy", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Tiny fey adventurers with wings, innate magic, and absolutely no obligation to respect gravity." },
    { name: "Firbolg", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Gentle giant-kin with subtle fey magic, woodland instincts, and an affinity for quiet places." },
    { name: "Genasi", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "People infused with elemental power, shaped by air, earth, fire, or water." },
    { name: "Giff", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Spelljammer", description: "Broad, hippo-like spacefarers famous for martial confidence, big weapons, and bigger personalities." },
    { name: "Githyanki", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Astral warriors raised in a militant culture, gifted with psionics and planar mobility." },
    { name: "Githzerai", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Disciplined psionic ascetics who train mind and body against chaos, intrusion, and control." },
    { name: "Gnome", rules: ["2014", "2024"], bonus2014: { int: 2 }, source: "Core", description: "Small, curious folk known for quick minds, odd ideas, magical knack, and dangerous enthusiasm." },
    { name: "Goblin", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Small goblinoids built for opportunism, quick escapes, sudden aggression, and surviving bad plans." },
    { name: "Goliath", rules: ["2014", "2024"], flexible2014: true, source: "Core / MotM", description: "Powerful giant-kin who carry echoes of giant ancestry into feats of strength and endurance." },
    { name: "Hadozee", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Spelljammer", description: "Simian spacefarers with gliding membranes, deft movement, and generations of shipboard experience." },
    { name: "Half-Elf", rules: ["2014", "2024"], legacy2024: true, bonus2014: { cha: 2 }, source: "Legacy", description: "People of mixed human and elven heritage, traditionally defined by adaptability and social versatility." },
    { name: "Half-Orc", rules: ["2014", "2024"], legacy2024: true, bonus2014: { str: 2, con: 1 }, source: "Legacy", description: "People of mixed orc and human heritage, famously hard to drop and frightening in a fight." },
    { name: "Halfling", rules: ["2014", "2024"], bonus2014: { dex: 2 }, source: "Core", description: "Small, nimble folk with remarkable nerve, uncanny luck, and a talent for slipping through trouble." },
    { name: "Harengon", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Rabbitfolk touched by the Feywild, quick on their feet and blessed with twitch-fast reflexes." },
    { name: "Hexblood", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Ravenloft", description: "Fey-cursed or hag-touched people marked by eerie tokens, uncanny bargains, and unsettling magic." },
    { name: "Hobgoblin", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Disciplined goblinoids whose culture prizes coordination, resolve, and turning teamwork into force." },
    { name: "Human", rules: ["2014", "2024"], bonus2014: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, source: "Core", description: "Adaptable and wildly varied, humans are defined less by one gift than by sheer flexibility." },
    { name: "Kalashtar", rules: ["2014", "2024"], flexible2014: true, source: "Eberron", description: "Humans bound to dream-born quori spirits, carrying telepathic gifts and unusual mental resilience." },
    { name: "Kenku", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Corvid folk with sharp memories, excellent mimicry, and a knack for borrowed sounds and skills." },
    { name: "Khoravar", rules: ["2024"], source: "Eberron", description: "A distinct Eberron people descended from humans and elves, with their own communities and traditions." },
    { name: "Kobold", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Small draconic folk who survive through nerve, cleverness, community, and shameless tactical improvisation." },
    { name: "Leonin", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Theros", description: "Proud lionfolk with powerful bodies, sharp instincts, and a roar that can freeze courage." },
    { name: "Lizardfolk", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Reptilian survivors whose practical instincts, natural armor, and alien perspective suit harsh environments." },
    { name: "Loxodon", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Ravnica", description: "Elephantine folk known for calm resolve, physical power, and surprisingly useful trunks." },
    { name: "Minotaur", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Horned, powerfully built people whose momentum and natural weapons reward direct solutions." },
    { name: "Orc", rules: ["2014", "2024"], flexible2014: true, source: "Core / MotM", description: "Strong, relentless people with explosive mobility and a refusal to stay down when it matters." },
    { name: "Owlin", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Strixhaven", description: "Owlfolk with silent wings, keen darkvision, and an academic-fantasy knack for appearing dramatically." },
    { name: "Plasmoid", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Spelljammer", description: "Amorphous ooze people who squeeze, reshape themselves, and make rigid anatomy look optional." },
    { name: "Reborn", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Ravenloft", description: "People returned from death or remade by strange forces, sustained by fragmented memory and resilience." },
    { name: "Satyr", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Fey revelers with goatlike features, magical resistance, and an instinct for turning caution into a party." },
    { name: "Sea Elf", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Aquatic elves adapted to ocean life, equally at home beneath waves and on shore." },
    { name: "Shadar-kai", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Shadow-touched elves hardened by the Shadowfell, capable of blinking through darkness when danger closes." },
    { name: "Shifter", rules: ["2014", "2024"], flexible2014: true, source: "Eberron / MotM", description: "Weretouched people who briefly awaken bestial traits for speed, toughness, senses, or predatory force." },
    { name: "Simic Hybrid", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Ravnica", description: "Magically altered people whose bodies incorporate adaptive animal traits and experimental biology." },
    { name: "Tabaxi", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Catfolk explorers with sharp senses, sudden bursts of speed, claws, and relentless curiosity." },
    { name: "Thri-kreen", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Spelljammer", description: "Four-armed insectoid people with natural armor, telepathy, and a very different idea of body language." },
    { name: "Tiefling", rules: ["2014", "2024"], bonus2014: { int: 1, cha: 2 }, source: "Core", description: "Fiend-touched people whose infernal, abyssal, or chthonic legacy manifests as magic and resistance." },
    { name: "Tortle", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Turtlefolk wanderers protected by heavy shells and an instinct for carrying home with them." },
    { name: "Triton", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Amphibious ocean guardians with elemental magic and generations of experience fighting deep-sea threats." },
    { name: "Vedalken", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "Ravnica", description: "Cool-headed, analytical people who pursue improvement through relentless study and precise specialization." },
    { name: "Warforged", rules: ["2014", "2024"], flexible2014: true, source: "Eberron", description: "Sentient constructs built for war who now choose what purpose, identity, and life mean for themselves." },
    { name: "Yuan-ti", rules: ["2014", "2024"], legacy2024: true, flexible2014: true, source: "MotM", description: "Serpentine humanoids with innate magic, poison resistance, and an unsettlingly supernatural heritage." }
  ];

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

  const FEATS = [
    "Alert", "Crafter", "Healer", "Lucky", "Magic Initiate (Cleric)", "Magic Initiate (Druid)",
    "Magic Initiate (Wizard)", "Musician", "Savage Attacker", "Skilled", "Tavern Brawler", "Tough"
  ];

  const SPELLS = [
    "Acid Splash", "Blade Ward", "Chill Touch", "Dancing Lights", "Druidcraft", "Eldritch Blast", "Fire Bolt",
    "Friends", "Guidance", "Light", "Mage Hand", "Mending", "Message", "Minor Illusion", "Poison Spray",
    "Prestidigitation", "Produce Flame", "Ray of Frost", "Resistance", "Sacred Flame", "Shillelagh", "Spare the Dying",
    "Thaumaturgy", "Thorn Whip", "True Strike", "Vicious Mockery", "Animal Friendship", "Bane", "Bless", "Burning Hands",
    "Charm Person", "Chromatic Orb", "Command", "Cure Wounds", "Detect Magic", "Disguise Self", "Dissonant Whispers",
    "Entangle", "Faerie Fire", "Feather Fall", "Find Familiar", "Fog Cloud", "Goodberry", "Guiding Bolt", "Healing Word",
    "Heroism", "Hex", "Hunter's Mark", "Identify", "Inflict Wounds", "Longstrider", "Mage Armor", "Magic Missile",
    "Protection from Evil and Good", "Sanctuary", "Shield", "Sleep", "Thunderwave"
  ];

  const EQUIPMENT = [
    "Class equipment", "Adventurer's pack", "Explorer's pack", "Scholar's pack", "Priest's pack",
    "Burglar's pack", "Custom / decide later"
  ];

  window.StormwreckCharacterCreatorData = {
    CLASSES, SPECIES, BACKGROUNDS, FEATS, SPELLS, EQUIPMENT
  };
})();
