(function () {
  "use strict";

  const api = window.CatalogueContentI18n;
  if (!api) return;

  // Editorial pass, not a word-for-word localization layer.
  // The goal is Swedish that sounds like someone at a Swedish D&D table wrote it:
  // idiomatic sentences, short table-facing explanations, and English rules terms
  // kept when translating them would make the text less natural rather than more.
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

  patches("rule", {
    "rule-ability-scores": {
      summary: "De sex grundegenskaperna och hur de faktiskt används när tärningarna kommer fram.",
      quickReference: "**Modifikation:** avrunda nedåt ((värde − 10) / 2).\n\n**Grundegenskaper:** Styrka, Smidighet, Fysik, Intelligens, Visdom och Karisma.\n\nNär ett slag bygger på en grundegenskap använder du dess modifikation. Har rollpersonen relevant proficiency lägger du också till proficiencybonusen.",
      details: "Själva grundegenskapsvärdet används mer sällan än modifikationen. Checks, saves och attacker utgår i regel från modifikationen, medan den specifika regeln talar om vilken grundegenskap som gäller."
    },
    "rule-strength": {
      summary: "Rå fysisk kraft: lyfta, bryta, klättra, hoppa, brottas och slå hårt.",
      quickReference: "**Vanliga situationer:** forcera en dörr, hålla fast något tungt, klättra där det faktiskt är svårt, simma mot ström eller pressa ett hopp längre än normalt.\n\n**Färdighet:** Atletik.\n\n**Strid:** många närstridsvapen använder Styrka.\n\n**Bärförmåga:** Styrka avgör också hur mycket du kan bära, lyfta, skjuta och dra.",
      details: "Använd Styrka när frågan i grunden är 'är du stark nog?'. Atletik är relevant när teknik och träning spelar in, men varje Styrkeslag är inte automatiskt Atletik."
    },
    "rule-dexterity": {
      summary: "Snabbhet, precision och kroppskontroll: balans, smygande, reflexer och finmotorik.",
      quickReference: "**Färdigheter:** Akrobatik, Fingerfärdighet och Smyga.\n\n**Strid:** distansvapen och finesse-vapen använder ofta Smidighet.\n\n**Försvar:** Smidighet bidrar ofta till AC.\n\n**Initiativ:** använder normalt Smidighet.",
      details: "Använd Smidighet när det viktigaste är att vara snabb, exakt eller smidig. Räddningsslag med Smidighet dyker ofta upp när något går att ducka, kasta sig undan från eller reagera på i sista sekund."
    },
    "rule-constitution": {
      summary: "Kroppens tålighet: HP, gift, sjukdom, koncentration och ren envis överlevnad.",
      quickReference: "**HP:** din Constitution-modifikation påverkar hur mycket HP du får per nivå.\n\n**Räddningsslag:** vanligt mot gift, sjukdom och annan fysisk påfrestning.\n\n**Koncentration:** tar du skada medan du koncentrerar dig gör du normalt ett Constitution-save med **DC 10 eller halva skadan, det högsta av dem**.\n\nDet finns ingen vanlig skill som använder Constitution.",
      details: "Constitution-checks är ganska ovanliga. När spelet vill testa kroppens motståndskraft handlar det oftare om ett save. Ett vanligt check passar bättre för sådant som långvarig ansträngning där ingen annan regel redan säger hur det ska lösas."
    },
    "rule-intelligence": {
      summary: "Kunskap och slutledning: vad du vet, minns, förstår eller lyckas lista ut.",
      quickReference: "**Färdigheter:** Arcana, Historia, Undersökning, Natur och Religion.\n\nIntelligens passar när rollpersonen försöker minnas fakta, tolka kunskap eller dra slutsatser av ledtrådar.",
      details: "En användbar tumregel: Perception hittar blodfläcken. Undersökning försöker lista ut varför den sitter i taket. Det är inte en perfekt gränsdragning, men den löser förvånansvärt många diskussioner."
    },
    "rule-wisdom": {
      summary: "Uppmärksamhet och magkänsla: märka saker, läsa människor och förstå vad som händer omkring dig.",
      quickReference: "**Färdigheter:** Hantera djur, Insikt, Läkekonst, Perception och Överlevnad.\n\nPerception märker saker. Insikt läser människor. Överlevnad läser spår och miljö. Läkekonst används när faktisk medicinsk bedömning eller stabilisering kräver ett slag.",
      details: "Visdom handlar oftare om att uppfatta och tolka det som finns framför dig än om att plocka fram inlärda fakta. Passiv Perception är därför ett av de passiva värden som används mest."
    },
    "rule-charisma": {
      summary: "Närvaro och social kraft: övertala, bluffa, hota, uppträda och få ett rum att lyssna.",
      quickReference: "**Färdigheter:** Bluffa, Skrämsel, Uppträda och Övertala.\n\nAnvänd Karisma när resultatet hänger på hur väl rollpersonen uttrycker sig, säljer en lögn, leder, pressar eller övertygar någon.",
      details: "Karisma är inte ett skönhetsvärde. Det handlar om hur starkt en rollperson kan projicera sin personlighet och påverka andra med den."
    },
    "rule-d20-tests": {
      summary: "Samlingsnamnet för ability checks, saves och attackslag i 2024-reglerna.",
      quickReference: "Slå en d20, lägg till de modifikationer som gäller och jämför med målvärdet, oftast en DC eller AC.\n\nDet knepiga är sällan själva d20:n. Det är vilken bonus som faktiskt får följa med den.",
      details: "I 2024-reglerna är **D20 Test** ett formellt samlingsbegrepp. I 2014-reglerna fungerar de tre typerna i stort på samma sätt, men reglerna pratar oftare om dem var för sig."
    },
    "rule-ability-checks": {
      summary: "Används när någon försöker göra något osäkert och utfallet faktiskt spelar roll.",
      quickReference: "**Formel:** d20 + relevant grundegenskapsmodifikation + proficiencybonus om rätt proficiency gäller.\n\nSL väljer grundegenskap och DC. En skill bestämmer framför allt om proficiency får läggas till, den ersätter inte själva grundegenskapen.",
      details: "Be inte om ett slag bara för att det går att slå en tärning. Om misslyckande inte vore intressant, eller om uppgiften rimligen lyckas automatiskt, låt den bara lyckas. SL kan också para en skill med en annan grundegenskap när situationen motiverar det, till exempel Styrka (Skrämsel)."
    },
    "rule-saving-throws": {
      summary: "När något händer med dig och du får en chans att stå emot, ducka eller skaka av dig effekten.",
      quickReference: "**Formel:** d20 + relevant grundegenskapsmodifikation + proficiencybonus om du är proficient i det save som används.\n\nEffekten talar om vilken grundegenskap du ska använda och vad framgång respektive misslyckande betyder.",
      details: "Ett save utlöses normalt av en besvärjelse, fara, monsterförmåga eller annan regel. Spelaren bestämmer alltså sällan själv att 'nu gör jag ett save'."
    },
    "rule-advantage-disadvantage": {
      summary: "Advantage: två d20, behåll den högre. Disadvantage: två d20, behåll den lägre.",
      quickReference: "**Fördel:** slå 2d20 och använd den högre.\n**Nackdel:** slå 2d20 och använd den lägre.\n\nFlera källor staplas inte. Har du minst en av varje tar de ut varandra och du slår en vanlig d20, även om ena sidan har fem anledningar och den andra bara en.",
      details: "Välj vilken d20 som räknas först och lägg sedan på vanliga modifikationer, om ingen specifik regel säger något annat."
    },
    "rule-proficiency-bonus": {
      summary: "Den nivåbaserade bonusen som säger 'ja, det här kan du faktiskt'.",
      quickReference: "**Nivå 1–4:** +2\n**5–8:** +3\n**9–12:** +4\n**13–16:** +5\n**17–20:** +6\n\nProficiency läggs normalt bara till en gång på samma slag. Expertise är ett uttryckligt undantag.",
      details: "Samma proficiencybonus används också av många klassförmågor och DC-formler. Vid multiclass använder du rollpersonens totala nivå för den vanliga progressionen."
    },
    "rule-difficulty-classes": {
      summary: "DC är målvärdet för ett check eller save. Högre siffra, jobbigare problem.",
      quickReference: "Bra riktvärden:\n- **5** mycket lätt\n- **10** lätt\n- **15** medelsvårt\n- **20** svårt\n- **25** mycket svårt\n- **30** nästan omöjligt\n\nEn rutinuppgift utan verklig osäkerhet behöver inget slag alls.",
      details: "Sätt DC efter hur svår själva uppgiften är, inte efter vem som försöker. Rollpersonens skicklighet finns redan i bonusar, proficiency, advantage och förmågor."
    },
    "rule-passive-checks": {
      summary: "Ett färdigt värde för sådant SL vill avgöra utan att be om ett synligt tärningsslag.",
      quickReference: "**Typiskt passivt värde:** 10 + de modifikationer som normalt skulle gälla.\n\nPassiv Perception är vanligast. Med den klassiska metoden motsvarar advantage +5 och disadvantage −5.",
      details: "Passiva värden är särskilt användbara när ett slag i sig skulle avslöja att något finns att upptäcka, eller när samma kontroll annars skulle behöva upprepas om och om igen."
    },
    "rule-initiative": {
      summary: "Bestämmer vem som hinner göra något först när striden drar igång.",
      quickReference: "Slå normalt **d20 + Smidighetsmodifikation** och sortera från högst till lägst. Lika resultat avgörs enligt den regel ni använder vid bordet.\n\nFör många likadana monster är det ofta skönare att låta dem dela initiativ än att administrera ett mindre excelark mitt i striden.",
      details: "Initiativ ordnar turerna i rundan. En runda motsvarar ungefär sex sekunder i spelvärlden, även om ni så klart spelar ut den betydligt långsammare än så."
    },
    "rule-combat-turn": {
      summary: "Din vanliga verktygslåda på en tur: rörelse, handling och ibland bonushandling eller reaktion.",
      quickReference: "På din tur har du normalt:\n- **Förflyttning** upp till din Speed\n- **En handling**\n- **En bonushandling**, men bara om något faktiskt ger dig en\n\nDu har dessutom normalt **en reaktion** mellan början av din tur och början av nästa. Den används när något uttryckligen triggar den.",
      details: "Du kan dela upp din förflyttning före och efter handlingar. Att ha en bonushandling betyder inte att du måste hitta på något att göra med den. Den existerar bara när en regel, spell eller förmåga ger dig ett alternativ."
    },
    "rule-actions-in-combat": {
      summary: "De vanliga stridshandlingarna när 'jag slår honom' inte riktigt täcker planen.",
      quickReference: "Vanliga handlingar är **Attack, Cast a Spell/Magic action, Dash, Disengage, Dodge, Help, Hide, Ready, Search** och att använda eller interagera med saker enligt den regelversion ni spelar.\n\nSpecialregler kan lägga till fler val.",
      details: "Handlingarna är verktyg, inte ett facit över vad en rollperson får försöka göra. Om spelaren hittar på något annat, avgör vad det kostar och vilket slag som eventuellt behövs."
    },
    "rule-attack-rolls": {
      summary: "d20 + attackbonus mot målets AC. Lika eller högre träffar.",
      quickReference: "**Melee weapon attack:** ofta Styrka + proficiency.\n**Ranged weapon attack:** ofta Smidighet + proficiency.\n**Finesse:** låter dig normalt välja Styrka eller Smidighet.\n**Spell attack:** använder spellcasting ability + proficiency.\n\nPå träff rullar du skadan som attacken anger.",
      details: "Proficiency läggs till om du är proficient med vapnet eller om regeln uttryckligen säger det. Att ha advantage påverkar själva attackslaget, inte skadetärningarna."
    },
    "rule-critical-hits": {
      summary: "En naturlig 20 på ett attackslag är normalt en crit. Då blir det fler skadetärningar.",
      quickReference: "Vid en crit rullar du normalt attackens skadetärningar **två gånger** och lägger sedan till fasta bonusar en gång. Extra skadetärningar som hör till samma träff dubbleras normalt också om regeln inte säger annat.",
      details: "Det är tärningarna som dubbleras, inte hela slutsumman. Om en attack gör 1d8 + 3 och ytterligare 2d6 från en effekt blir criten normalt 2d8 + 4d6 + 3."
    },
    "rule-cover": {
      summary: "Saker mellan angriparen och målet kan ge bonus till AC och vissa DEX-saves.",
      quickReference: "**Half cover:** +2 AC och +2 på relevanta DEX-saves.\n**Three-quarters cover:** +5 AC och +5 på relevanta DEX-saves.\n**Total cover:** kan normalt inte väljas som direkt mål för en attack eller effekt som kräver fri linje till målet.",
      details: "Bedöm cover från angriparens eller effektens position. En allierad, fiende, möbel eller del av terrängen kan räcka för half cover om den faktiskt skymmer en betydande del av målet."
    },
    "rule-opportunity-attacks": {
      summary: "Lämnar du en fiendes räckvidd utan att Disengage kan det bli en gratis smäll på vägen ut.",
      quickReference: "När en varelse du kan se lämnar din reach med sin egen rörelse kan du normalt använda din **reaktion** för en opportunity attack.\n\nDisengage hindrar normalt detta. Teleportering och vissa former av påtvingad rörelse gör det också.",
      details: "Det viktiga är att målet lämnar din reach, inte att det bara rör sig inne i den. En reach på 10 ft kan därför skapa ett annat hotområde än standard 5 ft."
    },
    "rule-concentration": {
      summary: "Du kan normalt bara koncentrera dig på en spell åt gången, och folk som slår dig försöker gärna ändra på det.",
      quickReference: "**En concentration-spell åt gången.** Börjar du koncentrera dig på en ny slutar den gamla.\n\nNär du tar skada gör du normalt ett **Constitution-save: DC 10 eller halva skadan, det högsta värdet**. Varje separat skadetillfälle kan kräva ett eget save.\n\nDu tappar också koncentrationen om du blir incapacitated eller dör.",
      details: "Koncentration kräver ingen handling för att fortsätta. Du behöver däremot hålla koll på den, särskilt vid flera små träffar. Fem goblinpilar kan vara betydligt mer irriterande för en concentration-spell än en ensam stor attack."
    },
    "rule-death-and-dying": {
      summary: "Vid 0 HP börjar dödsräddningsslagen, såvida något inte dödar dig direkt.",
      quickReference: "På din tur vid 0 HP slår du normalt ett **death save**.\n- **10+** = en framgång\n- **9 eller lägre** = ett misslyckande\n- **Naturlig 20** = du återfår normalt 1 HP\n- **Naturlig 1** = två misslyckanden\n\nTre framgångar stabiliserar. Tre misslyckanden dödar. Skada vid 0 HP ger normalt ytterligare misslyckanden, och crits är extra farliga.",
      details: "Framgångar och misslyckanden nollställs när du blir stabil eller återfår HP. En stabil varelse vid 0 HP är fortfarande unconscious men slår inte fortsatta death saves om inget ändras."
    },
    "rule-surprise": {
      summary: "Surprise är ett av de ställen där 2014 och 2024 faktiskt menar olika saker.",
      quickReference: "**2014:** en överraskad varelse kan inte röra sig eller ta en handling på sin första tur och kan inte använda reactions förrän den turen är slut.\n\n**2024:** surprise ger i stället normalt **disadvantage på initiative**. Det finns inte samma överraskad-status genom första rundan.",
      details: "Bestäm först vem som faktiskt märkte hotet. Använd sedan rätt versionsregel. Det är lätt att råka blanda ihop dem eftersom båda kallas surprise men beter sig ganska olika."
    },
    "rule-grappling-shoving": {
      summary: "Grapple och shove ändrades rejält mellan 2014 och 2024. Kolla vilken motor kampanjen kör innan ni börjar brottas.",
      quickReference: "**2014:** grapple och shove använder normalt ett Athletics-check mot målets Athletics eller Acrobatics.\n\n**2024:** de hanteras genom **Unarmed Strike** och målet gör ett Strength- eller Dexterity-save mot din DC. Grapple, shove och vanlig obeväpnad skada är olika utfall av samma grundhandling.",
      details: "Grappled hindrar framför allt förflyttning. Shove används typiskt för att göra målet prone eller flytta det. Exakta storleksgränser och flyktregler beror på vilken version ni använder."
    },
    "rule-movement-speed": {
      summary: "Din Speed är hur långt du normalt kan förflytta dig på din tur utan Dash.",
      quickReference: "Du kan dela upp rörelsen runt dina handlingar. Går du 10 ft, attackerar och går 20 ft till har du använt 30 ft totalt.\n\nHar du flera movement modes, till exempel walking och flying, behöver du hålla koll på hur mycket total rörelse som redan gått åt enligt reglerna för den versionen.",
      details: "Rörelse är inte en handling. Dash ökar däremot hur mycket rörelse du har tillgänglig under turen. Difficult terrain, crawling och liknande gör varje fot dyrare."
    },
    "rule-difficult-terrain": {
      summary: "Difficult terrain äter rörelse dubbelt så fort.",
      quickReference: "Varje **1 ft** du rör dig i difficult terrain kostar normalt **1 extra ft** movement. På ett 5-ft-rutnät betyder det i praktiken att en ruta kostar 10 ft.\n\nFlera källor gör normalt inte samma mark ännu dyrare om ingen regel uttryckligen säger det.",
      details: "Bråte, tät undervegetation, djup snö, hala stenfält och trånga folksamlingar är klassiska exempel. Frågan är inte om platsen ser jobbig ut, utan om den faktiskt gör det svårare att ta sig fram."
    },
    "rule-climbing-swimming-crawling": {
      summary: "Klättra, simma och krypa kostar normalt extra rörelse om du inte har rätt särskild Speed.",
      quickReference: "Utan climb- eller swim Speed kostar klättring och simning normalt extra movement. Crawling kostar också extra. Difficult terrain kan lägga på ytterligare kostnad.\n\nSL kan kräva Athletics när miljön faktiskt gör uppgiften osäker.",
      details: "En stege i lugn takt behöver sällan ett slag. En algtäckt klippvägg i storm gör det betydligt oftare. Låt tärningen komma in när miljön skapar verklig risk, inte bara för att någon råkar förflytta sig vertikalt."
    },
    "rule-jumping": {
      summary: "Styrka avgör hur långt eller högt du normalt kan hoppa. Ansatsen spelar stor roll.",
      quickReference: "I 2014-reglerna är ett running long jump normalt upp till ditt **Strength score i feet** efter 10 ft ansats; utan ansats halveras sträckan. Ett running high jump är normalt **3 + Strength modifier i feet**.\n\n2024 har omarbetade detaljer kring Jump och checks, så använd kampanjens version när exakta siffror spelar roll.",
      details: "Du måste fortfarande ha movement kvar för sträckan du hoppar. Hoppet ger alltså inte gratis extra förflyttning bara för att fysiken för ett ögonblick blev mer dramatisk."
    },
    "rule-falling": {
      summary: "Standardfallet: 1d6 bludgeoning per 10 ft, upp till regelns max, och sedan landar man vanligtvis prone.",
      quickReference: "Den klassiska regeln ger normalt **1d6 bludgeoning damage per 10 ft fall**, upp till **20d6**. En varelse som tar skada från fallet landar normalt prone om inget säger annat.\n\nNyare regler har ytterligare detaljer för fallhastighet och landning på andra varelser.",
      details: "För extrema eller ovanliga fall kan det vara värt att slå upp exakt versionsregel i stället för att improvisera vidare från minnesbilden av 'det var väl någon d6 per tio fot'."
    },
    "rule-conditions": {
      summary: "Conditions är färdiga regelpaket. När någon blir prone, restrained eller stunned följer hela paketet med.",
      quickReference: "När en effekt ger en condition behöver du normalt inte uppfinna några extra följder. Läs condition-texten och kombinera den med vad den utlösande effekten redan säger.\n\nFlera conditions kan gälla samtidigt.",
      details: "Det här är en av de bästa sakerna att söka i Compendium mitt under strid. Conditions har många små följder som är lätta att minnas nästan rätt, vilket är den farligaste sortens rätt."
    },
    "rule-prone": {
      summary: "Prone gör dig långsammare att komma iväg och ändrar hur lätt du är att träffa beroende på avstånd.",
      quickReference: "En prone varelse kryper normalt tills den reser sig. Att resa sig kostar vanligtvis **halva Speed**.\n\nAttackslag från inom 5 ft får normalt advantage mot en prone varelse; attacker längre bort får normalt disadvantage.",
      details: "Prone stoppar inte handlingar i sig. Den stora kostnaden är positionering, movement och hur attackerna runt varelsen påverkas."
    },
    "rule-grappled": {
      summary: "Grappled betyder framför allt att din Speed blir 0 tills greppet bryts.",
      quickReference: "En grappled varelses **Speed är 0** och kan inte ökas. Om den som håller fast dig flyttar kan du normalt följa med enligt reglerna för grapple.\n\nFlyktmetoden beror på version och den effekt som skapade greppet.",
      details: "Grappled är inte samma sak som restrained. Ett vanligt grapple ger inte automatiskt disadvantage på attacker eller advantage åt alla som slår på målet."
    },
    "rule-restrained": {
      summary: "Restrained är den elakare kusinen till grappled: Speed 0 och tydliga nackdelar i strid.",
      quickReference: "En restrained varelse har normalt **Speed 0**, får **disadvantage på attacker** och attacker mot den får **advantage**. Den får också normalt disadvantage på DEX-saves.\n\nKontrollera alltid den exakta condition-texten för versionen ni spelar.",
      details: "Eftersom restrained både låser movement och påverkar attacker är det ett betydligt starkare tillstånd än ett vanligt grapple."
    },
    "rule-stunned-incapacitated": {
      summary: "Stunned innehåller incapacitated och lägger dessutom på fler problem. Det är sällan en bra tur att vara den som är stunned.",
      quickReference: "**Incapacitated:** kan normalt inte ta actions eller reactions och kan påverka concentration enligt versionsregeln.\n\n**Stunned:** innehåller incapacitated och brukar dessutom stoppa movement, ge automatiska misslyckanden på vissa saves och ge advantage åt attacker mot varelsen.",
      details: "Eftersom stunned bygger vidare på incapacitated är det lätt att missa en följd om man bara läser ordet 'stunned' som en fristående effekt."
    },
    "rule-unconscious": {
      summary: "Unconscious slår i princip av varelsen tills något väcker den eller situationen förändras.",
      quickReference: "En unconscious varelse är normalt incapacitated, kan inte röra sig eller tala och är omedveten om omgivningen. Den tappar saker den håller i och faller prone.\n\nAttacker mot den får normalt advantage, och träffar från mycket nära håll kan bli crits enligt regelversionen.",
      details: "Vid 0 HP kombineras unconscious med reglerna för death saves och stabilisering. Att vara magiskt sövd och att ligga på 0 HP kan alltså dela condition men ha olika sätt att upphöra."
    },
    "rule-invisible": {
      summary: "Invisible handlar både om att inte synas och om vilka mekaniska fördelar det faktiskt ger i den version ni spelar.",
      quickReference: "En invisible varelse går inte att se utan särskild förmåga eller magi. Reglerna påverkar också typiskt attacker till och från varelsen.\n\n**Obs:** formuleringen och samspelet med att fienden ändå vet var du är skiljer sig mellan 2014 och 2024.",
      details: "Invisible betyder inte automatiskt att ingen vet vilken ruta du står i. Att vara unseen och att vara hidden är närbesläktat men inte alltid samma sak."
    },
    "rule-exhaustion": {
      summary: "Exhaustion är ett annat stort 2014/2024-skifte. Blanda inte tabellerna, de spelar helt olika.",
      quickReference: "**2014:** sex nivåer med olika, allt värre effekter, från disadvantage på ability checks till Speed 0 och död.\n\n**2024:** varje nivå ger normalt **−2 på D20 Tests** och **−5 ft Speed**. Nivå 6 dödar.\n\nEn Long Rest tar normalt bort en nivå när övriga krav är uppfyllda.",
      details: "Om någon säger 'jag har två exhaustion' behöver du alltså veta vilken edition kampanjen använder innan siffran betyder något mekaniskt."
    },
    "rule-rests": {
      summary: "Short Rest och Long Rest är spelets stora återställningsknappar, men exakt vad de återställer beror på version och klass.",
      quickReference: "**Short Rest:** ungefär en timmes lugn vila i 2014-reglerna; många resurser och Hit Dice-interaktioner använder den.\n\n**Long Rest:** ungefär åtta timmars längre vila och återställer betydligt mer.\n\n2024 justerar flera detaljer kring avbrott, återställning och vilka resurser som kommer tillbaka.",
      details: "Klassförmågan eller resursen i fråga är alltid bästa källan för exakt återhämtning. 'Kommer tillbaka på short rest' är viktigare än en generell minnesregel om vad en short rest brukar göra."
    },
    "rule-vision-light": {
      summary: "Bright light, dim light, darkness och olika senses avgör vem som faktiskt kan se vad.",
      quickReference: "**Bright light:** normal syn.\n**Dim light:** räknas typiskt som lightly obscured och kan ge disadvantage på synbaserad Perception.\n**Darkness:** räknas typiskt som heavily obscured för vanlig syn.\n\nDarkvision låter dig se i mörker inom angiven räckvidd enligt dess regel, men betyder inte automatiskt perfekt färgseende eller att dim light försvinner som problem i alla versioner.",
      details: "När stealth blir rörigt, börja med den enkla frågan: kan observatören faktiskt se varelsen från sin plats med sina senses och ljusförhållandena som råder?"
    },
    "rule-object-interaction": {
      summary: "Småsaker under turen är ofta gratis tills de inte är det. 2024 kallar den mer formella varianten Utilize.",
      quickReference: "**2014:** du får normalt en mindre föremålsinteraktion som del av din movement eller action, till exempel dra ett vapen eller öppna en olåst dörr. Mer omfattande användning kan kräva **Use an Object**.\n\n**2024:** **Utilize** är den tydligare handlingen för många objektinteraktioner.",
      details: "Gränsen handlar om hur mycket handling och uppmärksamhet saken rimligen kräver. Att släppa något är enkelt. Att gräva fram rätt flaska ur en fullpackad ryggsäck mitt under en ogre-attack är en annan historia."
    }
  });

  patches("feature", {
    "feature-rage": {
      summary: "Barbarens stora röda knapp: mer tryck i närstrid och mycket svårare att slå sönder.",
      description: "Rage är barbarens kärnläge i strid. När det är aktivt får du de offensiva och defensiva bonusar som din version av klassen anger. Hur många Rage du har, hur länge de varar och vad som krävs för att hålla dem igång skiljer sig mellan 2014 och 2024."
    },
    "feature-reckless-attack": {
      summary: "Ska du ändå stå längst fram kan du lika gärna göra det med dörren till försvaret på vid gavel.",
      description: "Reckless Attack låter barbaren få advantage på kvalificerande attacker genom att samtidigt göra sig lättare att träffa. Vinsten kommer nu, räkningen kommer när fienderna börjar slå tillbaka. Exakta villkor beror på regelversion."
    },
    "feature-bardic-inspiration": {
      summary: "Ge någon en extra tärning för ögonblicket där ett nästan lyckat slag behöver bli ett faktiskt lyckat slag.",
      description: "Bardic Inspiration är bardens klassiska stöddresurs. Du ger en annan varelse en inspirationstärning som kan användas på de slag som klassen tillåter. Tärningsstorlek, timing och hur användningarna återställs förbättras med nivå och skiljer sig något mellan editionerna."
    },
    "feature-channel-divinity": {
      summary: "Klassens gudomliga batteri för de effekter som är för stora för att bara vara ännu en vanlig handling.",
      description: "Channel Divinity är en begränsad resurs som driver flera cleric- och paladinförmågor. Vilka effekter du kan välja mellan kommer från klass och subclass; antal användningar och återhämtning beror på nivå och regelversion."
    },
    "feature-lay-on-hands": {
      summary: "Paladinens egna HP-reserv, främst till för att få folk tillbaka på benen.",
      description: "Lay on Hands ger paladinen en separat pott läkande kraft. Du spenderar så mycket av den som behövs på giltiga mål, och vissa versioner låter den även ta hand om särskilda tillstånd eller gifter."
    },
    "feature-cunning-action": {
      summary: "Roguen får göra det jobbiga rogue-saker som bonus action och blir därför svår att hålla fast.",
      description: "Cunning Action flyttar viktiga rörelse- och positionsverktyg till bonus action. Exakt vilka val du får beror på version, men poängen är densamma: roguen kan attackera och ändå ha gott om utrymme kvar för att försvinna, flytta eller ta sig ur vägen."
    },
    "feature-uncanny-dodge": {
      summary: "Använd reaktionen för att göra en träff betydligt mindre imponerande än angriparen hade hoppats.",
      description: "Uncanny Dodge låter en rogue minska skadan från en kvalificerande attack som träffar. Det kostar din reaction, så du får välja om just den här träffen är värd att spendera den på."
    },
    "feature-metamagic": {
      summary: "Sorcererns sätt att säga 'ja, spellens regel säger så, men min version gör inte riktigt det'.",
      description: "Metamagic låter sorcerern spendera Sorcery Points för att förändra hur en spell fungerar när den kastas. Exempel är räckvidd, antal mål, timing eller andra delar av spellens leverans. Vilka alternativ du känner till och vad de kostar beror på din version av klassen."
    },
    "feature-pact-magic": {
      summary: "Få spell slots, hög nivå på dem och betydligt snabbare återhämtning än vanliga casters.",
      description: "Pact Magic följer en egen progression. Warlocks har få slots men de ligger på den nivå klassen anger och kommer tillbaka enligt warlockens viloregler. Därför spelar rytmen mellan encounters mycket större roll för warlock än för de flesta andra casters."
    },
    "feature-eldritch-invocations": {
      summary: "Warlockens modulhylla: små och stora uppgraderingar som bygger om hur klassen faktiskt fungerar.",
      description: "Eldritch Invocations är valbara warlock-förmågor med egna krav. De kan förstärka spells, ge permanenta trick, låsa upp ny magi eller förändra en central klassförmåga. Det är en stor del av varför två warlocks kan kännas väldigt olika vid bordet."
    },
    "feature-fighting-style": {
      summary: "En liten men återkommande bonus som säger vilken sorts strid du faktiskt tränat på.",
      description: "Fighting Style är ett val av stridsspecialisering. Tillgängliga stilar och exakt effekt beror på klass, nivå, källa och edition. Välj den som stöttar det du tänker göra ofta, inte den som råkar se snyggast ut isolerad."
    },
    "feature-extra-attack": {
      summary: "När du tar Attack-handlingen får du göra fler attacker. Enkel regel, enorm skillnad.",
      description: "Extra Attack ökar hur många attacker du gör inom samma Attack action. Olika versioner av Extra Attack staplas normalt inte med varandra; använd det bästa antal attacker som dina relevanta förmågor ger om inget uttryckligen säger annat."
    },
    "feature-dwarven-resilience": {
      summary: "Dvärgar är exceptionellt dåliga kunder för den som byggt hela planen kring gift.",
      description: "Dwarven Resilience ger dvärgen bättre motstånd mot gift. Exakt form beror på vilken version av dvärgen kampanjen använder, men kärnan är advantage på relevanta saves och/eller resistance mot poison damage."
    },
    "feature-halfling-lucky": {
      summary: "En naturlig etta behöver inte få sista ordet bara för att du är halfling.",
      description: "Halflingens Lucky låter kvalificerande naturliga 1:or slås om. Det är en separat släktförmåga från featet Lucky, trots att namnet gör sitt bästa för att skapa helt onödig förvirring."
    },
    "feature-brave": {
      summary: "Halflings är svårare än de ser ut att skrämma vettet ur.",
      description: "Brave förbättrar halflingens försvar mot frightened. Exakt formulering beror på den släktversion ni använder, men funktionen är densamma: rädsla får jobba hårdare."
    },
    "feature-halfling-nimbleness": {
      summary: "Ta dig genom luckor i stridsfältet som större varelser helt enkelt inte har plats för.",
      description: "Halfling Nimbleness gör det lättare att röra sig genom utrymmen som upptas av större varelser. Kontrollera editionen för exakt vilka storlekar och begränsningar som gäller."
    },
    "feature-gnome-cunning": {
      summary: "Gnomer har ovanligt bra mentalt immunförsvar mot magiskt trams.",
      description: "Gnome Cunning ger bättre försvar mot vissa magiska effekter som angriper sinnet. Vilka saves som omfattas skiljer sig mellan regelversionerna, så använd texten för den gnomversion kampanjen kör."
    },
    "feature-breath-weapon": {
      summary: "Dragonborn gör det mest dragonborniga möjliga och andas ett element över problemet.",
      description: "Breath Weapon är en area attack kopplad till ditt drakoniska arv. Form, damage, save, scaling, antal användningar och hur den passar in i action economy skiljer sig tydligt mellan olika 5e-versioner."
    },
    "feature-hellish-resistance": {
      summary: "Tieflingens klassiska svar på eld: mindre panik, mindre skada.",
      description: "Hellish Resistance ger resistance mot fire damage i de klassiska tiefling-reglerna. Nyare tiefling-varianter kan koppla resistance till vald lineage i stället."
    },
    "feature-infernal-legacy": {
      summary: "Ett litet paket med medfödd infernalisk magi som växer med nivån.",
      description: "Infernal Legacy är den äldre tiefling-modellen för innate spellcasting. Vilken cantrip och vilka spells du får, vilken ability de använder och när de återställs beror på tiefling-versionen."
    },
    "feature-relentless-endurance": {
      summary: "När något borde sänka dig till 0 HP får du en gång bestämma att nej, faktiskt inte.",
      description: "Relentless Endurance låter den klassiska half-orc stanna på 1 HP i stället för att falla till 0 när villkoren är uppfyllda. Begränsningen på användningar gör att timingen spelar roll."
    },
    "feature-savage-attacks": {
      summary: "Crits med rätt närstridsvapen får ännu en vapenskadetärning ovanpå resten.",
      description: "Savage Attacks förstärker kvalificerande crits för den klassiska half-orc. Det är en släktförmåga och inte samma sak som featet Savage Attacker, trots namnen som ser ut att ha skapats under en kaffepaus."
    }
  });

  patches("race", {
    "race-grung": {
      summary: "Små färgstarka grodfolk med klätterfötter, giftig hud och ett väldigt konkret behov av vatten.",
      traits: "Klättrar naturligt, är immuna mot poison och kan använda sin giftiga hud offensivt. Hoppar långt för sin storlek, men måste regelbundet blöta ned sig för att må bra."
    },
    "race-kender": {
      summary: "Små vandrare från Krynn med nästan patologisk nyfikenhet och ett märkligt lugn inför saker andra rimligen borde vara rädda för.",
      traits: "Svåra att skrämma, kvicka och socialt oförskämda på ett sätt som ibland råkar vara användbart. Har dessutom en talang för att råka ha en liten praktisk sak precis när den behövs."
    },
    "race-locathah": {
      summary: "Fiskfolk byggda för livet under ytan, robusta och helt hemma i vatten men inte särskilt imponerade av långa torra perioder.",
      traits: "Bra simmare med naturliga försvar och vattenanpassad fysiologi. De kan fungera på land, men behöver återvända till vatten regelbundet."
    },
    "race-verdan": {
      summary: "Goblinoida varelser omformade av kaotisk magi, med föränderliga kroppar och en lätt telepatisk känslighet.",
      traits: "Fysiologin fortsätter förändras genom livet. Verdan har begränsad telepati, stark social intuition och återhämtar sig ovanligt snabbt."
    },
    "subspecies-genasi-air": {
      summary: "Air Genasi bär elementär luft i kroppen: rastlösa, lätta på foten och aldrig riktigt långt från vinden.",
      traits: "Har luft- och stormpräglade egenskaper plus medfödd magi kring vind, rörelse eller blixt. Exakt paket beror på vilken genasi-version kampanjen använder."
    },
    "subspecies-genasi-earth": {
      summary: "Earth Genasi känns som om sten och tyngdkraft fått en humanoid kropp och ganska bestämda åsikter om att stå kvar.",
      traits: "Tåliga, stadiga och bekväma i besvärlig terräng, med medfödd magi kopplad till sten, jord och skydd."
    },
    "subspecies-genasi-fire": {
      summary: "Fire Genasi har hetta i blodet, mörkersyn och en naturlig tendens att lösa problem med mer eld.",
      traits: "Fire resistance, darkvision och medfödd fire magic som utvecklas när rollpersonen stiger i nivå."
    },
    "subspecies-genasi-water": {
      summary: "Water Genasi är lika hemma under ytan som ovanför den och bär tidvatten, strömmar och hav i sin magi.",
      traits: "Kan leva och röra sig väl i vatten, har resistance mot acid och får medfödd water magic."
    },
    "subspecies-shifter-beasthide": {
      summary: "Beasthide är shiftern som blir svårare att slå sönder när djursidan kommer fram.",
      traits: "När du Shiftar får du framför allt extra tålighet och bättre fysiskt försvar. Det är den defensiva shifter-linjen."
    },
    "subspecies-shifter-longtooth": {
      summary: "Longtooth låter rovdjurssidan vinna diskussionen och ger dig ett betydligt mer relevant bett.",
      traits: "Shifting ger ett naturligt bite och gör linjen klart mer offensiv i närstrid."
    },
    "subspecies-shifter-swiftstride": {
      summary: "Swiftstride handlar om fart, avstånd och att stå exakt där fienden helst inte vill att du står.",
      traits: "Shifting ökar rörligheten och ger verktyg för snabb ompositionering. Bra för den som vill styra avståndet i strid."
    },
    "subspecies-shifter-wildhunt": {
      summary: "Wildhunt skruvar upp sinnena: spårning, vaksamhet och ett nästan irriterande bra grepp om vad som händer nära dig.",
      traits: "Shifting förstärker uppmärksamheten och gör det svårare för närliggande fiender att dra nytta av att överraska eller få övertag på dig."
    },
    "subspecies-tiefling-abyssal": {
      summary: "Abyssal Tieflings bär avgrundens giftiga och frätande arv snarare än den klassiska helveteselden.",
      traits: "Får poison resistance och medfödd magi med mer toxisk, frätande eller försvagande karaktär."
    },
    "subspecies-tiefling-chthonic": {
      summary: "Chthonic Tieflings är knutna till död, skuggor och de betydligt kallare delarna av de lägre planen.",
      traits: "Har necrotic resistance och medfödd magi som lutar åt mörker, dränering och dödstema."
    },
    "subspecies-tiefling-infernal": {
      summary: "Den klassiska tieflingen: helvetespräglad, eldtålig och utrustad med medfödd infernalisk magi.",
      traits: "Fire resistance och innate spells från ett infernaliskt arv. Exakt spellpaket beror på version."
    },
    "subspecies-aasimar-protector": {
      summary: "Den äldre Protector-varianten låter den himmelska sidan slå ut i strålande vingar när det verkligen gäller.",
      traits: "En äldre aasimar-transformation med fokus på flygförmåga och radiant damage."
    },
    "subspecies-aasimar-scourge": {
      summary: "Scourge Aasimar släpper ut sin himmelska kraft som en farlig aura som inte är särskilt hänsynsfull mot den egna kroppen heller.",
      traits: "En äldre aasimar-transformation som skapar en närstridsaura av radiant energy och samtidigt belastar bäraren."
    },
    "subspecies-aasimar-fallen": {
      summary: "Fallen Aasimar bär en mörkare himmelsk rest, med en uppenbarelse som är byggd mer för skräck än tröst.",
      traits: "En äldre aasimar-transformation med fokus på fear och necrotic damage."
    }
  });

  patches("spell", {
    "spell-acid-splash": {
      summary: "Kasta syra på ett mål, eller på två som står tillräckligt nära varandra.",
      description: "Målet gör ett räddningsslag med Smidighet. Vid misslyckande tar det acid damage. Cantripens skada ökar på högre rollpersonsnivåer."
    },
    "spell-chill-touch": {
      summary: "En nekrotisk attack på avstånd som också stänger av healing en kort stund.",
      description: "Gör en spell attack på avstånd. På träff tar målet necrotic damage och kan inte återfå HP förrän början av din nästa tur. I den klassiska versionen får undead dessutom svårare att träffa dig under samma tid."
    },
    "spell-eldritch-blast": {
      summary: "Warlockens signaturcantrip: force damage på avstånd och fler strålar när du stiger i nivå.",
      description: "Gör en separat spell attack för varje stråle. Varje träff gör force damage, och strålarna får riktas mot samma mål eller delas upp mellan flera."
    },
    "spell-fire-bolt": {
      summary: "En rak eldattack på avstånd som även kan sätta obevakade brännbara saker i brand.",
      description: "Gör en spell attack på avstånd. På träff tar målet fire damage. Ett obevakat brännbart föremål som träffas kan börja brinna."
    },
    "spell-guidance": {
      summary: "Ge någon en liten d4-knuff på ett ability check när det verkligen behövs.",
      description: "En villig varelse du rör får lägga till 1d4 på ett kvalificerande ability check innan effekten tar slut. Exakt timing och concentration skiljer sig mellan regelversioner."
    },
    "spell-light": {
      summary: "Få ett föremål att lysa. Ibland är den bästa cantripen helt enkelt att faktiskt kunna se grottan.",
      description: "Ett föremål du rör börjar avge bright light och dim light enligt spellens räckvidder. Om en ovillig varelse bär föremålet kan ett save krävas."
    },
    "spell-mage-hand": {
      summary: "En spektral hand för allt du vill peta på utan att gå hela vägen dit själv.",
      description: "Handen kan flytta och hantera lätta föremål, öppna olåsta behållare och hämta eller stoppa undan mindre saker. Den kan inte attackera och har en tydlig viktgräns."
    },
    "spell-mending": {
      summary: "Laga en mindre spricka eller reva utan att behöva släpa fram verktygslådan.",
      description: "Reparerar en begränsad fysisk skada på ett föremål. Den kan laga själva föremålet men återställer inte automatiskt förlorad magi i ett magiskt föremål."
    },
    "spell-message": {
      summary: "Viska ett kort meddelande på avstånd och låt mottagaren svara lika diskret.",
      description: "Bara målet hör meddelandet. Spellen kan ta sig runt hörn men blockeras av vissa material, tillräckligt tjocka barriärer och effekter som stoppar ljud eller magi."
    },
    "spell-minor-illusion": {
      summary: "Skapa ett litet ljud eller en stilla bild. Enorm potential, noll respekt för DM:s förberedelsetid.",
      description: "Skapa antingen ett ljud eller en bild inom spellens begränsningar. Fysisk interaktion kan avslöja illusionen direkt, och en lyckad Undersökning kan genomskåda den enligt regeln."
    },
    "spell-prestidigitation": {
      summary: "Små vardagliga magitrick: lukt, smak, rengöring, färg, värme, kyla och allmänt wizard-pynt.",
      description: "Skapa en liten ofarlig sensorisk effekt, tänd eller släck något litet, rengör eller smutsa ned, värm, kyl eller smaksätt material eller skapa en mindre tillfällig markering eller pryl."
    },
    "spell-ray-of-frost": {
      summary: "En kall spell attack på avstånd som både skadar och bromsar målet.",
      description: "På träff tar målet cold damage och dess Speed minskar fram till början av din nästa tur enligt spellens version."
    },
    "spell-sacred-flame": {
      summary: "Radiant damage via ett DEX-save i stället för ett attackslag.",
      description: "Målet gör ett räddningsslag med Smidighet. Vid misslyckande tar det radiant damage. I den klassiska versionen hjälper cover normalt inte på samma sätt mot detta save."
    },
    "spell-shocking-grasp": {
      summary: "En elektrisk spell attack i närstrid som kan stänga av målets reactions.",
      description: "På träff tar målet lightning damage och kan inte använda reactions under den tid spellen anger. Den klassiska versionen ger dessutom advantage mot mål i metallrustning."
    },
    "spell-thaumaturgy": {
      summary: "Små gudomliga specialeffekter: större röst, darrningar, märkliga lågor och dörrar med alldeles för bra timing.",
      description: "Skapa mindre övernaturliga effekter som förstärkt röst, vibrationer, förändrade lågor, ljud, rörelse i olåsta dörrar eller fönster och andra små tecken på gudomlig dramatik."
    },
    "spell-toll-the-dead": {
      summary: "Ett Wisdom-save mot necrotic damage som blir värre om målet redan är skadat.",
      description: "Målet gör ett räddningsslag med Visdom. Vid misslyckande tar det necrotic damage, normalt med större skadetärning om det redan saknar HP."
    },
    "spell-vicious-mockery": {
      summary: "Förolämpa någon så effektivt att det blir psychic damage och sämre träffsäkerhet.",
      description: "Målet måste kunna höra dig och gör ett räddningsslag med Visdom. Vid misslyckande tar det psychic damage och får disadvantage på nästa kvalificerande attackslag."
    },
    "spell-bless": {
      summary: "Upp till tre varelser får 1d4 på attacker och saves så länge du håller concentration.",
      description: "Välj upp till tre giltiga mål. Under spellens varaktighet får de lägga till 1d4 på attackslag och räddningsslag. Högre spell slots kan öka antalet mål."
    },
    "spell-burning-hands": {
      summary: "En kort kon eld rakt framför dig. DEX-save för halva skadan.",
      description: "Varelser i konen gör ett räddningsslag med Smidighet. De tar full fire damage vid misslyckande och halva vid framgång."
    },
    "spell-charm-person": {
      summary: "Försök få en humanoid att tillfälligt se dig som betydligt trevligare än situationen motiverar.",
      description: "Målet gör ett Wisdom-save, ofta med advantage om ni redan slåss. Vid misslyckande blir det charmed. När effekten tar slut vet målet normalt att du använde magi på det."
    },
    "spell-cure-wounds": {
      summary: "Healing på beröring. Gå fram till den trasiga personen och gör den mindre trasig.",
      description: "En varelse du rör återfår HP enligt spellens tärning plus din spellcasting-modifikation. Högre spell slots ger fler läkningstärningar."
    },
    "spell-detect-magic": {
      summary: "Känn om det finns magi i närheten och undersök sedan var den faktiskt sitter.",
      description: "Du känner närvaron av magi inom räckvidden. Med ytterligare fokus kan du se en aura kring synliga magiska varelser eller föremål och ofta få en ledtråd om vilken skola magin tillhör."
    },
    "spell-disguise-self": {
      summary: "Byt synligt utseende, kläder och utrustning med illusion. Fysiken bakom illusionen bryr sig inte.",
      description: "Du skapar en kosmetisk illusion över ditt utseende. Den klarar inte fysisk kontakt som motsäger bilden, och en lyckad Undersökning mot ditt spell save DC kan genomskåda den."
    },
    "spell-faerie-fire": {
      summary: "Måla upp mål med magiskt ljus så att de blir mycket enklare att träffa.",
      description: "Varelser i området gör ett DEX-save. De som misslyckas omges av färgat ljus, kan inte dra nytta av invisibility och blir lättare att träffa under spellens varaktighet."
    },
    "spell-fog-cloud": {
      summary: "Fyll ett område med tät dimma och gör allas line of sight till någon annans problem.",
      description: "En stor sfär fylls med dimma och blir heavily obscured. Kraftig vind kan skingra molnet. Högre spell slots ökar storleken."
    },
    "spell-guiding-bolt": {
      summary: "En hård radiant attack på avstånd som samtidigt målar upp målet för nästa angripare.",
      description: "Gör en spell attack på avstånd. På träff tar målet radiant damage och nästa kvalificerande attack mot det får advantage inom spellens tidsgräns."
    },
    "spell-healing-word": {
      summary: "Mindre healing på avstånd som bonus action. En av de klassiska 'nej, du får inte dö än'-knapparna.",
      description: "En varelse du kan se återfår HP enligt spellens läkningstärning plus din spellcasting-modifikation. Högre slots ger mer healing. Reglerna för fler spells samma tur beror på edition."
    },
    "spell-hex": {
      summary: "Märk ett mål med en förbannelse: mer necrotic damage från dina attacker och sämre checks med en vald ability.",
      description: "Som bonus action förbannar du ett mål. Dina attacker mot det gör extra necrotic damage, och målet får disadvantage på ability checks med den grundegenskap du väljer. När målet faller kan Hex normalt flyttas vidare enligt regeln."
    },
    "spell-hunter-s-mark": {
      summary: "Markera ett byte för extra skada och betydligt mindre 'vart fan tog den vägen?'.",
      description: "Dina kvalificerande träffar mot det markerade målet gör extra damage, och du får bättre chans att hitta eller spåra det. När målet faller kan markeringen normalt flyttas enligt spellens regel."
    },
    "spell-mage-armor": {
      summary: "Ge en orustad varelse AC 13 + DEX-modifikation utan att behöva hitta faktisk rustning.",
      description: "En villig orustad varelse får spellens AC-formel under varaktigheten. Effekten slutar om målet tar på sig riktig rustning."
    },
    "spell-magic-missile": {
      summary: "Tre små force-projektiler som inte tänker delta i diskussionen om attackslag.",
      description: "Skapa tre projektiler som träffar automatiskt och gör 1d4+1 force damage var. De kan samlas på ett mål eller delas upp. Högre spell slots skapar fler projektiler."
    },
    "spell-shield": {
      summary: "+5 AC som reaction när du verkligen inte håller med om att attacken träffade.",
      description: "När en attack träffar dig kan du kasta Shield som reaction. Du får +5 AC under spellens varaktighet, även mot den utlösande attacken, och Magic Missile blockeras."
    },
    "spell-sleep": {
      summary: "Söv de varelser i området som har lägst HP först. Den klassiska versionen använder ingen vanlig save.",
      description: "Rulla spellens HP-pott och börja med varelsen som har lägst nuvarande HP. Fortsätt uppåt tills potten inte räcker till nästa mål. Immuniteter och creature type kan göra vissa mål helt ointresserade av planen."
    },
    "spell-speak-with-animals": {
      summary: "Prata med beasts och få svar som fortfarande är begränsade av att den andra parten är en häst, kråka eller grävling.",
      description: "Du kan förstå och kommunicera med beasts. De kan berätta sådant de rimligen har uppfattat eller förstår om platsen, närliggande varelser och nyliga händelser."
    }
  });

  patches("npc", {
    "sw-runara": {
      ideals: "Fred mellan chromatic och metallic dragons, och tron att även den som formats av våld kan välja något annat.",
      bonds: "Dragon's Rest, människorna och kobolderna som bor där, och öns kvarvarande drakmagi.",
      flaws: "Håller sin sanna natur hemlig för länge och ingriper helst först när situationen redan blivit riktigt illa.",
      summary: "Leder Dragon's Rest och är i hemlighet en vuxen bronsdrake. För hundra år sedan dödade hon en blå drake på ön och byggde sedan klostret som en plats där våld inte skulle behöva vara svaret på allt.",
      backstory: "För hundra år sedan försökte Runara få en blå drake att sluta utnyttja öns destruktiva magi. Han vägrade, och hon dödade honom. Efteråt var hon så trött på vad våld gjorde med både vinnare och förlorare att hon grundade Dragon's Rest och började söka ett annat sätt att leva."
    },
    "sw-tarak": {
      summary: "Sköter klostrets trädgårdar och vet mer om örter än de flesta apotek. Förr blandade han gift åt Gilded Gallows, något tatueringarna fortfarande kan avslöja för den som känner igen dem.",
      backstory: "Tarak arbetade tidigare som giftblandare åt Gilded Gallows. På Dragon's Rest fick han chansen att bygga ett helt annat liv och valde odling, läkande och svamp framför människor som betalade för att någon skulle dö.",
      notes: "Uppdrag: han behöver Heart Cap Mushrooms från Seagrow Caves, men vägen dit blockeras av en Spore Servant Octopus.\n\nOm gruppen nämner Tarak eller hans gåva till myconiderna får de fördel på det relevanta Karisma-slaget."
    },
    "sw-myla": {
      summary: "Bevingad kobold, uppfinnare och klostrets lilla utrustningsbutik i samma person. Hennes bröder Mek och Minn har lämnat Dragon's Rest för att följa Sparkrender, vilket hon tar betydligt hårdare än hon vill visa.",
      backstory: "Myla experimenterar med mekanik och alkemi och säljer vanlig äventyrsutrustning vid klostret. Efter en stirge-attack fungerar vingarna dåligt. Laylee hjälper henne i verkstaden och har, av fullt rimliga skäl, blivit förbjuden att använda alchemical fire."
    },
    "sw-sinensa": {
      summary: "Myconidernas sovereign. Hon ligger sjuk efter att ha undersökt kristallgrottan B6, där Sharruths grav fortfarande läcker eldplanets inflytande in i grottorna.",
      backstory: "Sinensa ledde kolonin tills hon undersökte den svavelstinkande kristallgrottan vid Sharruths grav. Kontakten med Elemental Plane of Fire försvagade henne och lämnade kolonin utan sin vanliga ledare när gruppen anländer."
    },
    "sw-aidron": {
      summary: "En ung bronsdrake som sitter fången i observatoriet och råkar vara den viktigaste ingrediensen i Sparkrenders ritual.",
      backstory: "Aidron lämnade Runaras undervisning och mötte Sparkrender vid observatoriet. När han vägrade ansluta sig blev han övermannad och fängslad. Sparkrender tänker offra honom för att kunna binda de döda drakarnas andar till sig."
    }
  });

  patches("monster", {
    "sw-sparkrender": {
      traits: "Final boss vid Clifftop Observatory. Sparkrender är mager för en wyrmling, med glittrande blå fjäll och små blixtar runt horn och nos.\n\nNär King-Killer Star står rätt tänker han binda de döda drakarnas andar till sig genom att offra Aidron. Han har ett dussin eller fler kobolder omkring sig, kan absolut prata innan striden börjar och är precis så högmodig som en ung blå drake borde vara.",
      actions: "**Bite:** melee weapon attack, +5 to hit, reach 5 ft, ett mål. Träff: 8 (1d10+3) piercing + 3 (1d6) lightning.\n\n**Lightning Breath (Recharge 5–6):** 30-ft line, 5 ft bred. DEX save DC 12; 22 (4d10) lightning vid misslyckande, halva vid framgång.",
      notes: "Blå dragon wyrmling och barnbarn till draken Runara dödade för hundra år sedan. Justera HP eller antal stödvarelser efter gruppstorlek vid behov.\n\nAidron hålls fången i tornet och är tänkt som offer i ritualen."
    },
    "sw-zombie": {
      actions: "**Slam:** melee weapon attack, +3 to hit, reach 5 ft, ett mål. Träff: 4 (1d6+1) bludgeoning.",
      notes: "De drunknade sjömännen på stranden i början av äventyret. Undead Fortitude gör dem irriterande sega om gruppen inte använder radiant damage eller crits.\n\nPå Compass Rose finns två i C4 och en i C8. När förbannelsen i lasten bryts slutar nya zombies resa sig."
    }
  });
})();
