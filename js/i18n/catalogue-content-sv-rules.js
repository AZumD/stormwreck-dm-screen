(function () {
  "use strict";
  const api = window.CatalogueContentI18n;
  if (!api) return;

  api.register("rule", {
    "rule-ability-scores": { aliases: ["grundegenskaper", "stats", "egenskapsvärden"], sv: {
      name: "Grundegenskaper", category: "Grundegenskaper",
      summary: "De sex grundegenskaperna, deras modifikationer och vad de normalt används till.",
      quickReference: "**Modifikation:** avrunda nedåt ((värde − 10) / 2).\n\n**Sex grundegenskaper:** Styrka, Smidighet, Fysik, Intelligens, Visdom och Karisma.\n\nEtt grundegenskapsslag använder relevant modifikation och lägger till proficiency när en passande färdighet, verktygsvana eller annan proficiency gäller.",
      details: "Grundegenskapsvärdet är själva grundvärdet. De flesta slag använder modifikationen snarare än värdet. Räddningsslag och attackslag använder också en grundegenskapsmodifikation enligt regeln som utlöser slaget."
    }},
    "rule-strength": { aliases: ["styrka", "STY", "STR", "bära", "lyfta"], sv: {
      name: "Styrka", category: "Grundegenskaper",
      summary: "Rå fysisk kraft: lyfta, forcera, klättra, hoppa, greppa och många närstridsattacker.",
      quickReference: "**Vanliga slag:** forcera dörrar, bryta sig loss, klättra på svåra ytor, simma mot hinder och pressa ett hopp bortom normala gränser.\n\n**Färdighet:** Atletik.\n\n**Strid:** används ofta för närstridsattacker och skada.\n\n**Bärförmåga:** Styrka påverkar hur mycket du kan bära, lyfta, skjuta och dra.",
      details: "Använd Styrka när rå fysisk kraft avgör. Atletik är vanlig proficiency när teknik spelar roll, men varje Styrkeslag är inte automatiskt Atletik."
    }},
    "rule-dexterity": { aliases: ["smidighet", "SMI", "DEX", "reflexer"], sv: {
      name: "Smidighet", category: "Grundegenskaper",
      summary: "Rörlighet, reflexer, balans, smygande, finmotorik, initiativ och många distans- eller finesseattacker.",
      quickReference: "**Färdigheter:** Akrobatik, Fingerfärdighet, Smyga.\n\n**Strid:** används ofta för distansvapen och finessevapen.\n\n**Försvar:** bidrar ofta till rustningsklass (AC).\n\n**Initiativ:** använder normalt Smidighet.",
      details: "Använd Smidighet när snabbhet, precision, balans eller att undgå upptäckt betyder mer än rå kraft. Smidighetsräddningsslag används ofta mot faror som går att ducka eller kasta sig undan."
    }},
    "rule-constitution": { aliases: ["fysik", "FYS", "CON", "uthållighet", "hp"], sv: {
      name: "Fysik (Constitution)", category: "Grundegenskaper",
      summary: "Hälsa och uthållighet: HP, koncentration, gift, sjukdom och kroppslig påfrestning.",
      quickReference: "**HP:** din Fysik/Constitution-modifikation bidrar till HP du får på varje nivå.\n\n**Räddningsslag:** används ofta mot gift, sjukdom, utmattning och annat som angriper kroppens motståndskraft.\n\n**Koncentration:** när du tar skada medan du koncentrerar dig slår du normalt ett Fysik/Constitution-räddningsslag: **DC 10 eller halva skadan, det högsta värdet gäller.**\n\nDet finns ingen standardfärdighet som bygger på Constitution.",
      details: "Constitution-slag är ovanligare eftersom uthållighet ofta hanteras med räddningsslag. Använd ett grundegenskapsslag när rollpersonen prövar långvarig fysisk uthållighet och ingen effekt uttryckligen kräver ett räddningsslag."
    }},
    "rule-intelligence": { aliases: ["intelligens", "INT", "kunskap", "minne"], sv: {
      name: "Intelligens", category: "Grundegenskaper",
      summary: "Logik, minne, studier, slutledning, lärdom och att återkalla inlärda fakta.",
      quickReference: "**Färdigheter:** Arcana, Historia, Undersökning, Natur och Religion.\n\nAnvänd Intelligens när frågan är vad rollpersonen vet, minns, deducerar, forskar fram eller förstår genom inlärd kunskap.",
      details: "Undersökning handlar typiskt om att dra slutsatser från ledtrådar. Perception handlar om att upptäcka ledtråden från början. Den skillnaden löser förvånansvärt många bordsdiskussioner."
    }},
    "rule-wisdom": { aliases: ["visdom", "WIS", "intuition", "uppmärksamhet"], sv: {
      name: "Visdom", category: "Grundegenskaper",
      summary: "Uppmärksamhet, intuition, instinkt, empati, överlevnadskänsla och att läsa av omvärlden.",
      quickReference: "**Färdigheter:** Hantera djur, Insikt, Läkekonst, Perception och Överlevnad.\n\nPerception upptäcker. Insikt läser människor. Överlevnad läser miljöer och spår. Läkekonst hanterar omedelbar medicinsk bedömning och stabilisering när ett slag krävs.",
      details: "Visdom handlar oftare om att märka eller intuitivt förstå det som redan finns än att minnas inlärd fakta. Passiv Perception är ett av de vanligaste passiva värdena."
    }},
    "rule-charisma": { aliases: ["karisma", "KAR", "CHA", "socialt"], sv: {
      name: "Karisma", category: "Grundegenskaper",
      summary: "Personlig utstrålning, självförtroende, bluff, hot, uppträdande och övertalning.",
      quickReference: "**Färdigheter:** Bluffa, Skrämsel, Uppträda och Övertala.\n\nAnvänd Karisma när framgång beror på social närvaro, uttryckt avsikt, ledarskap, en övertygande lögn eller att påverka en annan varelse.",
      details: "Karisma är inte samma sak som utseende. Det representerar hur starkt och effektivt en rollperson projicerar sin personlighet och vilja."
    }},
    "rule-d20-tests": { aliases: ["d20-slag", "d20 test", "slag"], sv: {
      name: "D20-slag", category: "Grundmekanik",
      summary: "Samlingsbegreppet bakom grundegenskapsslag, räddningsslag och attackslag.",
      quickReference: "Slå en d20, lägg till relevant grundegenskapsmodifikation och eventuell proficiency eller annan modifikation, och jämför summan med ett målvärde som DC eller rustningsklass (AC).",
      details: "2024-reglerna använder **D20 Test** som ett formellt samlingsbegrepp för grundegenskapsslag, räddningsslag och attackslag. 2014 använder samma grundstruktur men behandlar oftast de tre typerna separat.",
      editionNotes: "**2014:** grundegenskapsslag, räddningsslag och attackslag är separata mekaniker.\n\n**2024:** D20 Test är ett formellt samlingsbegrepp som många regler och effekter hänvisar till."
    }},
    "rule-ability-checks": { aliases: ["grundegenskapsslag", "färdighetsslag", "skill check", "check"], sv: {
      name: "Grundegenskapsslag", category: "Grundmekanik",
      summary: "Avgör osäkra försök med d20 + relevant grundegenskapsmodifikation och proficiency när den är tillämplig.",
      quickReference: "**Formel:** d20 + grundegenskapsmodifikation + proficiencybonus om relevant proficiency gäller.\n\nSL väljer grundegenskap och DC. En namngiven färdighet ersätter inte grundegenskapen; den avgör när proficiency kan läggas till.",
      details: "Slå bara när både framgång och misslyckande faktiskt är meningsfulla. SL kan para en färdighet med en annan grundegenskap när situationen motiverar det, exempelvis Styrka (Skrämsel). Gruppslag och motståndsslag kan ha ytterligare regler beroende på utgåva."
    }},
    "rule-saving-throws": { aliases: ["räddningsslag", "save", "resist"], sv: {
      name: "Räddningsslag", category: "Grundmekanik",
      summary: "Reaktiva d20-slag för att motstå eller minska skadliga effekter.",
      quickReference: "**Formel:** d20 + relevant grundegenskapsmodifikation + proficiencybonus om du har proficiency i räddningsslaget.\n\nEffekten anger vilken grundegenskap som används och vad som händer vid framgång eller misslyckande.",
      details: "Ett räddningsslag tvingas normalt fram av en besvärjelse, fara, monsterförmåga, miljöeffekt eller annan regel. Rollpersonen väljer vanligtvis inte själv att slå ett räddningsslag."
    }},
    "rule-advantage-disadvantage": { aliases: ["fördel", "nackdel", "advantage", "disadvantage", "2d20"], sv: {
      name: "Fördel & nackdel", category: "Grundmekanik",
      summary: "Slå två d20 och behåll den högre vid fördel eller den lägre vid nackdel.",
      quickReference: "**Fördel:** slå 2d20, använd den högre.\n**Nackdel:** slå 2d20, använd den lägre.\n\nFlera källor till samma sak ger inte fler tärningar. Har du både fördel och nackdel tar de ut varandra och du slår en d20, oavsett hur många källor av varje du har.",
      details: "Lägg normalt till modifikationer efter att du valt vilket d20-resultat som används, om ingen specifik regel säger något annat."
    }},
    "rule-proficiency-bonus": { aliases: ["proficiencybonus", "proficiency bonus", "PB"], sv: {
      name: "Proficiencybonus", category: "Grundmekanik",
      summary: "En nivåskalad bonus som läggs till när rollpersonen har rätt proficiency för uppgiften, räddningsslaget, attacken, verktyget eller förmågan.",
      quickReference: "**Rollpersonsnivå 1–4:** +2\n**5–8:** +3\n**9–12:** +4\n**13–16:** +5\n**17–20:** +6\n\nProficiency läggs normalt bara till en gång på ett slag om inte en regel som Expertise uttryckligen ändrar detta.",
      details: "Många klassförmågor och save DC använder också proficiencybonus. Multiklassade rollpersoner använder sin totala rollpersonsnivå för den vanliga progressionen."
    }},
    "rule-difficulty-classes": { aliases: ["svårighetsgrad", "DC", "difficulty class"], sv: {
      name: "Svårighetsgrader (DC)", category: "Grundmekanik",
      summary: "Målvärden för slag och räddningsslag; högre DC betyder svårare uppgift eller effekt att motstå.",
      quickReference: "Praktiska riktvärden:\n- **5** mycket lätt\n- **10** lätt\n- **15** medelsvårt\n- **20** svårt\n- **25** mycket svårt\n- **30** nästan omöjligt\n\nFör rutinuppgifter utan meningsfull osäkerhet behövs inget slag.",
      details: "Sätt DC utifrån uppgiften, inte utifrån hur skicklig rollpersonen är. Rollpersonens förmåga representeras redan av modifikationer, proficiency, fördel och förmågor."
    }},
    "rule-passive-checks": { aliases: ["passiva slag", "passiv perception", "passive perception"], sv: {
      name: "Passiva slag", category: "Grundmekanik",
      summary: "Ett värde utan tärningsslag för upprepade uppgifter eller när SL vill avgöra något utan att avslöja att ett slag sker.",
      quickReference: "**Typiskt passivt värde:** 10 + alla modifikationer som normalt skulle gälla för slaget.\n\nPassiv Perception är vanligast. Med den klassiska metoden motsvarar fördel +5 och nackdel −5 på ett passivt värde.",
      details: "Passiva värden är användbara när ett slag skulle avslöja dold information eller när samma slag annars skulle upprepas om och om igen."
    }},
    "rule-initiative": { aliases: ["initiativ", "turordning", "initiative"], sv: {
      name: "Initiativ", category: "Strid",
      summary: "Bestämmer turordningen när strid börjar.",
      quickReference: "Slå normalt **d20 + Smidighetsmodifikation**, och agera från högsta till lägsta resultat. Hantera lika resultat enligt bordets vanliga regel eller SL-beslut; monster med identiska värden grupperas ofta för snabbare spel.",
      details: "Initiativ skapar turordningen inom en runda. En runda motsvarar ungefär sex sekunder i spelvärlden även om turerna löses en i taget."
    }},
    "rule-combat-turn": { aliases: ["tur", "runda", "action economy", "stridstur"], sv: {
      name: "Tur & runda", category: "Strid",
      summary: "Vad en varelse normalt kan göra på sin tur och hur turerna bildar en runda.",
      quickReference: "På din tur har du normalt:\n- **Förflyttning** upp till din Speed\n- **En handling**\n- **En bonushandling** endast om en förmåga eller regel ger dig något som använder den\n- **En reaktion** mellan början av din tur och början av nästa tur, när en trigger tillåter det\n- Vanligt tal och mindre föremålsinteraktioner när situationen medger det\n\nFörflyttning kan delas upp före, mellan och efter handlingar och attacker.",
      details: "En runda är ungefär sex sekunder. Reaktioner kan ske utanför din tur när de triggas, men du återfår din reaktion i början av din tur."
    }},
    "rule-actions-in-combat": { aliases: ["handlingar", "actions", "attack dash disengage hide search"], sv: {
      name: "Handlingar i strid", category: "Strid",
      summary: "Standardmenyn av handlingar som finns även när rollformuläret inte listar en särskild förmåga.",
      quickReference: "Vanliga handlingar är **Attack, Dash, Disengage, Dodge, Help, Hide, Ready, Search** samt magi eller föremålsanvändning när regeln tillåter det. Klass, besvärjelse, föremål eller monster kan lägga till fler handlingar.",
      details: "När en spelare beskriver något som inte täcks av en namngiven handling, bedöm det som en improviserad handling eller ett grundegenskapsslag i stället för att tvinga in beskrivningen i fel regel.",
      editionNotes: "2024 formaliserar vissa handlingsnamn annorlunda, bland annat **Magic** och **Utilize**. Grundidén för action economy är densamma."
    }},
    "rule-attack-rolls": { aliases: ["attackslag", "attack roll", "träffa", "AC"], sv: {
      name: "Attackslag", category: "Strid",
      summary: "Avgör en attack med d20 + relevant attackmodifikation mot målets rustningsklass (AC).",
      quickReference: "**Attack:** d20 + grundegenskapsmodifikation + proficiency om du har proficiency med attacken.\n\nOm summan är lika med eller högre än målets AC träffar attacken.\n\nEn naturlig 20 träffar och är normalt en kritisk träff. En naturlig 1 missar.",
      details: "Närstridsattacker använder oftast Styrka, distansattacker oftast Smidighet och finessevapen kan vanligtvis använda endera. Besvärjelseattacker använder den spellcasting-grundegenskap som förmågan anger."
    }},
    "rule-critical-hits": { aliases: ["kritisk träff", "crit", "natural 20"], sv: {
      name: "Kritiska träffar", category: "Strid",
      summary: "En naturlig 20 på ett attackslag ger normalt en kritisk träff och extra skadetärningar.",
      quickReference: "Slå **alla attackens skadetärningar två gånger**, och lägg sedan till normala fasta modifikationer en gång. Extra tärningar som ingår i attackens skada dubbleras vanligtvis också om deras regel inte säger annat.",
      details: "Fasta bonusar dubbleras inte. Regler för kritiska träffar gäller attackslag, inte automatiskt skada som orsakas via räddningsslag."
    }},
    "rule-cover": { aliases: ["skydd", "cover", "halvt skydd", "total cover"], sv: {
      name: "Skydd (Cover)", category: "Strid",
      summary: "Hinder mellan angripare och mål kan förbättra rustningsklass och Smidighetsräddningsslag.",
      quickReference: "**Halvt skydd:** +2 AC och +2 på Smidighetsräddningsslag.\n**Tre fjärdedels skydd:** +5 AC och +5 på Smidighetsräddningsslag.\n**Totalt skydd:** målet kan inte angripas direkt av attacker eller effekter som kräver fri väg till målet. Områdeseffekter kan fortfarande nå runt skydd beroende på sina regler.",
      details: "Bedöm skydd från den faktiska linjen mellan angriparen eller effektens ursprung och målet. Varelser kan ge skydd om de fysiskt blockerar linjen."
    }},
    "rule-opportunity-attacks": { aliases: ["opportunity attack", "OA", "reaktionsattack", "lämnar reach"], sv: {
      name: "Opportunity attack", category: "Strid",
      summary: "En reaktionsattack som triggas när en fiende lämnar din reach med sin egen förflyttning utan att säkert Disengage.",
      quickReference: "När en varelse du hotar lämnar din reach med sin egen förflyttning kan du normalt använda din **reaktion** för att göra en närstridsattack precis innan den lämnar.\n\n**Disengage** förhindrar opportunity attacks för den förflyttningen. Tvingad förflyttning som inte använder varelsens egen movement, handling eller reaktion triggar normalt inte attacken.",
      details: "Teleportering triggar normalt inte en opportunity attack eftersom varelsen inte rör sig genom mellanliggande utrymme."
    }},
    "rule-ready-action": { aliases: ["förbered", "ready", "håll handling", "trigger"], sv: {
      name: "Förbered (Ready)", category: "Strid",
      summary: "Förbered en handling nu och utlös den senare som reaktion när en angiven trigger inträffar.",
      quickReference: "Välj en **förnimbar trigger** och bestäm vad du gör när den inträffar. När triggern sker använder du din reaktion för att utföra det förberedda svaret, eller låter bli.\n\nAtt förbereda en besvärjelse har extra krav och kräver normalt koncentration medan du håller den.",
      details: "Det förberedda svaret sker efter att triggern avslutats om ingen specifik regel säger annat. Har du redan använt din reaktion kan du inte utlösa den förberedda handlingen."
    }},
    "rule-help-action": { aliases: ["hjälp", "help", "assist", "aid"], sv: {
      name: "Hjälp (Help)", category: "Strid",
      summary: "Hjälp en annan varelse med en uppgift eller skapa ett anfallsläge, vanligtvis genom att ge fördel när kraven uppfylls.",
      quickReference: "För en uppgift beskriver du hur du faktiskt hjälper till. I strid behöver du vanligtvis vara nära nog för att störa eller distrahera målet. Den du hjälper får fördel på relevant nästa slag inom regelns tidsfönster.",
      details: "Help är inte en magisk fördel-knapp. Hjälparen måste kunna bidra meningsfullt i fiktionen och uppfylla eventuella positionskrav."
    }},
    "rule-dodge-action": { aliases: ["undvik", "dodge", "försvara"], sv: {
      name: "Undvik (Dodge)", category: "Strid",
      summary: "Använd handlingen till försvar: bli svårare att träffa och bättre på att undvika många Smidighetsräddningseffekter.",
      quickReference: "Till början av din nästa tur har attacker mot dig normalt **nackdel** om du kan se angriparen, och du har normalt **fördel på Smidighetsräddningsslag**. Fördelen upphör om du blir incapacitated; i den klassiska regeln även om din Speed blir 0.",
      details: "Dodge skyddar mot attackslag och Smidighetsräddningsslag, inte mot alla typer av skadliga effekter."
    }},
    "rule-concentration": { aliases: ["koncentration", "concentration", "CON save", "halva skadan"], sv: {
      name: "Koncentration", category: "Magi",
      summary: "En varelse kan normalt bara upprätthålla en koncentrationseffekt åt gången, och skada kan bryta den.",
      quickReference: "**En åt gången.** Att börja koncentrera på en ny effekt avslutar den gamla.\n\n**Skada:** slå ett Constitution-räddningsslag för varje separat skadetillfälle medan du koncentrerar dig. **DC 10 eller halva skadan, det högsta värdet gäller.**\n\nAtt bli incapacitated eller dö avslutar koncentrationen. Miljöstörningar kan också kräva ett räddningsslag enligt SL:s bedömning.",
      details: "Flera separata skadetillfällen kan kräva varsitt koncentrationsslag. Koncentration är inte en handling i sig utan ett pågående krav som hör till effekten."
    }},
    "rule-death-and-dying": { aliases: ["dödsslag", "death saves", "döende", "0 hp", "stabil"], sv: {
      name: "Dödsslag & döende", category: "Strid",
      summary: "Vid 0 HP är en varelse vanligtvis medvetslös och döende; rollpersoner slår normalt dödsslag på sina turer.",
      quickReference: "**Dödsslag:** d20 utan normal grundegenskapsmodifikation. **10+ = lyckat**, **9 eller lägre = misslyckat**.\n\n**3 lyckade:** stabil. **3 misslyckade:** död.\n**Naturlig 1:** två misslyckanden. **Naturlig 20:** återfå 1 HP.\n\nSkada vid 0 HP ger ett misslyckat dödsslag; en kritisk träff ger två. Mycket stor skada kan orsaka omedelbar död enligt regeln för massiv skada.",
      details: "Lyckade och misslyckade dödsslag nollställs när varelsen blir stabil eller återfår HP. En stabil varelse vid 0 HP är fortfarande medvetslös men slutar slå dödsslag tills den tar skada och börjar dö igen."
    }},
    "rule-surprise": { aliases: ["överraskning", "surprise", "överraskad", "bakhåll"], sv: {
      name: "Överraskning", category: "Strid",
      summary: "Stor versionsskillnad: 2014 använder överraskning som tillstånd i första rundan, medan 2024 ger nackdel på initiativ.",
      quickReference: "**2014:** en överraskad varelse kan inte förflytta sig eller ta en handling på sin första tur och kan inte ta reaktioner förrän den turen är slut.\n\n**2024:** en varelse som är överraskad när initiativ slås har **nackdel på sitt initiativslag** i stället för att förlora sin första tur.",
      details: "Överraskning avgörs när striden börjar utifrån medvetenhet och omständigheter, inte bara för att någon säger 'jag attackerar först'. Hantera gömda varelser, medvetenhet och initiativ tillsammans.",
      editionNotes: "Blanda inte de två procedurerna. Använd överraskningsregeln för kampanjens valda regelversion."
    }},
    "rule-grappling-shoving": { aliases: ["greppa", "grapple", "knuffa", "shove", "brottning"], sv: {
      name: "Greppa & knuffa", category: "Strid",
      summary: "Kontrollera en närliggande varelse genom att greppa den eller tvinga den bakåt/liggande; metoden skiljer sig tydligt mellan 2014 och 2024.",
      quickReference: "**2014 greppa:** ersätt en attack med en särskild närstridsattack; Styrka (Atletik) möter målets Styrka (Atletik) eller Smidighet (Akrobatik). Framgång ger Grappled.\n\n**2014 knuffa:** liknande motståndsslag; vid framgång skjuts målet 5 ft eller blir liggande.\n\n**2024:** Grapple och Shove är alternativ för **Unarmed Strike**. Målet slår ett Styrke- eller Smidighetsräddningsslag mot ett DC baserat på din Styrka och proficiency i stället för ett motståndsslag i Atletik.",
      details: "Storleksgränser gäller: du kan normalt inte greppa eller knuffa en varelse som är mer än en storlekskategori större. Att flytta en greppad varelse kostar extra förflyttning.",
      editionNotes: "Det här är ett av de lättaste ställena att råka blanda 2014 och 2024. Använd antingen motståndsslaget eller Unarmed Strike/räddningsslaget, inte båda."
    }},
    "rule-movement-speed": { aliases: ["förflyttning", "movement", "speed", "hastighet", "rörelse"], sv: {
      name: "Förflyttning & Speed", category: "Förflyttning",
      summary: "På din tur kan du normalt förflytta dig upp till din Speed och dela upp rörelsen före, mellan och efter handlingar eller attacker.",
      quickReference: "Förflyttning är en pott för turen. Du kan dela upp den runt din handling och, vid flera attacker, mellan enskilda attacker.\n\nOlika rörelsesätt som gång, klättring, simning, flygning och grävning samspelar med redan använd förflyttning i stället för att var och en ge en helt ny full pott.",
      details: "Att resa sig från liggande, svår terräng, trånga passager, klättring, simning och att dra en greppad varelse kan förbruka förflyttning snabbare än normalt."
    }},
    "rule-difficult-terrain": { aliases: ["svår terräng", "difficult terrain", "halv fart"], sv: {
      name: "Svår terräng", category: "Förflyttning",
      summary: "Terräng som är svår att ta sig genom kostar extra förflyttning.",
      quickReference: "Varje **1 fot** du rör dig genom svår terräng kostar normalt **2 fot förflyttning**. Flera källor till svår terräng multiplicerar normalt inte kostnaden ytterligare om ingen specifik regel säger det.",
      details: "Exempel är rasmassor, djup snö, tät undervegetation, branta trappor, trängsel eller magisk terräng som uttryckligen räknas som svår."
    }},
    "rule-climbing-swimming-crawling": { aliases: ["klättra", "simma", "krypa", "climb", "swim", "crawl"], sv: {
      name: "Klättra, simma & krypa", category: "Förflyttning",
      summary: "Utan rätt särskild Speed kostar dessa rörelsesätt normalt extra förflyttning.",
      quickReference: "En vanlig grundregel är **1 extra fot förflyttning per fot** när du klättrar, simmar eller kryper. Har varelsen motsvarande Speed kan den använda den normalt.\n\nSärskilt svåra ytor, strömmar eller omständigheter kan dessutom kräva ett grundegenskapsslag.",
      details: "En hal eller lodrät yta och grovt vatten är bra exempel på när SL kan lägga till ett Styrka (Atletik)-slag ovanpå förflyttningskostnaden."
    }},
    "rule-jumping": { aliases: ["hopp", "hoppa", "jump", "längdhopp", "höjdhopp"], sv: {
      name: "Hopp", category: "Förflyttning",
      summary: "Längd- och höjdhopp bygger främst på Styrka, och ansats förbättrar räckvidden.",
      quickReference: "**Längdhopp:** med 10 ft ansats kan du hoppa upp till ditt **Styrkevärde i fot**; från stillastående hälften.\n\n**Höjdhopp:** med 10 ft ansats hoppar du **3 + Styrkemodifikation fot** uppåt; från stillastående hälften.\n\nVarje fot du hoppar kostar fortfarande en fot av din förflyttning.",
      details: "SL kan kräva Styrka (Atletik) för att ta sig över ett hinder, pressa hoppet bortom normal gräns eller hantera särskilt svåra omständigheter."
    }},
    "rule-falling": { aliases: ["fall", "falla", "fallskada", "fall damage", "1d6"], sv: {
      name: "Fall", category: "Förflyttning",
      summary: "Ett fall orsakar krosskada baserat på fallhöjden, upp till ett standardtak.",
      quickReference: "När fallet slutar tar du **1d6 krosskada per 10 fot du fallit**, maximalt **20d6**. En varelse som tar fallskada landar normalt **liggande** om ingen regel förhindrar det.",
      details: "Mycket långa fall, flygande varelser, fall på andra varelser och särskilda miljöer kan ha ytterligare regler. 1d6-per-10-ft är den snabba bordsreferensen."
    }},
    "rule-squeezing": { aliases: ["tränga sig", "squeezing", "trång passage"], sv: {
      name: "Tränga sig", category: "Förflyttning",
      summary: "En varelse kan ta sig genom ett utrymme avsett för en varelse en storlekskategori mindre, men det är långsamt och riskabelt.",
      quickReference: "När du tränger dig kostar förflyttning extra. Varelsen får ett sämre stridsläge: attacker mot den blir lättare och dess egna attacker och Smidighetsräddningsslag hindras enligt den klassiska regeln.",
      details: "Använd regeln när en varelse pressar sig genom en passage avsedd för en storlekskategori mindre. En ännu mindre passage kan helt enkelt vara omöjlig utan magi eller en särskild metod."
    }},
    "rule-conditions": { aliases: ["tillstånd", "conditions", "status"], sv: {
      name: "Tillstånd", category: "Tillstånd",
      summary: "Namngivna tillstånd som Liggande, Grappled, Restrained, Stunned, Osynlig och Medvetslös samlar återkommande mekaniska effekter.",
      quickReference: "Tillstånd gör exakt vad deras regeltext säger och kan överlappa. Om flera tillstånd ger samma sorts fördel/nackdel gäller vanliga regler för fördel och nackdel i stället för att fler d20 staplas.",
      details: "När en varelse får ett tillstånd, applicera själva tillståndet i stället för att kopiera effekterna till lösa anteckningar. Det gör borttagning, immunitet och interaktioner mycket enklare att följa."
    }},
    "rule-prone": { aliases: ["liggande", "prone", "omkull"], sv: {
      name: "Liggande (Prone)", category: "Tillstånd",
      summary: "På marken: förflyttning begränsas, närliggande angripare får övertag och avlägsna angripare hindras.",
      quickReference: "En liggande varelse **kryper** normalt om den inte reser sig. Att resa sig kostar **hälften av dess Speed**.\n\nVarelsen har nackdel på sina egna attackslag. Attacker mot den har **fördel inom 5 ft** och **nackdel längre bort**.",
      details: "Du kan inte resa dig om du saknar tillräcklig förflyttning för kostnaden eller om din Speed är 0."
    }},
    "rule-grappled": { aliases: ["greppad", "grappled", "grapple", "speed 0"], sv: {
      name: "Greppad (Grappled)", category: "Tillstånd",
      summary: "Ett grepp stoppar främst vanlig förflyttning och låter den som greppar dra eller flytta målet enligt grapple-reglerna.",
      quickReference: "**Kärneffekt:** den greppade varelsens Speed blir 0 så länge greppet varar.\n\nGreppet upphör vanligtvis om den som håller greppet blir incapacitated eller om varelserna separeras utanför dess reach. Regler för flykt och släpande skiljer sig mellan utgåvor.",
      details: "Grappled betyder inte automatiskt Restrained. Lägg inte till fördel/nackdel på attacker om ingen annan förmåga eller tillstånd ger det.",
      editionNotes: "**2014:** flykt är normalt en handling med Atletik eller Akrobatik mot den som greppars Atletik.\n\n**2024:** tillstånd och flykt knyts till de nyare Unarmed Strike/grapple-reglerna och ett räddningsslags-DC."
    }},
    "rule-restrained": { aliases: ["fasthållen", "restrained", "fjättrad"], sv: {
      name: "Fasthållen (Restrained)", category: "Tillstånd",
      summary: "Ett starkare rörelselås som också påverkar attacker och Smidighetsräddningsslag.",
      quickReference: "En restrained varelses **Speed är 0**. Dess attackslag har **nackdel**. Attackslag mot den har **fördel**. Dess **Smidighetsräddningsslag har nackdel**.",
      details: "Restrained är betydligt hårdare än Grappled. Ett grepp innebär inte restraint om ingen separat förmåga uttryckligen säger det."
    }},
    "rule-stunned-incapacitated": { aliases: ["bedövad", "stunned", "incapacitated", "oförmögen"], sv: {
      name: "Bedövad & incapacitated", category: "Tillstånd",
      summary: "Stunned inkluderar incapacitated och lägger dessutom på kraftiga försvarsnackdelar.",
      quickReference: "**Incapacitated:** kan inte ta handlingar eller reaktioner.\n\n**Stunned:** incapacitated, rörelsen stoppas eller begränsas kraftigt av tillståndet, tal försvåras, attacker mot varelsen har fördel och varelsen misslyckas automatiskt med Styrke- och Smidighetsräddningsslag enligt den klassiska regeln.",
      details: "Många andra tillstånd och effekter inkluderar Incapacitated. Om en regel upphör när en varelse blir incapacitated utlöser Stunned vanligtvis också den följden."
    }},
    "rule-unconscious": { aliases: ["medvetslös", "unconscious", "0 hp"], sv: {
      name: "Medvetslös", category: "Tillstånd",
      summary: "Varelsen kan inte agera, är omedveten om omgivningen, tappar det den håller, faller liggande och är mycket sårbar på nära håll.",
      quickReference: "En medvetslös varelse är incapacitated, kan inte röra sig eller tala, är omedveten, tappar hållna föremål och faller liggande. Den misslyckas automatiskt med Styrke- och Smidighetsräddningsslag. Attacker mot den har fördel och en träff inom 5 ft är normalt kritisk.",
      details: "Vid 0 HP är rollpersoner ofta medvetslösa och omfattas samtidigt av reglerna för döende och dödsslag om ingen effekt säger annat."
    }},
    "rule-invisible": { aliases: ["osynlig", "invisible", "gömd", "hidden"], sv: {
      name: "Osynlig", category: "Tillstånd",
      summary: "Varelsen kan inte ses utan särskilda sinnen eller magi; attackinteraktioner beror på om dess position är känd och på regelversion.",
      quickReference: "Osynliga varelser syns inte med vanlig syn. I den klassiska stridsregeln har attacker mot en osedd osynlig varelse nackdel och den osynliga varelsens attacker fördel, med undantag för särskilda sinnen och andra effekter.",
      details: "Osynlig är inte samma sak som gömd. En varelse kan vara osedd men ändå ha en känd position genom ljud, spår, attacker eller andra ledtrådar.",
      editionNotes: "2024 organiserar om språket kring osynlighet och Hide. Använd kampanjens exakta tillståndstext när kantfall kring upptäckt eller Hide-handlingen spelar roll."
    }},
    "rule-exhaustion": { aliases: ["utmattning", "exhaustion", "trötthet"], sv: {
      name: "Utmattning", category: "Vila & återhämtning",
      summary: "En kumulativ skala med sex nivåer; själva nackdelarna gjordes om rejält i 2024-reglerna.",
      quickReference: "**2014:** sex nivåer med olika nackdel på varje steg, från nackdel på slag via minskad Speed/HP till död på nivå 6.\n\n**2024:** varje nivå ger **−2 på D20-slag** och **−5 ft Speed** per nivå; nivå 6 betyder död. En lång vila tar normalt bort en nivå när kraven är uppfyllda.",
      details: "Spåra utmattning som ett tal 0–6. Eftersom utgåvorna använder olika modeller bör du alltid notera kampanjens regelversion och inte bara skriva 'Utmattning 2'.",
      editionNotes: "Tillståndet kan inte säkert blandas mellan utgåvor. 2014 har olika effekt per nivå; 2024 upprepar −2 D20-slag / −5 ft Speed."
    }},
    "rule-rests": { aliases: ["kort vila", "lång vila", "short rest", "long rest", "vila"], sv: {
      name: "Kort & lång vila", category: "Vila & återhämtning",
      summary: "Kort vila låter dig använda Hit Dice och återställer vissa förmågor; lång vila återställer stora resurser och skiljer sig något mellan utgåvor.",
      quickReference: "**Kort vila:** normalt minst 1 timme. Rollpersoner kan använda tillgängliga Hit Dice för att återfå HP och återställer förmågor som uttryckligen laddas om på kort vila.\n\n**Lång vila:** normalt omkring 8 timmar med krav på sömn/lätt aktivitet. Återställer förlorade HP och förmågor som laddas om på lång vila.",
      details: "Avbrott, frekvens, sömnkrav och exakt vad som återställs följer kampanjens utgåva. Klassförmågor och magiska föremål anger själva om de återställs vid kort eller lång vila.",
      editionNotes: "**2014:** en färdig lång vila återställer upp till hälften av rollpersonens totala Hit Dice.\n\n**2024:** återställningen av Hit Point Dice är generösare och proceduren för lång vila är omskriven; använd 2024-texten för kantfall."
    }},
    "rule-vision-light": { aliases: ["sikt", "ljus", "mörker", "darkvision", "vision"], sv: {
      name: "Sikt & ljus", category: "Utforskning",
      summary: "Klart ljus, svagt ljus, mörker, skymmande miljö och särskilda sinnen avgör vad varelser kan se.",
      quickReference: "**Klart ljus:** normal syn.\n**Svagt ljus:** lightly obscured; synbaserad Perception försvåras.\n**Mörker:** heavily obscured för vanlig syn.\n\n**Darkvision:** låter en varelse se genom mörker inom sin räckvidd, vanligtvis som svagt ljus och ofta utan färg.\n\nDimma, lövverk, rök och liknande kan skymma synen oberoende av belysning.",
      details: "Sikt påverkar målval, Hide, fördel/nackdel och om en varelse kan uppfatta en trigger. Skilj alltid på 'kan se varelsen' och 'vet ungefär var varelsen är'."
    }},
    "rule-object-interaction": { aliases: ["föremålsinteraktion", "use an object", "utilize", "dra vapen", "öppna dörr"], sv: {
      name: "Föremålsinteraktion", category: "Grundmekanik",
      summary: "Enkel interaktion med omgivningen ryms ofta i turen; mer omfattande föremålsanvändning kan kosta en handling.",
      quickReference: "Exempel på enkla interaktioner är att öppna en vanlig dörr, dra eller stoppa undan ett vapen, plocka upp ett tappat föremål eller räcka över något när omständigheterna tillåter det. En andra betydande interaktion eller ett komplicerat föremål kostar vanligtvis en handling eller använder utgåvans särskilda procedur.",
      details: "Gränsen är avsiktligt en SL-bedömning. Om föremålet är huvudpoängen med vad rollpersonen försöker göra, eller hanteringen är farlig, komplex eller tidskrävande, är en handling normalt rimlig.",
      editionNotes: "2024 formaliserar **Utilize** för många föremålsinteraktioner. 2014 beskriver oftare en incidental object interaction som del av movement/handling och använder Use an Object för ytterligare eller komplex användning."
    }}
  });

  api.register("skill", {
    "skill-acrobatics": { aliases: ["akrobatik", "balans", "rörlighet"], sv: {
      name: "Akrobatik", defaultAbility: "Smidighet", summary: "Behåll balansen och fotfästet i svåra situationer.",
      description: "Ett Smidighet (Akrobatik)-slag används när du försöker hålla dig på fötter i en besvärlig situation, till exempel på is, en smal lina eller ett gungande skeppsdäck.",
      typicalUses: "Balans, kullerbyttor, akrobatik och att behålla fotfästet på instabil mark.",
      exampleChecks: "Ta sig längs en smal avsats; landa kontrollerat efter ett fall; tumla förbi en fiende."
    }},
    "skill-animal-handling": { aliases: ["hantera djur", "djurhantering", "djurträning", "djurvana"], sv: {
      name: "Hantera djur", defaultAbility: "Visdom", summary: "Lugna, kontrollera eller läsa av ett djur.",
      description: "När det är osäkert om du kan lugna ett tamdjur, hindra ett riddjur från att skena eller förstå ett djurs avsikt kan SL be om ett Visdom (Hantera djur)-slag.",
      typicalUses: "Lugna riddjur, träna djur, läsa av humör och styra bestar.",
      exampleChecks: "Lugna en skrämd häst; vinna en vakthunds förtroende; märka att ett djur tänker anfalla."
    }},
    "skill-arcana": { aliases: ["arkana", "magikunskap", "magi"], sv: {
      name: "Arcana", defaultAbility: "Intelligens", summary: "Kunskap om besvärjelser, magiska föremål och planens lore.",
      description: "Ett Intelligens (Arcana)-slag mäter din förmåga att minnas kunskap om besvärjelser, magiska föremål, ockulta symboler, magiska traditioner, existensplan och deras invånare.",
      typicalUses: "Identifiera magiska traditioner, planartecken och ockulta symboler.",
      exampleChecks: "Känna igen en ritualcirkel; minnas ett magiskt föremåls skola; förstå en aberrations natur."
    }},
    "skill-athletics": { aliases: ["atletik", "klättra", "hoppa", "simma"], sv: {
      name: "Atletik", defaultAbility: "Styrka", summary: "Klättring, hopp och simning under krävande omständigheter.",
      description: "Ett Styrka (Atletik)-slag täcker svåra situationer du möter när du klättrar, hoppar eller simmar.",
      typicalUses: "Klättra, hoppa, simma och ofta fysiska grapple-motståndsslag.",
      exampleChecks: "Klättra uppför en klippa; hoppa över en klyfta; simma mot en ström."
    }},
    "skill-deception": { aliases: ["bluffa", "bedrägeri", "ljuga"], sv: {
      name: "Bluffa", defaultAbility: "Karisma", summary: "Dölj sanningen på ett övertygande sätt.",
      description: "Ett Karisma (Bluffa)-slag avgör om du lyckas dölja sanningen övertygande, genom ord eller handling.",
      typicalUses: "Lögner, förklädnader, falska avsikter och bedrägerier.",
      exampleChecks: "Bluffa en vakt; utge dig för att vara någon annan; dölja dina verkliga avsikter."
    }},
    "skill-history": { aliases: ["historia", "historik", "lärdom"], sv: {
      name: "Historia", defaultAbility: "Intelligens", summary: "Minns historisk kunskap och legender.",
      description: "Ett Intelligens (Historia)-slag mäter din förmåga att minnas historiska händelser, legendariska personer, gamla riken, konflikter, krig och förlorade civilisationer.",
      typicalUses: "Kungahus, krig, ruiner och berömda personer.",
      exampleChecks: "Identifiera ett heraldiskt vapen; datera en ruin; minnas innehållet i ett gammalt fördrag."
    }},
    "skill-insight": { aliases: ["insikt", "människokännedom", "motiv", "lögn"], sv: {
      name: "Insikt", defaultAbility: "Visdom", summary: "Läs kroppsspråk, avsikter och motiv.",
      description: "Ett Visdom (Insikt)-slag avgör om du kan förstå en varelses verkliga avsikter, exempelvis upptäcka en lögn eller förutse någons nästa drag.",
      typicalUses: "Genomskåda lögner, ana motiv och läsa av ett rum.",
      exampleChecks: "Genomskåda en bluff; ana fientlighet bakom artiga ord."
    }},
    "skill-intimidation": { aliases: ["skrämsel", "hota", "intimidation"], sv: {
      name: "Skrämsel", defaultAbility: "Karisma", summary: "Påverka andra genom hot eller skrämmande närvaro.",
      description: "När du försöker påverka någon genom öppna hot, fientliga handlingar eller våld kan SL be om ett Karisma (Skrämsel)-slag.",
      typicalUses: "Hot, förhör och skrämseltaktik.",
      exampleChecks: "Skrämma en ligist; pressa fram en bekännelse; tömma en krog med en blick."
    }},
    "skill-investigation": { aliases: ["undersökning", "utreda", "ledtrådar", "finna dolda ting"], sv: {
      name: "Undersökning", defaultAbility: "Intelligens", summary: "Sök metodiskt efter ledtrådar och dra slutsatser.",
      description: "När du letar efter ledtrådar och drar slutsatser utifrån dem slår du Intelligens (Undersökning).",
      typicalUses: "Söka igenom rum, analysera brottsplatser och hitta dolda saker genom resonemang.",
      exampleChecks: "Hitta en lönndörr genom att studera väggen; lista ut vilken bägare som förgiftats."
    }},
    "skill-medicine": { aliases: ["läkekonst", "medicin", "första hjälpen", "stabilisera"], sv: {
      name: "Läkekonst", defaultAbility: "Visdom", summary: "Stabilisera döende och bedöm skador eller sjukdom.",
      description: "Ett Visdom (Läkekonst)-slag kan användas för att försöka stabilisera en döende kamrat eller diagnostisera en sjukdom.",
      typicalUses: "Stabilisera, diagnostisera sjukdom/gift och bedöma sår.",
      exampleChecks: "Identifiera ett gift; stabilisera en fallen allierad; bedöma dödsorsak."
    }},
    "skill-nature": { aliases: ["natur", "vildmark", "flora", "fauna"], sv: {
      name: "Natur", defaultAbility: "Intelligens", summary: "Kunskap om terräng, växter, djur och väder.",
      description: "Ett Intelligens (Natur)-slag mäter din förmåga att minnas kunskap om terräng, växter och djur, väder och naturliga kretslopp.",
      typicalUses: "Identifiera flora/fauna, vädermönster och naturliga faror.",
      exampleChecks: "Känna igen en sällsynt ört; förutse en storm; förstå varför djur undviker en strand."
    }},
    "skill-perception": { aliases: ["perception", "upptäcka fara", "iakttagelse", "varseblivning", "se", "höra"], sv: {
      name: "Perception", defaultAbility: "Visdom", summary: "Se, höra eller på annat sätt upptäcka att något finns där.",
      description: "Ett Visdom (Perception)-slag låter dig se, höra eller på annat sätt upptäcka något. Det mäter allmän uppmärksamhet på omgivningen och skärpan i dina sinnen.",
      typicalUses: "Upptäcka fällor/gömda fiender, lyssna vid dörrar och märka bakhåll.",
      exampleChecks: "Höra viskningar; upptäcka en kamouflerad jägare; se en snubbeltråd."
    }},
    "skill-performance": { aliases: ["uppträda", "underhålla", "performance", "musik", "skådespel"], sv: {
      name: "Uppträda", defaultAbility: "Karisma", summary: "Underhåll en publik.",
      description: "Ett Karisma (Uppträda)-slag avgör hur väl du fängslar en publik med musik, dans, skådespel, berättande eller annan underhållning.",
      typicalUses: "Musik, dans, skådespel och scenframträdanden.",
      exampleChecks: "Vinna en publik; distrahera med en sång; imponera på ett hov."
    }},
    "skill-persuasion": { aliases: ["övertala", "övertalning", "förhandla", "persuasion"], sv: {
      name: "Övertala", defaultAbility: "Karisma", summary: "Påverka med takt, resonemang och social fingertoppskänsla.",
      description: "När du försöker påverka någon eller en grupp med takt, social skicklighet eller välvilja kan SL be om ett Karisma (Övertala)-slag.",
      typicalUses: "Diplomati, förhandling och vädjanden till förnuft eller vänskap.",
      exampleChecks: "Mäkla fred; förhandla ned ett pris; övertyga ett råd."
    }},
    "skill-religion": { aliases: ["religion", "gudar", "riter", "kult"], sv: {
      name: "Religion", defaultAbility: "Intelligens", summary: "Kunskap om gudar, riter och heliga symboler.",
      description: "Ett Intelligens (Religion)-slag mäter din förmåga att minnas kunskap om gudar, riter och böner, religiösa hierarkier, heliga symboler och hemliga kulter.",
      typicalUses: "Identifiera kulter, heliga symboler, riter och gudomlig lore.",
      exampleChecks: "Känna igen ett vanhelgat altare; minnas en guds lära; identifiera religiös symbolik."
    }},
    "skill-sleight-of-hand": { aliases: ["fingerfärdighet", "ficktjuv", "palma", "sleight of hand"], sv: {
      name: "Fingerfärdighet", defaultAbility: "Smidighet", summary: "Placera, göm eller stjäl små föremål obemärkt.",
      description: "När du utför fingerfärdighet eller handtrick, exempelvis placerar något på en annan person eller gömmer ett föremål på kroppen, slår du Smidighet (Fingerfärdighet).",
      typicalUses: "Ficktjuveri, gömma föremål, plantera bevis och finmotoriska trick.",
      exampleChecks: "Lyfta en nyckelknippa; gömma en potion; byta plats på två identiska flaskor."
    }},
    "skill-stealth": { aliases: ["smyga", "smygande", "gömma sig", "stealth"], sv: {
      name: "Smyga", defaultAbility: "Smidighet", summary: "Dölj dig för fiender och andra som kan upptäcka dig.",
      description: "Slå Smidighet (Smyga) när du försöker gömma dig, smyga förbi vakter, lämna en plats utan att märkas eller närma dig någon utan att synas eller höras.",
      typicalUses: "Gömma sig, smyga och närma sig ett bakhåll obemärkt.",
      exampleChecks: "Smyga förbi vakter; gömma sig i undervegetation; närma sig ett läger utan att upptäckas."
    }},
    "skill-survival": { aliases: ["överlevnad", "vildmarksvana", "spåra", "jaga", "survival"], sv: {
      name: "Överlevnad", defaultAbility: "Visdom", summary: "Följ spår, jaga och navigera i vildmarken.",
      description: "SL kan be om ett Visdom (Överlevnad)-slag för att följa spår, jaga, leda gruppen genom vildmark, känna igen tecken på farliga djur, förutse väder eller undvika naturliga faror.",
      typicalUses: "Spåra, leta föda, navigera, förutse väder och hantera vildmarksfaror.",
      exampleChecks: "Följa en varelses spår; hitta färskvatten; undvika ett förrädiskt kärr."
    }}
  });
})();
