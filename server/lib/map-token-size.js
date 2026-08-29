/**
 * Server-side D&D token footprint + catalogue image resolution (mirrors js/core/map-token-size.js).
 */
"use strict";

const catalogues = require("./catalogues");
const assets = require("./assets");

const MARKER = "__idb__";

const CREATURE_DEFAULTS = Object.freeze({
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
});

let monstersCache = null;
let racesCache = null;

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

function cellSpanPercent(cells, mapMeta) {
  const n = Math.max(1, Number(cells) || 1);
  const sx = Number(mapMeta?.grid?.sizeX) || 1;
  const sy = Number(mapMeta?.grid?.sizeY) || 1;
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

async function loadMonsters() {
  if (!monstersCache) monstersCache = await catalogues.list("monster");
  return monstersCache;
}

async function loadRaces() {
  if (!racesCache) racesCache = await catalogues.list("race");
  return racesCache;
}

function clearCatalogueCache() {
  monstersCache = null;
  racesCache = null;
}

async function lookupMonsterEntryByRace(raceText) {
  const tokens = tokenizeRace(raceText);
  if (!tokens.length) return null;
  const monsters = await loadMonsters();
  if (!monsters.length) return null;

  for (const token of tokens) {
    const exact = monsters.find((m) => String(m.name || "").toLowerCase() === token);
    if (exact) return exact;
  }

  for (const token of tokens) {
    const re = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const wordHits = monsters.filter((m) => re.test(String(m.name || "")));
    if (wordHits.length === 1) return wordHits[0];
    const contains = monsters.filter((m) => String(m.name || "").toLowerCase().includes(token));
    if (contains.length === 1) return contains[0];
  }
  return null;
}

async function lookupRaceSizeByName(raceText) {
  const tokens = tokenizeRace(raceText);
  if (!tokens.length) return null;
  const races = await loadRaces();

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

async function resolveNpcSize(npcEntry) {
  const race = String(npcEntry?.race || "").trim();
  if (!race) return "Medium";
  const mon = await lookupMonsterEntryByRace(race);
  return mon?.size || (await lookupRaceSizeByName(race)) || lookupCreatureDefault(race) || "Medium";
}

async function resolvePcSize(pcEntry) {
  const race = String(pcEntry?.race || "").trim();
  if (!race) return "Medium";
  return (await lookupRaceSizeByName(race)) || lookupCreatureDefault(race) || "Medium";
}

async function resolveEntitySize(kind, entry) {
  if (kind === "monster") return entry?.size || "Medium";
  if (kind === "npc") return resolveNpcSize(entry);
  if (kind === "pc") return resolvePcSize(entry);
  return "Medium";
}

async function resolveGridCells(kind, entry) {
  const dndSize = await resolveEntitySize(kind, entry);
  return { dndSize: normalizeDndSize(dndSize), gridCells: dndSizeToGridCells(dndSize) };
}

function isUsableUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return Boolean(trimmed && trimmed !== MARKER && trimmed !== "__idb__");
}

function isMarker(value) {
  return value === MARKER || value === "__idb__";
}

async function assetUrlForField(type, id, field) {
  if (!type || !id) return null;
  const kind = assets.fieldToKind(field);
  const meta = await assets.resolveAsset(kind, type, id);
  if (!meta) return null;
  return assets.publicUrl(kind, type, id, meta.version);
}

async function resolveCatalogueFieldUrl(type, id, field, entry) {
  const val = entry?.[field];
  if (isUsableUrl(val)) return String(val).trim();
  if (isMarker(val) || val != null) {
    const url = await assetUrlForField(type, id, field);
    if (url) return url;
  }
  return null;
}

function fieldHasAssetHint(sources, field) {
  return (sources || []).some((src) => {
    const value = src?.[field];
    return isUsableUrl(value) || isMarker(value);
  });
}

function collectImageSources(kind, entry, pin) {
  const sources = [];
  const catalogueId = entry?.id || pin?.catalogueId || null;
  if (entry) sources.push(entry);
  if (pin?.tokenImage) sources.push({ tokenImage: pin.tokenImage });
  if (pin?.imageUrl) sources.push({ tokenImage: pin.imageUrl, portrait: pin.portrait });
  return { sources, catalogueId };
}

async function resolvePinImageUrls(kind, entry, pin) {
  const { sources, catalogueId } = collectImageSources(kind, entry, pin);
  let ownToken = null;
  let ownPortrait = null;

  for (const src of sources) {
    if (!ownToken && isUsableUrl(src?.tokenImage)) ownToken = String(src.tokenImage).trim();
    if (!ownPortrait && isUsableUrl(src?.portrait)) ownPortrait = String(src.portrait).trim();
  }

  if (catalogueId && kind) {
    if (!ownToken && fieldHasAssetHint(sources, "tokenImage")) {
      ownToken = await resolveCatalogueFieldUrl(kind, catalogueId, "tokenImage", entry);
    }
    if (!ownPortrait && fieldHasAssetHint(sources, "portrait")) {
      ownPortrait = await resolveCatalogueFieldUrl(kind, catalogueId, "portrait", entry);
    }
    if (!ownToken) {
      ownToken = await assetUrlForField(kind, catalogueId, "tokenImage");
    }
    if (!ownPortrait) {
      ownPortrait = await assetUrlForField(kind, catalogueId, "portrait");
    }
  }

  let raceToken = null;
  let racePortrait = null;
  if ((kind === "npc" || kind === "pc") && entry?.race) {
    const mon = await lookupMonsterEntryByRace(entry.race);
    if (mon?.id) {
      const monEntry = (await catalogues.get("monster", mon.id)) || mon;
      if (isUsableUrl(monEntry?.tokenImage)) raceToken = String(monEntry.tokenImage).trim();
      if (isUsableUrl(monEntry?.portrait)) racePortrait = String(monEntry.portrait).trim();
      if (!raceToken) raceToken = await assetUrlForField("monster", mon.id, "tokenImage");
      if (!racePortrait) racePortrait = await assetUrlForField("monster", mon.id, "portrait");
    }
  }

  const chain = [];
  for (const u of [ownToken, raceToken, ownPortrait, racePortrait]) {
    if (u && !chain.includes(u)) chain.push(u);
  }
  return { url: chain[0] || null, fallbackUrl: chain[1] || null };
}

module.exports = {
  normalizeDndSize,
  dndSizeToGridCells,
  cellSpanPercent,
  resolveGridCells,
  resolvePinImageUrls,
  lookupMonsterEntryByRace,
  clearCatalogueCache,
  CREATURE_DEFAULTS
};
