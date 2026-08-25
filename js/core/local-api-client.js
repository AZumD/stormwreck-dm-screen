/**
 * HTTP client for the local Node /api — sole place that talks to file-backed storage.
 */
window.LocalApiClient = (function () {
  "use strict";

  let available = null;
  let readyPromise = null;
  const writeQueue = new Map();

  function base() {
    return "";
  }

  async function request(method, path, body) {
    const opts = {
      method,
      headers: { Accept: "application/json" }
    };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(`${base()}${path}`, opts);
    } catch (err) {
      const wrapped = new Error(
        err?.message === "Failed to fetch"
          ? "Failed to fetch (connection dropped — often a body larger than the server limit, or the API is offline)"
          : err?.message || "Network request failed"
      );
      wrapped.cause = err;
      wrapped.name = err?.name || "TypeError";
      throw wrapped;
    }
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { ok: false, error: text || "Invalid JSON response" };
    }
    if (!res.ok || data?.ok === false) {
      const err = new Error(data?.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function probe() {
    try {
      const data = await request("GET", "/api/health");
      available = !!(data && data.ok);
      return available;
    } catch {
      available = false;
      return false;
    }
  }

  function ready() {
    if (!readyPromise) readyPromise = probe();
    return readyPromise;
  }

  function isAvailable() {
    return available === true;
  }

  /**
   * Serialize writes per key: same key waits for prior settle (success or fail).
   * `startWrite` must be a function so the HTTP call does not start until its turn.
   */
  function trackWrite(key, startWrite) {
    if (typeof startWrite !== "function") {
      throw new Error("trackWrite requires a write factory function");
    }
    if (window.SaveStatus) window.SaveStatus.saving();
    const prev = writeQueue.get(key) || Promise.resolve();
    const tracked = prev
      .catch(() => undefined)
      .then(() => startWrite())
      .then((result) => {
        if (window.SaveStatus) window.SaveStatus.saved();
        return result;
      })
      .catch((err) => {
        if (window.SaveStatus) window.SaveStatus.failed(err);
        throw err;
      })
      .finally(() => {
        if (writeQueue.get(key) === tracked) writeQueue.delete(key);
      });
    writeQueue.set(key, tracked);
    return tracked;
  }

  /* Catalogues */
  async function listCatalogue(type) {
    const data = await request("GET", `/api/catalogues/${encodeURIComponent(type)}`);
    return data.entries || [];
  }

  async function getCatalogue(type, id) {
    try {
      const data = await request(
        "GET",
        `/api/catalogues/${encodeURIComponent(type)}/${encodeURIComponent(id)}`
      );
      return data.entry || null;
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  async function putCatalogue(type, id, entry) {
    return trackWrite(`cat:${type}:${id}`, () =>
      request("PUT", `/api/catalogues/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, entry).then(
        (d) => d.entry
      )
    );
  }

  async function deleteCatalogue(type, id) {
    return trackWrite(`cat:${type}:${id}`, () =>
      request("DELETE", `/api/catalogues/${encodeURIComponent(type)}/${encodeURIComponent(id)}`)
    );
  }

  async function putMusicAudio(id, buffer, { contentType, originalFilename, durationSec } = {}) {
    await ready();
    if (!available) throw Object.assign(new Error("API unavailable"), { status: 0 });
    const headers = {
      "Content-Type": contentType || "audio/mpeg",
      "X-Original-Filename": originalFilename || "track.mp3"
    };
    if (durationSec != null && Number.isFinite(Number(durationSec))) {
      headers["X-Audio-Duration"] = String(durationSec);
    }
    return trackWrite(`music-audio:${id}`, async () => {
      const res = await fetch(`/api/catalogues/music/${encodeURIComponent(id)}/audio`, {
        method: "PUT",
        credentials: "same-origin",
        headers,
        body: buffer
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw Object.assign(new Error(data.error || res.statusText || "Upload failed"), {
          status: res.status
        });
      }
      return data;
    });
  }

  async function getMusicPlayback(id) {
    const data = await request("GET", `/api/catalogues/music/${encodeURIComponent(id)}/audio`);
    return data.playback || null;
  }

  /* Campaigns */
  async function listCampaigns() {
    const data = await request("GET", "/api/campaigns");
    return data.campaigns || [];
  }

  async function createCampaign(payload) {
    return trackWrite("campaigns:create", () =>
      request("POST", "/api/campaigns", payload).then((d) => d.campaign)
    );
  }

  async function upsertCampaign(id, payload) {
    return trackWrite(`campaign:${id}`, () =>
      request("PUT", `/api/campaigns/${encodeURIComponent(id)}`, payload).then((d) => d.campaign)
    );
  }

  async function updateCampaign(id, patch) {
    return trackWrite(`campaign:${id}`, () =>
      request("PATCH", `/api/campaigns/${encodeURIComponent(id)}`, patch).then((d) => d.campaign)
    );
  }

  async function removeCampaign(id) {
    return trackWrite(`campaign:${id}`, () =>
      request("DELETE", `/api/campaigns/${encodeURIComponent(id)}`)
    );
  }

  async function getCampaignDocument(campaignId, kind) {
    const data = await request(
      "GET",
      `/api/campaigns/${encodeURIComponent(campaignId)}/documents/${encodeURIComponent(kind)}`
    );
    return data.document;
  }

  async function putCampaignDocument(campaignId, kind, document) {
    return trackWrite(`doc:${campaignId}:${kind}`, () =>
      request(
        "PUT",
        `/api/campaigns/${encodeURIComponent(campaignId)}/documents/${encodeURIComponent(kind)}`,
        document
      ).then((d) => d.document)
    );
  }

  /* Assets */
  async function putCatalogueAsset(type, id, field, dataUrl) {
    return trackWrite(`asset:${type}:${id}:${field}`, () =>
      request(
        "PUT",
        `/api/catalogue-assets/${encodeURIComponent(type)}/${encodeURIComponent(id)}/${encodeURIComponent(field)}`,
        { dataUrl }
      )
    );
  }

  async function deleteCatalogueAsset(type, id, field) {
    return trackWrite(`asset:${type}:${id}:${field}`, () =>
      request(
        "DELETE",
        `/api/catalogue-assets/${encodeURIComponent(type)}/${encodeURIComponent(id)}/${encodeURIComponent(field)}`
      )
    );
  }

  async function importLocationUvtt(type, id, payload) {
    return trackWrite(`uvtt:${type}:${id}`, () =>
      request(
        "POST",
        `/api/catalogue-assets/${encodeURIComponent(type)}/${encodeURIComponent(id)}/uvtt`,
        payload
      )
    );
  }

  async function getLocationUvttMap(id) {
    const data = await request(
      "GET",
      `/api/catalogue-assets/location/${encodeURIComponent(id)}/uvtt`
    );
    return data.map;
  }

  async function deleteLocationUvtt(type, id) {
    return trackWrite(`uvtt:${type}:${id}:del`, () =>
      request(
        "DELETE",
        `/api/catalogue-assets/${encodeURIComponent(type)}/${encodeURIComponent(id)}/uvtt`
      )
    );
  }

  async function patchLocationUvtt(type, id, patch) {
    return trackWrite(`uvtt:${type}:${id}:patch`, () =>
      request(
        "PATCH",
        `/api/catalogue-assets/${encodeURIComponent(type)}/${encodeURIComponent(id)}/uvtt`,
        patch
      )
    );
  }

  async function exportAll() {
    return request("GET", "/api/export");
  }

  async function listRevealedNpcs(campaignId) {
    const data = await request(
      "GET",
      `/api/campaigns/${encodeURIComponent(campaignId)}/revealed-npcs`
    );
    return data.npcs || [];
  }

  async function revealNpc(campaignId, npcId, payload = {}) {
    return trackWrite(`revealed-npcs:${campaignId}:${npcId}`, () =>
      request(
        "PUT",
        `/api/campaigns/${encodeURIComponent(campaignId)}/revealed-npcs/${encodeURIComponent(npcId)}`,
        payload
      ).then((d) => d.npc)
    );
  }

  async function unrevealNpc(campaignId, npcId) {
    return trackWrite(`revealed-npcs:${campaignId}:${npcId}:del`, () =>
      request(
        "DELETE",
        `/api/campaigns/${encodeURIComponent(campaignId)}/revealed-npcs/${encodeURIComponent(npcId)}`,
        {}
      )
    );
  }

  async function listCharacters(campaignId) {
    const data = await request("GET", `/api/campaigns/${encodeURIComponent(campaignId)}/characters`);
    return data.characters || [];
  }

  async function getCharacter(campaignId, characterId) {
    const data = await request(
      "GET",
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}`
    );
    return data.character;
  }

  async function patchCharacter(campaignId, characterId, patch) {
    return trackWrite(`characters:${campaignId}:${characterId}`, () =>
      request(
        "PATCH",
        `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}`,
        patch
      ).then((d) => d.character)
    );
  }

  async function getCharacterState(campaignId, characterId) {
    const data = await request(
      "GET",
      `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}/state`
    );
    return data.state;
  }

  async function putCharacterState(campaignId, characterId, patch) {
    return trackWrite(`characters:${campaignId}:${characterId}:state`, () =>
      request(
        "PUT",
        `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}/state`,
        patch
      ).then((d) => d.state)
    );
  }

  async function mirrorCharacterToCatalogue(campaignId, characterId) {
    return trackWrite(`characters:${campaignId}:${characterId}:mirror`, () =>
      request(
        "POST",
        `/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}/mirror-to-catalogue`,
        {}
      ).then((d) => d.entry)
    );
  }

  return {
    ready,
    probe,
    isAvailable,
    listCatalogue,
    getCatalogue,
    putCatalogue,
    deleteCatalogue,
    putMusicAudio,
    getMusicPlayback,
    listCampaigns,
    createCampaign,
    upsertCampaign,
    updateCampaign,
    removeCampaign,
    getCampaignDocument,
    putCampaignDocument,
    putCatalogueAsset,
    deleteCatalogueAsset,
    importLocationUvtt,
    getLocationUvttMap,
    deleteLocationUvtt,
    patchLocationUvtt,
    exportAll,
    listRevealedNpcs,
    revealNpc,
    unrevealNpc,
    listCharacters,
    getCharacter,
    patchCharacter,
    getCharacterState,
    putCharacterState,
    mirrorCharacterToCatalogue,
    /* test hook */
    _trackWrite: trackWrite,
    _writeQueue: writeQueue
  };
})();
