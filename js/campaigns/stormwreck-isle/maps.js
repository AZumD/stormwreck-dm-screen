/**
 * Map definitions and pins.
 * image: fallback path relative to campaigns/stormwreck-isle/index.html
 * locationId: catalogue link id — uploaded mapImage overrides `image` when present
 * Pin x/y are percentages (0–100) of map width/height.
 *
 * pinType (filter): pc | npc | poi | item | monster
 * entityId: links to ENTITIES for tooltip/modal
 * partyId: links to PARTY member
 */

const MAPS = {
  "island-overview": {
    id: "island-overview",
    title: "Stormwreck Isle",
    locationId: "stormwreck-isle",
    image: "../../assets/maps/island-overview.svg",
    pins: [
      { id: "p-dr", pinType: "poi", entityId: "dragons-rest", label: "Dragon's Rest", x: 38, y: 28 },
      { id: "p-seagrow", pinType: "poi", entityId: "seagrow-caves", label: "Seagrow Caves", x: 72, y: 62 },
      { id: "p-ship", pinType: "poi", entityId: "compass-rose", label: "Compass Rose", x: 48, y: 18 },
      { id: "p-obs", pinType: "poi", entityId: "clifftop-observatory", label: "Observatory", x: 55, y: 42 }
    ]
  },

  "dragons-rest": {
    id: "dragons-rest",
    title: "Dragon's Rest",
    locationId: "dragons-rest",
    image: "../../assets/maps/dragons-rest.svg",
    pins: [
      { id: "p-runara", pinType: "npc", entityId: "runara", x: 52, y: 22 },
      { id: "p-tarak", pinType: "npc", entityId: "tarak", x: 28, y: 55 },
      { id: "p-varnoth", pinType: "npc", entityId: "varnoth", x: 68, y: 48 },
      { id: "p-myla", pinType: "npc", entityId: "myla", x: 44, y: 68 },
      { id: "p-beach", pinType: "poi", label: "Beach landing", summary: "Drowned sailors encounter.", x: 50, y: 88 },
      { id: "p-temple", pinType: "poi", label: "Open-air temple", summary: "Bahamut shrine — +1d4 on saves.", x: 50, y: 12 }
    ]
  },

  "seagrow-caves": {
    id: "seagrow-caves",
    title: "Seagrow Caves",
    locationId: "seagrow-caves",
    image: "../../assets/maps/seagrow-caves.svg",
    pins: [
      { id: "p-entrance", pinType: "poi", label: "B1 Entrance", summary: "Spore servant octopus in the water.", x: 18, y: 50 },
      { id: "p-farm", pinType: "poi", label: "B2 Fungus Farm", summary: "Myconid sprouts and violet fungi.", x: 45, y: 40 },
      { id: "p-crystal", pinType: "poi", label: "B6 Crystal Cave", summary: "Fire plane connection — Sharruth's grave.", x: 78, y: 35 },
      { id: "p-sinensa", pinType: "npc", entityId: "sinensa", x: 62, y: 52 }
    ]
  },

  "compass-rose": {
    id: "compass-rose",
    title: "Compass Rose",
    locationId: "compass-rose",
    image: "../../assets/maps/island-overview.svg",
    pins: [
      { id: "p-cr-wheel", pinType: "poi", label: "C3 Wheel", summary: "Compass Rose engraved — noise attracts zombies.", x: 40, y: 35 },
      { id: "p-cr-hold", pinType: "poi", label: "C9 Hold", summary: "Captain's chest — curse heart.", x: 55, y: 70 }
    ]
  },

  "clifftop-observatory": {
    id: "clifftop-observatory",
    title: "Clifftop Observatory",
    locationId: "clifftop-observatory",
    image: "../../assets/maps/island-overview.svg",
    pins: [
      { id: "p-obs-key", pinType: "poi", label: "D1 Key slot", summary: "Moonstone key in dragon statue.", x: 30, y: 55 },
      { id: "p-obs-rotunda", pinType: "poi", label: "D2 Rotunda", summary: "Stirges and golden sculpture.", x: 50, y: 40 },
      { id: "p-sparkrender", pinType: "monster", entityId: "sparkrender", x: 72, y: 28 }
    ]
  }
};

window.MAPS = MAPS;
