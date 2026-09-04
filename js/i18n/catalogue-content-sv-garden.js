(function () {
  "use strict";

  const api = window.CatalogueContentI18n;
  if (!api) return;

  function feature(name, summary, description, aliases) {
    return {
      aliases: [name, ...(aliases || [])],
      sv: { name, summary, description }
    };
  }

  api.register("feature", {
    "feature-rage": feature(
      "Rage",
      "Gå in i ett stridsraseri som ökar ditt närstridstryck och gör vanlig vapenskada lättare att uthärda.",
      "Rage är barbarens centrala stridstillstånd. Under Rage får rollpersonen klassens angivna offensiva och defensiva fördelar, men måste följa begränsningarna och varaktigheten för den reglerversion som används. Antal användningar, skadebonus och senare förbättringar skalar med barbarens nivå.",
      ["raseri", "barbar", "motstånd"]
    ),
    "feature-reckless-attack": feature(
      "Reckless Attack",
      "Byt säkerhet mot träffsäkerhet genom att anfalla vårdslöst och samtidigt göra dig lättare att träffa.",
      "Reckless Attack låter en barbar medvetet öppna sitt försvar för att förbättra kvalificerande anfall under sin tur. Samma beslut gör det lättare för fiender att slå tillbaka tills effektens angivna tid löper ut.",
      ["vårdslöst anfall", "barbar", "fördel"]
    ),
    "feature-bardic-inspiration": feature(
      "Bardic Inspiration",
      "Ge en allierad en Bardic Inspiration-tärning som kan förbättra ett viktigt slag.",
      "Bardic Inspiration omvandlar bardens uppmuntran, framträdande eller övernaturliga självförtroende till en begränsad resurs för en annan varelse. Tärningsstorlek, vilka slag som kan påverkas, timing och återhämtning förbättras när barden stiger i nivå.",
      ["bardisk inspiration", "bard", "inspiration", "stödförmåga"]
    ),
    "feature-channel-divinity": feature(
      "Channel Divinity",
      "Spendera en gudomlig resurs på kraftfulla klass- eller subklasseffekter.",
      "Channel Divinity är ett gemensamt resurssystem för gudomliga klasser. Tillgängliga effekter kommer från klass och subklass, medan antal användningar och återhämtning beror på nivå och reglerversion.",
      ["kanalisera gudomlighet", "cleric", "paladin", "gudomlig"]
    ),
    "feature-lay-on-hands": feature(
      "Lay on Hands",
      "Använd en helandepool för att återställa HP eller hantera vissa skadliga tillstånd.",
      "Lay on Hands ger paladinen en daglig pool av återställande kraft. Paladinen kan spendera delar av eller hela poolen på giltiga mål, med ytterligare användningsområden beroende på kampanjens reglerversion.",
      ["handpåläggning", "paladin", "healing", "helning"]
    ),
    "feature-cunning-action": feature(
      "Cunning Action",
      "Använd en bonushandling till signifikant rogue-rörlighet och positionering.",
      "Cunning Action pressar in användbara förflyttnings- och positioneringsval i rogues bonushandling. Den exakta menyn beror på reglerversion, men det är förmågan som gör rogue särskilt svår att låsa fast från tur till tur.",
      ["listig handling", "rogue", "bonushandling", "förflyttning"]
    ),
    "feature-uncanny-dodge": feature(
      "Uncanny Dodge",
      "Använd din reaktion för att kraftigt minska skadan från ett kvalificerande anfall som träffar dig.",
      "Uncanny Dodge låter en rogue omvandla sin reaktion till omedelbar skadereducering när utlösningsvillkoret uppfylls. Reaktionen är sedan förbrukad tills rollpersonen får tillbaka den.",
      ["undvika", "rogue", "reaktion", "skadereducering"]
    ),
    "feature-metamagic": feature(
      "Metamagic",
      "Spendera sorcerer-resurser för att förändra hur en besvärjelse fungerar när du kastar den.",
      "Metamagic ger sorcerers en meny av sätt att forma om besvärjelser, till exempel räckvidd, mål, timing eller andra egenskaper. Kända alternativ och kostnader beror på vald Metamagic och reglerversion.",
      ["metamagi", "sorcerer", "besvärjelse", "sorcery points"]
    ),
    "feature-pact-magic": feature(
      "Pact Magic",
      "Warlock-besvärjelser byggda kring få men ovanligt lättåterhämtade spell slots.",
      "Pact Magic använder en progression som skiljer sig från vanlig Spellcasting. Warlocks har relativt få slots, kastar dem enligt klassens slot level-regler och återfår dem enligt vilorytmen i den reglerversion som används.",
      ["paktmagi", "warlock", "spell slots", "magi"]
    ),
    "feature-eldritch-invocations": feature(
      "Eldritch Invocations",
      "Välj modulära övernaturliga uppgraderingar som formar warlockens magi och verktygslåda.",
      "Eldritch Invocations är valbara warlock-förmågor med egna krav och effekter. De kan förstärka besvärjelser, ge permanenta förmågor, låsa upp ny magi eller förändra hur klassen spelas.",
      ["eldritch invocation", "warlock", "åkallan", "anpassning"]
    ),
    "feature-fighting-style": feature(
      "Fighting Style",
      "Välj en fokuserad stridsspecialisering som förbättrar ett återkommande sätt att slåss.",
      "Fighting Style är en familj av valbara stridsbonusar. Tillgängliga stilar och deras exakta effekter beror på klass, nivå, källa och reglerversion.",
      ["stridsstil", "martial", "fighter", "paladin", "ranger"]
    ),
    "feature-extra-attack": feature(
      "Extra Attack",
      "Gör mer än ett anfall när du använder Attack-handlingen.",
      "Extra Attack ökar antalet anfall en rollperson kan göra inom en enda Attack-handling. De flesta versioner staplas inte med varandra; använd det bästa antalet anfall som rollpersonens relevanta förmågor ger om ingen regel uttryckligen säger annat.",
      ["extra anfall", "attack", "martial", "flera anfall"]
    ),
    "feature-dwarven-resilience": feature(
      "Dwarven Resilience",
      "Dvärgars tålighet gör gift lättare att stå emot och mindre brutalt när det väl tar sig igenom.",
      "Dwarven Resilience representerar dvärgens övernaturliga eller fysiologiska motståndskraft mot gift. Tillämpa den fördel och resistans som anges av den version av släktet som kampanjen använder.",
      ["dvärgtålighet", "dvärg", "gift", "resistans"]
    ),
    "feature-halfling-lucky": feature(
      "Lucky (Halfling)",
      "Halfling-tur ger katastrofala naturliga ettor på vissa d20-slag en ny chans.",
      "Den här släktförmågan förbättrar tillförlitligheten genom att låta kvalificerande naturliga 1-resultat slås om. Den är skild från featet Lucky trots det gemensamma namnet i äldre regler.",
      ["halfling tur", "halfling", "tur", "slå om"]
    ),
    "feature-brave": feature(
      "Brave",
      "Halflings är ovanligt motståndskraftiga mot rädsla.",
      "Brave förbättrar en halflings förmåga att stå emot tillståndet frightened enligt den släktversion som används.",
      ["modig", "halfling", "rädsla", "frightened"]
    ),
    "feature-halfling-nimbleness": feature(
      "Halfling Nimbleness",
      "Slink förbi utrymmen som upptas av större varelser när släktregeln tillåter det.",
      "Halfling Nimbleness gör släktet ovanligt bra på att ta sig genom trånga stridsfält. Kontrollera aktiv reglerversion för exakt vilka storlekar och förflyttningsbegränsningar som gäller.",
      ["halfling smidighet", "halfling", "förflyttning", "trångt"]
    ),
    "feature-gnome-cunning": feature(
      "Gnome Cunning",
      "Gnomers mentala motståndskraft förbättrar deras försvar mot vissa magiska effekter.",
      "Gnome Cunning representerar en gnoms inlärda eller inneboende motstånd mot fientlig magi som angriper sinnet. Vilka räddningsslag som kvalificerar skiljer sig mellan regelversioner.",
      ["gnomslughet", "gnom", "magi", "räddningsslag"]
    ),
    "feature-breath-weapon": feature(
      "Breath Weapon",
      "Andas ut drakonisk energi över ett område med den skadetyp som hör till ditt arv.",
      "En dragonborns Breath Weapon skapar en elementär områdesattack. Form, skada, räddningsslag, skalning, antal användningar och action economy varierar tydligt mellan olika 5e-versioner.",
      ["andningsvapen", "dragonborn", "drake", "områdesskada"]
    ),
    "feature-hellish-resistance": feature(
      "Hellish Resistance",
      "Infernal heritage ger resistans mot eldskada.",
      "Hellish Resistance är det klassiska tiefling-försvaret mot eld. Om kampanjen använder en nyare tiefling-version med lineage-specifika förändringar följer du den versionen i stället.",
      ["infernal resistans", "tiefling", "eld", "resistans"]
    ),
    "feature-infernal-legacy": feature(
      "Infernal Legacy",
      "Infernal ancestry låser upp en liten progression av medfödd magi.",
      "Infernal Legacy är det äldre grundsystemet för tieflings medfödda spellcasting. Exakt cantrip, besvärjelser, casting ability och återhämtning varierar mellan tiefling-versioner och nyare lineage-alternativ.",
      ["infernalt arv", "tiefling", "magi", "medfödd magi"]
    ),
    "feature-relentless-endurance": feature(
      "Relentless Endurance",
      "Vägra falla en gång när skada annars skulle sänka dig till 0 HP.",
      "Relentless Endurance ger den klassiska half-orc en begränsad möjlighet att stå kvar på 1 HP i stället för att falla till 0 när förmågans utlösningsvillkor och undantag är uppfyllda.",
      ["obeveklig uthållighet", "half-orc", "överlevnad", "1 hp"]
    ),
    "feature-savage-attacks": feature(
      "Savage Attacks",
      "Kritiska närstridsträffar med vapen får en extra vapenskadetärning i de klassiska half-orc-reglerna.",
      "Savage Attacks ökar utdelningen från kvalificerande kritiska träffar. Det är en släktförmåga och är skild från featet Savage Attacker trots det snarlika namnet.",
      ["vilda anfall", "half-orc", "kritisk träff", "skada"]
    )
  });
})();
