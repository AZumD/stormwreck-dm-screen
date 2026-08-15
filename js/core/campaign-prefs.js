/**
 * Campaign prefs document: session number, view mode, notes, checklist, UI chrome.
 */
window.CampaignPrefs = (function () {
  "use strict";

  const mem = new Map();

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  function empty() {
    return {
      session: "1",
      viewMode: "play",
      notes: "",
      checklist: {},
      sidebarCollapsed: false,
      mapPanelCollapsed: false,
      sceneTrayCollapsed: false,
      chronicleSessionOrder: "newest"
    };
  }

  function loadLocal(campaignId) {
    const data = empty();
    try {
      data.session = localStorage.getItem(`${campaignId}-session`) || "1";
      data.viewMode = localStorage.getItem(`${campaignId}-view-mode`) || "play";
      data.notes = localStorage.getItem(`${campaignId}-notes`) || "";
      data.checklist = JSON.parse(localStorage.getItem(`${campaignId}-checklist`) || "{}") || {};
      data.sidebarCollapsed = localStorage.getItem(`${campaignId}-sidebar-collapsed`) === "1";
      data.mapPanelCollapsed = localStorage.getItem(`${campaignId}-map-panel-collapsed`) === "1";
      data.sceneTrayCollapsed = localStorage.getItem(`${campaignId}-scene-tray-collapsed`) === "1";
      const order = localStorage.getItem(`${campaignId}-chronicle-session-order`);
      if (order === "oldest" || order === "newest") data.chronicleSessionOrder = order;
    } catch {
      /* ignore */
    }
    return data;
  }

  function saveLocal(campaignId, data) {
    try {
      localStorage.setItem(`${campaignId}-session`, String(data.session || "1"));
      localStorage.setItem(`${campaignId}-view-mode`, data.viewMode === "document" ? "document" : "play");
      localStorage.setItem(`${campaignId}-notes`, data.notes || "");
      localStorage.setItem(`${campaignId}-checklist`, JSON.stringify(data.checklist || {}));
      localStorage.setItem(`${campaignId}-sidebar-collapsed`, data.sidebarCollapsed ? "1" : "0");
      localStorage.setItem(`${campaignId}-map-panel-collapsed`, data.mapPanelCollapsed ? "1" : "0");
      localStorage.setItem(`${campaignId}-scene-tray-collapsed`, data.sceneTrayCollapsed ? "1" : "0");
      localStorage.setItem(
        `${campaignId}-chronicle-session-order`,
        data.chronicleSessionOrder === "oldest" ? "oldest" : "newest"
      );
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
      LocalApiClient.putCampaignDocument(campaignId, "prefs", data).catch((err) => {
        console.warn("prefs save failed:", err);
      });
      /* Also keep notes/checklist as dedicated docs for readability */
      LocalApiClient.putCampaignDocument(campaignId, "notes", { text: data.notes || "" }).catch(() => {});
      LocalApiClient.putCampaignDocument(campaignId, "checklist", data.checklist || {}).catch(() => {});
    } else {
      saveLocal(campaignId, data);
    }
  }

  async function bootstrap(campaignId) {
    if (window.LocalApiClient) await LocalApiClient.ready();
    if (useApi()) {
      try {
        const prefs = await LocalApiClient.getCampaignDocument(campaignId, "prefs");
        const notes = await LocalApiClient.getCampaignDocument(campaignId, "notes");
        const checklist = await LocalApiClient.getCampaignDocument(campaignId, "checklist");
        const data = { ...empty(), ...(prefs && typeof prefs === "object" ? prefs : {}) };
        if (notes && typeof notes === "object" && typeof notes.text === "string") data.notes = notes.text;
        else if (typeof notes === "string") data.notes = notes;
        if (checklist && typeof checklist === "object") data.checklist = checklist;
        mem.set(campaignId, data);
        return data;
      } catch (err) {
        console.warn("prefs API load failed:", err);
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
