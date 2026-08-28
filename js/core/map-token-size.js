/**
 * D&D creature size → map grid footprint (Tiny/S/M = 1, Large = 2, Huge = 3, Gargantuan = 4).
 * NPC race text resolves via monster catalogue name match, then race catalogue, then defaults.
 */
window.MapTokenSize = (function () {
  "use strict";

  /** Common creature names when no catalogue entry exists (MM defaults). */
  const CREATURE_DEFAULTS = {
    kobold: "Small",
    goblin: "Small",
    gnome: "Small",
    halfling: "Small",
    merrow: "Large",
    ogre: "Large",
    giant: "Huge",
    stirge: "Tiny",
    bat: "Tiny",
    rat: "Tiny",
    spider: "Tiny",
    wyrmling: "Medium"
  };

  function normalizeDndSize(size) {
    const s = String(size || "Medium").trim();
    if (!s) return "Medium";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  function dndSizeToGridCells(size) {
    const s = normalizeDndSize(size).toLowerCase();
    if (s === "large") return 2;
    if (s === "huge") return 3;
    if (s === "gargantuan") return 4;
    return 1;
  }

  function cellSpanPercent(cells, map) {
    const n = Math.max(1, Number(cells) || 1);
    const sx = Number(map?.grid?.sizeX) || 1;
    const sy = Number(map?.grid?.sizeY) || 1;
    return { w: (n / sx) * 100, h: (n / sy) * 100, cells: n };
  }

  function tokenizeRace(raceText) {
    const words = String(raceText || "")
      .toLowerCase()
      .split(/[\s,/\-]+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ""))
      .filter(Boolean);
    return words.sort((a, b) => {
      const aScore = CREATURE_DEFAULTS[a] ? 0 : a.length > 4 ? 2 : 1;
      const bScore = CREATURE_DEFAULTS[b] ? 0 : b.length > 4 ? 2 : 1;
      return aScore - bScore;
    });
  }

  function loadMonsters() {
    try {
      return window.CatalogueStore?.loadAll?.("monster") || [];
    } catch {
      return [];
    }
  }

  function loadRaces() {
    try {
      return window.CatalogueStore?.loadAll?.("race") || [];
    } catch {
      return [];
    }
  }

  function lookupMonsterSizeByRace(raceText) {
    const tokens = tokenizeRace(raceText);
    if (!tokens.length) return null;
    const monsters = loadMonsters();
    if (!monsters.length) return null;

    for (const token of tokens) {
      const exact = monsters.find((m) => String(m.name || "").toLowerCase() === token);
      if (exact?.size) return exact.size;
    }

    for (const token of tokens) {
      const re = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const wordHits = monsters.filter((m) => re.test(String(m.name || "")));
      if (wordHits.length === 1 && wordHits[0].size) return wordHits[0].size;
      const contains = monsters.filter((m) => String(m.name || "").toLowerCase().includes(token));
      if (contains.length === 1 && contains[0].size) return contains[0].size;
    }
    return null;
  }

  function lookupRaceSizeByName(raceText) {
    const tokens = tokenizeRace(raceText);
    if (!tokens.length) return null;
    const races = loadRaces();

    for (const token of tokens) {
      const exact = races.find(
        (r) =>
          String(r.name || "").toLowerCase() === token ||
          String(r.id || "")
            .toLowerCase()
            .replace(/^race-|^subspecies-/, "")
            .includes(token)
      );
      if (exact?.size) return exact.size;
    }

    const lower = String(raceText).toLowerCase();
    const partial = races.find((r) => {
      const name = String(r.name || "").toLowerCase();
      return name && (lower.includes(name) || name.includes(lower));
    });
    return partial?.size || null;
  }

  function lookupCreatureDefault(raceText) {
    for (const token of tokenizeRace(raceText)) {
      if (CREATURE_DEFAULTS[token]) return CREATURE_DEFAULTS[token];
    }
    return null;
  }

  function resolveNpcSize(npcEntry) {
    const race = String(npcEntry?.race || "").trim();
    if (!race) return "Medium";
    return (
      lookupMonsterSizeByRace(race) ||
      lookupRaceSizeByName(race) ||
      lookupCreatureDefault(race) ||
      "Medium"
    );
  }

  function resolvePcSize(pcEntry) {
    const race = String(pcEntry?.race || "").trim();
    if (!race) return "Medium";
    return lookupRaceSizeByName(race) || lookupCreatureDefault(race) || "Medium";
  }

  function resolveEntitySize(kind, entry) {
    if (kind === "monster") return entry?.size || "Medium";
    if (kind === "npc") return resolveNpcSize(entry);
    if (kind === "pc") return resolvePcSize(entry);
    return "Medium";
  }

  function resolveGridCells(kind, entry) {
    const dndSize = resolveEntitySize(kind, entry);
    return { dndSize: normalizeDndSize(dndSize), gridCells: dndSizeToGridCells(dndSize) };
  }

  function loadEntry(type, id) {
    if (!id || !window.CatalogueStore?.get) return null;
    let entry = CatalogueStore.get(type, id);
    if (!entry) return null;
    if (window.CatalogueImages?.hydrate) entry = CatalogueImages.hydrate(type, entry);
    return entry;
  }

  function resolvePinCatalogue(pin) {
    if (pin?.partyId && window.PARTY) {
      const member = PARTY.find((p) => p.id === pin.partyId);
      if (member?.catalogueId) {
        return { kind: "pc", entry: loadEntry("pc", member.catalogueId) };
      }
    }
    if (pin?.entityId && window.EntityRegistry) {
      const row = EntityRegistry.resolveCatalogueEntry?.(pin.entityId);
      if (row?.id) {
        return { kind: row._catalogueType || pin.pinType || "npc", entry: row };
      }
      const entity = EntityRegistry.resolve(pin.entityId);
      if (entity?.catalogueId) {
        const kind = entity.type || pin.pinType || "npc";
        return { kind, entry: loadEntry(kind, entity.catalogueId) || entity };
      }
      if (entity?.type) {
        return { kind: entity.type, entry: entity };
      }
    }
    return { kind: pin?.pinType || "npc", entry: null };
  }

  function resolveTokenUrl(entry) {
    if (!entry) return null;
    for (const field of ["tokenImage", "portrait"]) {
      const url = entry[field];
      if (!url || typeof url !== "string") continue;
      const trimmed = url.trim();
      if (!trimmed || trimmed === "__idb__") continue;
      return trimmed;
    }
    return null;
  }

  function tokenBackgroundAttr(url) {
    if (!url) return "";
    return ` style="background-image:url('${String(url).replace(/'/g, "%27")}')"`;
  }

  function resolvePinSize(pin, ctx) {
    const map = ctx?.map;
    if (!map?.grid) return null;

    const { kind, entry } = resolvePinCatalogue(pin);
    const { dndSize, gridCells } = resolveGridCells(kind, entry);
    const span = cellSpanPercent(gridCells, map);
    return { dndSize, gridCells, span, kind, tokenUrl: resolveTokenUrl(entry) };
  }

  function gridTokenStyle(pos, span) {
    const w = span.w;
    const h = span.h;
    return `left:${pos.left};top:${pos.top};width:${w}%;height:${h}%;margin:calc(-${h / 2}%) 0 0 calc(-${w / 2}%)`;
  }

  function isCalibratedMap(map) {
    return Boolean(map?.grid && (map.calibrated || map.kind === "uvtt" || map.kind === "calibrated"));
  }

  return {
    normalizeDndSize,
    dndSizeToGridCells,
    cellSpanPercent,
    resolveNpcSize,
    resolvePcSize,
    resolveEntitySize,
    resolveGridCells,
    resolvePinSize,
    resolveTokenUrl,
    tokenBackgroundAttr,
    gridTokenStyle,
    isCalibratedMap,
    lookupMonsterSizeByRace,
    CREATURE_DEFAULTS
  };
})();
