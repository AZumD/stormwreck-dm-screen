(function () {
  "use strict";

  const api = window.CatalogueContentI18n;
  if (!api) return;

  // Complete Swedish fallback for built-in seed content. Curated records loaded
  // elsewhere always win; this layer mainly prevents later catalogue growth
  // waves from ending up as aliases-only records with an empty `sv: {}`.
  const MONSTER_NAMES = {
    "Goblin":"Goblin","Kobold":"Kobold","Bandit":"Bandit","Bandit Captain":"Banditkapten",
    "Cultist":"Kultist","Cult Fanatic":"Kultfanatiker","Skeleton":"Skelett","Wolf":"Varg",
    "Dire Wolf":"Skräckvarg","Giant Rat":"Jätteråtta","Swarm of Rats":"Råttsvärm","Giant Spider":"Jättespindel",
    "Giant Eagle":"Jätteörn","Giant Toad":"Jättepadda","Animated Armor":"Animerad rustning","Flying Sword":"Flygande svärd",
    "Gelatinous Cube":"Gelatinös kub","Harpy":"Harpya","Giant Scorpion":"Jätteskorpion","Specter":"Vålnad",
    "Wight":"Gast","Troll":"Troll","Owlbear":"Ugglebjörn","Ghoul":"Likätare","Ghost":"Spöke",
    "Shadow":"Skugga","Mummy":"Mumie","Cockatrice":"Kokatris","Griffon":"Grip","Rust Monster":"Rostmonster",
    "Hell Hound":"Helveteshund","Fire Elemental":"Eldelementar","Air Elemental":"Luftelementar",
    "Earth Elemental":"Jordelementar","Water Elemental":"Vattenelementar","Orc":"Orch","Ogre":"Oger",
    "Commoner":"Vanlig person","Guard":"Vakt","Acolyte":"Akolyt","Noble":"Adlig","Tribal Warrior":"Stamkrigare",
    "Scout":"Spejare","Thug":"Ligist","Spy":"Spion","Berserker":"Bärsärk","Priest":"Präst","Druid":"Druid",
    "Knight":"Riddare","Veteran":"Veteran","Gladiator":"Gladiator","Mage":"Magiker","Assassin":"Lönnmördare",
    "Archmage":"Ärkemagiker","Young Black Dragon":"Ung svart drake","Young White Dragon":"Ung vit drake",
    "Young Green Dragon":"Ung grön drake","Young Red Dragon":"Ung röd drake","Young Blue Dragon":"Ung blå drake"
  };

  const ITEM_NAMES = {
    "Club":"Klubba","Dagger":"Dolk","Greatclub":"Stor klubba","Handaxe":"Handyxa","Javelin":"Kastspjut",
    "Light Hammer":"Lätt hammare","Mace":"Stridsklubba","Quarterstaff":"Stav","Sickle":"Skära","Spear":"Spjut",
    "Light Crossbow":"Lätt armborst","Dart":"Kastpil","Shortbow":"Kortbåge","Sling":"Slunga","Battleaxe":"Stridsyxa",
    "Flail":"Stridsgissel","Glaive":"Glef","Greataxe":"Stor stridsyxa","Greatsword":"Tvåhandssvärd","Halberd":"Hillebard",
    "Lance":"Lans","Longsword":"Långsvärd","Maul":"Storslägga","Morningstar":"Morgonstjärna","Pike":"Pik",
    "Rapier":"Rapir","Scimitar":"Kroksabel","Shortsword":"Kortsvärd","Trident":"Treudd","War Pick":"Stridshacka",
    "Warhammer":"Stridshammare","Whip":"Piska","Blowgun":"Blåsrör","Hand Crossbow":"Handarmborst",
    "Heavy Crossbow":"Tungt armborst","Longbow":"Långbåge","Net":"Nät","Padded Armor":"Vadderad rustning",
    "Leather Armor":"Läderrustning","Studded Leather":"Nitat läder","Hide Armor":"Hudrustning","Chain Shirt":"Ringbrynjeskjorta",
    "Scale Mail":"Fjällpansar","Breastplate":"Bröstplåt","Half Plate":"Halvplåt","Ring Mail":"Ringpansar",
    "Chain Mail":"Ringbrynja","Splint Armor":"Skenrustning","Plate Armor":"Plåtrustning","Shield":"Sköld",
    "Backpack":"Ryggsäck","Bedroll":"Sängrulle","Bell":"Klocka","Blanket":"Filt","Block and Tackle":"Talja",
    "Bottle, Glass":"Glasflaska","Bucket":"Hink","Candle":"Ljus","Chain (10 ft.)":"Kedja (10 fot)","Chalk (1 piece)":"Krita (1 bit)",
    "Chest":"Kista","Climber's Kit":"Klätterkit","Component Pouch":"Komponentpåse","Crowbar":"Kofot","Fishing Tackle":"Fiskeutrustning",
    "Hammer":"Hammare","Hammer, Sledge":"Slägga","Holy Water (flask)":"Vigvatten (flaska)","Hourglass":"Timglas",
    "Hunting Trap":"Jaktfälla","Ink Pen":"Bläckpenna","Ladder (10 ft.)":"Stege (10 fot)","Lamp":"Lampa",
    "Lantern, Bullseye":"Riktad lykta","Lantern, Hooded":"Skärmad lykta","Lock":"Lås","Magnifying Glass":"Förstoringsglas",
    "Mess Kit":"Kokkärlskit","Mirror, Steel":"Stålspegel","Oil (flask)":"Olja (flaska)","Paper (one sheet)":"Papper (ett ark)",
    "Parchment (one sheet)":"Pergament (ett ark)","Perfume (vial)":"Parfym (flaska)","Pick, Miner's":"Gruvhacka","Piton":"Klätterkil",
    "Pole (10 ft.)":"Stång (10 fot)","Pot, Iron":"Järngryta","Pouch":"Påse","Quiver":"Koger","Rations (1 day)":"Proviant (1 dag)",
    "Robes":"Dräkt","Rope, Hempen (50 ft.)":"Hamprep (50 fot)","Rope, Silk (50 ft.)":"Sidenrep (50 fot)","Sack":"Säck",
    "Scale, Merchant's":"Handelsvåg","Sealing Wax":"Sigillvax","Shovel":"Spade","Signal Whistle":"Signalvisselpipa","Signet Ring":"Sigillring",
    "Soap":"Tvål","Spellbook":"Spellbook","Iron Spikes (10)":"Järnspikar (10)","Tent, Two-Person":"Tvåmannatält",
    "Tinderbox":"Tänddon","Torch":"Fackla","Vial":"Flaska","Waterskin":"Vattenskinn","Whetstone":"Brynsten",
    "Brewer's Supplies":"Bryggarverktyg","Calligrapher's Supplies":"Kalligrafverktyg","Carpenter's Tools":"Snickarverktyg",
    "Cobbler's Tools":"Skomakarverktyg","Cook's Utensils":"Köksredskap","Glassblower's Tools":"Glasblåsarverktyg",
    "Jeweler's Tools":"Juvelerarverktyg","Leatherworker's Tools":"Läderarbetarverktyg","Mason's Tools":"Murarverktyg",
    "Painter's Supplies":"Målarverktyg","Potter's Tools":"Krukmakarverktyg","Smith's Tools":"Smedsverktyg",
    "Tinker's Tools":"Reparatörsverktyg","Weaver's Tools":"Vävarverktyg","Woodcarver's Tools":"Träsnidarverktyg",
    "Disguise Kit":"Förklädnadskit","Forgery Kit":"Förfalskningskit","Poisoner's Kit":"Giftblandarkit",
    "Bagpipes":"Säckpipa","Drum":"Trumma","Dulcimer":"Hackbräde","Flute":"Flöjt","Lute":"Luta","Lyre":"Lyra","Pan Flute":"Panflöjt","Shawm":"Skalmeja","Viol":"Gamba",
    "Bit and Bridle":"Bett och träns","Feed (1 day)":"Djurfoder (1 dag)","Saddlebags":"Sadelväskor","Carriage":"Vagn","Cart":"Kärra","Chariot":"Stridsvagn","Sled":"Släde","Wagon":"Lastvagn",
    "Adamantine Armor":"Adamantinrustning","Amulet of Health":"Hälsoamulett","Bag of Holding":"Bottenlös väska",
    "Boots of Speed":"Snabbhetsstövlar","Bracers of Defense":"Försvarsarmskenor","Brooch of Shielding":"Skyddsbrosch",
    "Broom of Flying":"Flygande kvast","Cloak of Elvenkind":"Alvmantel","Cloak of Protection":"Skyddsmantel",
    "Decanter of Endless Water":"Karaff med oändligt vatten","Deck of Illusions":"Illusionskortlek","Driftglobe":"Svävklot",
    "Dust of Disappearance":"Försvinnandestoft","Elven Chain":"Alvringbrynja","Eyes of Charming":"Charmglasögon",
    "Gauntlets of Ogre Power":"Ogerkraftens stridshandskar","Gloves of Missile Snaring":"Projektilfångarhandskar","Goggles of Night":"Nattglasögon",
    "Hat of Disguise":"Förklädnadshatt","Headband of Intellect":"Intelligenspannband","Helm of Telepathy":"Telepatihjälm",
    "Immovable Rod":"Orubblig stav","Lantern of Revealing":"Avslöjandets lykta","Necklace of Adaptation":"Anpassningshalsband",
    "Pearl of Power":"Kraftpärla","Ring of Protection":"Skyddsring","Ring of Swimming":"Simring","Ring of Water Walking":"Vattengångsring",
    "Robe of Useful Items":"Dräkt med användbara föremål","Rope of Climbing":"Klätterrep","Sentinel Shield":"Vaktpostsköld",
    "Slippers of Spider Climbing":"Spindelklättringstofflor","Stone of Good Luck":"Tursten","Wand of Magic Detection":"Stav för magidetektering",
    "Wand of Magic Missiles":"Magic Missile-stav","Winged Boots":"Bevingade stövlar","Alchemy Jug":"Alkemikanna",
    "Chime of Opening":"Öppningsklockspel","Circlet of Blasting":"Sprängdiadem","Portable Hole":"Portabelt hål","Quiver of Ehlonna":"Ehlonnas koger",
    "Sending Stones":"Sändarstenar","Potion of Healing":"Läkedryck","Potion of Greater Healing":"Stark läkedryck",
    "Potion of Superior Healing":"Mycket stark läkedryck","Potion of Supreme Healing":"Överlägsen läkedryck","Potion of Climbing":"Klätterdryck",
    "Potion of Water Breathing":"Vattenandningsdryck","Potion of Invisibility":"Osynlighetsdryck","Potion of Flying":"Flygdryck","Potion of Speed":"Snabbhetsdryck",
    "Oil of Slipperiness":"Halkolja","Keoghtom's Ointment":"Keoghtoms salva","Dagger of Venom":"Giftdolk","Dragon Slayer":"Drakdödare",
    "Flame Tongue":"Flammtunga","Frost Brand":"Frostmärke","Giant Slayer":"Jättedödare","Javelin of Lightning":"Blixtkastspjut",
    "Mace of Terror":"Skräckklubba","Sun Blade":"Solklinga","Weapon, +1":"Vapen, +1","Weapon, +2":"Vapen, +2","Weapon, +3":"Vapen, +3",
    "Armor, +1":"Rustning, +1","Armor, +2":"Rustning, +2","Armor, +3":"Rustning, +3","Shield, +1":"Sköld, +1","Shield, +2":"Sköld, +2","Shield, +3":"Sköld, +3"
  };

  const CATEGORY={"Weapon":"Vapen","Armor & Shield":"Rustning & sköld","Ammunition":"Ammunition","Adventuring Gear":"Äventyrsutrustning","Tool & Kit":"Verktyg & kit","Consumable":"Förbrukningsvara","Ingredient & Material":"Ingrediens & material","Wondrous Item":"Magiskt föremål","Treasure & Valuable":"Skatt & värdesak","Document & Lore":"Dokument & lore","Container & Storage":"Behållare & förvaring","Trade Good":"Handelsvara","Trinket & Curio":"Kuriosa","Junk & Salvage":"Skrot & bärgods","Hazard & Trap":"Fara & fälla","Collection & Hoard":"Utrustningspaket","Other":"Övrigt"};
  const RARITY={"Common":"Vanlig","Uncommon":"Ovanlig","Rare":"Sällsynt","Very Rare":"Mycket sällsynt","Legendary":"Legendarisk","Artifact":"Artefakt","Unique":"Unik","Varies":"Varierar"};
  const SIZE={"Tiny":"Mycket liten","Small":"Liten","Medium":"Medelstor","Large":"Stor","Huge":"Enorm","Gargantuan":"Kolossal"};
  const CREATURE={"Beast":"Best","Construct":"Konstruktion","Dragon":"Drake","Elemental":"Elementar","Fey":"Feväsen","Giant":"Jätte","Monstrosity":"Monstrositet","Ooze":"Slemvarelse","Plant":"Växtvarelse","Undead":"Odöd"};
  const SKILLS={"Animal Handling":"Hantera djur","Athletics":"Atletik","Deception":"Bluffa","History":"Historia","Insight":"Insikt","Intimidation":"Skrämsel","Investigation":"Undersökning","Medicine":"Läkekonst","Nature":"Natur","Performance":"Uppträda","Persuasion":"Övertala","Sleight of Hand":"Fingerfärdighet","Stealth":"Smyga","Survival":"Överlevnad"};

  const STOCK=new Map([
    ["Condensed SRD 5.1 quick reference, reformatted for table use. See docs/OPEN-CONTENT.md for attribution.","Komprimerad SRD 5.1-snabbreferens, omarbetad för spelbordet. Se docs/OPEN-CONTENT.md för attribution."],
    ["Condensed SRD 5.1 NPC quick reference, reformatted for table use. See docs/OPEN-CONTENT.md for attribution.","Komprimerad SRD 5.1-snabbreferens för SLP, omarbetad för spelbordet. Se docs/OPEN-CONTENT.md för attribution."],
    ["Condensed SRD 5.1 table reference. See docs/OPEN-CONTENT.md for attribution.","Komprimerad SRD 5.1-referens för spelbordet. Se docs/OPEN-CONTENT.md för attribution."],
    ["Condensed SRD 5.1 equipment reference. See docs/OPEN-CONTENT.md for attribution.","Komprimerad SRD 5.1-utrustningsreferens. Se docs/OPEN-CONTENT.md för attribution."],
    ["SRD 5.1 treasure/trade reference. See docs/OPEN-CONTENT.md for attribution.","SRD 5.1-referens för skatter och handelsvaror. Se docs/OPEN-CONTENT.md för attribution."],
    ["Standard adventuring equipment from the SRD.","Standardutrustning för äventyrare från SRD."],
    ["Trade or treasure reference from the SRD.","Handels- eller skattreferens från SRD."],
    ["Common trade good with a standard reference value.","Vanlig handelsvara med ett standardiserat referensvärde."],
    ["Magic item from the SRD 5.1 reference set.","Magiskt föremål från SRD 5.1."],
    ["Keen Smell — advantage on scent-based Perception checks.","Skarpt luktsinne — fördel på Perception-slag som bygger på lukt."],
    ["Keen Sight — advantage on sight-based Perception checks.","Skarp syn — fördel på Perception-slag som bygger på syn."],
    ["Keen Hearing — advantage on hearing-based Perception checks.","Skarp hörsel — fördel på Perception-slag som bygger på hörsel."],
    ["Pack Tactics — advantage on an attack when an active ally is adjacent to the target.","Flocktaktik — fördel på attackslag när en aktiv allierad står intill målet."],
    ["Pack Tactics — advantage when an active ally is beside the target.","Flocktaktik — fördel på attackslag när en aktiv allierad står intill målet."],
    ["Amphibious — breathes air and water.","Amfibisk — kan andas både luft och vatten."],
    ["Water Breathing — breathes only underwater.","Vattenandning — kan bara andas under vatten."],
    ["Spider Climb — moves on walls and ceilings without checks.","Spindelklättring — kan röra sig på väggar och i tak utan slag."],
    ["Web Sense — knows the location of creatures touching the same web.","Nätkänsla — vet var varelser som rör vid samma nät befinner sig."],
    ["Web Walker — ignores web movement restrictions.","Nätvandrare — ignorerar nätens begränsningar för förflyttning."],
    ["Parry — add 2 AC against one visible melee attack that would hit.","Parera — lägg till 2 AC mot en synlig närstridsattack som annars skulle träffa."],
    ["Parry — add 3 AC against one visible melee attack that would hit.","Parera — lägg till 3 AC mot en synlig närstridsattack som annars skulle träffa."],
    ["Capacity: 1 cubic foot / 30 lb. of gear.","Kapacitet: 1 kubikfot / 30 lb. utrustning."],
    ["Holds up to 20 arrows.","Rymmer upp till 20 pilar."],
    ["Holds up to 20 crossbow bolts.","Rymmer upp till 20 armborstlod."],
    ["Viewed objects are magnified to roughly twice their apparent size.","Föremål som betraktas ser ungefär dubbelt så stora ut."],
    ["A pulley set that gives mechanical advantage when hoisting heavy loads.","En talja som ger mekanisk fördel när tunga laster hissas."],
    ["A sturdy iron chain suitable for securing loads or restraints.","En robust järnkedja för att säkra last eller hålla fast någon."],
    ["A blank spellbook suitable for a wizard's recorded spells.","En tom spellbook avsedd för en wizards nedskrivna spells."],
    ["Drink to regain 2d4 + 2 HP.","Drick för att återfå 2d4 + 2 HP."],
    ["Drink to regain 4d4 + 4 HP.","Drick för att återfå 4d4 + 4 HP."],
    ["Drink to regain 8d4 + 8 HP.","Drick för att återfå 8d4 + 8 HP."],
    ["Drink to regain 10d4 + 20 HP.","Drick för att återfå 10d4 + 20 HP."]
  ]);

  const ITEM_TYPES={"Simple melee":"Simple melee-vapen","Simple ranged":"Simple ranged-vapen","Martial melee":"Martial melee-vapen","Martial ranged":"Martial ranged-vapen","Light armor":"Lätt rustning","Medium armor":"Medeltung rustning","Heavy armor":"Tung rustning","Shield":"Sköld","Wondrous item":"Magiskt föremål","Magic item":"Magiskt föremål","Artisan's tools":"Hantverksverktyg","Musical instrument":"Musikinstrument","Arcane focus":"Arcane focus","Druidic focus":"Druidiskt fokus","Holy symbol":"Helig symbol","Trade good":"Handelsvara","Gemstone":"Ädelsten","Equipment pack":"Utrustningspaket","Land vehicle":"Landfordon","Potion":"Dryck","Wand":"Trollstav"};

  const GEMS={azurite:"azurit",agate:"agat",quartz:"kvarts",hematite:"hematit",malachite:"malakit",obsidian:"obsidian",turquoise:"turkos",bloodstone:"blodsten",carnelian:"karneol",chalcedony:"kalcedon",chrysoprase:"krysopras",citrine:"citrin",jasper:"jaspis",moonstone:"månsten",onyx:"onyx",zircon:"zirkon",amber:"bärnsten",amethyst:"ametist",coral:"korall",garnet:"granat",jade:"jade",pearl:"pärla",spinel:"spinell",tourmaline:"turmalin",alexandrite:"alexandrit",aquamarine:"akvamarin",peridot:"peridot",topaz:"topas",opal:"opal",sapphire:"safir",emerald:"smaragd",ruby:"rubin",diamond:"diamant",jacinth:"hyacint"};

  function cap(s){s=String(s||"").trim();return s?s[0].toLocaleUpperCase("sv-SE")+s.slice(1):s;}
  function existingAlias(entry,current){const en=String(entry.name||"").toLocaleLowerCase("sv-SE");return (current.aliases||[]).find(a=>String(a).trim()&&String(a).toLocaleLowerCase("sv-SE")!==en)||"";}
  function monsterName(entry,current){return MONSTER_NAMES[entry.name]||cap(existingAlias(entry,current))||entry.name;}
  function itemName(name){
    if(ITEM_NAMES[name])return ITEM_NAMES[name];
    let s=String(name||"");
    const phrases=[["Arrows","Pilar"],["Crossbow Bolts","Armborstlod"],["Sling Bullets","Slungkulor"],["Blowgun Needles","Blåsrörsnålar"],["Black Sapphire","Svart safir"],["Blue Sapphire","Blå safir"],["Yellow Sapphire","Gul safir"],["Star Sapphire","Stjärnsafir"],["Star Ruby","Stjärnrubin"],["Black Pearl","Svart pärla"],["Blue Spinel","Blå spinell"],["Black Opal","Svart opal"],["Fire Opal","Eldopal"],["Blue Quartz","Blå kvarts"],["Banded Agate","Bandad agat"],["Eye Agate","Ögonagat"],["Moss Agate","Mossagat"],["Tiger Eye","Tigeröga"]];
    for(const [a,b] of phrases)if(s===a||s.startsWith(a+" ("))return b+s.slice(a.length);
    s=s.replace(/\b[A-Za-z]+\b/g,w=>GEMS[w.toLowerCase()]||w);
    return cap(s);
  }
  function skills(s){let out=String(s||"");for(const [a,b] of Object.entries(SKILLS).sort((x,y)=>y[0].length-x[0].length))out=out.split(a).join(b);return out;}
  function creatureType(s){return String(s||"").replace(/^([A-Za-z]+)(.*)$/,(m,h,t)=>(CREATURE[h]||h)+t.replace(/\(any\)/i,"(valfri)"));}

  function commonText(s){
    let t=skills(String(s||""));
    if(STOCK.has(t))return STOCK.get(t);
    t=t
      .replace(/\bPassive Perception\b/gi,"passiv Perception")
      .replace(/\bAny one language\b/g,"Valfritt språk").replace(/\bAny two languages\b/g,"Valfria två språk").replace(/\bAny four languages\b/g,"Valfria fyra språk")
      .replace(/\bKeen Hearing and Smell\b/g,"Skarp hörsel och lukt").replace(/\bKeen Hearing and Sight\b/g,"Skarp hörsel och syn").replace(/\bKeen Smell\b/g,"Skarpt luktsinne").replace(/\bKeen Sight\b/g,"Skarp syn")
      .replace(/\bPack Tactics\b/g,"Flocktaktik").replace(/\bSpider Climb\b/g,"Spindelklättring").replace(/\bWeb Sense\b/g,"Nätkänsla").replace(/\bWeb Walker\b/g,"Nätvandrare")
      .replace(/\bMultiattack — two melee attacks\./gi,"Multiattack — två närstridsattacker.").replace(/\bMultiattack — three melee attacks or two ranged attacks\./gi,"Multiattack — tre närstridsattacker eller två distansattacker.")
      .replace(/\badvantage on scent-based Perception checks\b/gi,"fördel på Perception-slag som bygger på lukt").replace(/\badvantage on sight-based Perception checks\b/gi,"fördel på Perception-slag som bygger på syn").replace(/\badvantage on hearing-based Perception checks\b/gi,"fördel på Perception-slag som bygger på hörsel")
      .replace(/\badvantage on an attack when an active ally is adjacent to the target\b/gi,"fördel på attackslag när en aktiv allierad står intill målet").replace(/\badvantage when an active ally is beside the target\b/gi,"fördel på attackslag när en aktiv allierad står intill målet")
      .replace(/\badvantage on saving throws against being frightened\b/gi,"fördel på saves mot frightened").replace(/\badvantage on saving throws against being charmed or frightened\b/gi,"fördel på saves mot charmed eller frightened")
      .replace(/\bas a bonus action\b/gi,"som bonushandling").replace(/\bonce per turn\b/gi,"en gång per tur")
      .replace(/\bmust pass DC (\d+) (STR|DEX|CON|INT|WIS|CHA) save or fall prone\b/gi,"måste klara ett $2-save med DC $1 eller bli prone")
      .replace(/\bmust pass DC (\d+) (STR|DEX|CON|INT|WIS|CHA) or fall prone\b/gi,"måste klara ett $2-save med DC $1 eller bli prone")
      .replace(/\btarget is grappled and restrained \(escape DC (\d+)\)/gi,"målet blir grappled och restrained (escape DC $1)").replace(/\btarget is grappled \(escape DC (\d+)\)/gi,"målet blir grappled (escape DC $1)")
      .replace(/\bbreathes air and water\b/gi,"kan andas både luft och vatten").replace(/\bbreathes only underwater\b/gi,"kan bara andas under vatten")
      .replace(/\bwithout checks\b/gi,"utan slag").replace(/\bcan Disengage or Hide as a bonus action\b/gi,"kan använda Disengage eller Hide som bonushandling")
      .replace(/\b(\+\d+) to hit, range ([^;]+);/gi,"$1 att träffa, räckvidd $2;").replace(/\b(\+\d+) to hit, reach ([^;]+);/gi,"$1 att träffa, räckvidd $2;").replace(/\b(\+\d+) to hit;/gi,"$1 att träffa;")
      .replace(/\b(\d+) ft\.?\b/gi,"$1 fot").replace(/\bclimb (\d+) fot/gi,"klättra $1 fot").replace(/\bfly (\d+) fot/gi,"flyg $1 fot").replace(/\bswim (\d+) fot/gi,"simma $1 fot").replace(/\bburrow (\d+) fot/gi,"gräv $1 fot")
      .replace(/\bfor 1 hour\b/gi,"i 1 timme").replace(/\bfor 1 minute\b/gi,"i 1 minut").replace(/\bfor 8 hours\b/gi,"i 8 timmar")
      .replace(/\bCapacity:/g,"Kapacitet:").replace(/\bHolds up to\b/g,"Rymmer upp till")
      .replace(/\bdisadvantage on Stealth\b/gi,"nackdel på Smyga").replace(/\bDEX modifier\b/g,"DEX-modifikation").replace(/\bmaximum \+2\b/gi,"max +2")
      .replace(/\bFinesse\b/g,"Finesse").replace(/\blight\b/g,"lätt").replace(/\bheavy\b/g,"tung").replace(/\bthrown\b/g,"kast").replace(/\bloading\b/g,"laddning").replace(/\btwo-handed\b/g,"tvåhands").replace(/\bversatile\b/g,"mångsidig")
      .replace(/\bStandard simple melee weapon from the SRD equipment list\./gi,"Standardvapen för enkel närstrid från SRD:s utrustningslista.")
      .replace(/\bStandard simple ranged weapon from the SRD equipment list\./gi,"Standardvapen för enkel distansstrid från SRD:s utrustningslista.")
      .replace(/\bStandard martial melee weapon from the SRD equipment list\./gi,"Martial-närstridsvapen från SRD:s utrustningslista.")
      .replace(/\bStandard martial ranged weapon from the SRD equipment list\./gi,"Martial-distansvapen från SRD:s utrustningslista.")
      .replace(/\bStandard (light|medium|heavy) armor from the SRD equipment list\./gi,(m,a)=>`Standard ${a==="light"?"lätt":a==="medium"?"medeltung":"tung"} rustning från SRD:s utrustningslista.`)
      .replace(/\b(\d[\d,]*) gp gemstone from the SRD treasure tables\./gi,"$1 gp-ädelsten från SRD:s skattabeller.");
    return t;
  }

  function fallbackMonster(e,current){
    const sv={name:monsterName(e,current)};
    for(const f of ["speed","savingThrows","skills","damageVulnerabilities","damageResistances","damageImmunities","conditionImmunities","senses","languages","traits","actions","bonusActions","reactions","legendaryActions","notes"])if(e[f]!=null&&String(e[f]).trim())sv[f]=commonText(e[f]);
    if(e.size)sv.size=SIZE[e.size]||e.size;if(e.creatureType)sv.creatureType=creatureType(e.creatureType);if(e.alignment)sv.alignment=e.alignment==="Unaligned"?"Ingen alignment":e.alignment.replace(/^Any alignment$/,"Valfri alignment");
    return sv;
  }
  function fallbackItem(e){
    const sv={name:itemName(e.name)};if(e.category)sv.category=CATEGORY[e.category]||e.category;if(e.itemType)sv.itemType=ITEM_TYPES[e.itemType]||commonText(e.itemType);if(e.rarity)sv.rarity=RARITY[e.rarity]||e.rarity;
    for(const f of ["description","properties","notes"])if(e[f]!=null&&String(e[f]).trim())sv[f]=commonText(e[f]);return sv;
  }
  function merge(type,e,fallback){const current=api.getRecord?.(type,e.id)||{};api.register(type,{[e.id]:{en:current.en||{},aliases:[...new Set([...(current.aliases||[]),e.name,fallback.name].filter(Boolean))],sv:{...fallback,...(current.sv||{})}}});}

  (window.CatalogueSeeds?.monster||[]).forEach(e=>e?.id&&merge("monster",e,fallbackMonster(e,api.getRecord?.("monster",e.id)||{})));
  (window.CatalogueSeeds?.item||[]).forEach(e=>e?.id&&merge("item",e,fallbackItem(e)));

  window.CatalogueContentSvMonsterItems={installed:true,monsterName,itemName,commonText,fallbackMonster,fallbackItem};
})();