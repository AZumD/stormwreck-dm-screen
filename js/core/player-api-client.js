/**
 * Player companion API client (cookie session).
 */
window.PlayerApiClient = (function () {
  "use strict";

  async function request(method, path, body) {
    const opts = {
      method,
      credentials: "include",
      headers: { Accept: "application/json" }
    };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { ok: false, error: text || "Invalid response" };
    }
    if (!res.ok || data?.ok === false) {
      const err = new Error(data?.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  const enc = (v) => encodeURIComponent(v);

  return {
    login: (email, password) => request("POST", "/api/auth/login", { email, password }),
    logout: () => request("POST", "/api/auth/logout", {}),
    bootstrap: () => request("GET", "/api/player/bootstrap"),
    myCharacters: (campaignId) =>
      request("GET", `/api/player/campaigns/${enc(campaignId)}/characters/mine`),
    patchState: (campaignId, characterId, patch) =>
      request(
        "PATCH",
        `/api/player/campaigns/${enc(campaignId)}/characters/${enc(characterId)}/state`,
        patch
      ),
    party: (campaignId) => request("GET", `/api/player/campaigns/${enc(campaignId)}/party`),
    catalogue: (campaignId, type, id) =>
      request(
        "GET",
        `/api/player/campaigns/${enc(campaignId)}/catalogues/${enc(type)}/${enc(id)}`
      ),
    notes: (campaignId) => request("GET", `/api/player/campaigns/${enc(campaignId)}/notes`),
    createNote: (campaignId, payload) =>
      request("POST", `/api/player/campaigns/${enc(campaignId)}/notes`, payload),
    updateNote: (noteId, payload) => request("PUT", `/api/player/notes/${enc(noteId)}`, payload),
    deleteNote: (noteId) => request("DELETE", `/api/player/notes/${enc(noteId)}`, {}),
    portraitUrl: (campaignId, characterId) =>
      `/api/player/campaigns/${enc(campaignId)}/portraits/characters/${enc(characterId)}`
  };
})();
