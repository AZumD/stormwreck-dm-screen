(function (root, factory) {
  "use strict";

  const entries = factory();
  if (typeof module === "object" && module.exports) module.exports = entries;
  if (root) {
    root.CatalogueSeeds = root.CatalogueSeeds || {};
    root.CatalogueSeeds.rule = entries;
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const BOTH = "2014 / 2024";

  return [
    {
      id: "rule-ability-scores",
      name: "Ability Scores",
      category: "Abilities",
      rulesets: BOTH,
      summary: "The six abilities, their modifiers, and what each score is normally used to resolve.",
      quickReference: "**Modifier:** floor((score − 10) / 2).\n\n**Six abilities:** Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma.\n\nA check uses an ability modifier, plus proficiency when a relevant skill, tool, or other proficiency applies.",
      details: "The ability score is the underlying rating. Most moment-to-moment rolls use the ability modifier rather than the score itself. Saving throws also use an ability modifier, and attack rolls use the ability specified by the attack or feature.",
      tags: ["abilities", "modifier", "str", "dex", "con", "int", "wis", "cha", "checks", "saves"],
      relatedRefs: [
        "@rule:rule-ability-checks|Ability Checks",
        "@rule:rule-saving-throws|Saving Throws",
        "@rule:rule-difficulty-classes|Difficulty Classes"
      ]
    },
    {
      id: "rule-strength",
      name: "Strength",
      category: "Abilities",
      rulesets: BOTH,
      summary: "Physical power: lifting, forcing, climbing, jumping, grappling, and many melee attacks.",
      quickReference: "**Common checks:** forcing doors, breaking restraints, climbing difficult surfaces, swimming against hazards, jumping beyond normal limits.\n\n**Skill:** Athletics.\n\n**Combat:** commonly powers melee weapon attacks and damage.\n\n**Carrying:** Strength also feeds carrying, lifting, pushing, and dragging limits.",
      details: "Call for Strength when raw physical force is the deciding factor. Athletics is the usual proficiency when technique matters, but not every Strength check is Athletics.",
      tags: ["strength", "str", "athletics", "lift", "carry", "push", "drag", "jump", "grapple", "melee"],
      relatedRefs: ["@rule:rule-grappling-shoving|Grappling & Shoving", "@rule:rule-jumping|Jumping"]
    },
    {
      id: "rule-dexterity",
      name: "Dexterity",
      category: "Abilities",
      rulesets: BOTH,
      summary: "Agility, reflexes, balance, stealth, fine control, initiative, and many ranged or finesse attacks.",
      quickReference: "**Skills:** Acrobatics, Sleight of Hand, Stealth.\n\n**Combat:** commonly used for ranged weapon attacks and finesse weapons.\n\n**Defense:** often contributes to Armor Class.\n\n**Initiative:** normally uses Dexterity.",
      details: "Use Dexterity when speed, precision, balance, or avoiding notice matters more than force. Dexterity saving throws commonly resist hazards that can be dodged or escaped quickly.",
      tags: ["dexterity", "dex", "acrobatics", "sleight of hand", "stealth", "initiative", "armor class", "ac", "ranged", "finesse"],
      relatedRefs: ["@rule:rule-initiative|Initiative", "@rule:rule-cover|Cover"]
    },
    {
      id: "rule-constitution",
      name: "Constitution",
      category: "Abilities",
      rulesets: BOTH,
      summary: "Health and endurance: hit points, stamina, concentration, poison, disease, and surviving bodily stress.",
      quickReference: "**Hit points:** Constitution modifier contributes to HP gained at each level.\n\n**Saving throws:** frequently resist poison, disease, exhaustion-like stress, and effects that attack bodily resilience.\n\n**Concentration:** taking damage while concentrating normally calls for a Constitution save: DC 10 or half the damage taken, whichever is higher.\n\nThere is no standard Constitution-based skill.",
      details: "Constitution checks are relatively uncommon because endurance is often handled by saves instead. Use a Constitution check when a character is testing sustained physical stamina and no specific saving throw is being forced by an effect.",
      tags: ["constitution", "con", "health", "hit points", "hp", "endurance", "stamina", "concentration", "poison", "disease"],
      relatedRefs: [
        "@rule:rule-concentration|Concentration",
        "@rule:rule-saving-throws|Saving Throws",
        "@rule:rule-rests|Short & Long Rests"
      ]
    },
    {
      id: "rule-intelligence",
      name: "Intelligence",
      category: "Abilities",
      rulesets: BOTH,
      summary: "Reasoning, memory, study, deduction, lore, and recalling learned facts.",
      quickReference: "**Skills:** Arcana, History, Investigation, Nature, Religion.\n\nUse Intelligence when the question is what a character knows, remembers, deduces, researches, or understands through learned reasoning.",
      details: "Investigation is typically about drawing conclusions from clues. Perception is about noticing the clue in the first place. That distinction solves a surprising number of table arguments.",
      tags: ["intelligence", "int", "arcana", "history", "investigation", "nature", "religion", "knowledge", "memory", "deduction"],
      relatedRefs: ["@rule:rule-ability-checks|Ability Checks", "@rule:rule-passive-checks|Passive Checks"]
    },
    {
      id: "rule-wisdom",
      name: "Wisdom",
      category: "Abilities",
      rulesets: BOTH,
      summary: "Awareness, intuition, instinct, empathy, survival sense, and reading the immediate world.",
      quickReference: "**Skills:** Animal Handling, Insight, Medicine, Perception, Survival.\n\nPerception notices. Insight reads people. Survival reads environments and tracks. Medicine handles immediate medical assessment and stabilization-type tasks when a rule calls for a check.",
      details: "Wisdom is usually about noticing or intuiting what is already present rather than recalling studied knowledge. Passive Perception is one of the most commonly used passive scores.",
      tags: ["wisdom", "wis", "perception", "insight", "medicine", "survival", "animal handling", "passive perception", "awareness"],
      relatedRefs: ["@rule:rule-passive-checks|Passive Checks", "@rule:rule-vision-light|Vision & Light"]
    },
    {
      id: "rule-charisma",
      name: "Charisma",
      category: "Abilities",
      rulesets: BOTH,
      summary: "Force of personality, confidence, deception, intimidation, performance, and persuasion.",
      quickReference: "**Skills:** Deception, Intimidation, Performance, Persuasion.\n\nUse Charisma when success depends on social presence, projected intent, leadership, lying convincingly, or influencing another creature.",
      details: "Charisma is not simply attractiveness. It represents the strength and effectiveness with which a character projects personality and intent.",
      tags: ["charisma", "cha", "deception", "intimidation", "performance", "persuasion", "social", "influence"],
      relatedRefs: ["@rule:rule-ability-checks|Ability Checks", "@rule:rule-difficulty-classes|Difficulty Classes"]
    },
    {
      id: "rule-d20-tests",
      name: "D20 Tests",
      category: "Core Mechanics",
      rulesets: BOTH,
      summary: "The umbrella idea behind ability checks, saving throws, and attack rolls.",
      quickReference: "Roll a d20, add the relevant ability modifier and any applicable proficiency or other modifiers, then compare the total to a target number such as a DC or Armor Class.",
      details: "The 2024 rules use **D20 Test** as an explicit umbrella term for ability checks, saving throws, and attack rolls. The 2014 rules use the same underlying d20 structure but usually discuss those three roll types separately.",
      editionNotes: "**2014:** ability checks, saving throws, and attack rolls are separate named mechanics.\n\n**2024:** D20 Test is a formal umbrella term used by many rules and effects.",
      tags: ["d20", "d20 test", "checks", "saving throws", "attack rolls", "roll", "modifier"],
      relatedRefs: [
        "@rule:rule-ability-checks|Ability Checks",
        "@rule:rule-saving-throws|Saving Throws",
        "@rule:rule-attack-rolls|Attack Rolls"
      ]
    },
    {
      id: "rule-ability-checks",
      name: "Ability Checks",
      category: "Core Mechanics",
      rulesets: BOTH,
      summary: "Resolve uncertain attempts by rolling d20 + the relevant ability modifier, with proficiency when appropriate.",
      quickReference: "**Formula:** d20 + ability modifier + proficiency bonus if a relevant proficiency applies.\n\nThe DM chooses the ability and DC. A named skill does not replace the ability; it tells you when proficiency can apply.",
      details: "Only roll when both success and failure are meaningfully possible. The DM can pair a proficiency with a different ability when the situation calls for it, such as Strength (Intimidation). Group checks and contests may have additional rules depending on edition and situation.",
      tags: ["ability check", "check", "skill check", "skills", "dc", "proficiency", "test"],
      relatedRefs: ["@rule:rule-difficulty-classes|Difficulty Classes", "@rule:rule-advantage-disadvantage|Advantage & Disadvantage"]
    },
    {
      id: "rule-saving-throws",
      name: "Saving Throws",
      category: "Core Mechanics",
      rulesets: BOTH,
      summary: "Reactive d20 rolls used to resist or reduce harmful effects.",
      quickReference: "**Formula:** d20 + relevant ability modifier + proficiency bonus if proficient in that saving throw.\n\nThe effect tells you which ability to use and what happens on success or failure.",
      details: "A saving throw is usually forced by a spell, hazard, monster ability, environmental effect, or other rule. Characters do not normally choose to make one unless an effect calls for it.",
      tags: ["saving throw", "save", "resist", "dc", "constitution save", "dexterity save", "wisdom save"],
      relatedRefs: ["@rule:rule-d20-tests|D20 Tests", "@rule:rule-concentration|Concentration"]
    },
    {
      id: "rule-advantage-disadvantage",
      name: "Advantage & Disadvantage",
      category: "Core Mechanics",
      rulesets: BOTH,
      summary: "Roll two d20s and keep the higher for advantage or lower for disadvantage.",
      quickReference: "**Advantage:** roll 2d20, use the higher.\n**Disadvantage:** roll 2d20, use the lower.\n\nMultiple sources of the same one do not stack into extra dice. If you have both advantage and disadvantage, they cancel and you roll one d20 regardless of how many sources of each are present.",
      details: "Apply modifiers after choosing which d20 result is used unless a specific rule says otherwise.",
      tags: ["advantage", "disadvantage", "2d20", "roll twice", "cancel"],
      relatedRefs: ["@rule:rule-d20-tests|D20 Tests"]
    },
    {
      id: "rule-proficiency-bonus",
      name: "Proficiency Bonus",
      category: "Core Mechanics",
      rulesets: BOTH,
      summary: "A level-scaled bonus added when a character is proficient with the relevant task, save, attack, tool, or feature.",
      quickReference: "**Character levels 1–4:** +2\n**5–8:** +3\n**9–12:** +4\n**13–16:** +5\n**17–20:** +6\n\nNormally add proficiency only once to a roll unless a rule such as Expertise explicitly modifies it.",
      details: "Many class features and save DCs also use proficiency bonus. Multiclass characters use total character level for the normal proficiency progression.",
      tags: ["proficiency", "proficiency bonus", "pb", "level", "expertise", "save dc"],
      relatedRefs: ["@rule:rule-ability-checks|Ability Checks", "@rule:rule-difficulty-classes|Difficulty Classes"]
    },
    {
      id: "rule-difficulty-classes",
      name: "Difficulty Classes (DCs)",
      category: "Core Mechanics",
      rulesets: BOTH,
      summary: "Target numbers for checks and saves; higher DC means a harder task or effect to resist.",
      quickReference: "Useful benchmark ladder:\n- **5** very easy\n- **10** easy\n- **15** medium\n- **20** hard\n- **25** very hard\n- **30** nearly impossible\n\nFor routine tasks with no meaningful uncertainty, do not roll at all.",
      details: "Set the DC from the task, not from how skilled the character is. Character capability is already represented by modifiers, proficiency, advantage, and features.",
      tags: ["dc", "difficulty class", "easy", "medium", "hard", "check difficulty", "save dc"],
      relatedRefs: ["@rule:rule-ability-checks|Ability Checks", "@rule:rule-saving-throws|Saving Throws"]
    },
    {
      id: "rule-passive-checks",
      name: "Passive Checks",
      category: "Core Mechanics",
      rulesets: BOTH,
      summary: "A no-roll score used for repeated tasks or when the DM wants to resolve awareness without announcing a check.",
      quickReference: "**Typical passive score:** 10 + all modifiers that would normally apply to the check.\n\nA common use is Passive Perception. If advantage or disadvantage is being translated into a passive score under the classic method, use +5 or −5 respectively.",
      details: "Passive scores are useful when rolling would reveal hidden information or when the same check would otherwise be repeated over and over.",
      tags: ["passive", "passive perception", "perception", "10 + modifier", "secret check"],
      relatedRefs: ["@rule:rule-wisdom|Wisdom", "@rule:rule-ability-checks|Ability Checks"]
    },
    {
      id: "rule-initiative",
      name: "Initiative",
      category: "Combat",
      rulesets: BOTH,
      summary: "Determines turn order when combat starts.",
      quickReference: "Normally roll **d20 + Dexterity modifier**, then act from highest result to lowest. Resolve ties using the table's normal tie rule or DM ruling; monsters with identical statistics are often grouped for speed.",
      details: "Initiative establishes an order of turns inside a round. A round represents roughly six seconds of in-world time even though turns are resolved sequentially.",
      tags: ["initiative", "turn order", "combat order", "dexterity", "round", "six seconds"],
      relatedRefs: ["@rule:rule-combat-turn|Combat Turn & Round", "@rule:rule-surprise|Surprise"]
    },
    {
      id: "rule-combat-turn",
      name: "Combat Turn & Round",
      category: "Combat",
      rulesets: BOTH,
      summary: "What a creature can normally do on its turn and how turns fit into a round.",
      quickReference: "On your turn you normally have:\n- **Movement** up to your Speed\n- **One action**\n- **One bonus action** only if a feature or rule gives you something that uses it\n- **One reaction** between the start of your turn and the start of your next turn, when a trigger allows it\n- Ordinary speech and minor object interaction as the situation allows\n\nMovement can be split around actions and attacks.",
      details: "A round is about six seconds. Reactions happen outside your turn when triggered, but you regain your reaction at the start of your turn.",
      tags: ["turn", "round", "action", "bonus action", "reaction", "movement", "six seconds", "combat economy"],
      relatedRefs: ["@rule:rule-actions-in-combat|Actions in Combat", "@rule:rule-movement-speed|Movement & Speed"]
    },
    {
      id: "rule-actions-in-combat",
      name: "Actions in Combat",
      category: "Combat",
      rulesets: BOTH,
      summary: "The standard menu of actions available even when a character sheet does not list a special feature.",
      quickReference: "Common actions include **Attack, Dash, Disengage, Dodge, Help, Hide, Ready, Search**, and using magic or an object when the relevant rule allows it. A class, spell, item, or monster can add other actions.",
      details: "When a player describes something not covered by a named action, adjudicate it as an improvised action or ability check rather than forcing the description into the wrong button-shaped rule.",
      editionNotes: "The 2024 rules formalize some action names differently, including the **Magic** and **Utilize** actions. The basic action-economy idea remains the same.",
      tags: ["actions", "attack", "dash", "disengage", "dodge", "help", "hide", "ready", "search", "magic", "utilize"],
      relatedRefs: ["@rule:rule-dodge-action|Dodge", "@rule:rule-help-action|Help", "@rule:rule-ready-action|Ready"]
    },
    {
      id: "rule-attack-rolls",
      name: "Attack Rolls",
      category: "Combat",
      rulesets: BOTH,
      summary: "Resolve an attack by rolling d20 plus the relevant attack modifier against the target's Armor Class.",
      quickReference: "**Attack:** d20 + ability modifier + proficiency if proficient with the attack.\n\nIf the total equals or exceeds the target's AC, the attack hits.\n\nA natural 20 hits and is normally a critical hit. A natural 1 misses.",
      details: "Melee attacks usually use Strength, ranged attacks usually use Dexterity, and finesse weapons can usually use either Strength or Dexterity. Spell attacks use the spellcasting ability specified by the feature.",
      tags: ["attack roll", "attack", "armor class", "ac", "natural 20", "natural 1", "melee", "ranged", "spell attack"],
      relatedRefs: ["@rule:rule-critical-hits|Critical Hits", "@rule:rule-cover|Cover"]
    },
    {
      id: "rule-critical-hits",
      name: "Critical Hits",
      category: "Combat",
      rulesets: BOTH,
      summary: "A natural 20 on an attack roll normally produces a critical hit and rolls extra damage dice.",
      quickReference: "Roll **all of the attack's damage dice twice**, then add the normal flat modifiers once. Extra dice that are part of the attack's damage are generally doubled too unless their rule says otherwise.",
      details: "Flat bonuses are not doubled. Critical-hit rules apply to attack rolls, not automatically to saving-throw damage.",
      tags: ["critical", "crit", "critical hit", "natural 20", "double dice", "damage dice"],
      relatedRefs: ["@rule:rule-attack-rolls|Attack Rolls"]
    },
    {
      id: "rule-cover",
      name: "Cover",
      category: "Combat",
      rulesets: BOTH,
      summary: "Obstacles between attacker and target can improve Armor Class and Dexterity saving throws.",
      quickReference: "**Half cover:** +2 AC and +2 Dexterity saves.\n**Three-quarters cover:** +5 AC and +5 Dexterity saves.\n**Total cover:** cannot be targeted directly by attacks or effects that require a clear path to the target, though area effects may still reach around cover depending on their rules.",
      details: "Judge cover from the actual line between attacker/effect origin and target. Creatures can provide cover when they physically obstruct that line.",
      tags: ["cover", "half cover", "three quarters cover", "total cover", "+2 ac", "+5 ac", "dexterity save", "line of sight"],
      relatedRefs: ["@rule:rule-attack-rolls|Attack Rolls", "@rule:rule-vision-light|Vision & Light"]
    },
    {
      id: "rule-opportunity-attacks",
      name: "Opportunity Attacks",
      category: "Combat",
      rulesets: BOTH,
      summary: "A reaction attack triggered when an enemy willingly leaves your reach without safely disengaging.",
      quickReference: "When a creature you can threaten leaves your reach using its own movement, you can normally spend your **reaction** to make one melee attack just before it leaves.\n\n**Disengage** prevents opportunity attacks for that movement. Forced movement that does not use the creature's own movement, action, or reaction normally does not provoke.",
      details: "Teleportation does not normally provoke an opportunity attack because the creature does not move through the intervening space.",
      tags: ["opportunity attack", "oa", "reaction", "leaves reach", "disengage", "forced movement", "teleport"],
      relatedRefs: ["@rule:rule-movement-speed|Movement & Speed", "@rule:rule-combat-turn|Combat Turn & Round"]
    },
    {
      id: "rule-ready-action",
      name: "Ready",
      category: "Combat",
      rulesets: BOTH,
      summary: "Prepare an action now and release it later as a reaction when a stated trigger occurs.",
      quickReference: "Choose a **perceivable trigger** and decide what you will do in response. When the trigger occurs, use your reaction to perform the readied response, or ignore the trigger.\n\nReadying a spell has extra requirements and normally requires concentration while you hold the spell.",
      details: "The readied response happens after the trigger finishes unless a specific rule says otherwise. If your reaction is already spent, you cannot release the readied response.",
      tags: ["ready", "readied action", "trigger", "reaction", "hold action", "ready spell", "concentration"],
      relatedRefs: ["@rule:rule-concentration|Concentration", "@rule:rule-combat-turn|Combat Turn & Round"]
    },
    {
      id: "rule-help-action",
      name: "Help",
      category: "Combat",
      rulesets: BOTH,
      summary: "Assist another creature with a task or help set up an attack, usually granting advantage when the requirements are met.",
      quickReference: "For a task, describe how you are meaningfully assisting. For combat assistance, you generally need to be close enough to interfere with or distract the target as the rule requires. The beneficiary gets advantage on the relevant next roll within the rule's timing window.",
      details: "Help is not a magic advantage button. The assisting creature needs to be capable of providing meaningful assistance in the fiction and satisfy any positional requirement.",
      tags: ["help", "assist", "aid", "advantage", "combat help", "working together"],
      relatedRefs: ["@rule:rule-advantage-disadvantage|Advantage & Disadvantage"]
    },
    {
      id: "rule-dodge-action",
      name: "Dodge",
      category: "Combat",
      rulesets: BOTH,
      summary: "Spend your action on defense: harder to hit and better at avoiding many Dexterity-save effects.",
      quickReference: "Until the start of your next turn, attacks against you normally have **disadvantage** if you can see the attacker, and you normally have **advantage on Dexterity saving throws**. The benefit ends if you become incapacitated, and classic rules also end it if your Speed drops to 0.",
      details: "Dodge protects against attack rolls and Dexterity saves, not every kind of harmful effect.",
      tags: ["dodge", "defend", "disadvantage attacks", "dexterity save advantage", "defensive action"],
      relatedRefs: ["@rule:rule-advantage-disadvantage|Advantage & Disadvantage"]
    },
    {
      id: "rule-concentration",
      name: "Concentration",
      category: "Magic",
      rulesets: BOTH,
      summary: "A creature can normally maintain only one concentration effect at a time, and damage can break it.",
      quickReference: "**One at a time.** Starting another concentration effect ends the first.\n\n**Damage:** make a Constitution saving throw for each instance of damage while concentrating. **DC 10 or half the damage taken, whichever is higher.**\n\nBecoming incapacitated or dying ends concentration. Environmental disruption can also call for a Constitution save at the DM's discretion.",
      details: "If several separate damage instances occur, each can require its own concentration save. Concentration is not an action by itself; it is an ongoing requirement attached to the effect.",
      tags: ["concentration", "constitution", "con save", "dc 10", "half damage", "spell", "incapacitated"],
      relatedRefs: ["@rule:rule-constitution|Constitution", "@rule:rule-saving-throws|Saving Throws"]
    },
    {
      id: "rule-death-and-dying",
      name: "Death Saves & Dying",
      category: "Combat",
      rulesets: BOTH,
      summary: "At 0 HP a creature is usually unconscious and dying; player characters normally make death saving throws on their turns.",
      quickReference: "**Death save:** d20, no normal ability modifier. **10+ = success**, **9 or less = failure**.\n\n**3 successes:** stable. **3 failures:** dead.\n**Natural 1:** two failures. **Natural 20:** regain 1 HP.\n\nTaking damage at 0 HP causes a death-save failure; a critical hit causes two. Damage equal to or greater than max HP beyond 0 can cause instant death under the massive-damage rule.",
      details: "Successes and failures reset when the creature becomes stable or regains HP. A stable creature at 0 HP is still unconscious but stops making death saves unless it takes damage and begins dying again.",
      tags: ["death save", "dying", "zero hp", "0 hp", "stable", "unconscious", "natural 20", "natural 1", "instant death"],
      relatedRefs: ["@rule:rule-unconscious|Unconscious", "@rule:rule-rests|Short & Long Rests"]
    },
    {
      id: "rule-surprise",
      name: "Surprise",
      category: "Combat",
      rulesets: "2014 vs 2024",
      summary: "A major edition difference: 2014 uses a surprised state during the first round; 2024 handles surprise through initiative disadvantage.",
      quickReference: "**2014:** a surprised creature cannot move or take an action on its first turn and cannot take reactions until that turn ends.\n\n**2024:** a creature that is surprised when initiative is rolled has **disadvantage on its initiative roll** instead of losing its first turn.",
      details: "Surprise is determined when combat begins from awareness and circumstances, not simply because one side says 'I attack first.' Resolve hidden creatures, awareness, and initiative together.",
      editionNotes: "Do not mix the two surprise procedures accidentally. Pick the rule matching the campaign's ruleset.",
      tags: ["surprise", "surprised", "ambush", "initiative disadvantage", "first round", "2014", "2024"],
      relatedRefs: ["@rule:rule-initiative|Initiative"]
    },
    {
      id: "rule-grappling-shoving",
      name: "Grappling & Shoving",
      category: "Combat",
      rulesets: "2014 vs 2024",
      summary: "Control an adjacent creature by grabbing it or forcing it prone/away; the resolution method changes substantially between editions.",
      quickReference: "**2014 grapple:** replace one attack with a special melee attack; Strength (Athletics) contested by the target's Strength (Athletics) or Dexterity (Acrobatics). Success gives the grappled condition.\n\n**2014 shove:** similar contest; on success push 5 ft or knock prone.\n\n**2024:** Grapple and Shove are options of an **Unarmed Strike**. The target makes a Strength or Dexterity saving throw against a DC based on your Strength and proficiency instead of making an opposed Athletics check.",
      details: "Size limits apply: you normally cannot grapple or shove a creature more than one size larger than you. Moving a grappled creature costs extra movement unless a rule says otherwise.",
      editionNotes: "This is one of the easiest places to accidentally blend 2014 and 2024 mechanics. Use either the opposed-check procedure or the Unarmed Strike/save procedure, not both.",
      tags: ["grapple", "grappling", "shove", "athletics", "acrobatics", "unarmed strike", "prone", "push", "2014", "2024"],
      relatedRefs: ["@rule:rule-grappled|Grappled", "@rule:rule-prone|Prone", "@rule:rule-strength|Strength"]
    },
    {
      id: "rule-movement-speed",
      name: "Movement & Speed",
      category: "Movement",
      rulesets: BOTH,
      summary: "On your turn you can normally move up to your Speed, split before, between, and after actions or attacks.",
      quickReference: "Movement is a pool for the turn. You can break it up around your action and, when making multiple attacks, between individual attacks.\n\nDifferent movement modes such as walking, climbing, swimming, flying, or burrowing interact with the movement you have already spent rather than each granting a completely separate full pool.",
      details: "Standing from prone, difficult terrain, squeezing, climbing, swimming, and dragging a grappled creature can consume movement faster than normal.",
      tags: ["movement", "speed", "move", "walking", "climbing", "swimming", "flying", "split movement"],
      relatedRefs: ["@rule:rule-difficult-terrain|Difficult Terrain", "@rule:rule-climbing-swimming-crawling|Climbing, Swimming & Crawling"]
    },
    {
      id: "rule-difficult-terrain",
      name: "Difficult Terrain",
      category: "Movement",
      rulesets: BOTH,
      summary: "Terrain that is hard to cross costs extra movement.",
      quickReference: "Each **1 foot** moved through difficult terrain normally costs **2 feet of movement**. Multiple sources of difficult terrain do not normally multiply the cost again unless a specific rule says so.",
      details: "Examples include rubble, deep snow, thick undergrowth, steep stairs, crowded spaces, or magical terrain specifically described as difficult.",
      tags: ["difficult terrain", "movement", "half speed", "rubble", "snow", "undergrowth", "terrain"],
      relatedRefs: ["@rule:rule-movement-speed|Movement & Speed"]
    },
    {
      id: "rule-climbing-swimming-crawling",
      name: "Climbing, Swimming & Crawling",
      category: "Movement",
      rulesets: BOTH,
      summary: "Without the appropriate special Speed, these forms of movement normally cost extra movement.",
      quickReference: "A common baseline is **1 extra foot of movement for each foot moved** while climbing, swimming, or crawling. A creature with the matching movement Speed can use that Speed normally.\n\nExceptionally difficult surfaces, currents, or circumstances can also call for an ability check.",
      details: "Climbing a sheer or slippery surface and swimming through rough water are good examples of when the DM may add a Strength (Athletics) check on top of the movement cost.",
      tags: ["climb", "climbing", "swim", "swimming", "crawl", "crawling", "athletics", "movement cost"],
      relatedRefs: ["@rule:rule-strength|Strength", "@rule:rule-movement-speed|Movement & Speed"]
    },
    {
      id: "rule-jumping",
      name: "Jumping",
      category: "Movement",
      rulesets: BOTH,
      summary: "Long and high jumps are primarily based on Strength, with running starts improving distance.",
      quickReference: "**Long jump:** with a 10-ft running start, cover up to your **Strength score in feet**; standing long jump is half that.\n\n**High jump:** with a 10-ft running start, leap **3 + Strength modifier feet** upward; standing high jump is half that.\n\nEach foot jumped still spends a foot of movement.",
      details: "The DM may call for Strength (Athletics) to clear an obstacle, extend a jump beyond the ordinary limit, or handle unusually difficult circumstances. Reaching above the jump height also benefits from the creature's own height and reach.",
      tags: ["jump", "jumping", "long jump", "high jump", "strength", "athletics", "running start"],
      relatedRefs: ["@rule:rule-strength|Strength", "@rule:rule-movement-speed|Movement & Speed"]
    },
    {
      id: "rule-falling",
      name: "Falling",
      category: "Movement",
      rulesets: BOTH,
      summary: "A fall deals bludgeoning damage based on distance, up to a standard cap.",
      quickReference: "At the end of a fall, take **1d6 bludgeoning damage per 10 feet fallen**, to a maximum of **20d6**. A creature that takes falling damage normally lands **prone** unless a rule prevents it.",
      details: "Very long falls, flying creatures, falling onto other creatures, and special environments can introduce additional rules. The basic 1d6-per-10-ft rule is the fast table reference.",
      tags: ["fall", "falling", "fall damage", "1d6", "20d6", "prone", "height"],
      relatedRefs: ["@rule:rule-prone|Prone"]
    },
    {
      id: "rule-squeezing",
      name: "Squeezing",
      category: "Movement",
      rulesets: BOTH,
      summary: "A creature can fit through a space sized for a creature one size smaller, but doing so is slow and dangerous.",
      quickReference: "While squeezing, movement costs extra. The squeezing creature has worse combat positioning: attacks against it are easier and its own attacks and Dexterity saves are hindered under the classic rule.",
      details: "Use squeezing when a creature is forcing itself through a passage intended for a creature one size category smaller. A passage smaller than that may simply be impassable without magic or another special method.",
      tags: ["squeeze", "squeezing", "tight space", "narrow passage", "movement", "size"],
      relatedRefs: ["@rule:rule-movement-speed|Movement & Speed"]
    },
    {
      id: "rule-conditions",
      name: "Conditions",
      category: "Conditions",
      rulesets: BOTH,
      summary: "Named states such as Prone, Restrained, Stunned, Grappled, Invisible, and Unconscious that bundle recurring mechanical effects.",
      quickReference: "Conditions do exactly what their condition text says and can overlap. If several conditions impose the same type of advantage/disadvantage, normal advantage/disadvantage rules still apply rather than stacking extra d20s.",
      details: "When a creature gains a condition, apply the condition itself rather than copying its effects into ad-hoc notes. That makes removal, immunity, and interactions much easier to track.",
      tags: ["condition", "conditions", "status", "prone", "grappled", "restrained", "stunned", "unconscious", "invisible"],
      relatedRefs: [
        "@rule:rule-prone|Prone",
        "@rule:rule-grappled|Grappled",
        "@rule:rule-restrained|Restrained",
        "@rule:rule-stunned-incapacitated|Stunned & Incapacitated"
      ]
    },
    {
      id: "rule-prone",
      name: "Prone",
      category: "Conditions",
      rulesets: BOTH,
      summary: "On the ground: movement is restricted, nearby attackers gain an edge, and distant attackers are hindered.",
      quickReference: "A prone creature normally **crawls** unless it stands. Standing costs **half its Speed**.\n\nThe creature has disadvantage on its own attack rolls. Attacks against it have **advantage within 5 ft** and **disadvantage from farther away**.",
      details: "You cannot stand if you do not have enough movement remaining to pay the standing cost or if your Speed is 0.",
      tags: ["prone", "knocked down", "stand up", "half speed", "crawl", "advantage melee", "disadvantage ranged"],
      relatedRefs: ["@rule:rule-falling|Falling", "@rule:rule-grappling-shoving|Grappling & Shoving"]
    },
    {
      id: "rule-grappled",
      name: "Grappled",
      category: "Conditions",
      rulesets: BOTH,
      summary: "A grapple primarily prevents ordinary movement and lets the grappler drag or reposition the target under the grapple rules.",
      quickReference: "**Core effect:** the grappled creature's Speed becomes 0 while the grapple lasts.\n\nThe grapple usually ends if the grappler is incapacitated or if the creatures are separated beyond the grappler's reach. Escape and dragging procedures differ between editions.",
      details: "Grappled does not automatically mean Restrained. Do not add attack advantage/disadvantage unless another feature or condition supplies it.",
      editionNotes: "**2014:** escaping is normally an action using Athletics or Acrobatics against the grappler's Athletics.\n\n**2024:** the condition and escape procedure are tied to the newer Unarmed Strike/grapple rules and saving-throw DC.",
      tags: ["grappled", "grapple", "speed 0", "escape grapple", "drag", "restrained difference"],
      relatedRefs: ["@rule:rule-grappling-shoving|Grappling & Shoving", "@rule:rule-restrained|Restrained"]
    },
    {
      id: "rule-restrained",
      name: "Restrained",
      category: "Conditions",
      rulesets: BOTH,
      summary: "A stronger movement-lock condition that also shifts attacks and Dexterity saves.",
      quickReference: "A restrained creature's **Speed is 0**. Its attack rolls have **disadvantage**. Attack rolls against it have **advantage**. Its **Dexterity saving throws have disadvantage**.",
      details: "Restrained is substantially harsher than Grappled. A grapple does not imply restraint unless a separate feature specifically says it does.",
      tags: ["restrained", "speed 0", "attack disadvantage", "attacks advantage", "dex save disadvantage", "grappled difference"],
      relatedRefs: ["@rule:rule-grappled|Grappled", "@rule:rule-advantage-disadvantage|Advantage & Disadvantage"]
    },
    {
      id: "rule-stunned-incapacitated",
      name: "Stunned & Incapacitated",
      category: "Conditions",
      rulesets: BOTH,
      summary: "Stunned includes incapacitation plus severe defensive penalties.",
      quickReference: "**Incapacitated:** cannot take actions or reactions.\n\n**Stunned:** incapacitated, movement is severely limited/stopped by the condition, speech is impaired, attacks against the creature have advantage, and the creature automatically fails Strength and Dexterity saving throws under the classic condition.",
      details: "Many other conditions and effects include Incapacitated as part of their package. If a rule ends when a creature becomes incapacitated, Stunning it will usually trigger that consequence too.",
      tags: ["stunned", "incapacitated", "no actions", "no reactions", "auto fail strength save", "auto fail dex save", "advantage attacks"],
      relatedRefs: ["@rule:rule-concentration|Concentration", "@rule:rule-conditions|Conditions"]
    },
    {
      id: "rule-unconscious",
      name: "Unconscious",
      category: "Conditions",
      rulesets: BOTH,
      summary: "The creature cannot act, is unaware of its surroundings, drops what it is holding, falls prone, and is extremely vulnerable nearby.",
      quickReference: "An unconscious creature is incapacitated, cannot move or speak, is unaware, drops held items, and falls prone. It automatically fails Strength and Dexterity saves. Attacks against it have advantage, and a hit from within 5 ft is normally a critical hit.",
      details: "At 0 HP, player characters are commonly unconscious and also subject to the dying/death-save rules unless an effect says otherwise.",
      tags: ["unconscious", "incapacitated", "zero hp", "0 hp", "prone", "critical within 5 feet", "death save"],
      relatedRefs: ["@rule:rule-death-and-dying|Death Saves & Dying", "@rule:rule-prone|Prone"]
    },
    {
      id: "rule-invisible",
      name: "Invisible",
      category: "Conditions",
      rulesets: BOTH,
      summary: "The creature cannot be seen without special senses or magic; attack interactions depend on whether its location is known and on edition wording.",
      quickReference: "Invisible creatures are not visible to ordinary sight. In the classic combat rule, attacks against an unseen invisible creature have disadvantage and the invisible creature's attacks have advantage, subject to special senses and other effects.",
      details: "Invisible is not the same as hidden. A creature can be unseen but still have its location known because of sound, tracks, attacks, or other clues. Hidden creatures add uncertainty about location.",
      editionNotes: "2024 reorganizes invisibility and hiding language, so use the campaign's exact condition text when edge cases involving detection or the Hide action matter.",
      tags: ["invisible", "invisibility", "unseen", "hidden", "stealth", "attack advantage", "attack disadvantage", "special senses"],
      relatedRefs: ["@rule:rule-vision-light|Vision & Light", "@rule:rule-advantage-disadvantage|Advantage & Disadvantage"]
    },
    {
      id: "rule-exhaustion",
      name: "Exhaustion",
      category: "Rest & Recovery",
      rulesets: "2014 vs 2024",
      summary: "A six-level cumulative penalty track; the actual penalties were substantially redesigned in 2024.",
      quickReference: "**2014:** six levels with a different penalty at each step, escalating through disadvantage, reduced Speed/HP, then death at level 6.\n\n**2024:** each level gives **−2 to D20 Tests** and **−5 ft Speed** per level; level 6 means death. A Long Rest normally removes one level when its requirements are met.",
      details: "Track exhaustion as a number from 0 to 6. Because the editions use different penalty models, always note which ruleset the campaign uses rather than writing only 'Exhaustion 2.'",
      editionNotes: "This condition is not safely interchangeable between editions. 2014 uses bespoke effects by level; 2024 uses the repeating −2 D20 Test / −5 ft Speed pattern.",
      tags: ["exhaustion", "fatigue", "d20 penalty", "speed penalty", "long rest", "2014", "2024"],
      relatedRefs: ["@rule:rule-rests|Short & Long Rests", "@rule:rule-d20-tests|D20 Tests"]
    },
    {
      id: "rule-rests",
      name: "Short & Long Rests",
      category: "Rest & Recovery",
      rulesets: "2014 vs 2024",
      summary: "Short rests spend Hit Dice/Hit Point Dice and refresh some features; long rests restore major resources and differ slightly by edition.",
      quickReference: "**Short Rest:** normally at least 1 hour. Characters can spend available Hit Dice/Hit Point Dice to recover HP and refresh features that explicitly recharge on a short rest.\n\n**Long Rest:** normally about 8 hours with sleep/light activity requirements. Regains lost HP and refreshes features that recharge on a long rest.",
      details: "Rest interruption, frequency, sleep requirements, and what exactly refreshes should follow the campaign's edition. Individual class features and magic items state whether they recharge on a short or long rest.",
      editionNotes: "**2014:** a completed long rest restores up to half of the character's total Hit Dice.\n\n**2024:** the refreshed Hit Point Dice rule is more generous and the long-rest procedure is rewritten; use the 2024 rest text for interruption and refresh edge cases.",
      tags: ["short rest", "long rest", "rest", "hit dice", "hit point dice", "healing", "recharge", "sleep"],
      relatedRefs: ["@rule:rule-exhaustion|Exhaustion", "@rule:rule-constitution|Constitution"]
    },
    {
      id: "rule-vision-light",
      name: "Vision & Light",
      category: "Exploration",
      rulesets: BOTH,
      summary: "Bright light, dim light, darkness, obscurement, and special senses determine what creatures can see.",
      quickReference: "**Bright light:** normal vision.\n**Dim light:** lightly obscured; sight-based Perception is hindered.\n**Darkness:** heavily obscured to ordinary vision.\n\n**Darkvision:** lets a creature see through darkness within its range, usually treating darkness as dim light and often without color.\n\nFog, foliage, smoke, and similar effects can create light or heavy obscurement independent of lighting.",
      details: "Vision affects targeting, hiding, advantage/disadvantage, and whether a creature can perceive a trigger. Always separate 'can see the creature' from 'knows roughly where the creature is.'",
      tags: ["vision", "light", "bright light", "dim light", "darkness", "darkvision", "obscured", "heavily obscured", "perception", "line of sight"],
      relatedRefs: ["@rule:rule-invisible|Invisible", "@rule:rule-cover|Cover", "@rule:rule-wisdom|Wisdom"]
    },
    {
      id: "rule-object-interaction",
      name: "Object Interaction",
      category: "Core Mechanics",
      rulesets: BOTH,
      summary: "Simple interaction with the environment is often folded into a turn; more involved object use can cost an action.",
      quickReference: "Examples of simple interaction include opening an ordinary door, drawing or stowing a weapon, picking up a dropped item, or handing something to another creature when circumstances allow. A second significant interaction or a complicated object usually costs an action or uses the edition's object-utilization procedure.",
      details: "The boundary is intentionally adjudicative. If manipulating the object is the main thing the character is trying to accomplish, dangerous, complex, or time-consuming, charging an action is usually appropriate.",
      editionNotes: "The 2024 rules formalize the **Utilize** action for many object interactions. The 2014 rules more often describe one incidental object interaction as part of movement/action and use the Use an Object action for additional or complex use.",
      tags: ["object interaction", "use an object", "utilize", "draw weapon", "stow weapon", "open door", "free interaction"],
      relatedRefs: ["@rule:rule-combat-turn|Combat Turn & Round", "@rule:rule-actions-in-combat|Actions in Combat"]
    }
  ];
});
