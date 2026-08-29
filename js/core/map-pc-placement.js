/**
 * Canonical PC map placement — partyPositions[pc:id] is the source of truth.
 * tokens[mapId][] is kept synchronized as combat/map representation only.
 */
window.MapPcPlacement = (function () {
  "use strict";

  function catalogueIdFromPartyId(partyId) {
    if (!partyId) return null;
    const s = String(partyId);
    return s.startsWith("pc:") ? s.slice(3) : null;
  }

  function partyIdFromCatalogueId(catalogueId) {
    return catalogueId ? `pc:${catalogueId}` : null;
  }

  function resolveIds(opts) {
    const catalogueId = opts.catalogueId || catalogueIdFromPartyId(opts.partyId);
    const partyId = opts.partyId || partyIdFromCatalogueId(catalogueId);
    return { catalogueId, partyId };
  }

  function matchesPcToken(token, catalogueId, partyId) {
    if (!token || token.kind !== "pc") return false;
    if (catalogueId && token.catalogueId === catalogueId) return true;
    if (partyId && token.partyId === partyId) return true;
    const derived = catalogueIdFromPartyId(token.partyId);
    if (catalogueId && derived === catalogueId) return true;
    return false;
  }

  function tokenTimestamp(token) {
    const m = String(token?.id || "").match(/^tok-pc-([a-z0-9]+)-/i);
    if (m) return parseInt(m[1], 36) || 0;
    return 0;
  }

  function cloneTokensMap(tokens) {
    const out = {};
    Object.keys(tokens || {}).forEach((mapId) => {
      const list = tokens[mapId];
      out[mapId] = Array.isArray(list) ? list.map((t) => ({ ...t })) : [];
    });
    return out;
  }

  /**
   * Canonical location from partyPositions. Token on that map is attached for world coords only.
   */
  function findPcLocation(mapState, catalogueId, partyId) {
    if (!mapState || !catalogueId) return null;
    const pid = partyId || partyIdFromCatalogueId(catalogueId);
    const saved = mapState.partyPositions?.[pid];
    if (!saved?.mapId || saved.x == null || saved.y == null) return null;

    const result = { mapId: saved.mapId, percent: { x: saved.x, y: saved.y } };
    const list = mapState.tokens?.[saved.mapId];
    if (Array.isArray(list)) {
      const token = list.find((t) => matchesPcToken(t, catalogueId, pid));
      if (token) result.token = token;
    }
    return result;
  }

  function normalizePcMapState(mapState) {
    const state = {
      partyPositions: { ...(mapState?.partyPositions || {}) },
      tokens: cloneTokensMap(mapState?.tokens)
    };

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
        canonical = { mapId: winner.mapId, x: 50, y: 50 };
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

  function normalizeDuplicates(campaignId) {
    if (!window.CampaignMapState?.get) return false;
    const state = CampaignMapState.get(campaignId);
    const beforeTokens = state.tokens || {};
    const beforeParty = state.partyPositions || {};
    const normalized = normalizePcMapState(state);

    const tokensPatch = {};
    const allMapIds = new Set([
      ...Object.keys(beforeTokens),
      ...Object.keys(normalized.tokens)
    ]);
    allMapIds.forEach((mapId) => {
      const prev = beforeTokens[mapId] || [];
      const next = normalized.tokens[mapId] || [];
      if (JSON.stringify(prev) !== JSON.stringify(next)) tokensPatch[mapId] = next;
    });

    const partyPatch = {};
    const allPartyIds = new Set([
      ...Object.keys(beforeParty),
      ...Object.keys(normalized.partyPositions)
    ]);
    allPartyIds.forEach((id) => {
      const prev = beforeParty[id];
      const next = normalized.partyPositions[id];
      if (JSON.stringify(prev) !== JSON.stringify(next)) partyPatch[id] = next ?? null;
    });

    if (!Object.keys(tokensPatch).length && !Object.keys(partyPatch).length) return false;

    const patch = {};
    if (Object.keys(tokensPatch).length) patch.tokens = tokensPatch;
    if (Object.keys(partyPatch).length) patch.partyPositions = partyPatch;
    CampaignMapState.patch(campaignId, patch);
    return true;
  }

  function placePcOnMap(campaignId, opts) {
    if (!window.CampaignMapState?.get) return { ok: false, error: "Map state unavailable" };
    const { catalogueId, partyId } = resolveIds(opts || {});
    if (!catalogueId || !partyId) return { ok: false, error: "Missing PC identity" };

    const state = CampaignMapState.get(campaignId);
    const allTokens = cloneTokensMap(state.tokens);

    if (opts.remove || !opts.mapId) {
      const partyPositions = { ...(state.partyPositions || {}) };
      delete partyPositions[partyId];
      Object.keys(allTokens).forEach((mid) => {
        allTokens[mid] = (allTokens[mid] || []).filter((t) => !matchesPcToken(t, catalogueId, partyId));
      });
      CampaignMapState.patch(campaignId, {
        partyPositions: { [partyId]: null },
        tokens: allTokens
      });
      return { ok: true, removed: true };
    }

    const mapId = String(opts.mapId);
    const map = opts.map;
    const calibrated = map && window.MapTokenSize?.isCalibratedMap?.(map);

    let percent = opts.percent;
    let world = opts.world;
    if (world && map && window.MapDistance?.worldToPercent && !percent) {
      percent = MapDistance.worldToPercent(world.x, world.y, map);
    }
    if (percent && map && window.MapDistance?.percentToWorld && !world) {
      world = MapDistance.percentToWorld(percent.x, percent.y, map);
    }
    if (!percent) return { ok: false, error: "Missing position" };

    Object.keys(allTokens).forEach((mid) => {
      if (mid === mapId) return;
      allTokens[mid] = (allTokens[mid] || []).filter((t) => !matchesPcToken(t, catalogueId, partyId));
    });

    let list = Array.isArray(allTokens[mapId]) ? [...allTokens[mapId]] : [];
    if (calibrated && world) {
      const idx = list.findIndex((t) => matchesPcToken(t, catalogueId, partyId));
      if (opts.token) {
        const token = { ...opts.token, partyId, catalogueId, x: world.x, y: world.y };
        if (idx >= 0) list[idx] = { ...list[idx], ...token };
        else list.push(token);
      } else if (idx >= 0) {
        list[idx] = { ...list[idx], x: world.x, y: world.y, partyId, catalogueId };
      }
    } else {
      list = list.filter((t) => !matchesPcToken(t, catalogueId, partyId));
    }
    allTokens[mapId] = list;

    const tokensPatch = {};
    Object.keys(allTokens).forEach((mid) => {
      const prev = state.tokens?.[mid] || [];
      const next = allTokens[mid] || [];
      if (JSON.stringify(prev) !== JSON.stringify(next)) tokensPatch[mid] = next;
    });
    Object.keys(state.tokens || {}).forEach((mid) => {
      if (!(mid in allTokens) && (state.tokens[mid] || []).length) tokensPatch[mid] = [];
    });

    CampaignMapState.patch(campaignId, {
      partyPositions: { [partyId]: { mapId, x: percent.x, y: percent.y } },
      tokens: tokensPatch
    });
    return { ok: true, mapId, partyId, catalogueId };
  }

  function syncTokenDrag(campaignId, mapId, token, map) {
    if (!token || token.kind !== "pc") return;
    const { catalogueId, partyId } = resolveIds({
      catalogueId: token.catalogueId,
      partyId: token.partyId
    });
    if (!catalogueId) return;
    placePcOnMap(campaignId, {
      catalogueId,
      partyId,
      mapId,
      world: { x: token.x, y: token.y },
      map,
      token
    });
  }

  function removePcToken(campaignId, mapId, token, map) {
    if (!token || token.kind !== "pc") return false;
    const { catalogueId, partyId } = resolveIds({
      catalogueId: token.catalogueId,
      partyId: token.partyId
    });
    if (!catalogueId) return false;
    placePcOnMap(campaignId, { catalogueId, partyId, remove: true, map });
    return true;
  }

  return {
    catalogueIdFromPartyId,
    partyIdFromCatalogueId,
    matchesPcToken,
    findPcLocation,
    normalizePcMapState,
    normalizeDuplicates,
    placePcOnMap,
    syncTokenDrag,
    removePcToken
  };
})();
