(function () {
  "use strict";

  const api = window.CatalogueContentI18n;
  if (!api) return;

  function patch(type, id, sv, aliases) {
    const current = api.getRecord?.(type, id) || {};
    api.register(type, {
      [id]: {
        en: current.en || {},
        aliases: [...new Set([...(current.aliases || []), ...(aliases || [])])],
        sv: { ...(current.sv || {}), ...(sv || {}) }
      }
    });
  }

  function patches(type, entries) {
    Object.entries(entries).forEach(([id, sv]) => patch(type, id, sv));
  }

  patches("background", {
    "background-artisan": {
      summary: "Du lärde dig ett riktigt hantverk och hann bygga användbara saker långt innan äventyrarlivet blev det betydligt sämre karriärvalet.",
      description: "Du lärde dig ett riktigt hantverk och hann bygga användbara saker långt innan äventyrarlivet blev det betydligt sämre karriärvalet."
    },
    "background-astral-drifter": {
      summary: "Du drev omkring på Astral Sea i åratal och kom tillbaka med avstånd bakom blicken som vanliga kartor inte riktigt kan förklara.",
      description: "Du drev omkring på Astral Sea i åratal och kom tillbaka med avstånd bakom blicken som vanliga kartor inte riktigt kan förklara."
    },
    "background-clan-crafter": {
      summary: "Ditt hantverk är en del av klanens tradition. Ditt namn, ditt yrkesrykte och flera generationers petiga hantverkare följer med varje sak du gör.",
      description: "Ditt hantverk är en del av klanens tradition. Ditt namn, ditt yrkesrykte och flera generationers petiga hantverkare följer med varje sak du gör."
    },
    "background-courtier": {
      summary: "Du lärde dig hur makt faktiskt fungerar: i korridorer, vid middagar, genom små tjänster och genom att veta vem som bestämmer utan att behöva säga det högt.",
      description: "Du lärde dig hur makt faktiskt fungerar: i korridorer, vid middagar, genom små tjänster och genom att veta vem som bestämmer utan att behöva säga det högt."
    },
    "background-guild-artisan": {
      summary: "Ett gille lärde upp dig, skyddade yrket och gav dig ett nätverk av människor som åtminstone förstår varför bra arbete kostar pengar.",
      description: "Ett gille lärde upp dig, skyddade yrket och gav dig ett nätverk av människor som åtminstone förstår varför bra arbete kostar pengar."
    },
    "background-house-agent": {
      summary: "Du arbetade för ett av Eberrons dragonmarked houses, där handel, politik och makt ofta är tre namn på samma verksamhet.",
      description: "Du arbetade för ett av Eberrons dragonmarked houses, där handel, politik och makt ofta är tre namn på samma verksamhet."
    },
    "background-mercenary-veteran": {
      summary: "Du har haft krig som jobb. Marscher, kontrakt, logistik och våld lärde dig snabbt vad som faktiskt håller en soldat vid liv.",
      description: "Du har haft krig som jobb. Marscher, kontrakt, logistik och våld lärde dig snabbt vad som faktiskt håller en soldat vid liv."
    },
    "background-noble": {
      summary: "Du växte upp med status, etikett och förväntningar, och lärde dig tidigt vilka osynliga system som gör livet enklare för människor med rätt namn.",
      description: "Du växte upp med status, etikett och förväntningar, och lärde dig tidigt vilka osynliga system som gör livet enklare för människor med rätt namn."
    },
    "background-outlander": {
      summary: "Du växte upp i vildmarken, långt från det bofasta samhällets bekvämlighet, och lärde dig läsa landskapet långt innan du behövde läsa ett rum.",
      description: "Du växte upp i vildmarken, långt från det bofasta samhällets bekvämlighet, och lärde dig läsa landskapet långt innan du behövde läsa ett rum."
    },
    "background-soldier": {
      summary: "Militärlivet lärde dig disciplin, hierarki och våld, men framför allt den konkreta konsten att få dig själv och kamraterna levande genom ännu en dag.",
      description: "Militärlivet lärde dig disciplin, hierarki och våld, men framför allt den konkreta konsten att få dig själv och kamraterna levande genom ännu en dag."
    },
    "background-urchin": {
      summary: "Du lärde känna staden från gatunivå och överlevde genom att vara snabb, uppmärksam och väldigt bra på att veta vilka platser man inte ska stå kvar på.",
      description: "Du lärde känna staden från gatunivå och överlevde genom att vara snabb, uppmärksam och väldigt bra på att veta vilka platser man inte ska stå kvar på."
    }
  });

  patches("class", {
    "class-barbarian": {
      summary: "En närstridskrigare som går in i Rage, tål absurda mängder stryk och löser många problem genom att stå kvar där problemet helst vill att du inte står kvar.",
      notes: "Rage är klassens motor. Håll koll på vad din regelversion kräver för att Rage ska fortsätta och vilka skadetyper du får resistance mot."
    },
    "class-bard": {
      summary: "En full caster, problemlösare och stödklass som använder Karisma, Bardic Inspiration och en nästan oförskämt bred verktygslåda.",
      spellcasting: "Full caster med KAR. Kan ritualcasta när klassen tillåter det och plockar senare upp spells från andra listor genom Magical Secrets."
    },
    "class-cleric": {
      summary: "En gudomlig full caster som kan läka, skydda, kontrollera och ibland påminna fiender om varför gudar får egna tempel.",
      spellcasting: "Full caster med VIS. Du förbereder spells från cleric-listan, medan Domain spells normalt alltid är förberedda.",
      notes: "Din Domain styr mycket av klassens smak och ger bland annat egna spells, Channel Divinity-alternativ och ibland extra weapon- eller armor proficiency."
    },
    "class-druid": {
      summary: "En naturmagiker med full spellcasting och Wild Shape, lika hemma med battlefield control som med att plötsligt vara en grävling.",
      spellcasting: "Full caster med VIS. Du förbereder spells från druid-listan och kan ritualcasta när reglerna tillåter det.",
      notes: "Wild Shape utvecklas med nivå och subclass. Vilka CR, swim- och fly-former som är tillåtna beror på regelversionen."
    },
    "class-fighter": {
      summary: "En renodlad martial-klass med bra rustning, många attacker och tillräckligt många sätt att få en extra handling för att göra action economy nervös.",
      spellcasting: "Normalt ingen spellcasting. Eldritch Knight är det klassiska undantaget och använder INT med en begränsad spell progression."
    },
    "class-monk": {
      summary: "En snabb obeväpnad martial-klass som bygger försvar och offensiv kring Smidighet, Visdom och klassens egen resursmotor.",
      notes: "Martial Arts och Unarmored Movement växer med nivån. Namn och regler för klassens resurs skiljer sig mellan 2014 och 2024."
    },
    "class-paladin": {
      summary: "En tungt rustad halv-caster som kombinerar svärd, gudomlig magi, auras och den tidlösa konsten att lägga en Smite på exakt rätt träff.",
      spellcasting: "Half caster med KAR. Du förbereder paladin-spells, och Oath spells är normalt alltid förberedda.",
      notes: "Smite-reglerna skiljer sig märkbart mellan 2014 och 2024. Använd kampanjens version när spell slots och action economy börjar bli viktiga."
    },
    "class-ranger": {
      summary: "En vildmarksorienterad martial halv-caster som spårar, utforskar och plockar isär sitt valda byte med vapen och naturmagi.",
      spellcasting: "Half caster med VIS. Exakt modell för kända eller förberedda spells beror på vilken ranger-version kampanjen använder.",
      notes: "Ranger har fått ovanligt många officiella ombyggnader genom 5e. Kontrollera därför vilken version kampanjen faktiskt kör innan du antar att en gammal guide fortfarande stämmer."
    },
    "class-rogue": {
      summary: "En skicklig specialist som lever på Expertise, positionering, Cunning Action och en riktigt välplacerad Sneak Attack.",
      notes: "Sneak Attack kan normalt användas en gång per tur när vapnet och situationen uppfyller villkoren. Det behöver inte innebära att roguen faktiskt smyger."
    },
    "class-sorcerer": {
      summary: "En full caster vars magi kommer inifrån och som använder Sorcery Points och Metamagic för att forma spells på sätt andra casters inte riktigt får.",
      spellcasting: "Full caster med KAR. Sorcery Points driver Metamagic och kan enligt klassens regler växlas mot eller från spell slots."
    },
    "class-warlock": {
      summary: "En paktbunden caster med få men återkommande spell slots, Eldritch Invocations och en patron som definitivt aldrig kommer skapa komplikationer.",
      spellcasting: "Pact Magic med KAR. Du har få slots, normalt på samma slot level, och återfår dem snabbare än vanliga full casters. Invocations står för en stor del av klassens anpassning."
    },
    "class-wizard": {
      summary: "En INT-baserad full caster med spellbook och den bredaste sortens magiska verktygslåda, förutsatt att du faktiskt skrev ner rätt spell.",
      spellcasting: "Full caster med INT. Du förbereder spells ur din spellbook och kan ritualcasta lämpliga spells direkt från boken när regeln tillåter det.",
      notes: "Spellbooken är klassens stora styrka. Ju bredare den blir, desto fler absurdt specifika problem kan wizarden råka ha exakt rätt svar på."
    },
    "class-artificer": {
      summary: "En INT-baserad magisk uppfinnare som blandar spells, verktyg och förtrollade prylar tills gränsen mellan wizard och ingenjör blir akademisk.",
      spellcasting: "Förberedd spellcasting med INT. Artificern använder verktyg som spellcasting focus och kombinerar cantrips med en mer specialiserad spell-lista.",
      notes: "Half caster med starkt fokus på magiska föremål, support, verktyg och klassens egna item-förbättringar."
    }
  });

  patches("feature", {
    "feature-undead-fortitude": {
      summary: "När en zombie borde gå till 0 HP får den ibland säga 'nej' och stå kvar på 1 i stället.",
      description: "När skada sänker varelsen till 0 HP gör den ett Constitution-save med DC 5 + skadan, så länge träffen inte var en crit och skadan inte var radiant. Vid framgång stannar den på 1 HP.",
      usesRecharge: "Passiv, triggar när varelsen går till 0 HP"
    },
    "feature-slam": {
      summary: "Den klassiska monsterattacken för något som inte behöver ett svärd för att slå dig i golvet.",
      description: "Melee weapon attack med varelsens vanliga attackbonus och reach. På träff gör den bludgeoning damage enligt statblocket."
    },
    "feature-darkvision": {
      summary: "Se i mörker inom en bestämd räckvidd, men inte riktigt på samma sätt som i dagsljus.",
      description: "Inom räckvidden ser du dim light som bright light och darkness som dim light enligt Darkvision-regeln. I fullständigt mörker försvinner normalt färgerna och blir gråskalor."
    },
    "feature-fey-ancestry": {
      summary: "Fey-arvet gör charm svårare och magisk sömn till någon annans problem.",
      description: "Du får det försvar mot charmed och magisk sömn som din version av Fey Ancestry anger."
    },
    "feature-keen-senses": {
      summary: "Du är helt enkelt bättre tränad på att lägga märke till saker.",
      description: "Ger proficiency i Perception."
    },
    "feature-trance": {
      summary: "Alver sover inte på vanligt sätt utan går in i en djup meditativ trance.",
      description: "I stället för vanlig sömn kan alven meditera under den tid som regelversionen anger och få den återhämtning som Trance beskriver."
    },
    "feature-druidic": {
      summary: "Druidernas hemliga språk, inklusive möjligheten att lämna små meddelanden till andra druider.",
      description: "Du kan tala Druidic och lämna dolda meddelanden. Andra druider känner igen dem automatiskt; andra kan ibland märka att något finns där utan att förstå innehållet."
    },
    "feature-spellcasting-druid": {
      summary: "Druidens fulla VIS-baserade spellcasting, med dagligt förberedda spells och ritualer.",
      description: "Du är full caster med VIS, förbereder spells från druid-listan och följer klassens vanliga spell slot-progression. Ritual casting fungerar enligt druidens regeltext."
    },
    "feature-wild-shape": {
      summary: "Bli ett beast du har sett. Ja, det är ungefär lika användbart som det låter.",
      description: "Wild Shape låter druiden anta formen av ett beast den har sett. Nivå, subclass och regelversion styr CR-gräns, antal användningar och när swim- eller fly-former blir tillgängliga. Din personlighet är fortfarande din, medan stora delar av statblocket kommer från formen."
    },
    "feature-second-wind": {
      summary: "Fightern tar en sekund, skakar av sig en del av skadan och fortsätter slåss.",
      description: "Använd klassens angivna action economy för att återfå HP enligt Second Wind-formeln. Antal användningar och hur de kommer tillbaka skiljer sig mellan 2014 och 2024."
    },
    "feature-action-surge": {
      summary: "Ta en extra handling när en vanlig tur helt enkelt inte innehåller tillräckligt mycket fighter.",
      description: "Action Surge ger dig en extra action på din tur. Hur många användningar du har och exakt vilka begränsningar som gäller beror på nivå och regelversion."
    },
    "feature-sneak-attack": {
      summary: "En gång per tur får roguen lägga på en rejäl hög extra skadetärningar när positionen och vapnet är rätt.",
      description: "Sneak Attack gör extra damage med ett kvalificerande finesse- eller ranged weapon när villkoren är uppfyllda. Vanligast är advantage eller en relevant fiende till målet i närheten. Exakta villkor beror på version."
    },
    "feature-divine-smite": {
      summary: "Paladinens sätt att förvandla en träff och en spell slot till betydligt mer radiant damage.",
      description: "Divine Smite lägger extra radiant damage på en kvalificerande träff. 2014 och 2024 hanterar Smite på olika sätt, så följ den version kampanjen använder."
    }
  });

  patches("race", {
    "race-half-orc": {
      summary: "Halvorcher är byggda för att stå kvar efter träffen som borde ha fällt dem och slå tillbaka betydligt hårdare än situationen kräver."
    },
    "subspecies-elf-high": {
      summary: "High Elves blandar alvisk vapenträning med akademisk magi och får en liten bit wizard ovanpå grundpaketet."
    },
    "subspecies-elf-drow": {
      summary: "Drow är Underdark-alver med extrem Darkvision, medfödd magi och den ganska besvärliga nackdelen att direkt solljus verkligen inte är deras grej."
    },
    "race-tiefling": {
      summary: "Tieflings bär ett infernaliskt arv i både utseende och magi, klassiskt med horn, Darkvision, fire resistance och några medfödda spells."
    }
  });
})();
