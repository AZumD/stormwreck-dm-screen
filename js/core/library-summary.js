/**
 * Lightweight campaign summaries for the DM Library home — prefs, state, scene title only.
 * Does not load adventure documents, maps, or catalogues.
 */
window.LibrarySummary = (function () {
  "use strict";

  const LAST_OPENED_KEY = "dm-last-campaign-id";

  /** @typedef {{ id: string, title: string, description: string, level?: string, url: string, sandbox?: boolean, featured?: boolean }} LibraryCampaignDef */

  /** @type {LibraryCampaignDef} */
  const STORMWRECK = {
    id: "stormwreck-isle",
    title: "Dragons of Stormwreck Isle",
    description: "Starter Set adventure — cloister, caves, cursed ship, and a blue wyrmling.",
    level: "Level 1–3",
    url: "../campaigns/stormwreck-isle/index.html",
    featured: true
  };

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readJsonLocal(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function normalizeWorkspace(value, viewMode) {
    if (value === "prep" || value === "run" || value === "map" || value === "session") return value;
    return viewMode === "document" ? "prep" : "run";
  }

  async function loadPrefs(campaignId) {
    if (useApi()) {
      try {
        const doc = await LocalApiClient.getCampaignDocument(campaignId, "prefs");
        if (doc && typeof doc === "object") {
          const workspace = normalizeWorkspace(doc.workspace, doc.viewMode);
          return {
            session: String(doc.session || "1"),
            workspace
          };
        }
      } catch {
        /* fall through */
      }
    }
    const viewMode = localStorage.getItem(`${campaignId}-view-mode`) || "play";
    const rawWorkspace = localStorage.getItem(`${campaignId}-workspace`);
    return {
      session: localStorage.getItem(`${campaignId}-session`) || "1",
      workspace: normalizeWorkspace(rawWorkspace, viewMode)
    };
  }

  async function loadState(campaignId) {
    if (useApi()) {
      try {
        const doc = await LocalApiClient.getCampaignDocument(campaignId, "campaign-state");
        if (doc && typeof doc === "object") return doc;
      } catch {
        /* fall through */
      }
    }
    return readJsonLocal(`${campaignId}-campaign-state`, null);
  }

  async function loadStructure(campaignId) {
    if (useApi()) {
      try {
        const doc = await LocalApiClient.getCampaignDocument(campaignId, "section-structure");
        if (doc && typeof doc === "object") return doc;
      } catch {
        /* fall through */
      }
    }
    return readJsonLocal(`${campaignId}-section-structure`, null);
  }

  function currentSceneIdFromState(state) {
    if (!state?.scenes || typeof state.scenes !== "object") return null;
    const hit = Object.entries(state.scenes).find(([, s]) => s?.status === "current");
    return hit ? hit[0] : null;
  }

  function sceneTitleFromStructure(structure, sceneId) {
    if (!sceneId || !structure?.scenes) return null;
    const scene = structure.scenes.find((s) => s?.id === sceneId);
    return scene?.title ? String(scene.title).trim() : null;
  }

  function formatClock(clock) {
    if (!clock || typeof clock !== "object") return null;
    const day = Number(clock.day);
    const minute = Number(clock.minute);
    if (!Number.isFinite(day) || !Number.isFinite(minute)) return null;
    const hh = String(Math.floor(minute / 60)).padStart(2, "0");
    const mm = String(minute % 60).padStart(2, "0");
    return `Day ${Math.round(day)} · ${hh}:${mm}`;
  }

  function formatSessionLine(prefs, clock) {
    const session = prefs?.session ? String(prefs.session).trim() : "";
    const time = formatClock(clock);
    if (session && time) return `Session ${session} · ${time}`;
    if (session) return `Session ${session}`;
    if (time) return time;
    return null;
  }

  /**
   * @param {LibraryCampaignDef} def
   * @returns {Promise<{ id: string, title: string, description: string, level?: string, url: string, sandbox?: boolean, featured?: boolean, workspace: string, sessionLine: string|null, currentSceneId: string|null, currentSceneTitle: string|null }>}
   */
  async function summarize(def) {
    const [prefs, state, structure] = await Promise.all([
      loadPrefs(def.id),
      loadState(def.id),
      loadStructure(def.id)
    ]);
    const currentSceneId = currentSceneIdFromState(state);
    const currentSceneTitle = sceneTitleFromStructure(structure, currentSceneId);
    return {
      ...def,
      workspace: prefs.workspace || "run",
      sessionLine: formatSessionLine(prefs, state?.clock),
      currentSceneId,
      currentSceneTitle
    };
  }

  function listCampaignDefs() {
    /** @type {LibraryCampaignDef[]} */
    const out = [STORMWRECK];
    if (window.CampaignRegistry) {
      CampaignRegistry.list().forEach((c) => {
        out.push({
          id: c.id,
          title: c.title,
          description: c.description || "Custom sandbox campaign",
          level: c.level || "",
          url: CampaignRegistry.sandboxUrl(c.id),
          sandbox: true
        });
      });
    }
    return out;
  }

  function getLastOpenedId() {
    try {
      const raw = localStorage.getItem(LAST_OPENED_KEY);
      return raw ? String(raw).trim() : null;
    } catch {
      return null;
    }
  }

  function setLastOpened(campaignId) {
    if (!campaignId) return;
    try {
      localStorage.setItem(LAST_OPENED_KEY, String(campaignId));
    } catch {
      /* ignore */
    }
  }

  /** Pick Continue target: last opened if valid, else featured Stormwreck. */
  function pickContinueDef() {
    const defs = listCampaignDefs();
    const lastId = getLastOpenedId();
    if (lastId) {
      const hit = defs.find((d) => d.id === lastId);
      if (hit) return hit;
    }
    return defs.find((d) => d.featured) || defs[0] || null;
  }

  /**
   * @param {string} baseUrl
   * @param {"run"|"prep"|"map"|"session"|null} workspace
   */
  function campaignLaunchUrl(baseUrl, workspace) {
    if (!workspace) return baseUrl;
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}workspace=${encodeURIComponent(workspace)}`;
  }

  return {
    LAST_OPENED_KEY,
    STORMWRECK,
    escapeHtml,
    listCampaignDefs,
    summarize,
    pickContinueDef,
    getLastOpenedId,
    setLastOpened,
    campaignLaunchUrl,
    _test: {
      normalizeWorkspace,
      currentSceneIdFromState,
      sceneTitleFromStructure,
      formatSessionLine,
      formatClock
    }
  };
})();
