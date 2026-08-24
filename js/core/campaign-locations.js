/**
 * Campaign ↔ location catalogue membership (which places appear on the map panel).
 */
window.CampaignLocations = (function () {
  "use strict";

  const mem = new Map();

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  function empty() {
    return { version: 1, locationIds: [] };
  }

  function normalizeCatalogueId(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    return s.startsWith("sw-") ? s : `sw-${s}`;
  }

  function defaultFromStaticMaps() {
    const ids = [];
    Object.values(window.MAPS || {}).forEach((m) => {
      const lid = m.locationId || m.id;
      if (lid) ids.push(normalizeCatalogueId(lid));
    });
    return [...new Set(ids.filter(Boolean))];
  }

  function loadLocal(campaignId) {
    try {
      const raw = JSON.parse(localStorage.getItem(`${campaignId}-locations`) || "null");
      if (raw && Array.isArray(raw.locationIds)) {
        return { version: 1, locationIds: raw.locationIds.map(normalizeCatalogueId).filter(Boolean) };
      }
    } catch {
      /* ignore */
    }
    return { version: 1, locationIds: defaultFromStaticMaps() };
  }

  function saveLocal(campaignId, data) {
    try {
      localStorage.setItem(`${campaignId}-locations`, JSON.stringify(data));
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
      LocalApiClient.putCampaignDocument(campaignId, "locations", data).catch((err) => {
        console.warn("locations save failed:", err);
      });
    } else {
      saveLocal(campaignId, data);
    }
  }

  async function bootstrap(campaignId) {
    if (window.LocalApiClient) await LocalApiClient.ready();
    if (useApi()) {
      try {
        const doc = await LocalApiClient.getCampaignDocument(campaignId, "locations");
        if (doc && Array.isArray(doc.locationIds) && doc.locationIds.length) {
          mem.set(campaignId, {
            version: 1,
            locationIds: doc.locationIds.map(normalizeCatalogueId).filter(Boolean)
          });
          return get(campaignId);
        }
      } catch (err) {
        console.warn("locations API load failed:", err);
      }
    }
    const local = loadLocal(campaignId);
    mem.set(campaignId, local);
    if (useApi() && local.locationIds.length) persist(campaignId);
    return local;
  }

  function listIds(campaignId) {
    return get(campaignId).locationIds.slice();
  }

  function has(campaignId, catalogueId) {
    const id = normalizeCatalogueId(catalogueId);
    return get(campaignId).locationIds.includes(id);
  }

  function add(campaignId, catalogueId) {
    const id = normalizeCatalogueId(catalogueId);
    if (!id) return get(campaignId);
    const data = get(campaignId);
    if (data.locationIds.includes(id)) return data;
    const next = { ...data, locationIds: [...data.locationIds, id].sort() };
    mem.set(campaignId, next);
    persist(campaignId);
    return next;
  }

  function remove(campaignId, catalogueId) {
    const id = normalizeCatalogueId(catalogueId);
    const data = get(campaignId);
    const next = { ...data, locationIds: data.locationIds.filter((x) => x !== id) };
    mem.set(campaignId, next);
    persist(campaignId);
    return next;
  }

  return {
    bootstrap,
    get,
    listIds,
    has,
    add,
    remove,
    normalizeCatalogueId,
    defaultFromStaticMaps,
    empty
  };
})();
