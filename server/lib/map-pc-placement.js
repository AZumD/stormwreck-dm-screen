/**
 * Canonical PC map location — partyPositions[pc:id] is source of truth.
 * tokens[mapId][] is a synchronized combat/map representation only.
 */
"use strict";

function partyIdFromCatalogueId(catalogueId) {
  return catalogueId ? `pc:${catalogueId}` : null;
}

function catalogueIdFromPartyId(partyId) {
  if (!partyId) return null;
  const s = String(partyId);
  return s.startsWith("pc:") ? s.slice(3) : null;
}

function matchesPcToken(token, catalogueId, partyId) {
  if (!token || token.kind !== "pc") return false;
  if (catalogueId && token.catalogueId === catalogueId) return true;
  if (partyId && token.partyId === partyId) return true;
  const derived = catalogueIdFromPartyId(token.partyId);
  return Boolean(catalogueId && derived === catalogueId);
}

function tokenTimestamp(token) {
  const m = String(token?.id || "").match(/^tok-pc-([a-z0-9]+)-/i);
  if (m) return parseInt(m[1], 36) || 0;
  return 0;
}

/**
 * Canonical PC location from partyPositions only.
 * Token on the canonical map is attached for world coords / combat art — never used to pick mapId.
 */
function findCanonicalPcLocation(mapState, catalogueId) {
  if (!mapState || !catalogueId) return null;
  const partyId = partyIdFromCatalogueId(catalogueId);
  const saved = mapState.partyPositions?.[partyId];
  if (!saved?.mapId || saved.x == null || saved.y == null) return null;

  const result = {
    mapId: saved.mapId,
    partyId,
    catalogueId,
    percent: { x: saved.x, y: saved.y }
  };

  const list = mapState.tokens?.[saved.mapId];
  if (Array.isArray(list)) {
    const token = list.find((t) => matchesPcToken(t, catalogueId, partyId));
    if (token) result.token = token;
  }
  return result;
}

/**
 * Repair tokens to agree with canonical partyPositions.
 * - Removes PC tokens on non-canonical maps
 * - Dedupes multiple PC tokens on the canonical map (newest wins)
 * - Legacy: if tokens exist but no partyPositions, promotes newest token to partyPositions
 */
function normalizePcMapState(mapState) {
  const state = {
    partyPositions: { ...(mapState?.partyPositions || {}) },
    tokens: {}
  };
  Object.entries(mapState?.tokens || {}).forEach(([mapId, list]) => {
    state.tokens[mapId] = Array.isArray(list) ? list.map((t) => ({ ...t })) : [];
  });

  const byCatalogue = new Map();
  Object.entries(state.tokens).forEach(([mapId, list]) => {
    list.forEach((t) => {
      if (t?.kind !== "pc") return;
      const cid = t.catalogueId || catalogueIdFromPartyId(t.partyId);
      if (!cid) return;
      if (!byCatalogue.has(cid)) byCatalogue.set(cid, []);
      byCatalogue.get(cid).push({ mapId, token: t });
    });
  });

  byCatalogue.forEach((placements, catalogueId) => {
    const partyId = partyIdFromCatalogueId(catalogueId);
    let canonical = state.partyPositions[partyId];

    if (!canonical?.mapId && placements.length) {
      const winner = placements.reduce((a, b) =>
        tokenTimestamp(b.token) > tokenTimestamp(a.token) ? b : a
      );
      const pct =
        winner.token.x != null && winner.token.y != null
          ? { x: winner.token.x, y: winner.token.y }
          : { x: 50, y: 50 };
      canonical = { mapId: winner.mapId, x: pct.x, y: pct.y };
      state.partyPositions[partyId] = canonical;
    }

    if (!canonical?.mapId) {
      placements.forEach((p) => {
        state.tokens[p.mapId] = state.tokens[p.mapId].filter((t) => t.id !== p.token.id);
      });
      return;
    }

    const canonicalMapId = canonical.mapId;
    placements.forEach((p) => {
      if (p.mapId !== canonicalMapId) {
        state.tokens[p.mapId] = state.tokens[p.mapId].filter((t) => t.id !== p.token.id);
      }
    });

    const onCanonical = (state.tokens[canonicalMapId] || []).filter((t) =>
      matchesPcToken(t, catalogueId, partyId)
    );
    if (onCanonical.length > 1) {
      const keep = onCanonical.reduce((a, b) => (tokenTimestamp(b) > tokenTimestamp(a) ? b : a));
      state.tokens[canonicalMapId] = state.tokens[canonicalMapId].filter(
        (t) => !matchesPcToken(t, catalogueId, partyId) || t.id === keep.id
      );
    }
  });

  return state;
}

function tokensPatchFromNormalize(before, after) {
  const patch = {};
  const mapIds = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  mapIds.forEach((mapId) => {
    const prev = before?.[mapId] || [];
    const next = after?.[mapId] || [];
    if (JSON.stringify(prev) !== JSON.stringify(next)) patch[mapId] = next;
  });
  return patch;
}

function partyPositionsPatchFromNormalize(before, after) {
  const patch = {};
  const ids = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  ids.forEach((id) => {
    const prev = before?.[id];
    const next = after?.[id];
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      patch[id] = next === undefined ? null : next;
    }
  });
  return patch;
}

module.exports = {
  partyIdFromCatalogueId,
  catalogueIdFromPartyId,
  matchesPcToken,
  findCanonicalPcLocation,
  normalizePcMapState,
  tokensPatchFromNormalize,
  partyPositionsPatchFromNormalize
};
