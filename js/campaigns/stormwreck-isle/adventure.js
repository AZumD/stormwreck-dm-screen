/**
 * Dragons of Stormwreck Isle — adventure content
 * Sections render as one continuous scroll document.
 *
 * Formatting:
 *   @npc:runara|Elder Runara
 *   <b>bold</b>
 *   {{read-aloud}}...{{/read-aloud}}
 *   {{dm-note}}...{{/dm-note}}
 */

const ADVENTURE = {
  meta: {
    id: "stormwreck-isle",
    title: "Dragons of Stormwreck Isle",
    level: "1–3"
  },

  chapters: [
    { id: "intro", title: "Introduction" },
    { id: "prologue", title: "Prologue" },
    { id: "ch-1", title: "Chapter 1: Dragon's Rest" },
    { id: "ch-2", title: "Chapter 2: Seagrow Caves" },
    { id: "ch-3", title: "Chapter 3: Cursed Shipwreck" },
    { id: "ch-4", title: "Chapter 4: Clifftop Observatory" }
  ],

  sections: [
    {
      id: "overview",
      chapter: "intro",
      title: "Overview",
      content: `
        <p><b>Dragons of Stormwreck Isle</b> is an adventure for level 1–3 characters on @location:stormwreck-isle|Stormwreck Isle.</p>
        <p>Four chapters plus an optional ship prologue:</p>
        <ul>
          <li><b>Ch 1 — Dragon's Rest:</b> Home base at @location:dragons-rest, NPCs and quests.</li>
          <li><b>Ch 2 — Seagrow Caves:</b> Myconids threatened by fire from Sharruth's grave.</li>
          <li><b>Ch 3 — Compass Rose:</b> Cursed shipwreck and the source of the zombies.</li>
          <li><b>Ch 4 — Clifftop Observatory:</b> Finale against @monster:sparkrender|Sparkrender.</li>
        </ul>
        {{dm-note}}
        Party can tackle chapters 2 and 3 in either order. After both, they're ready for the observatory.
        {{/dm-note}}
      `
    },
    {
      id: "background",
      chapter: "intro",
      title: "Adventure Background",
      content: `
        <p>Legend says Bahamut made the metallic dragons and Tiamat the chromatic — their enmity echoes through dragonkind.</p>
        <p>The red dragon Sharruth was imprisoned beneath the sea off the Sword Coast. Her fury shaped the volcanoes of @location:stormwreck-isle|Stormwreck Isle. Draconic magic draws dragons here — and leaves spiritual scars when they die.</p>
        <p>A century ago a blue dragon tried to harness that magic. The bronze dragon Runara pleaded with him to stop; when he refused, she killed him. Weary of strife, she founded @location:dragons-rest|Dragon's Rest as a sanctuary.</p>
        <p>Now Sparkrender — the blue wyrmling's grandson — threatens that peace.</p>
      `
    },
    {
      id: "running",
      chapter: "intro",
      title: "Running the Adventure",
      content: `
        <p>You are <b>storyteller</b>, <b>referee</b>, and <b>roleplayer</b> for everyone the party meets. Let players drive the story — there's no fixed outcome.</p>
        <h3>DM Tips</h3>
        <ul>
          <li><b>Runara saves the day.</b> If the party is defeated, @npc:runara|Runara can rescue them. They wake at the cloister. Use sparingly.</li>
          <li><b>Focus NPCs.</b> Pick 2–3 to bring alive: @npc:runara, @npc:tarak, @npc:varnoth, @npc:myla.</li>
          <li><b>Boxed text</b> = read aloud or paraphrase on arrival.</li>
          <li><b>Bold names</b> in the booklet = stat block in appendix B.</li>
        </ul>
      `
    },
    {
      id: "voyage",
      chapter: "prologue",
      title: "Voyage to Stormwreck Isle",
      content: `
        <p>Optional demo prologue aboard ship before the party reaches the island.</p>
        {{read-aloud}}
        Your journey has been smooth sailing so far. You left Neverwinter a few days ago, heading for an island with the foreboding name of Stormwreck Isle. But you woke this morning to a blood-red sunrise, and dark clouds overhead threaten a violent storm.
        {{/read-aloud}}
        {{read-aloud}}
        As lightning flashes across the sky, a monster hauls itself up onto the deck!
        {{/read-aloud}}
        {{read-aloud}}
        "These waters belong to the Scaled Queen. I'm here to collect her tribute."
        {{/read-aloud}}
        <p>A @monster:merrow|merrow has climbed aboard. Let the players fight, negotiate, or scheme.</p>
      `
    },
    {
      id: "welcome",
      chapter: "ch-1",
      title: "Welcome to Dragon's Rest",
      content: `
        {{read-aloud}}
        Your journey was uneventful, but the island now visible off the bow promises rare wonders. Seaweed shimmers in countless brilliant colors below you, and rays of sunlight defy the overcast sky to illuminate lush grass and dark basalt rock. Your ship makes its way toward a calm harbor on the island's north side.
        {{/read-aloud}}
        {{read-aloud}}
        A large, open-air temple comes into view, perched on the edge of a cliff high above you. The ship drops anchor; sailors row you ashore. A long path winds up the cliff, dotted with doorways cut into the rock. Your visit to @location:dragons-rest|Dragon's Rest begins!
        {{/read-aloud}}
        <p>Have players introduce characters and set marching order up the path.</p>
      `
    },
    {
      id: "drowned-sailors",
      chapter: "ch-1",
      title: "Drowned Sailors",
      content: `
        {{read-aloud}}
        As you're about to leave the beach and start your climb, you hear splashing and a wet, gurgling moan behind you. Three figures shambling up from the water's edge, about thirty feet away. They're dressed as sailors, but their skin is gray and they look drowned. Sea water drools from their slack mouths as they lurch toward you.
        {{/read-aloud}}
        <p>Three @monster:zombie|zombies from a recent shipwreck. Fight or leave them — they can't catch the party up the path.</p>
        {{dm-note}}
        <b>Undead Fortitude:</b> Radiant damage or crits bypass it. DC 10 Intelligence to recall this.

        <b>Runara's Aid:</b> If the zombies win, the party wakes in the temple. @npc:runara|Runara arrived just in time.
        {{/dm-note}}
      `
    },
    {
      id: "inhabitants",
      chapter: "ch-1",
      title: "Meeting the Inhabitants",
      content: `
        {{read-aloud}}
        Your arrival draws the attention of the entire population — mostly kobolds. They eye you curiously while a couple of humans watch from a distance. No one carries a visible weapon. One kobold pipes up: "What's your name?" — and suddenly questions pour in.
        {{/read-aloud}}
        {{read-aloud}}
        The kobolds fall silent as an elderly woman descends from the upper cloister — white hair in tight braids, simple white robe. "Welcome to Dragon's Rest," she says. "May Bahamut's guidance lead you to whatever you seek."
        {{/read-aloud}}
        <p>This is @npc:runara|Elder Runara. She thanks them if they fought the zombies. Free room and board — cells, temple, or dining hall. Equipment available from @npc:myla|Myla.</p>
        <p>@location:dragons-rest|Dragon's Rest is home base. All sites are a few miles away.</p>
      `
    },
    {
      id: "npc-runara",
      chapter: "ch-1",
      title: "Elder Runara",
      content: `
        <p>@npc:runara|Runara leads the cloister — secretly an adult bronze dragon. Residents know but won't tell visitors.</p>
        <p><b>Attitude:</b> Indifferent → friendly if the party protects the cloister or takes quests. Hostile if they harm residents.</p>
        <p><b>Secret lair:</b> Undersea tunnel nearby. She never seems to sleep.</p>
      `
    },
    {
      id: "npc-kobolds",
      chapter: "ch-1",
      title: "Kobolds",
      content: `
        <p>Nine lawful good kobolds live here, working mostly at night due to sunlight sensitivity.</p>
        <p><b>Pick 1–2 to focus on</b> — you don't need all nine:</p>
        <ul>
          <li><b>Agga</b> — keeps the others organized.</li>
          <li><b>Blepp</b> — "supernaturally lucky," carries a "magic" dagger.</li>
          <li><b>Frub</b> — endless energy and questions.</li>
          <li><b>Laylee</b> — @npc:myla|Myla's helper, banned from alchemical fire.</li>
          <li><b>Myla</b> — winged inventor; brothers follow Sparkrender.</li>
          <li><b>Rix</b> — tends the temple, saw the shipwreck, loves puns.</li>
        </ul>
      `
    },
    {
      id: "npc-tarak-varnoth",
      chapter: "ch-1",
      title: "Tarak & Varnoth",
      content: `
        <h3>@npc:tarak|Tarak</h3>
        <p>Botanist with a dark past as a poisoner. Tends the gardens. Friendly until pressed about Gilded Gallows tattoos (DC 15 History).</p>
        <p>Needs heart cap mushrooms from @location:seagrow-caves|Seagrow Caves — blocked by the spore servant octopus.</p>
        <h3>@npc:varnoth|Varnoth</h3>
        <p>Former general of the Azure Wolves. Gruff but empathetic. Saw the latest shipwreck north of the cloister.</p>
      `
    },
    {
      id: "cloister-quests",
      chapter: "ch-1",
      title: "Cloister Quests",
      content: `
        <h3>Zombie Resurgence</h3>
        <p>If ignored, zombies return. @npc:runara|Runara suspects a wreck to the north.</p>
        <h3>Sea Caves</h3>
        <p>@npc:tarak|Tarak needs mushrooms — points to @location:seagrow-caves.</p>
        <h3>Shipwreck</h3>
        <p>@npc:varnoth|Varnoth and Rix saw a ship crash. Investigate the older wreck @location:compass-rose|Compass Rose.</p>
        <h3>Lost Wyrmling</h3>
        <p>Runara sends the party to @location:clifftop-observatory|Clifftop Observatory with the @item:moonstone-key|moonstone key.</p>
      `
    },
    {
      id: "seagrow-travel",
      chapter: "ch-2",
      title: "Travel to Seagrow Caves",
      content: `
        <p>Reach @location:seagrow-caves|Seagrow Caves by rowboat (5 miles, ~3 hr 20 min) or walk the coast (7 miles, ~2 hr 20 min).</p>
        {{read-aloud}}
        A cliff of dark gray stone towers two hundred feet above the crashing waves. A swirling slick of colors dances on the water's surface, emanating from the cave.
        {{/read-aloud}}
        <h3>Tides</h3>
        <table>
          <tr><th>Time</th><th>Tide</th></tr>
          <tr><td>Midnight to sunrise</td><td>Low</td></tr>
          <tr><td>Sunrise to noon</td><td>High</td></tr>
          <tr><td>Noon to sunset</td><td>Low</td></tr>
          <tr><td>Sunset to midnight</td><td>High</td></tr>
        </table>
      `
    },
    {
      id: "seagrow-myconids",
      chapter: "ch-2",
      title: "The Myconids",
      content: `
        <p>@monster:myconid|Myconids start hostile but aren't evil. Adults warn via rapport spores: leave.</p>
        <p>DC 20 Charisma to converse. Mention @npc:tarak|Tarak or his offering → advantage.</p>
        <p>Leader @npc:sinensa|Sinensa lies ill after investigating the crystal cave (B6) — sulfur smell, link to the Elemental Plane of Fire.</p>
        {{dm-note}}
        Rapport spores = telepathy for 1 hour within 30 ft. Players may feel myconid sadness directly.
        {{/dm-note}}
      `
    },
    {
      id: "seagrow-locations",
      chapter: "ch-2",
      title: "Cave Locations",
      content: `
        <p><b>B1 Entrance:</b> Spore servant octopus in the water. At level 2: 2 @monster:stirge|stirges in the ceiling.</p>
        <p><b>B2 Fungus Farm:</b> Myconid sprouts + violet fungi disguised among mushrooms.</p>
        <p><b>B6 Crystal Cave:</b> Source of the fire-plane connection from Sharruth's grave.</p>
      `
    },
    {
      id: "compass-intro",
      chapter: "ch-3",
      title: "The Compass Rose",
      content: `
        <p>@location:compass-rose|Compass Rose is the older wreck causing the zombies. Several ships have crashed north of the cloister — the latest veered off course suddenly (@npc:varnoth|Varnoth and Rix witnessed it).</p>
        <p>Find why ships crash and break the curse in the hold.</p>
      `
    },
    {
      id: "compass-decks",
      chapter: "ch-3",
      title: "Decks & Cabins",
      content: `
        <p><b>C3 Wheel:</b> "Compass Rose" engraved. If the wheel falls — noise attracts zombies in C4.</p>
        <p><b>C4 Captain's Quarters:</b> 2 @monster:zombie|zombies, hole to the hold. Treasure: 50 gp, cartographer's tools, dagger, compass (25 gp).</p>
        <p><b>C6 Crew Quarters:</b> Portrait "Aleitha and Brastos — together forever." Trapped floorboard: +5 dart, 1d6 poison (DC 11 Con). 200 gp below.</p>
        <p><b>C8 Lower Deck:</b> Zombie in water + cunning @monster:ghoul|ghoul waiting aft.</p>
      `
    },
    {
      id: "compass-hold",
      chapter: "ch-3",
      title: "The Hold & Curse",
      content: `
        <p><b>C9 Hold:</b> Captain's chest fell through the decks. The curse's heart is here.</p>
        {{dm-note}}
        Use stat blocks and treasure tables from the booklet for C8–C9 at the table. Breaking the curse stops new zombies at the beach.
        {{/dm-note}}
      `
    },
    {
      id: "observatory-intro",
      chapter: "ch-4",
      title: "Clifftop Observatory",
      content: `
        <p>@location:clifftop-observatory|Clifftop Observatory — where @npc:runara|Runara killed the blue dragon a century ago. @monster:sparkrender|Sparkrender has claimed it.</p>
        <p>Runara gives the @item:moonstone-key|moonstone key. Insert in a dragon statue at D1 to activate the energy bridge.</p>
        {{read-aloud}}
        Two marble dragon statues veined with gold roar silently toward the cliff edge. A hexagonal indentation at the base fits the key perfectly.
        {{/read-aloud}}
      `
    },
    {
      id: "observatory-d2",
      chapter: "ch-4",
      title: "Rotunda Ruins (D2)",
      content: `
        {{read-aloud}}
        Broken stone fills the plaza — shattered statues and pillars. At the center, a rusty sculpture of planets and gilded stars spins jerkily. Batlike creatures swarm two winged kobolds with blue paint on their snouts.
        {{/read-aloud}}
        <p>6 @monster:stirge|stirges vs @npc:mek|Mek and @npc:minn|Minn. Help the kobolds → friendly; they offer to fetch the key.</p>
        <p><b>Golden sculpture:</b> DC 15 Arcana — the King-Killer Star comet approaches Toril. Sparkrender waits for it.</p>
        <p>Dragon effigies: Astalagan (bronze), Clyssavar (gold), Eldenemir (blue), Sharruth (red), Turadaer (brass).</p>
      `
    },
    {
      id: "observatory-finale",
      chapter: "ch-4",
      title: "Finale — Sparkrender",
      content: `
        {{read-aloud}}
        Light dances through the shattered dome. A star map in gold and gems covers the dusty floor. Curled in the corner, a lithe blue dragon sleeps amid coins and jewels — lightning arcing around his horns and snout.
        {{/read-aloud}}
        <p>@monster:sparkrender|Sparkrender in the observatory tower (D5–D6). Aidron the bronze wyrmling is prisoner — may ally if freed.</p>
        {{dm-note}}
        Negotiate, fight, or creative solutions. The island's fate depends on the party's choices.
        {{/dm-note}}
      `
    }
  ],

  checklist: [
    {
      group: "Chapter 1",
      items: [
        { id: "beach", label: "Beach & drowned sailors" },
        { id: "cloister", label: "Meet inhabitants & Runara" },
        { id: "quests", label: "Cloister quests presented" }
      ]
    },
    {
      group: "Chapters 2–3",
      items: [
        { id: "seagrow", label: "Seagrow Caves complete" },
        { id: "compass", label: "Compass Rose explored" }
      ]
    },
    {
      group: "Chapter 4",
      items: [
        { id: "observatory", label: "Clifftop Observatory explored" },
        { id: "finale", label: "Sparkrender / finale" },
        { id: "epilogue", label: "Epilogue at cloister" }
      ]
    }
  ]
};

window.ADVENTURE = ADVENTURE;
