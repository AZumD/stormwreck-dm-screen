/**
 * Campaign-scoped play state: scenes, NPC memory, timeline.
 * Adventure/catalogue data stays immutable — this is session memory only.
 */
window.CampaignState = (function () {
  "use strict";

  const VERSION = 1;
  const SCENE_STATUSES = ["unseen", "current", "completed", "skipped"];

  let campaignId = null;
  let cache = null;

  function storageKey(id) {
    return `${id}-campaign-state`;
  }

  function emptyState() {
    return {
      version: VERSION,
      scenes: {},
      npcMemory: {},
      timeline: []
    };
  }

  function normalizeScene(raw) {
    const status = SCENE_STATUSES.includes(raw?.status) ? raw.status : "unseen";
    return {
      status,
      notes: typeof raw?.notes === "string" ? raw.notes : ""
    };
  }

  function normalizeMemory(raw) {
    const notes = Array.isArray(raw?.notes)
      ? raw.notes
          .map((n) => {
            if (typeof n === "string") return n.trim();
            if (n && typeof n.text === "string") return n.text.trim();
            return "";
          })
          .filter(Boolean)
      : [];
    const flags = Array.isArray(raw?.flags)
      ? raw.flags.map((f) => String(f || "").trim()).filter(Boolean)
      : [];
    const session =
      raw?.lastSeenSession == null || raw.lastSeenSession === ""
        ? null
        : Number(raw.lastSeenSession);
    return {
      attitude: String(raw?.attitude || "").trim(),
      mood: String(raw?.mood || "").trim(),
      lastSeenLocation: String(raw?.lastSeenLocation || "").trim(),
      lastSeenSession: Number.isFinite(session) ? session : null,
      notes,
      flags
    };
  }

  function normalizeTimelineEntry(raw) {
    if (!raw || typeof raw !== "object") return null;
    const text = String(raw.text || "").trim();
    if (!text && !raw.id) return null;
    const session = Number(raw.session);
    return {
      id: String(raw.id || generateId("tl")),
      timestamp: raw.timestamp || new Date().toISOString(),
      session: Number.isFinite(session) && session > 0 ? session : null,
      sceneId: String(raw.sceneId || "").trim(),
      locationId: String(raw.locationId || "").trim(),
      entityId: String(raw.entityId || "").trim(),
      type: String(raw.type || "note").trim() || "note",
      text: text
    };
  }

  function loadFromStorage(id) {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey(id)) || "null");
      if (!parsed || typeof parsed !== "object") return emptyState();
      const scenes = {};
      Object.entries(parsed.scenes || {}).forEach(([sid, val]) => {
        scenes[sid] = normalizeScene(val);
      });
      const npcMemory = {};
      Object.entries(parsed.npcMemory || {}).forEach(([eid, val]) => {
        npcMemory[eid] = normalizeMemory(val);
      });
      const timeline = Array.isArray(parsed.timeline)
        ? parsed.timeline.map(normalizeTimelineEntry).filter(Boolean)
        : [];
      return {
        version: VERSION,
        scenes,
        npcMemory,
        timeline
      };
    } catch {
      return emptyState();
    }
  }

  function persist() {
    if (!campaignId || !cache) return false;
    try {
      localStorage.setItem(storageKey(campaignId), JSON.stringify(cache));
      return true;
    } catch (err) {
      console.warn("CampaignState save failed:", err);
      return false;
    }
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function init(id) {
    campaignId = id || "campaign";
    cache = loadFromStorage(campaignId);
    return cache;
  }

  function ensure() {
    if (!cache || !campaignId) {
      init(campaignId || window.ADVENTURE?.meta?.id || "campaign");
    }
    return cache;
  }

  function getCampaignId() {
    ensure();
    return campaignId;
  }

  function memoryKey(entityId) {
    if (!entityId) return "";
    if (window.EntityRegistry?.resolve) {
      const entity = EntityRegistry.resolve(entityId);
      if (entity?.id) return entity.id;
      if (entity?.catalogueId) return entity.catalogueId;
    }
    return String(entityId);
  }

  /* ── Scenes ─────────────────────────────────────────── */

  function getSceneState(sceneId) {
    ensure();
    if (!sceneId) return normalizeScene(null);
    return normalizeScene(cache.scenes[sceneId]);
  }

  function getAllSceneStates() {
    ensure();
    const out = {};
    Object.keys(cache.scenes).forEach((id) => {
      out[id] = normalizeScene(cache.scenes[id]);
    });
    return out;
  }

  function getCurrentSceneId() {
    ensure();
    const hit = Object.entries(cache.scenes).find(([, s]) => s.status === "current");
    return hit ? hit[0] : null;
  }

  function setSceneState(sceneId, patch) {
    ensure();
    if (!sceneId) return getSceneState(sceneId);
    const next = { ...getSceneState(sceneId), ...(patch || {}) };
    if (!SCENE_STATUSES.includes(next.status)) next.status = "unseen";
    next.notes = typeof next.notes === "string" ? next.notes : "";

    if (next.status === "current") {
      Object.keys(cache.scenes).forEach((id) => {
        if (id !== sceneId && cache.scenes[id]?.status === "current") {
          cache.scenes[id] = { ...cache.scenes[id], status: "completed" };
        }
      });
    }

    if (next.status === "unseen" && !next.notes) {
      delete cache.scenes[sceneId];
    } else {
      cache.scenes[sceneId] = next;
    }
    persist();
    return getSceneState(sceneId);
  }

  function setSceneStatus(sceneId, status) {
    return setSceneState(sceneId, { status });
  }

  function setSceneNotes(sceneId, notes) {
    return setSceneState(sceneId, { notes: String(notes || "") });
  }

  /* ── NPC memory ─────────────────────────────────────── */

  function getNpcMemory(entityId) {
    ensure();
    const key = memoryKey(entityId);
    if (!key) return normalizeMemory(null);
    return normalizeMemory(cache.npcMemory[key] || cache.npcMemory[entityId]);
  }

  function hasNpcMemory(entityId) {
    const mem = getNpcMemory(entityId);
    return !!(
      mem.attitude ||
      mem.mood ||
      mem.lastSeenLocation ||
      mem.lastSeenSession != null ||
      mem.notes.length ||
      mem.flags.length
    );
  }

  function updateNpcMemory(entityId, patch) {
    ensure();
    const key = memoryKey(entityId) || String(entityId || "");
    if (!key) return normalizeMemory(null);
    const current = getNpcMemory(key);
    const next = normalizeMemory({ ...current, ...(patch || {}) });
    const empty =
      !next.attitude &&
      !next.mood &&
      !next.lastSeenLocation &&
      next.lastSeenSession == null &&
      !next.notes.length &&
      !next.flags.length;
    if (empty) delete cache.npcMemory[key];
    else cache.npcMemory[key] = next;
    persist();
    return getNpcMemory(key);
  }

  function addNpcNote(entityId, text) {
    const note = String(text || "").trim();
    if (!note) return getNpcMemory(entityId);
    const mem = getNpcMemory(entityId);
    if (mem.notes.includes(note)) return mem;
    return updateNpcMemory(entityId, { notes: [...mem.notes, note] });
  }

  function addNpcFlag(entityId, flag) {
    const value = String(flag || "").trim();
    if (!value) return getNpcMemory(entityId);
    const mem = getNpcMemory(entityId);
    if (mem.flags.includes(value)) return mem;
    return updateNpcMemory(entityId, { flags: [...mem.flags, value] });
  }

  /* ── Timeline ───────────────────────────────────────── */

  function getTimeline(filters) {
    ensure();
    let list = cache.timeline.slice();
    const f = filters || {};
    if (f.session != null && f.session !== "" && f.session !== "all") {
      const n = Number(f.session);
      list = list.filter((e) => e.session === n);
    }
    if (f.type && f.type !== "all") {
      if (f.type === "interaction") list = list.filter((e) => e.type === "interaction");
      else if (f.type === "scene") list = list.filter((e) => e.type === "scene" || !!e.sceneId);
      else if (f.type === "note") list = list.filter((e) => e.type === "note");
      else list = list.filter((e) => e.type === f.type);
    }
    if (f.entityId) {
      const key = memoryKey(f.entityId);
      list = list.filter((e) => e.entityId === f.entityId || e.entityId === key);
    }
    return list.sort((a, b) => {
      const sa = a.session || 0;
      const sb = b.session || 0;
      if (sb !== sa) return sb - sa;
      return String(b.timestamp).localeCompare(String(a.timestamp));
    });
  }

  function addTimelineEntry(entry) {
    ensure();
    const normalized = normalizeTimelineEntry({
      ...entry,
      id: entry?.id || generateId("tl"),
      timestamp: entry?.timestamp || new Date().toISOString()
    });
    if (!normalized || !normalized.text) return null;
    cache.timeline.push(normalized);
    persist();
    return normalized;
  }

  function updateTimelineEntry(id, patch) {
    ensure();
    const idx = cache.timeline.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const next = normalizeTimelineEntry({ ...cache.timeline[idx], ...patch, id });
    if (!next) return null;
    cache.timeline[idx] = next;
    persist();
    return next;
  }

  function deleteTimelineEntry(id) {
    ensure();
    const before = cache.timeline.length;
    cache.timeline = cache.timeline.filter((e) => e.id !== id);
    if (cache.timeline.length !== before) persist();
    return cache.timeline.length !== before;
  }

  /**
   * Log an NPC interaction: timeline + memory updates in one step.
   * @param {object} payload
   */
  function logInteraction(payload) {
    const p = payload || {};
    const entityId = String(p.entityId || "").trim();
    const text = String(p.text || "").trim();
    if (!entityId || !text) return null;

    const session =
      p.session == null || p.session === ""
        ? null
        : Number(p.session);
    const locationId = String(p.locationId || "").trim();
    const sceneId = String(p.sceneId || "").trim();
    const attitude = String(p.attitude || "").trim();
    const mood = String(p.mood || "").trim();

    const entry = addTimelineEntry({
      session: Number.isFinite(session) ? session : null,
      sceneId,
      locationId,
      entityId: memoryKey(entityId) || entityId,
      type: "interaction",
      text
    });

    const memPatch = {
      lastSeenSession: Number.isFinite(session) ? session : getNpcMemory(entityId).lastSeenSession
    };
    if (locationId) memPatch.lastSeenLocation = locationId;
    if (attitude) memPatch.attitude = attitude;
    if (mood) memPatch.mood = mood;
    if (p.addToNotes !== false) {
      const mem = getNpcMemory(entityId);
      memPatch.notes = [...mem.notes, text];
    }
    updateNpcMemory(entityId, memPatch);

    return entry;
  }

  return {
    VERSION,
    SCENE_STATUSES,
    init,
    getCampaignId,
    generateId,
    getSceneState,
    getAllSceneStates,
    getCurrentSceneId,
    setSceneState,
    setSceneStatus,
    setSceneNotes,
    getNpcMemory,
    hasNpcMemory,
    updateNpcMemory,
    addNpcNote,
    addNpcFlag,
    getTimeline,
    addTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry,
    logInteraction,
    memoryKey
  };
})();
