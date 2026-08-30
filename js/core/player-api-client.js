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
    listCharacters: () => request("GET", "/api/player/characters"),
    getCharacter: (characterId) => request("GET", `/api/player/characters/${enc(characterId)}`),
    createStandaloneCharacter: (payload) =>
      request("POST", "/api/player/characters", payload || {}),
    patchStateDirect: (characterId, patch) =>
      request("PATCH", `/api/player/characters/${enc(characterId)}/state`, patch),
    patchSheetDirect: (characterId, patch) =>
      request("PATCH", `/api/player/characters/${enc(characterId)}`, patch),
    addInventoryDirect: (characterId, payload) =>
      request("POST", `/api/player/characters/${enc(characterId)}/inventory`, payload),
    updateInventoryDirect: (characterId, entryId, payload) =>
      request(
        "PATCH",
        `/api/player/characters/${enc(characterId)}/inventory/${enc(entryId)}`,
        payload
      ),
    removeInventoryDirect: (characterId, entryId) =>
      request(
        "DELETE",
        `/api/player/characters/${enc(characterId)}/inventory/${enc(entryId)}`,
        {}
      ),
    putPortraitDirect: (characterId, dataUrl) =>
      request("PUT", `/api/player/portraits/characters/${enc(characterId)}`, { dataUrl }),
    attachableCampaigns: (characterId) =>
      request("GET", `/api/player/characters/${enc(characterId)}/attachable-campaigns`),
    attachToCampaign: (characterId, campaignId) =>
      request("POST", `/api/player/characters/${enc(characterId)}/campaigns/${enc(campaignId)}`, {}),
    detachFromCampaign: (characterId, campaignId) =>
      request(
        "DELETE",
        `/api/player/characters/${enc(characterId)}/campaigns/${enc(campaignId)}`,
        {}
      ),
    myCharacters: (campaignId) =>
      request("GET", `/api/player/campaigns/${enc(campaignId)}/characters/mine`),
    createCharacter: (campaignId, payload) =>
      request("POST", `/api/player/campaigns/${enc(campaignId)}/characters`, payload || {}),
    patchState: (campaignId, characterId, patch) =>
      request(
        "PATCH",
        `/api/player/campaigns/${enc(campaignId)}/characters/${enc(characterId)}/state`,
        patch
      ),
    patchSheet: (campaignId, characterId, patch) =>
      request(
        "PATCH",
        `/api/player/campaigns/${enc(campaignId)}/characters/${enc(characterId)}`,
        patch
      ),
    addInventory: (campaignId, characterId, payload) =>
      request(
        "POST",
        `/api/player/campaigns/${enc(campaignId)}/characters/${enc(characterId)}/inventory`,
        payload
      ),
    updateInventory: (campaignId, characterId, entryId, payload) =>
      request(
        "PATCH",
        `/api/player/campaigns/${enc(campaignId)}/characters/${enc(characterId)}/inventory/${enc(entryId)}`,
        payload
      ),
    removeInventory: (campaignId, characterId, entryId) =>
      request(
        "DELETE",
        `/api/player/campaigns/${enc(campaignId)}/characters/${enc(characterId)}/inventory/${enc(entryId)}`,
        {}
      ),
    putPortrait: (campaignId, characterId, dataUrl) =>
      request(
        "PUT",
        `/api/player/campaigns/${enc(campaignId)}/portraits/characters/${enc(characterId)}`,
        { dataUrl }
      ),
    party: (campaignId) => request("GET", `/api/player/campaigns/${enc(campaignId)}/party`),
    mapView: (campaignId, characterId) =>
      request(
        "GET",
        `/api/player/campaigns/${enc(campaignId)}/map-view?characterId=${enc(characterId)}`
      ),
    catalogue: (campaignId, type, id) =>
      request(
        "GET",
        `/api/player/campaigns/${enc(campaignId)}/catalogues/${enc(type)}/${enc(id)}`
      ),
    library: (campaignId, type, { q = "", limit = 40, offset = 0 } = {}) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      const qs = params.toString();
      return request(
        "GET",
        `/api/player/campaigns/${enc(campaignId)}/catalogues/${enc(type)}${qs ? `?${qs}` : ""}`
      );
    },
    libraryAttach: (campaignId, characterId, payload) =>
      request(
        "POST",
        `/api/player/campaigns/${enc(campaignId)}/characters/${enc(characterId)}/library-attach`,
        payload
      ),
    revealedNpcs: (campaignId) =>
      request("GET", `/api/player/campaigns/${enc(campaignId)}/npcs`),
    revealedNpc: (campaignId, npcId) =>
      request("GET", `/api/player/campaigns/${enc(campaignId)}/npcs/${enc(npcId)}`),
    notes: (campaignId) => request("GET", `/api/player/campaigns/${enc(campaignId)}/notes`),
    createNote: (campaignId, payload) =>
      request("POST", `/api/player/campaigns/${enc(campaignId)}/notes`, payload),
    updateNote: (noteId, payload) => request("PUT", `/api/player/notes/${enc(noteId)}`, payload),
    deleteNote: (noteId) => request("DELETE", `/api/player/notes/${enc(noteId)}`, {}),
    portraitUrl: (campaignId, characterId) =>
      `/api/player/campaigns/${enc(campaignId)}/portraits/characters/${enc(characterId)}`,
    portraitUrlDirect: (characterId) =>
      `/api/player/portraits/characters/${enc(characterId)}`,

    availability: (from, to) =>
      request("GET", `/api/player/availability?from=${enc(from)}&to=${enc(to)}`),
    putAvailability: (date, payload) =>
      request("PUT", `/api/player/availability/${enc(date)}`, payload),
    deleteAvailability: (date) =>
      request("DELETE", `/api/player/availability/${enc(date)}`, {}),
    upcomingEvents: (opts = {}) => {
      const params = new URLSearchParams();
      if (opts.limit) params.set("limit", String(opts.limit));
      if (opts.after) params.set("after", opts.after);
      const qs = params.toString();
      return request("GET", `/api/player/upcoming-events${qs ? `?${qs}` : ""}`);
    },

    campaignEvents: (campaignId, { from, to } = {}) => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();
      return request(
        "GET",
        `/api/player/campaigns/${enc(campaignId)}/events${qs ? `?${qs}` : ""}`
      );
    },
    campaignEvent: (campaignId, eventId) =>
      request("GET", `/api/player/campaigns/${enc(campaignId)}/events/${enc(eventId)}`),
    putEventRsvp: (campaignId, eventId, payload) =>
      request(
        "PUT",
        `/api/player/campaigns/${enc(campaignId)}/events/${enc(eventId)}/rsvp`,
        payload
      ),
    deleteEventRsvp: (campaignId, eventId) =>
      request(
        "DELETE",
        `/api/player/campaigns/${enc(campaignId)}/events/${enc(eventId)}/rsvp`,
        {}
      ),
    campaignAvailabilityRange: (campaignId, from, to) =>
      request(
        "GET",
        `/api/player/campaigns/${enc(campaignId)}/availability?from=${enc(from)}&to=${enc(to)}`
      ),
    campaignAvailabilityDay: (campaignId, date) =>
      request("GET", `/api/player/campaigns/${enc(campaignId)}/availability/${enc(date)}`),

    createCampaignEvent: (campaignId, payload) =>
      request("POST", `/api/campaigns/${enc(campaignId)}/events`, payload),
    updateCampaignEvent: (campaignId, eventId, payload) =>
      request("PATCH", `/api/campaigns/${enc(campaignId)}/events/${enc(eventId)}`, payload),
    deleteCampaignEvent: (campaignId, eventId) =>
      request("DELETE", `/api/campaigns/${enc(campaignId)}/events/${enc(eventId)}`, {}),

    campaignPosts: (campaignId) =>
      request("GET", `/api/player/campaigns/${enc(campaignId)}/posts`),
    createCampaignPost: (campaignId, payload) =>
      request("POST", `/api/player/campaigns/${enc(campaignId)}/posts`, payload),
    postReplies: (campaignId, postId) =>
      request("GET", `/api/player/campaigns/${enc(campaignId)}/posts/${enc(postId)}/replies`),
    updateCampaignPost: (campaignId, postId, payload) =>
      request("PATCH", `/api/player/campaigns/${enc(campaignId)}/posts/${enc(postId)}`, payload),
    deleteCampaignPost: (campaignId, postId) =>
      request("DELETE", `/api/player/campaigns/${enc(campaignId)}/posts/${enc(postId)}`, {}),
    pinCampaignPost: (campaignId, postId, pinned) =>
      request("PUT", `/api/player/campaigns/${enc(campaignId)}/posts/${enc(postId)}/pin`, {
        pinned
      }),

    platformEvents: (opts = {}) => {
      const params = new URLSearchParams();
      if (opts.from) params.set("from", opts.from);
      if (opts.to) params.set("to", opts.to);
      if (opts.after) params.set("after", opts.after);
      if (opts.limit) params.set("limit", String(opts.limit));
      const qs = params.toString();
      return request("GET", `/api/player/platform-events${qs ? `?${qs}` : ""}`);
    },
    platformEvent: (eventId) => request("GET", `/api/player/platform-events/${enc(eventId)}`),
    createPlatformEvent: (payload) => request("POST", "/api/player/platform-events", payload),
    updatePlatformEvent: (eventId, payload) =>
      request("PATCH", `/api/player/platform-events/${enc(eventId)}`, payload),
    deletePlatformEvent: (eventId) =>
      request("DELETE", `/api/player/platform-events/${enc(eventId)}`, {}),

    platformPosts: () => request("GET", "/api/player/platform-posts"),
    createPlatformPost: (payload) => request("POST", "/api/player/platform-posts", payload),
    platformPostReplies: (postId) =>
      request("GET", `/api/player/platform-posts/${enc(postId)}/replies`),
    updatePlatformPost: (postId, payload) =>
      request("PATCH", `/api/player/platform-posts/${enc(postId)}`, payload),
    deletePlatformPost: (postId) =>
      request("DELETE", `/api/player/platform-posts/${enc(postId)}`, {})
  };
})();
