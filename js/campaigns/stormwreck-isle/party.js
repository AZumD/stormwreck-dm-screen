/**
 * Player party — edit names/stats to match your table.
 * portrait: optional path relative to campaign page; initials used if omitted.
 */

const PARTY = [
  {
    id: "pc-cleric",
    name: "Amelia",
    class: "Cleric",
    hp: "10/10",
    ac: 18,
    speed: "30 ft.",
    color: "#c4a035",
    mapId: "dragons-rest",
    x: 32,
    y: 78,
    notes: "Dream-led to the cloister — hunger of death motif."
  },
  {
    id: "pc-fighter",
    name: "Gareth",
    class: "Fighter",
    hp: "12/12",
    ac: 17,
    speed: "30 ft.",
    color: "#7eb8da",
    mapId: "dragons-rest",
    x: 42,
    y: 82,
    notes: "Seeking clarity about a sense of destiny."
  },
  {
    id: "pc-wizard",
    name: "Elara",
    class: "Wizard",
    hp: "7/7",
    ac: 13,
    speed: "30 ft.",
    color: "#8bc49a",
    mapId: "dragons-rest",
    x: 52,
    y: 78,
    notes: "Eager to learn observatory secrets."
  },
  {
    id: "pc-rogue",
    name: "Sera",
    class: "Rogue",
    hp: "9/9",
    ac: 14,
    speed: "30 ft.",
    color: "#d4847a",
    mapId: "dragons-rest",
    x: 62,
    y: 82,
    notes: ""
  }
];

window.PARTY = PARTY;
