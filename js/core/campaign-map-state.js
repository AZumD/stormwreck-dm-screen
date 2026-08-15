/**
 * Campaign map panel persistence (filters, positions, custom pins, active map).
 */
window.CampaignMapState = (function () {
  "use strict";

  const mem = new Map();

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  function empty() {
    return {
      activeMap: null,
      filters: null,
      pinPositions: {},
      partyPositions: {},
      customPins: {}
    };
  }

  function loadLocal(campaignId) {
    const data = empty();
    try {
      data.activeMap = localStorage.getItem(`${campaignId}-active-map`) || null;
      data.filters = JSON.parse(localStorage.getItem(`${campaignId}-map-filters`) || "null");
      data.pinPositions = JSON.parse(localStorage.getItem(`${campaignId}-pin-positions`) || "{}") || {};
      data.partyPositions = JSON.parse(localStorage.getItem(`${campaignId}-party-positions`) || "{}") || {};
      data.customPins = JSON.parse(localStorage.getItem(`${campaignId}-custom-pins`) || "{}") || {};
    } catch {
      /* ignore */
    }
    return data;
  }

  function saveLocal(campaignId, data) {
    try {
      if (data.activeMap != null) localStorage.setItem(`${campaignId}-active-map`, data.activeMap);
      if (data.filters) localStorage.setItem(`${campaignId}-map-filters`, JSON.stringify(data.filters));
      localStorage.setItem(`${campaignId}-pin-positions`, JSON.stringify(data.pinPositions || {}));
      localStorage.setItem(`${campaignId}-party-positions`, JSON.stringify(data.partyPositions || {}));
      localStorage.setItem(`${campaignId}-custom-pins`, JSON.stringify(data.customPins || {}));
    } catch {
      /* ignore */
    }
  }

  function get(campaignId) {
    if (!mem.has(campaignId)) mem.set(campaignId, loadLocal(campaignId));
    return mem.get(campaignId);
  }

  function persist(campaignId) {
    const data = get(campaignId);
    if (useApi()) {
      LocalApiClient.putCampaignDocument(campaignId, "map-state", data).catch((err) => {
        console.warn("map-state save failed:", err);
      });
    } else {
      saveLocal(campaignId, data);
    }
  }

  async function bootstrap(campaignId) {
    if (window.LocalApiClient) await LocalApiClient.ready();
    if (useApi()) {
      try {
        const doc = await LocalApiClient.getCampaignDocument(campaignId, "map-state");
        mem.set(campaignId, doc && typeof doc === "object" ? { ...empty(), ...doc } : empty());
        return get(campaignId);
      } catch (err) {
        console.warn("map-state API load failed:", err);
      }
    }
    mem.set(campaignId, loadLocal(campaignId));
    return get(campaignId);
  }

  function patch(campaignId, partial) {
    const next = { ...get(campaignId), ...(partial || {}) };
    mem.set(campaignId, next);
    persist(campaignId);
    return next;
  }

  return { bootstrap, get, patch, persist, empty };
})();
