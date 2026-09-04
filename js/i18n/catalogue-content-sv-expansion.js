(function () {
  "use strict";

  const api = window.CatalogueContentI18n;
  if (!api) return;

  function race(name, aliases, summary, traits, extra = {}) {
    return {
      aliases: [name, ...(aliases || [])],
      sv: {
        name,
        summary,
        description: summary,
        traits,
        ...(extra || {})
      }
    };
  }

  function monster(aliases, traits, actions, extra = {}) {
    return {
      aliases: aliases || [],
      sv: {
        traits,
        actions,
        notes: "Kondenserad SRD 5.1-referens för spelbordet. Se docs/OPEN-CONTENT.md för attribution.",
        ...(extra || {})
      }
    };
  }

  api.register("race", {
    "race-grung": race(
      "Grung",
      ["grodfolk", "giftgroda"],
      "Små, färgstarka grodfolk vars trädklättring och giftiga hud gör dem mycket svåra att glömma.",
      "Amfibisk klättrare med giftimmunitet, giftig hud, kraftiga hopp och ett biologiskt behov av regelbunden kontakt med vatten.",
      { languages: "Grung" }
    ),
    "race-kender": race(
      "Kender",
      ["krynn", "dragonlance"],
      "Små vandrare från Krynn, kända för orädd nyfikenhet, social fräckhet och en nästan övernaturlig förmåga att hamna mitt i saker.",
      "Motståndskraftig mot rädsla, flink och ovanligt bra på att provocera fiender och råka ha praktiska småsaker nära till hands."
    ),
    "race-locathah": race(
      "Locathah",
      ["fiskfolk", "vattenfolk"],
      "Vattenlevande fiskfolk anpassade till livet under ytan, robusta men beroende av att regelbundet återvända till vatten.",
      "Amfibisk simmare med naturliga försvar, starka vatteninstinkter och begränsad tolerans för att hålla sig torr för länge.",
      { languages: "Aquan, Common" }
    ),
    "race-verdan": race(
      "Verdan",
      ["goblinoid", "telepati"],
      "Föränderliga människor med goblinoida rötter, omformade av kaotisk magi och utrustade med telepatisk känslighet.",
      "Föränderlig fysiologi, begränsad telepatisk kommunikation, stark social intuition och ovanligt snabb återhämtning."
    ),

    "subspecies-genasi-air": race(
      "Air Genasi",
      ["luftgenasi", "vindgenasi"],
      "Genasi präglade av elementär luft, med rastlös rörlighet, stormmagi och en instinktiv relation till vind och andning.",
      "Luftpräglad motståndskraft och medfödd vind- eller blixtmagi, plus ovanlig bekvämlighet i miljöer där andning eller höjd är ett problem."
    ),
    "subspecies-genasi-earth": race(
      "Earth Genasi",
      ["jordgenasi", "stengenasi"],
      "Jordpräglade genasi vars magi uttrycker sten, tyngd, uthållighet och säker rörelse genom besvärlig terräng.",
      "Jordpräglad tålighet, terrängaffinitet och medfödd skydds- eller smygmagi knuten till sten och jord."
    ),
    "subspecies-genasi-fire": race(
      "Fire Genasi",
      ["eldgenasi"],
      "Eldpräglade genasi med hetta i blodet, mörkersyn och medfödd eldmagi.",
      "Eldresistens, mörkersyn och medfödd eldmagi som utvecklas när rollpersonen blir starkare.",
      { senses: "Darkvision 60 ft." }
    ),
    "subspecies-genasi-water": race(
      "Water Genasi",
      ["vattengenasi", "havgenasi"],
      "Vattenpräglade genasi som är lika bekväma ovanför som under ytan och vars magi följer tidvatten och strömmande vatten.",
      "Amfibisk, syraresistent, naturligt skicklig i vatten och utrustad med medfödd vattenmagi."
    ),

    "subspecies-shifter-beasthide": race(
      "Beasthide Shifter",
      ["beasthide", "tålig shifter"],
      "En shifterlinje där förvandlingen betonar tjock hud, envis uthållighet och förmågan att stå kvar efter hårda träffar.",
      "Shifting ger framför allt tillfällig tålighet och starkare fysiskt försvar."
    ),
    "subspecies-shifter-longtooth": race(
      "Longtooth Shifter",
      ["longtooth", "bett"],
      "En rovdjurspräglad shifterlinje där förvandlingen drar fram kraftiga käkar och aggressiv närstrid.",
      "Shifting betonar ett naturligt bett och offensivt tryck i närstrid."
    ),
    "subspecies-shifter-swiftstride": race(
      "Swiftstride Shifter",
      ["swiftstride", "snabb shifter"],
      "En snabbfotad shifterlinje byggd kring fart, undanmanövrer och att hela tiden stå på exakt fel avstånd för fienden.",
      "Shifting ökar rörligheten och belönar rätt tajmad ompositionering."
    ),
    "subspecies-shifter-wildhunt": race(
      "Wildhunt Shifter",
      ["wildhunt", "spårare"],
      "En skarpsinnad shifterlinje fokuserad på spårning, vaksamhet och att vägra ge närliggande fiender enkla öppningar.",
      "Shifting skärper uppmärksamheten och gör rollpersonen ovanligt svår att överrumpla på nära håll."
    ),

    "subspecies-tiefling-abyssal": race(
      "Abyssal Tiefling",
      ["abyssal tiefling", "avgrundstiefling"],
      "En tieflinglinje präglad av Abyssen, med giftresistens och frätande eller försvagande medfödd magi.",
      "Abyssal fiendisk arvslinje centrerad kring giftresistens och toxisk, nedbrytande magi."
    ),
    "subspecies-tiefling-chthonic": race(
      "Chthonic Tiefling",
      ["chthonic tiefling", "dödstiefling"],
      "En tieflinglinje knuten till död och skugga i de lägre planen, med nekrotisk tålighet och gravpräglad magi.",
      "Chthonisk fiendisk arvslinje centrerad kring nekrotisk resistens och magi som försvagar eller dränerar."
    ),
    "subspecies-tiefling-infernal": race(
      "Infernal Tiefling",
      ["infernal tiefling", "helvetestiefling"],
      "Den klassiska helvetespräglade tieflinglinjen, markerad av eldresistens och medfödd infernalisk magi.",
      "Infernalisk fiendisk arvslinje centrerad kring eldresistens och magi från Hells."
    ),

    "subspecies-aasimar-protector": race(
      "Protector Aasimar",
      ["skyddsaasimar", "vingar"],
      "En äldre aasimarvariant där den himmelska uppenbarelsen uttrycks genom strålande vingar och en tydligt beskyddande närvaro.",
      "Äldre himmelsk transformation fokuserad på flygförmåga och radiant kraft."
    ),
    "subspecies-aasimar-scourge": race(
      "Scourge Aasimar",
      ["scourge aasimar", "radiant aura"],
      "En äldre aasimarvariant som låter himmelsk kraft brinna utåt som en farlig aura av strålande energi.",
      "Äldre himmelsk transformation fokuserad på en närstridsaura av radiant kraft som även belastar bäraren."
    ),
    "subspecies-aasimar-fallen": race(
      "Fallen Aasimar",
      ["fallen aasimar", "fallen aasimar", "nekrotisk"],
      "En äldre aasimarvariant skuggad av bruten eller korrumperad himmelsk påverkan och en skräckinjagande nekrotisk uppenbarelse.",
      "Äldre himmelsk transformation fokuserad på rädsla och nekrotisk kraft."
    )
  });

  api.register("monster", {
    "monster-goblin": monster(
      ["goblin"],
      "Nimble Escape — kan Disengage eller Hide som bonushandling.",
      "Scimitar. +4, 1d6+2 slashing.\nShortbow. +4, 80/320 ft., 1d6+2 piercing."
    ),
    "monster-kobold": monster(
      ["kobold"],
      "Pack Tactics — fördel när en aktiv allierad står intill målet. Sunlight Sensitivity gör starkt solljus besvärligt.",
      "Dagger. +4, 1d4+2 piercing.\nSling. +4, 30/120 ft., 1d4+2 bludgeoning."
    ),
    "monster-bandit": monster(
      ["bandit"],
      "En enkel humanoid motståndare utan specialresurser.",
      "Scimitar. +3, 1d6+1 slashing.\nLight Crossbow. +3, 80/320 ft., 1d8+1 piercing."
    ),
    "monster-bandit-captain": monster(
      ["banditkapten", "rövarhövding"],
      "Tåligare ledarstatblock med flera attacker och bra DEX.",
      "Multiattack — två scimitar och en dagger.\nScimitar. +5, 1d6+3 slashing.\nDagger. +5, 1d4+3 piercing.",
      { reactions: "Parry — +2 AC mot en synlig melee-attack som annars skulle träffa." }
    ),
    "monster-cultist": monster(
      ["kultist"],
      "Dark Devotion — fördel på räddningsslag mot charmed och frightened.",
      "Scimitar. +3, 1d6+1 slashing."
    ),
    "monster-cult-fanatic": monster(
      ["kultfanatiker", "kultledare"],
      "Dark Devotion samt gudomlig spellcasting på låg nivå. Typiska besvärjelser inkluderar command, inflict wounds, hold person och spiritual weapon.",
      "Multiattack — två dagger-attacker.\nDagger. +4, 1d4+2 piercing."
    ),
    "monster-skeleton": monster(
      ["skelett", "odöd"],
      "Sårbar mot bludgeoning, immun mot poison och påverkas inte av exhaustion eller poisoned.",
      "Shortsword. +4, 1d6+2 piercing.\nShortbow. +4, 80/320 ft., 1d6+2 piercing."
    ),
    "monster-wolf": monster(
      ["varg"],
      "Keen Hearing and Smell samt Pack Tactics.",
      "Bite. +4, 2d4+2 piercing; DC 11 STR eller prone."
    ),
    "monster-giant-rat": monster(
      ["jätteråtta", "stor råtta"],
      "Keen Smell samt Pack Tactics.",
      "Bite. +4, 1d4+2 piercing."
    ),
    "monster-swarm-of-rats": monster(
      ["råttsvärm", "svärm av råttor"],
      "Svärmen kan dela utrymme med andra varelser, pressa sig genom mycket små öppningar och är immun mot flera kontrolltillstånd.",
      "Bites. +2, 2d6 piercing; 1d6 när svärmen har högst hälften av sina HP."
    ),
    "monster-giant-spider": monster(
      ["jättespindel", "stor spindel"],
      "Spider Climb, Web Sense och Web Walker gör den stark i vertikala eller nätfyllda miljöer.",
      "Bite. +5, 1d8+3 piercing plus poison, DC 11 CON.\nWeb (Recharge 5–6). +5, 30/60 ft.; restrained, escape DC 12 STR."
    ),
    "monster-bugbear": monster(
      ["bugbear", "goblinoid"],
      "Brute ger extra vapenskadetärning i melee. Surprise Attack kan lägga 2d6 extra skada mot ett överraskat mål första rundan.",
      "Morningstar. +4, 2d8+2 piercing.\nJavelin. +4, 1d6+2 ranged eller 2d6+2 i melee."
    ),
    "monster-hobgoblin": monster(
      ["hobgoblin"],
      "Martial Advantage — 2d6 extra skada en gång per tur när en aktiv allierad står intill målet.",
      "Longsword. +3, 1d8+1 slashing.\nLongbow. +3, 150/600 ft., 1d8+1 piercing."
    ),
    "monster-orc": monster(
      ["orch", "orc"],
      "Aggressive — kan använda bonushandling för att rusa mot en fientlig varelse.",
      "Greataxe. +5, 1d12+3 slashing.\nJavelin. +5, 1d6+3 piercing."
    ),
    "monster-ogre": monster(
      ["oger", "ogre"],
      "Stor, enkel brute med mycket HP och hårda enskilda träffar.",
      "Greatclub. +6, 2d8+4 bludgeoning.\nJavelin. +6, 2d6+4 piercing."
    ),
    "monster-dire-wolf": monster(
      ["dire wolf", "jättevarg", "stor varg"],
      "Keen Hearing and Smell samt Pack Tactics; mycket snabb för ett CR 1-monster.",
      "Bite. +5, 2d6+3 piercing; DC 13 STR eller prone."
    ),
    "monster-giant-eagle": monster(
      ["jätteörn", "stor örn"],
      "Keen Sight och 80 ft. flyghastighet gör den till en utmärkt spanare eller luftburen motståndare.",
      "Multiattack — beak och talons.\nBeak. +5, 1d6+3 piercing.\nTalons. +5, 2d6+3 slashing."
    ),
    "monster-giant-toad": monster(
      ["jättepadda", "stor padda"],
      "Amphibious och Standing Leap. Bettet kan grapple/restrain och den kan svälja mindre mål.",
      "Bite. +4, 1d10+2 piercing plus 1d10 poison; grapple/restrained.\nSwallow. Sväljer ett redan grappled Medium eller mindre mål, som därefter tar syra inifrån."
    ),
    "monster-animated-armor": monster(
      ["animerad rustning", "levande rustning"],
      "Antimagic Susceptibility och False Appearance. Immun mot poison och psychic samt många tillstånd.",
      "Multiattack — två slam.\nSlam. +4, 1d6+2 bludgeoning."
    ),
    "monster-flying-sword": monster(
      ["flygande svärd", "animerat svärd"],
      "Antimagic Susceptibility och False Appearance; flyger med hover och har hög AC för sitt CR.",
      "Longsword. +3, 1d8+1 slashing."
    ),
    "monster-mimic": monster(
      ["mimic", "mimik", "lådfälla"],
      "Shapechanger, Adhesive, Grappler och False Appearance. Förklädd till ett vardagsföremål tills någon gör det klassiska misstaget.",
      "Pseudopod. +5, 1d8+3 bludgeoning.\nBite. +5, 1d8+3 piercing plus 1d8 acid."
    ),
    "monster-gelatinous-cube": monster(
      ["gelatinous cube", "gelékub", "geléklump"],
      "Transparent kubformad ooze som fyller hela sitt utrymme och kan omsluta varelser.",
      "Pseudopod. +4, 3d6 acid.\nEngulf. DC 12 DEX för att undvika; misslyckande ger acid-skada och fångar målet inne i kuben."
    ),
    "monster-harpy": monster(
      ["harpya", "harpy"],
      "Luring Song kan charma humanoider och jättar och tvinga dem att röra sig mot harpyn.",
      "Multiattack — claws och club.\nClaws. +3, 2d4+1 slashing.\nClub. +3, 1d4+1 bludgeoning."
    ),
    "monster-giant-scorpion": monster(
      ["jätteskorpion", "stor skorpion"],
      "Två klor kan hålla fast mål medan stinget levererar tung poisonskada.",
      "Multiattack — två claws och ett sting.\nClaw. +4, 1d8+2 bludgeoning och grapple.\nSting. +4, 1d10+2 piercing plus 4d10 poison, DC 12 CON för halv poison."
    ),
    "monster-specter": monster(
      ["specter", "spöke", "ande"],
      "Incorporeal Movement, omfattande resistens/immunitet och Sunlight Sensitivity.",
      "Life Drain. +4, 3d6 necrotic; DC 10 CON eller max-HP minskar med skadan tills long rest."
    ),
    "monster-wight": monster(
      ["wight", "odöd krigare"],
      "Sunlight Sensitivity, necrotic resistens och motståndskraft mot många icke-magiska vapen.",
      "Multiattack — två longsword eller longbow; en melee-attack kan bytas mot Life Drain.\nLife Drain. +4, 1d6+2 necrotic; DC 13 CON minskar max-HP."
    ),
    "monster-troll": monster(
      ["troll", "regeneration"],
      "Regeneration — återfår 10 HP i början av sin tur om den inte nyligen tagit acid- eller fire-skada.",
      "Multiattack — bite och två claws.\nBite. +7, 1d6+4 piercing.\nClaw. +7, 2d6+4 slashing."
    ),
    "monster-owlbear": monster(
      ["owlbear", "ugglebjörn"],
      "Keen Sight and Smell. En rak och väldigt effektiv CR 3-brute.",
      "Multiattack — beak och claws.\nBeak. +7, 1d10+5 piercing.\nClaws. +7, 2d8+5 slashing."
    ),

    "monster-young-black-dragon": monster(
      ["ung svart drake", "svart drake", "black dragon"],
      "Amphibious och immun mot acid.",
      "Multiattack — bite och två claws.\nBite. +7, 2d10+4 piercing plus 1d8 acid.\nClaw. +7, 2d6+4 slashing.\nAcid Breath (5–6). 30-ft. line; DC 14 DEX, 11d8 acid."
    ),
    "monster-young-white-dragon": monster(
      ["ung vit drake", "vit drake", "white dragon"],
      "Ice Walk och immun mot cold.",
      "Multiattack — bite och två claws.\nBite. +7, 2d10+4 piercing plus 1d8 cold.\nClaw. +7, 2d6+4 slashing.\nCold Breath (5–6). 30-ft. cone; DC 15 CON, 10d8 cold."
    ),
    "monster-young-green-dragon": monster(
      ["ung grön drake", "grön drake", "green dragon"],
      "Amphibious, immun mot poison och poisoned.",
      "Multiattack — bite och två claws.\nBite. +7, 2d10+4 piercing plus 1d6 poison.\nClaw. +7, 2d6+4 slashing.\nPoison Breath (5–6). 30-ft. cone; DC 14 CON, 12d6 poison."
    ),
    "monster-young-blue-dragon": monster(
      ["ung blå drake", "blå drake", "blue dragon"],
      "Kan gräva och flyga; immun mot lightning.",
      "Multiattack — bite och två claws.\nBite. +9, 2d10+5 piercing plus 1d10 lightning.\nClaw. +9, 2d6+5 slashing.\nLightning Breath (5–6). 60-ft. line; DC 16 DEX, 12d10 lightning."
    ),
    "monster-young-red-dragon": monster(
      ["ung röd drake", "röd drake", "red dragon"],
      "Kan klättra och flyga; immun mot fire.",
      "Multiattack — bite och två claws.\nBite. +10, 2d10+6 piercing plus 1d6 fire.\nClaw. +10, 2d6+6 slashing.\nFire Breath (5–6). 30-ft. cone; DC 17 DEX, 16d6 fire."
    )
  });
})();
