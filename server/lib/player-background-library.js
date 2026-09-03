"use strict";

/**
 * Player Companion Background catalogue integration.
 *
 * Kept as a small additive adapter so Backgrounds can become a first-class
 * player library type without duplicating the large player API module.
 */

const player = require("./player");

const BACKGROUND_TYPE = "background";
const BACKGROUND_ACTION = "background";

function withBackgroundAction(dto) {
  if (!dto || dto.type !== BACKGROUND_TYPE) return dto;
  const actions = Array.isArray(dto.actions) ? dto.actions.slice() : [];
  if (!actions.includes(BACKGROUND_ACTION)) actions.push(BACKGROUND_ACTION);
  return { ...dto, actions };
}

function formatBackgroundRef(id, name) {
  const safeId = String(id || "").trim();
  const label = String(name || safeId).replace(/\|/g, "/");
  return `@background:${safeId}|${label}`;
}

function install() {
  if (player.__backgroundLibraryInstalled) return player;
  Object.defineProperty(player, "__backgroundLibraryInstalled", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });

  player.PLAYER_LIBRARY_BROWSE_TYPES.add(BACKGROUND_TYPE);
  player.PLAYER_CATALOGUE_TYPES.add(BACKGROUND_TYPE);
  player.LIBRARY_ATTACH_ACTIONS.add(BACKGROUND_ACTION);

  const originalListPlayerCatalogue = player.listPlayerCatalogue;
  const originalResolveCatalogue = player.resolveCatalogue;
  const originalAttachLibraryEntry = player.attachLibraryEntry;

  player.listPlayerCatalogue = async function listPlayerCatalogueWithBackgrounds(req, campaignId, type, query) {
    const result = await originalListPlayerCatalogue(req, campaignId, type, query);
    if (result?.type !== BACKGROUND_TYPE || !Array.isArray(result.entries)) return result;
    return {
      ...result,
      entries: result.entries.map((entry) => withBackgroundAction(entry))
    };
  };

  player.resolveCatalogue = async function resolveCatalogueWithBackgrounds(req, campaignId, type, id) {
    const dto = await originalResolveCatalogue(req, campaignId, type, id);
    return withBackgroundAction(dto);
  };

  player.attachLibraryEntry = async function attachLibraryEntryWithBackgrounds(req, campaignId, characterId, body) {
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "").trim();
    if (action !== BACKGROUND_ACTION) {
      return originalAttachLibraryEntry(req, campaignId, characterId, payload);
    }

    const type = String(payload.type || "").trim();
    if (type !== BACKGROUND_TYPE) {
      const err = new Error(`Action ${BACKGROUND_ACTION} does not apply to type ${type || "unknown"}`);
      err.status = 400;
      throw err;
    }

    // resolveCatalogue performs the normal campaign membership, type, id and
    // visibility checks before anything is written to the character sheet.
    const entry = await player.resolveCatalogue(req, campaignId, BACKGROUND_TYPE, payload.id);
    const ref = formatBackgroundRef(entry.id || payload.id, entry.name || payload.id);
    const character = await player.patchMyCharacter(req, campaignId, characterId, {
      background: ref
    });
    return { character, attached: ref, action: BACKGROUND_ACTION };
  };

  return player;
}

install();

module.exports = {
  BACKGROUND_TYPE,
  BACKGROUND_ACTION,
  withBackgroundAction,
  formatBackgroundRef,
  install
};
