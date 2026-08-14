/**
 * Campaign Chronicle — Story So Far, session prose, curated Key Events.
 * Separate from CampaignState History (factual ledger) and DM notes.
 */
window.ChronicleStore = (function () {
  "use strict";

  const VERSION = 1;
  const EVENT_TYPES = [
    "discovery",
    "combat",
    "relationship",
    "decision",
    "arrival",
    "loss",
    "victory",
    "revelation",
    "other"
  ];
  const IMPORTANCE = ["normal", "major"];

  let campaignId = null;
  let cache = null;

  function storageKey(id) {
    return `${id}-chronicle`;
  }

  function prefKey(id) {
    return `${id}-chronicle-session-order`;
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function emptyState() {
    return {
      version: VERSION,
      storySoFar: "",
      sessions: {},
      keyEvents: []
    };
  }

  function normalizeSession(raw, sessionNum) {
    const session = Number(raw?.session ?? sessionNum);
    if (!Number.isFinite(session) || session < 1) return null;
    return {
      session,
      title: String(raw?.title || "").trim(),
      playedDate: String(raw?.playedDate || "").trim(),
      inWorldDate: String(raw?.inWorldDate || "").trim(),
      content: typeof raw?.content === "string" ? raw.content : "",
      updatedAt: raw?.updatedAt || Date.now()
    };
  }

  function normalizeKeyEvent(raw) {
    if (!raw || typeof raw !== "object") return null;
    const title = String(raw.title || "").trim();
    if (!title && !raw.id) return null;
    const session = Number(raw.session);
    let type = String(raw.type || "other").trim().toLowerCase();
    if (!EVENT_TYPES.includes(type)) type = "other";
    let importance = String(raw.importance || "normal").trim().toLowerCase();
    if (!IMPORTANCE.includes(importance)) importance = "normal";
    const entityIds = Array.isArray(raw.entityIds)
      ? raw.entityIds.map((id) => String(id || "").trim()).filter(Boolean)
      : raw.entityId
        ? [String(raw.entityId).trim()].filter(Boolean)
        : [];
    const order = Number(raw.order);
    return {
      id: String(raw.id || generateId("ke")),
      session: Number.isFinite(session) && session > 0 ? session : null,
      title: title || "Untitled event",
      description: String(raw.description || "").trim(),
      type,
      importance,
      sceneId: String(raw.sceneId || "").trim(),
      locationId: String(raw.locationId || "").trim(),
      entityIds,
      sourceHistoryId: String(raw.sourceHistoryId || "").trim() || null,
      order: Number.isFinite(order) ? order : Date.now(),
      timestamp: raw.timestamp || new Date().toISOString()
    };
  }

  function load() {
    if (!campaignId) return emptyState();
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey(campaignId)) || "null");
      if (!raw || typeof raw !== "object") return emptyState();
      const sessions = {};
      Object.entries(raw.sessions || {}).forEach(([key, val]) => {
        const s = normalizeSession(val, key);
        if (s) sessions[String(s.session)] = s;
      });
      const keyEvents = Array.isArray(raw.keyEvents)
        ? raw.keyEvents.map(normalizeKeyEvent).filter(Boolean)
        : [];
      return {
        version: VERSION,
        storySoFar: typeof raw.storySoFar === "string" ? raw.storySoFar : "",
        sessions,
        keyEvents
      };
    } catch {
      return emptyState();
    }
  }

  function save(state) {
    if (!campaignId) return false;
    try {
      localStorage.setItem(storageKey(campaignId), JSON.stringify(state));
      cache = state;
      return true;
    } catch (err) {
      console.warn("ChronicleStore save failed:", err);
      return false;
    }
  }

  function ensure() {
    if (!cache) cache = load();
    return cache;
  }

  function init(id) {
    campaignId = id;
    cache = load();
    return cache;
  }

  function getStorySoFar() {
    return ensure().storySoFar || "";
  }

  function setStorySoFar(text) {
    const state = ensure();
    state.storySoFar = typeof text === "string" ? text : "";
    save(state);
    return state.storySoFar;
  }

  function listSessions() {
    return Object.values(ensure().sessions).sort((a, b) => a.session - b.session);
  }

  function getSession(sessionNum) {
    const n = Number(sessionNum);
    if (!Number.isFinite(n)) return null;
    return ensure().sessions[String(n)] || null;
  }

  function upsertSession(partial) {
    const state = ensure();
    const existing = getSession(partial?.session);
    const next = normalizeSession({ ...(existing || {}), ...(partial || {}) }, partial?.session);
    if (!next) return null;
    next.updatedAt = Date.now();
    state.sessions[String(next.session)] = next;
    save(state);
    return next;
  }

  function deleteSession(sessionNum) {
    const state = ensure();
    const key = String(sessionNum);
    if (!state.sessions[key]) return false;
    delete state.sessions[key];
    save(state);
    return true;
  }

  function suggestNextSessionNumber(currentCampaignSession) {
    const sessions = listSessions();
    const maxChronicle = sessions.reduce((m, s) => Math.max(m, s.session), 0);
    const current = Number(currentCampaignSession) || 1;
    if (!sessions.some((s) => s.session === current)) return current;
    return Math.max(maxChronicle, current) + 1;
  }

  function listKeyEvents(filters) {
    let list = ensure().keyEvents.slice();
    if (filters?.session != null && filters.session !== "" && filters.session !== "all") {
      const s = Number(filters.session);
      list = list.filter((e) => e.session === s);
    }
    if (filters?.entityId) {
      const id = String(filters.entityId);
      list = list.filter((e) => e.entityIds.includes(id));
    }
    if (filters?.locationId) {
      const id = String(filters.locationId);
      list = list.filter((e) => e.locationId === id);
    }
    list.sort((a, b) => {
      const sa = a.session || 0;
      const sb = b.session || 0;
      if (sa !== sb) return sa - sb;
      return (a.order || 0) - (b.order || 0);
    });
    return list;
  }

  function getKeyEvent(id) {
    return ensure().keyEvents.find((e) => e.id === id) || null;
  }

  function upsertKeyEvent(partial) {
    const state = ensure();
    const existing = partial?.id ? getKeyEvent(partial.id) : null;
    const next = normalizeKeyEvent({ ...(existing || {}), ...(partial || {}) });
    if (!next || !next.title) return null;
    if (!existing) {
      const siblings = state.keyEvents.filter((e) => e.session === next.session);
      const maxOrder = siblings.reduce((m, e) => Math.max(m, e.order || 0), 0);
      if (!partial?.order) next.order = maxOrder + 1;
      state.keyEvents.push(next);
    } else {
      state.keyEvents = state.keyEvents.map((e) => (e.id === next.id ? next : e));
    }
    save(state);
    return next;
  }

  function deleteKeyEvent(id) {
    const state = ensure();
    const before = state.keyEvents.length;
    state.keyEvents = state.keyEvents.filter((e) => e.id !== id);
    if (state.keyEvents.length === before) return false;
    save(state);
    return true;
  }

  function moveKeyEvent(id, direction) {
    const state = ensure();
    const event = state.keyEvents.find((e) => e.id === id);
    if (!event || event.session == null) return null;
    const siblings = state.keyEvents
      .filter((e) => e.session === event.session)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = siblings.findIndex((e) => e.id === id);
    const swapWith = direction < 0 ? idx - 1 : idx + 1;
    if (idx < 0 || swapWith < 0 || swapWith >= siblings.length) return event;
    const a = siblings[idx];
    const b = siblings[swapWith];
    const tmp = a.order;
    a.order = b.order;
    b.order = tmp;
    save(state);
    return a;
  }

  function getSessionOrderNewestFirst() {
    if (!campaignId) return true;
    try {
      const v = localStorage.getItem(prefKey(campaignId));
      if (v === "oldest") return false;
      return true;
    } catch {
      return true;
    }
  }

  function setSessionOrderNewestFirst(newestFirst) {
    if (!campaignId) return;
    try {
      localStorage.setItem(prefKey(campaignId), newestFirst ? "newest" : "oldest");
    } catch {
      /* ignore */
    }
  }

  function fromHistoryEntry(entry) {
    if (!entry) return null;
    return {
      session: entry.session,
      title: String(entry.text || "").trim().slice(0, 80),
      description: String(entry.text || "").trim(),
      sceneId: entry.sceneId || "",
      locationId: entry.locationId || "",
      entityIds: entry.entityId ? [entry.entityId] : [],
      sourceHistoryId: entry.id || null,
      type: "other",
      importance: "normal"
    };
  }

  return {
    VERSION,
    EVENT_TYPES,
    IMPORTANCE,
    init,
    getStorySoFar,
    setStorySoFar,
    listSessions,
    getSession,
    upsertSession,
    deleteSession,
    suggestNextSessionNumber,
    listKeyEvents,
    getKeyEvent,
    upsertKeyEvent,
    deleteKeyEvent,
    moveKeyEvent,
    getSessionOrderNewestFirst,
    setSessionOrderNewestFirst,
    fromHistoryEntry,
    generateId
  };
})();
