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
      workspace: "run",
      notes: "",
      checklist: {},
      sidebarCollapsed: false,
      mapPanelCollapsed: false,
      sceneTrayCollapsed: false,
      chronicleSessionOrder: "newest",
      referenceTab: "overview",
      sessionTab: "notes",
      referencePins: [],
      referenceRecent: []
    };
  }

  function normalizeWorkspace(value, viewMode) {
    if (value === "prep" || value === "run" || value === "map" || value === "session") return value;
    /* Migrate legacy Play/Document preference into Run/Prep */
    return viewMode === "document" ? "prep" : "run";
  }

  function loadLocal(campaignId) {
    const data = empty();
    try {
      data.session = localStorage.getItem(`${campaignId}-session`) || "1";
      data.viewMode = localStorage.getItem(`${campaignId}-view-mode`) || "play";
      const rawWorkspace = localStorage.getItem(`${campaignId}-workspace`);
      data.workspace = normalizeWorkspace(rawWorkspace, data.viewMode);
      data.viewMode = data.workspace === "prep" ? "document" : "play";
      data.notes = localStorage.getItem(`${campaignId}-notes`) || "";
      data.checklist = JSON.parse(localStorage.getItem(`${campaignId}-checklist`) || "{}") || {};
      data.sidebarCollapsed = localStorage.getItem(`${campaignId}-sidebar-collapsed`) === "1";
      data.mapPanelCollapsed = localStorage.getItem(`${campaignId}-map-panel-collapsed`) === "1";
      data.sceneTrayCollapsed = localStorage.getItem(`${campaignId}-scene-tray-collapsed`) === "1";
      const order = localStorage.getItem(`${campaignId}-chronicle-session-order`);
      if (order === "oldest" || order === "newest") data.chronicleSessionOrder = order;
      const refTab = localStorage.getItem(`${campaignId}-reference-tab`);
      if (refTab) data.referenceTab = refTab;
      const sessTab = localStorage.getItem(`${campaignId}-session-tab`);
      if (sessTab) data.sessionTab = sessTab;
      const pins = localStorage.getItem(`${campaignId}-reference-pins`);
      if (pins) {
        try {
          data.referencePins = JSON.parse(pins) || [];
        } catch {
          data.referencePins = [];
        }
      }
      const recent = localStorage.getItem(`${campaignId}-reference-recent`);
      if (recent) {
        try {
          data.referenceRecent = JSON.parse(recent) || [];
        } catch {
          data.referenceRecent = [];
        }
      }
    } catch {
      /* ignore */
    }
    return data;
  }

  function saveLocal(campaignId, data) {
    try {
      const workspace = normalizeWorkspace(data.workspace, data.viewMode);
      data.workspace = workspace;
      data.viewMode = workspace === "prep" ? "document" : "play";
      localStorage.setItem(`${campaignId}-session`, String(data.session || "1"));
      localStorage.setItem(`${campaignId}-workspace`, workspace);
      localStorage.setItem(`${campaignId}-view-mode`, data.viewMode);
      localStorage.setItem(`${campaignId}-notes`, data.notes || "");
      localStorage.setItem(`${campaignId}-checklist`, JSON.stringify(data.checklist || {}));
      localStorage.setItem(`${campaignId}-sidebar-collapsed`, data.sidebarCollapsed ? "1" : "0");
      localStorage.setItem(`${campaignId}-map-panel-collapsed`, data.mapPanelCollapsed ? "1" : "0");
      localStorage.setItem(`${campaignId}-scene-tray-collapsed`, data.sceneTrayCollapsed ? "1" : "0");
      localStorage.setItem(
        `${campaignId}-chronicle-session-order`,
        data.chronicleSessionOrder === "oldest" ? "oldest" : "newest"
      );
      if (data.referenceTab) localStorage.setItem(`${campaignId}-reference-tab`, String(data.referenceTab));
      if (data.sessionTab) localStorage.setItem(`${campaignId}-session-tab`, String(data.sessionTab));
      localStorage.setItem(`${campaignId}-reference-pins`, JSON.stringify(data.referencePins || []));
      localStorage.setItem(`${campaignId}-reference-recent`, JSON.stringify(data.referenceRecent || []));
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
        data.workspace = normalizeWorkspace(data.workspace, data.viewMode);
        data.viewMode = data.workspace === "prep" ? "document" : "play";
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
    if (partial && Object.prototype.hasOwnProperty.call(partial, "workspace")) {
      next.workspace = normalizeWorkspace(partial.workspace, next.viewMode);
    } else if (partial && Object.prototype.hasOwnProperty.call(partial, "viewMode")) {
      /* Legacy viewMode patches must not clobber an explicit Map workspace */
      if (next.workspace !== "map") {
        next.workspace = partial.viewMode === "document" ? "prep" : "run";
      }
    } else {
      next.workspace = normalizeWorkspace(next.workspace, next.viewMode);
    }
    next.viewMode = next.workspace === "prep" ? "document" : "play";
    mem.set(campaignId, next);
    persist(campaignId);
    return next;
  }

  return { bootstrap, get, patch, persist, empty };
})();
