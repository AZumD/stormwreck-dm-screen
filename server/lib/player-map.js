/**
 * Player-safe map view — derives map from canonical partyPositions only.
 */
"use strict";

const db = require("./db");
const campaigns = require("./campaigns");
const catalogues = require("./catalogues");
const locationMaps = require("./catalogue-location-maps");
const assets = require("./assets");
const authorize = require("./authorize");
const { assertSafeId } = require("./ids");
const {
  findCanonicalPcLocation,
  partyIdFromCatalogueId,
  catalogueIdFromPartyId
} = require("./map-pc-placement");
const { percentToWorld, worldToPercent } = require("./map-distance");

function locationLinkId(entry) {
  if (!entry) return null;
  if (entry.linkId) return entry.linkId;
  if (entry.id?.startsWith("sw-")) return entry.id.slice(3);
  return entry.id;
}

async function findLocationByMapId(mapId) {
  const safe = assertSafeId(mapId, "map id");
  const candidates = new Set([safe, safe.startsWith("sw-") ? safe : `sw-${safe}`]);
  for (const type of ["location"]) {
    const entries = await catalogues.list(type);
    for (const entry of entries) {
      if (candidates.has(entry.id) || locationLinkId(entry) === safe) {
        return entry;
      }
    }
  }
  return null;
}

function playerFogDto(fogRaw) {
  if (!fogRaw || typeof fogRaw !== "object") {
    return { enabled: false, revision: 0, revealedAll: false, strokes: [] };
  }
  const strokesObj =
    fogRaw.strokes && typeof fogRaw.strokes === "object" && !Array.isArray(fogRaw.strokes)
      ? fogRaw.strokes
      : {};
  const strokes = Object.values(strokesObj)
    .filter(Boolean)
    .sort((a, b) => (a.seq || 0) - (b.seq || 0))
    .map((s) => ({
      id: s.id,
      seq: s.seq,
      mode: s.mode === "hide" ? "hide" : "reveal",
      radius: Number(s.radius) || 0.025,
      points: Array.isArray(s.points) ? s.points : []
    }));
  return {
    enabled: Boolean(fogRaw.enabled),
    revision: Number(fogRaw.revision) || 0,
    revealedAll: Boolean(fogRaw.revealedAll),
    strokes
  };
}

function buildRevision(mapId, fog, tokens) {
  const fogRev = fog?.revision || 0;
  const tokenSig = (tokens || [])
    .map((t) => `${t.id}:${t.percent?.x ?? ""},${t.percent?.y ?? ""}:${t.kind ?? ""}`)
    .join("|");
  return `${mapId}:${fogRev}:${tokenSig}`;
}

function mapMetaFromView(calibrated, uvtt, entry) {
  return {
    calibrated,
    widthPx: uvtt?.widthPx || entry.mapCalibration?.widthPx || null,
    heightPx: uvtt?.heightPx || entry.mapCalibration?.heightPx || null,
    grid: calibrated ? uvtt?.grid || entry.mapCalibration?.grid || null : null
  };
}

function tokenToPlayerDto(token, mapMeta, viewerCatalogueId) {
  if (!token || token.visible === false) return null;
  if (!["pc", "npc", "monster"].includes(token.kind)) return null;

  let percent = null;
  if (token.x != null && token.y != null && mapMeta.calibrated) {
    percent = worldToPercent(token.x, token.y, mapMeta);
  }
  if (!percent && token.percent?.x != null && token.percent?.y != null) {
    percent = { x: token.percent.x, y: token.percent.y };
  }

  const catalogueId = token.catalogueId || null;
  return {
    id: token.id,
    kind: token.kind,
    label: token.label || token.id,
    imageUrl: token.imageUrl || null,
    percent,
    gridCells: Number(token.gridCells) > 0 ? Number(token.gridCells) : 1,
    isSelf: token.kind === "pc" && Boolean(viewerCatalogueId && catalogueId === viewerCatalogueId)
  };
}

async function loadCampaignPcLookup(campaignId) {
  if (!db.isDbConfigured()) return new Map();
  const result = await db.query(
    `SELECT catalogue_pc_id, name, portrait_url
     FROM characters
     WHERE campaign_id = $1 AND catalogue_pc_id IS NOT NULL`,
    [campaignId]
  );
  const byCatalogue = new Map();
  for (const row of result.rows) {
    if (row.catalogue_pc_id) byCatalogue.set(row.catalogue_pc_id, row);
  }
  return byCatalogue;
}

function buildPlayerMapTokens(mapState, mapId, viewerCatalogueId, mapMeta, pcLookup) {
  const tokens = [];
  const seenPc = new Set();

  const list = mapState.tokens?.[mapId];
  if (Array.isArray(list)) {
    for (const raw of list) {
      const dto = tokenToPlayerDto(raw, mapMeta, viewerCatalogueId);
      if (!dto || !dto.percent) continue;
      if (dto.kind === "pc" && raw.catalogueId) {
        seenPc.add(raw.catalogueId);
        const meta = pcLookup.get(raw.catalogueId);
        if (meta?.name) dto.label = meta.name;
        if (!dto.imageUrl && meta?.portrait_url) dto.imageUrl = meta.portrait_url;
      }
      tokens.push(dto);
    }
  }

  for (const [partyId, pos] of Object.entries(mapState.partyPositions || {})) {
    if (pos.mapId !== mapId || pos.x == null || pos.y == null) continue;
    const catalogueId = catalogueIdFromPartyId(partyId);
    if (!catalogueId || seenPc.has(catalogueId)) continue;
    seenPc.add(catalogueId);
    const meta = pcLookup.get(catalogueId);
    tokens.push({
      id: `party-${partyId}`,
      kind: "pc",
      label: meta?.name || "Party member",
      imageUrl: meta?.portrait_url || null,
      percent: { x: pos.x, y: pos.y },
      gridCells: 1,
      isSelf: catalogueId === viewerCatalogueId
    });
  }

  return tokens;
}

async function assertCharacterControl(req, campaignId, characterId) {
  if (!db.isDbConfigured()) {
    const err = new Error("DATABASE_URL is not configured");
    err.status = 503;
    throw err;
  }
  const user = await authorize.requireUser(req);
  const safeCampaign = assertSafeId(campaignId, "campaign id");
  const safeCharacter = assertSafeId(characterId, "character id");
  await authorize.requireCampaignMember(req, safeCampaign);
  const result = await db.query(
    `SELECT c.id, c.name, c.catalogue_pc_id, c.portrait_url
     FROM characters c
     JOIN character_controllers cc ON cc.character_id = c.id AND cc.user_id = $1
     WHERE c.id = $2 AND c.campaign_id = $3`,
    [user.id, safeCharacter, safeCampaign]
  );
  if (!result.rows.length) {
    const err = new Error("Character not found or not controlled by you");
    err.status = 403;
    throw err;
  }
  return result.rows[0];
}

async function getPlayerMapView(req, campaignId, characterId) {
  const character = await assertCharacterControl(req, campaignId, characterId);
  const catalogueId = character.catalogue_pc_id || character.id;
  const mapState = (await campaigns.getDocument(campaignId, "map-state")) || {};
  const loc = findCanonicalPcLocation(mapState, catalogueId);

  if (!loc?.mapId) {
    return { available: false, revision: "none", characterId: character.id };
  }

  const mapId = loc.mapId;
  const entry = await findLocationByMapId(mapId);
  if (!entry) {
    return { available: false, revision: "none", characterId: character.id };
  }

  const catalogueKey = entry.id;
  const uvtt = await locationMaps.getFullMap("location", catalogueKey);
  const calibrated = Boolean(entry.mapCalibration || uvtt?.grid);
  const imageUrl = `/api/player/campaigns/${encodeURIComponent(campaignId)}/maps/${encodeURIComponent(mapId)}/image?characterId=${encodeURIComponent(character.id)}`;

  let tokenDto = {
    label: character.name,
    percent: { x: loc.percent.x, y: loc.percent.y },
    gridCells: 1,
    imageUrl: character.portrait_url || null
  };
  if (loc.token) {
    tokenDto = {
      label: loc.token.label || character.name,
      percent: loc.percent,
      world: { x: loc.token.x, y: loc.token.y },
      gridCells: loc.token.gridCells || 1,
      imageUrl: loc.token.imageUrl || character.portrait_url || null
    };
  }

  const fog = playerFogDto(mapState.fog?.[mapId]);
  const mapMeta = mapMetaFromView(calibrated, uvtt, entry);
  const pcLookup = await loadCampaignPcLookup(campaignId);
  const tokens = buildPlayerMapTokens(mapState, mapId, catalogueId, mapMeta, pcLookup);
  const selfToken =
    tokens.find((t) => t.isSelf) ||
    tokens.find((t) => t.id === tokenDto.id) ||
    (tokenDto.percent
      ? {
          id: "self",
          kind: "pc",
          label: tokenDto.label,
          imageUrl: tokenDto.imageUrl,
          percent: tokenDto.percent,
          gridCells: tokenDto.gridCells || 1,
          isSelf: true
        }
      : null);

  return {
    available: true,
    revision: buildRevision(mapId, fog, tokens),
    characterId: character.id,
    cataloguePcId: catalogueId,
    mapId,
    mapName: entry.name || entry.title || mapId,
    imageUrl,
    calibrated,
    widthPx: mapMeta.widthPx,
    heightPx: mapMeta.heightPx,
    grid: mapMeta.grid,
    scale: uvtt?.scale || entry.mapCalibration?.scale || null,
    token: selfToken || tokenDto,
    tokens,
    fog
  };
}

async function streamPlayerMapImage(req, campaignId, mapId, characterId) {
  const character = await assertCharacterControl(req, campaignId, characterId);
  const catalogueId = character.catalogue_pc_id || character.id;
  const mapState = (await campaigns.getDocument(campaignId, "map-state")) || {};
  const loc = findCanonicalPcLocation(mapState, catalogueId);
  if (!loc || loc.mapId !== assertSafeId(mapId, "map id")) {
    const err = new Error("Map not available for this character");
    err.status = 403;
    throw err;
  }

  const entry = await findLocationByMapId(mapId);
  if (!entry) {
    const err = new Error("Map not found");
    err.status = 404;
    throw err;
  }

  const asset = await assets.readAsset("maps", "location", entry.id);
  if (!asset) {
    const err = new Error("Map image not found");
    err.status = 404;
    throw err;
  }

  return {
    buffer: asset.buffer,
    mime: asset.mime || "image/png",
    playerField: entry.playerMapImage ? "playerMapImage" : "mapImage"
  };
}

module.exports = {
  findCanonicalPcLocation,
  getPlayerMapView,
  streamPlayerMapImage,
  partyIdFromCatalogueId,
  buildPlayerMapTokens,
  tokenToPlayerDto
};
