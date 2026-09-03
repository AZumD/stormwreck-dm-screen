/**
 * Safe ID / path helpers — never trust request params as filesystem paths.
 */
"use strict";

const CATALOGUE_TYPES = Object.freeze([
  "pc",
  "npc",
  "race",
  "background",
  "class",
  "skill",
  "feature",
  "spell",
  "item",
  "monster",
  "location",
  "music",
  "source"
]);

const CAMPAIGN_DOC_KINDS = Object.freeze([
  "campaign-state",
  "scene-meta",
  "chronicle",
  "section-edits",
  "section-structure",
  "notes",
  "checklist",
  "map-state",
  "maps",
  "locations",
  "prefs",
  "music-mixer"
]);

const ASSET_KINDS = Object.freeze(["portraits", "maps", "tokens"]);

const ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

function assertSafeId(value, label = "id") {
  const id = String(value ?? "").trim();
  if (!id) {
    const err = new Error(`${label} is required`);
    err.status = 400;
    throw err;
  }
  if (id.includes("..") || id.includes("/") || id.includes("\\") || id.includes("\0")) {
    const err = new Error(`Invalid ${label}`);
    err.status = 400;
    throw err;
  }
  if (!ID_RE.test(id)) {
    const err = new Error(`Invalid ${label}`);
    err.status = 400;
    throw err;
  }
  return id;
}

function assertCatalogueType(type) {
  const t = String(type || "").trim();
  if (!CATALOGUE_TYPES.includes(t)) {
    const err = new Error(`Unknown catalogue type: ${t}`);
    err.status = 400;
    throw err;
  }
  return t;
}

function assertDocKind(kind) {
  const k = String(kind || "").trim();
  if (!CAMPAIGN_DOC_KINDS.includes(k)) {
    const err = new Error(`Unknown document kind: ${k}`);
    err.status = 400;
    throw err;
  }
  return k;
}

function assertAssetKind(kind) {
  const k = String(kind || "").trim();
  if (!ASSET_KINDS.includes(k)) {
    const err = new Error(`Unknown asset kind: ${k}`);
    err.status = 400;
    throw err;
  }
  return k;
}

function assertAssetField(field) {
  const f = String(field || "").trim();
  if (f !== "portrait" && f !== "mapImage" && f !== "tokenImage") {
    const err = new Error(`Unknown asset field: ${f}`);
    err.status = 400;
    throw err;
  }
  return f;
}

module.exports = {
  CATALOGUE_TYPES,
  CAMPAIGN_DOC_KINDS,
  ASSET_KINDS,
  assertSafeId,
  assertCatalogueType,
  assertDocKind,
  assertAssetKind,
  assertAssetField
};
