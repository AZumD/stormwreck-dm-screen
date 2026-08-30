/**
 * Campaign map panel persistence (filters, positions, custom pins, active map, tokens, initiative).
 */
window.CampaignMapState = (function () {
  "use strict";

  const mem = new Map();
  const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  function empty() {
    return {
      activeMap: null,
      filters: null,
      pinPositions: {},
      partyPositions: {},
      customPins: {},
      removedPins: {},
      tokens: {},
      fog: {},
      initiativeTracker: {}
    };
  }

  function isPlainObject(value) {
    /* JSON document values only — avoid Object.prototype identity checks (cross-realm / iframe safe). */
    return value != null && typeof value === "object" && !Array.isArray(value);
  }

  function cloneJson(value) {
    if (value === undefined) return undefined;
    if (value === null || typeof value !== "object") return value;
    return JSON.parse(JSON.stringify(value));
  }

  /** Same semantics as server/lib/deep-merge.js (objects merge, arrays replace, null deletes). */
  function deepMerge(target, patch) {
    if (patch === undefined) return cloneJson(target);
    if (patch === null || Array.isArray(patch) || !isPlainObject(patch)) return cloneJson(patch);
    const base = {};
    if (isPlainObject(target)) {
      for (const key of Object.keys(target)) {
        if (BLOCKED_KEYS.has(key)) continue;
        base[key] = cloneJson(target[key]);
      }
    }
    for (const key of Object.keys(patch)) {
      if (BLOCKED_KEYS.has(key)) continue;
      const patchVal = patch[key];
      if (patchVal === null) {
        delete base[key];
        continue;
      }
      if (isPlainObject(patchVal) && isPlainObject(base[key])) {
        base[key] = deepMerge(base[key], patchVal);
      } else if (isPlainObject(patchVal)) {
        base[key] = deepMerge({}, patchVal);
      } else {
        base[key] = cloneJson(patchVal);
      }
    }
    return base;
  }

  function normalize(doc) {
    return { ...empty(), ...(doc && typeof doc === "object" ? doc : {}) };
  }

  function loadLocal(campaignId) {
    const data = empty();
    try {
      data.activeMap = localStorage.getItem(`${campaignId}-active-map`) || null;
      data.filters = JSON.parse(localStorage.getItem(`${campaignId}-map-filters`) || "null");
      data.pinPositions = JSON.parse(localStorage.getItem(`${campaignId}-pin-positions`) || "{}") || {};
      data.partyPositions = JSON.parse(localStorage.getItem(`${campaignId}-party-positions`) || "{}") || {};
      data.customPins = JSON.parse(localStorage.getItem(`${campaignId}-custom-pins`) || "{}") || {};
      data.removedPins = JSON.parse(localStorage.getItem(`${campaignId}-removed-pins`) || "{}") || {};
      data.tokens = JSON.parse(localStorage.getItem(`${campaignId}-map-tokens`) || "{}") || {};
      data.fog = JSON.parse(localStorage.getItem(`${campaignId}-map-fog`) || "{}") || {};
      data.initiativeTracker =
        JSON.parse(localStorage.getItem(`${campaignId}-initiative-tracker`) || "{}") || {};
    } catch {
      /* ignore */
    }
    return data;
  }

  function saveLocal(campaignId, data) {
    try {
      if (data.activeMap != null) localStorage.setItem(`${campaignId}-active-map`, data.activeMap);
      else localStorage.removeItem(`${campaignId}-active-map`);
      if (data.filters) localStorage.setItem(`${campaignId}-map-filters`, JSON.stringify(data.filters));
      else localStorage.removeItem(`${campaignId}-map-filters`);
      localStorage.setItem(`${campaignId}-pin-positions`, JSON.stringify(data.pinPositions || {}));
      localStorage.setItem(`${campaignId}-party-positions`, JSON.stringify(data.partyPositions || {}));
      localStorage.setItem(`${campaignId}-custom-pins`, JSON.stringify(data.customPins || {}));
      localStorage.setItem(`${campaignId}-removed-pins`, JSON.stringify(data.removedPins || {}));
      localStorage.setItem(`${campaignId}-map-tokens`, JSON.stringify(data.tokens || {}));
      localStorage.setItem(`${campaignId}-map-fog`, JSON.stringify(data.fog || {}));
      localStorage.setItem(
        `${campaignId}-initiative-tracker`,
        JSON.stringify(data.initiativeTracker || {})
      );
    } catch {
      /* ignore */
    }
  }

  function get(campaignId) {
    if (!mem.has(campaignId)) mem.set(campaignId, loadLocal(campaignId));
    return mem.get(campaignId);
  }

  function reconcile(campaignId, doc) {
    mem.set(campaignId, normalize(doc));
    if (window.MapPcPlacement?.normalizeDuplicates) {
      MapPcPlacement.normalizeDuplicates(campaignId);
    }
    window.MapPanel?.refreshInitiative?.();
    return get(campaignId);
  }

  function persistLocal(campaignId) {
    saveLocal(campaignId, get(campaignId));
  }

  async function bootstrap(campaignId) {
    if (window.LocalApiClient) await LocalApiClient.ready();
    if (useApi()) {
      try {
        const doc = await LocalApiClient.getCampaignDocument(campaignId, "map-state");
        mem.set(campaignId, normalize(doc));
        if (window.MapPcPlacement?.normalizeDuplicates) {
          MapPcPlacement.normalizeDuplicates(campaignId);
        }
        return get(campaignId);
      } catch (err) {
        console.warn("map-state API load failed:", err);
      }
    }
    mem.set(campaignId, loadLocal(campaignId));
    if (window.MapPcPlacement?.normalizeDuplicates) {
      MapPcPlacement.normalizeDuplicates(campaignId);
    }
    return get(campaignId);
  }

  /**
   * Apply a partial patch. When the API is available, sends ONLY the patch via PATCH
   * (not a full-document PUT). Optimistically merges locally, then reconciles with
   * the server's returned canonical document.
   */
  function patch(campaignId, partial) {
    const patchBody = partial && typeof partial === "object" ? partial : {};
    const optimistic = deepMerge(get(campaignId), patchBody);
    mem.set(campaignId, normalize(optimistic));

    if (useApi()) {
      LocalApiClient.patchCampaignDocument(campaignId, "map-state", patchBody)
        .then((doc) => {
          reconcile(campaignId, doc);
        })
        .catch((err) => {
          console.warn("map-state patch failed:", err);
        });
    } else {
      persistLocal(campaignId);
    }
    return get(campaignId);
  }

  /** Full replace persist (rare); prefer patch() for concurrent-safe updates. */
  function persist(campaignId) {
    const data = get(campaignId);
    if (useApi()) {
      LocalApiClient.putCampaignDocument(campaignId, "map-state", data).catch((err) => {
        console.warn("map-state save failed:", err);
      });
    } else {
      persistLocal(campaignId);
    }
  }

  return { bootstrap, get, patch, persist, empty, deepMerge };
})();
