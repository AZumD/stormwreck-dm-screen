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
const { worldToPercent } = require("./map-distance");
const mapTokenSize = require("./map-token-size");
const mapFog = require("./map-fog");
const { resolveCatalogueId } = require("./entity-link-aliases");
const { pinsForMap } = require("./campaign-static-maps");

const PLAYER_PIN_TYPES = new Set(["pc", "npc", "monster"]);

/** Canonical PC percent from partyPositions — tokens must not override this. */
function canonicalPcPercent(mapState, mapId, linkId, catalogueId) {
  const partyId = partyIdFromCatalogueId(catalogueId);
  const pos = mapState.partyPositions?.[partyId];
  if (!pos || pos.x == null || pos.y == null) return null;
  if (pos.mapId !== mapId && pos.mapId !== linkId) return null;
  return { x: pos.x, y: pos.y };
}

/** Strip stale world coords from PC combat tokens; partyPositions percent is authoritative. */
function withCanonicalPcPosition(raw, mapState, mapId, linkId) {
  if (raw?.kind !== "pc") return raw;
  const catalogueId = raw.catalogueId || catalogueIdFromPartyId(raw.partyId);
  if (!catalogueId) return raw;
  const pct = canonicalPcPercent(mapState, mapId, linkId, catalogueId);
  if (!pct) return raw;
  const next = { ...raw, percent: pct };
  delete next.x;
  delete next.y;
  return next;
}

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
    .map((s) => {
      const base = {
        id: s.id,
        seq: s.seq,
        mode: s.mode === "hide" ? "hide" : "reveal"
      };
      if (s.shape === "rect" && Array.isArray(s.rect) && s.rect.length >= 4) {
        return { ...base, shape: "rect", rect: s.rect.map(Number) };
      }
      return {
        ...base,
        radius: Number(s.radius) || 0.025,
        points: Array.isArray(s.points) ? s.points : []
      };
    });
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
    .map(
      (t) =>
        `${t.id}:${t.percent?.x ?? ""},${t.percent?.y ?? ""}:${t.kind ?? ""}:${t.imageUrl ?? ""}:${t.gridCells ?? ""}`
    )
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

function tokenDedupeKey(kind, catalogueId, entityId, id) {
  if (catalogueId) return `${kind}:${catalogueId}`;
  if (entityId) return `${kind}:${entityId}`;
  return `${kind}:${id}`;
}

async function loadCatalogueEntry(kind, catalogueId) {
  if (!catalogueId || !kind) return null;
  let entry = await catalogues.get(kind, catalogueId);
  if (!entry && !String(catalogueId).startsWith("sw-")) {
    entry = await catalogues.get(kind, `sw-${catalogueId}`);
  }
  return entry;
}

async function enrichPlayerToken(raw, mapMeta, viewerCatalogueId, pcLookup, options = {}) {
  const kind = raw.kind;
  if (!PLAYER_PIN_TYPES.has(kind)) return null;
  if (raw.visible === false) return null;

  let percent = null;
  if (raw.x != null && raw.y != null && mapMeta.calibrated) {
    percent = worldToPercent(raw.x, raw.y, mapMeta);
  }
  if (!percent && raw.percent?.x != null && raw.percent?.y != null) {
    percent = { x: raw.percent.x, y: raw.percent.y };
  }
  if (!percent) return null;

  const catalogueId = raw.catalogueId || options.catalogueId || null;
  const entry = options.entry || (catalogueId ? await loadCatalogueEntry(kind, catalogueId) : null);

  const images = await mapTokenSize.resolvePinImageUrls(kind, entry, {
    catalogueId,
    entityId: raw.entityId,
    partyId: raw.partyId,
    tokenImage: raw.tokenImage,
    imageUrl: raw.imageUrl,
    portrait: raw.portrait
  });

  let gridCells = 0;
  const sizeMeta = await mapTokenSize.resolveGridCells(kind, entry);
  if (entry) {
    gridCells = sizeMeta.gridCells;
  } else if (Number(raw.gridCells) > 0) {
    gridCells = Number(raw.gridCells);
  } else {
    gridCells = sizeMeta.gridCells;
  }
  const span = mapTokenSize.cellSpanPercent(gridCells, mapMeta);

  let label = raw.label || entry?.name || raw.id;
  let imageUrl = images.url || raw.imageUrl || raw.tokenImage || null;
  const fallbackUrl = images.fallbackUrl || raw.fallbackUrl || null;

  if (kind === "pc" && catalogueId) {
    const meta = pcLookup.get(catalogueId);
    if (meta?.name) label = meta.name;
    if (!imageUrl && meta?.portrait_url) imageUrl = meta.portrait_url;
  }

  return {
    id: raw.id,
    kind,
    label,
    imageUrl,
    fallbackUrl,
    percent,
    gridCells,
    spanW: span.w,
    spanH: span.h,
    catalogueId,
    entityId: raw.entityId || null,
    isSelf: kind === "pc" && Boolean(viewerCatalogueId && catalogueId === viewerCatalogueId)
  };
}

function collectMapPins(campaignId, mapId, mapState, linkId) {
  const ids = [mapId, linkId].filter(Boolean);
  const pinPos = {};
  for (const id of ids) {
    Object.assign(pinPos, mapState.pinPositions?.[id] || {});
  }
  const removedIds = new Set();
  for (const id of ids) {
    const removed = mapState.removedPins?.[id];
    if (Array.isArray(removed)) removed.forEach((pinId) => removedIds.add(pinId));
  }

  const pins = [];
  const seenIds = new Set();

  for (const pin of pinsForMap(campaignId, mapId)) {
    if (!PLAYER_PIN_TYPES.has(pin.pinType)) continue;
    if (removedIds.has(pin.id)) continue;
    const pos = pinPos[pin.id];
    pins.push({
      ...pin,
      kind: pin.pinType,
      x: pos?.x ?? pin.x,
      y: pos?.y ?? pin.y,
      percent: { x: pos?.x ?? pin.x, y: pos?.y ?? pin.y }
    });
    seenIds.add(pin.id);
  }

  for (const id of ids) {
    const custom = mapState.customPins?.[id];
    if (!Array.isArray(custom)) continue;
    for (const pin of custom) {
      if (!PLAYER_PIN_TYPES.has(pin.pinType)) continue;
      if (removedIds.has(pin.id)) continue;
      if (seenIds.has(pin.id)) continue;
      const pos = pinPos[pin.id];
      pins.push({
        ...pin,
        kind: pin.pinType,
        x: pos?.x ?? pin.x,
        y: pos?.y ?? pin.y,
        percent: { x: pos?.x ?? pin.x, y: pos?.y ?? pin.y }
      });
      seenIds.add(pin.id);
    }
  }

  return pins.filter((p) => p.percent?.x != null && p.percent?.y != null);
}

async function buildPlayerMapTokens(mapState, mapId, viewerCatalogueId, mapMeta, pcLookup, options = {}) {
  const tokens = [];
  const seenKeys = new Set();
  const campaignId = options.campaignId || null;
  const linkId = options.linkId || mapId;

  const list = mapState.tokens?.[mapId];
  if (Array.isArray(list)) {
    for (const raw of list) {
      const adjusted = withCanonicalPcPosition(raw, mapState, mapId, linkId);
      const dto = await enrichPlayerToken(adjusted, mapMeta, viewerCatalogueId, pcLookup);
      if (!dto) continue;
      tokens.push(dto);
      seenKeys.add(tokenDedupeKey(dto.kind, dto.catalogueId, dto.entityId, dto.id));
    }
  }

  if (campaignId) {
    const pins = collectMapPins(campaignId, mapId, mapState, linkId);
    for (const pin of pins) {
      const catalogueId = resolveCatalogueId(pin.entityId, pin.pinType || pin.kind);
      const kind = pin.pinType || pin.kind;
      const key = tokenDedupeKey(kind, catalogueId, pin.entityId, pin.id);
      if (seenKeys.has(key)) continue;

      const entry = catalogueId ? await loadCatalogueEntry(kind, catalogueId) : null;
      const dto = await enrichPlayerToken(
        {
          id: pin.id,
          kind,
          label: pin.label,
          entityId: pin.entityId,
          catalogueId,
          visible: true,
          percent: pin.percent
        },
        mapMeta,
        viewerCatalogueId,
        pcLookup,
        { entry, catalogueId }
      );
      if (!dto) continue;
      tokens.push(dto);
      seenKeys.add(key);
    }
  }

  const seenPc = new Set(tokens.filter((t) => t.kind === "pc" && t.catalogueId).map((t) => t.catalogueId));

  for (const [partyId, pos] of Object.entries(mapState.partyPositions || {})) {
    if (pos.mapId !== mapId && pos.mapId !== linkId) continue;
    if (pos.x == null || pos.y == null) continue;
    const catalogueId = catalogueIdFromPartyId(partyId);
    if (!catalogueId || seenPc.has(catalogueId)) continue;
    const key = tokenDedupeKey("pc", catalogueId, null, `party-${partyId}`);
    if (seenKeys.has(key)) continue;

    seenPc.add(catalogueId);
    seenKeys.add(key);
    const meta = pcLookup.get(catalogueId);
    const entry = await loadCatalogueEntry("pc", catalogueId);
    const dto = await enrichPlayerToken(
      {
        id: `party-${partyId}`,
        kind: "pc",
        label: meta?.name || entry?.name || "Party member",
        catalogueId,
        visible: true,
        percent: { x: pos.x, y: pos.y }
      },
      mapMeta,
      viewerCatalogueId,
      pcLookup,
      { entry, catalogueId }
    );
    if (dto) tokens.push(dto);
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
     JOIN campaign_characters campc ON campc.character_id = c.id AND campc.campaign_id = $3
     WHERE c.id = $2`,
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

  const linkId = locationLinkId(entry) || mapId;
  const catalogueKey = entry.id;
  const uvtt = await locationMaps.getFullMap("location", catalogueKey);
  const calibrated = Boolean(entry.mapCalibration || uvtt?.grid);
  const imageUrl = `/api/player/campaigns/${encodeURIComponent(campaignId)}/maps/${encodeURIComponent(mapId)}/image?characterId=${encodeURIComponent(character.id)}`;

  let tokenDto = {
    label: character.name,
    percent: { x: loc.percent.x, y: loc.percent.y },
    gridCells: 1,
    spanW: null,
    spanH: null,
    imageUrl: character.portrait_url || null
  };
  if (loc.token) {
    tokenDto = {
      label: loc.token.label || character.name,
      percent: loc.percent,
      gridCells: loc.token.gridCells || 1,
      imageUrl: loc.token.imageUrl || character.portrait_url || null
    };
  }

  const fog = playerFogDto(mapState.fog?.[mapId]);
  const mapMeta = mapMetaFromView(calibrated, uvtt, entry);
  const pcLookup = await loadCampaignPcLookup(campaignId);
  const tokensRaw = await buildPlayerMapTokens(mapState, mapId, catalogueId, mapMeta, pcLookup, {
    campaignId,
    linkId
  });

  if (calibrated && mapMeta.grid) {
    for (const t of tokensRaw) {
      if (t.spanW == null || t.spanH == null) {
        const span = mapTokenSize.cellSpanPercent(t.gridCells || 1, mapMeta);
        t.spanW = span.w;
        t.spanH = span.h;
      }
    }
    if (tokenDto.gridCells) {
      const span = mapTokenSize.cellSpanPercent(tokenDto.gridCells, mapMeta);
      tokenDto.spanW = span.w;
      tokenDto.spanH = span.h;
    }
  }

  const tokens = mapFog.filterVisibleTokens(tokensRaw, fog);

  const selfFromList = tokens.find((t) => t.isSelf);
  let selfToken = selfFromList || tokens.find((t) => t.id === tokenDto.id);
  if (!selfToken && tokenDto.percent) {
    const entry = await loadCatalogueEntry("pc", catalogueId);
    selfToken = await enrichPlayerToken(
      {
        id: "self",
        kind: "pc",
        label: tokenDto.label || character.name,
        catalogueId,
        visible: true,
        percent: tokenDto.percent,
        gridCells: tokenDto.gridCells || 1,
        imageUrl: tokenDto.imageUrl || character.portrait_url || null
      },
      mapMeta,
      catalogueId,
      pcLookup,
      { entry, catalogueId }
    );
    if (selfToken) selfToken.isSelf = true;
  }
  if (selfToken) selfToken.isSelf = true;

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

async function loadCampaignPcLookup(campaignId) {
  if (!db.isDbConfigured()) return new Map();
  const result = await db.query(
    `SELECT c.catalogue_pc_id, c.name, c.portrait_url
     FROM characters c
     JOIN campaign_characters cc ON cc.character_id = c.id AND cc.campaign_id = $1
     WHERE c.catalogue_pc_id IS NOT NULL`,
    [campaignId]
  );
  const byCatalogue = new Map();
  for (const row of result.rows) {
    if (row.catalogue_pc_id) byCatalogue.set(row.catalogue_pc_id, row);
  }
  return byCatalogue;
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

/** @deprecated use enrichPlayerToken */
async function tokenToPlayerDto(token, mapMeta, viewerCatalogueId) {
  return enrichPlayerToken(token, mapMeta, viewerCatalogueId, new Map());
}

module.exports = {
  findCanonicalPcLocation,
  getPlayerMapView,
  streamPlayerMapImage,
  partyIdFromCatalogueId,
  buildPlayerMapTokens,
  tokenToPlayerDto,
  enrichPlayerToken,
  collectMapPins,
  playerFogDto
};
