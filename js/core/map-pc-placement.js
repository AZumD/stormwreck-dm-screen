/**
 * Canonical PC map placement — one map per PC (catalogue id).
 * PC token / partyPositions are kept in sync; stale tokens on other maps are removed.
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
   * Find where a PC lives. Token on a map wins over partyPositions alone.
   * @returns {{ mapId: string, token?: object, percent?: {x,y}, world?: {x,y} } | null}
   */
  function findPcLocation(mapState, catalogueId, partyId) {
    if (!mapState || !catalogueId) return null;
    const pid = partyId || partyIdFromCatalogueId(catalogueId);
    const hits = [];

    Object.entries(mapState.tokens || {}).forEach(([mapId, list]) => {
      if (!Array.isArray(list)) return;
      list.forEach((t) => {
        if (matchesPcToken(t, catalogueId, pid)) hits.push({ mapId, token: t });
      });
    });

    if (hits.length === 1) {
      return { mapId: hits[0].mapId, token: hits[0].token };
    }
    if (hits.length > 1) {
      const partyMapId = mapState.partyPositions?.[pid]?.mapId;
      const preferred = hits.find((h) => h.mapId === partyMapId);
      const winner = preferred || hits.reduce((a, b) =>
        tokenTimestamp(b.token) > tokenTimestamp(a.token) ? b : a
      );
      return { mapId: winner.mapId, token: winner.token };
    }

    const saved = mapState.partyPositions?.[pid];
    if (saved?.mapId != null && saved.x != null && saved.y != null) {
      return { mapId: saved.mapId, percent: { x: saved.x, y: saved.y } };
    }
    return null;
  }

  /**
   * Remove duplicate PC tokens across maps. Prefer partyPositions.mapId, else newest token id.
   */
  function normalizeDuplicates(campaignId) {
    if (!window.CampaignMapState?.get) return false;
    const state = CampaignMapState.get(campaignId);
    const tokens = state.tokens || {};
    const partyPositions = state.partyPositions || {};
    const byCatalogue = new Map();

    Object.entries(tokens).forEach(([mapId, list]) => {
      if (!Array.isArray(list)) return;
      list.forEach((t) => {
        if (t?.kind !== "pc") return;
        const cid = t.catalogueId || catalogueIdFromPartyId(t.partyId);
        if (!cid) return;
        if (!byCatalogue.has(cid)) byCatalogue.set(cid, []);
        byCatalogue.get(cid).push({ mapId, token: t });
      });
    });

    const tokenPatch = {};
    let changed = false;

    byCatalogue.forEach((placements, catalogueId) => {
      if (placements.length <= 1) return;
      const pid = partyIdFromCatalogueId(catalogueId);
      const partyMapId = partyPositions[pid]?.mapId;
      let winner = placements.find((p) => p.mapId === partyMapId);
      if (!winner) {
        winner = placements.reduce((a, b) =>
          tokenTimestamp(b.token) > tokenTimestamp(a.token) ? b : a
        );
      }
      placements.forEach((p) => {
        if (p.mapId === winner.mapId && p.token.id === winner.token.id) return;
        if (!tokenPatch[p.mapId]) {
          tokenPatch[p.mapId] = (tokens[p.mapId] || []).filter((t) => t.id !== p.token.id);
        } else {
          tokenPatch[p.mapId] = tokenPatch[p.mapId].filter((t) => t.id !== p.token.id);
        }
        changed = true;
      });
    });

    if (changed) {
      CampaignMapState.patch(campaignId, { tokens: tokenPatch });
    }
    return changed;
  }

  /**
   * Place/move/remove a PC on a map. Single patch updates partyPositions + tokens.
   * @param {string} campaignId
   * @param {{ catalogueId?: string, partyId?: string, mapId?: string|null, percent?: {x,y}, world?: {x,y}, map?: object, token?: object, remove?: boolean }} opts
   */
  function placePcOnMap(campaignId, opts) {
    if (!window.CampaignMapState?.get) return { ok: false, error: "Map state unavailable" };
    const { catalogueId, partyId } = resolveIds(opts || {});
    if (!catalogueId || !partyId) return { ok: false, error: "Missing PC identity" };

    const state = CampaignMapState.get(campaignId);
    const allTokens = cloneTokensMap(state.tokens);
    const partyPositions = { ...(state.partyPositions || {}) };

    if (opts.remove || !opts.mapId) {
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

    partyPositions[partyId] = { mapId, x: percent.x, y: percent.y };

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
      partyPositions: { [partyId]: partyPositions[partyId] },
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
    normalizeDuplicates,
    placePcOnMap,
    syncTokenDrag,
    removePcToken
  };
})();
