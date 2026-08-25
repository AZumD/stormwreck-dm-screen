/**
 * Campaign music mixer persistence — ordered catalogue track slots in the map rail.
 * Runtime play state lives in MusicMixerUi, not in this document.
 */
window.CampaignMusicMixer = (function () {
  "use strict";

  const DOC_KIND = "music-mixer";
  const mem = new Map();

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  function empty() {
    return { tracks: [] };
  }

  function normalizeTrack(raw, index) {
    if (!raw || typeof raw !== "object") return null;
    const catalogueMusicId = String(raw.catalogueMusicId || raw.musicId || "").trim();
    if (!catalogueMusicId) return null;
    const volume = Number(raw.volume);
    return {
      id: String(raw.id || "").trim() || newSlotId(),
      catalogueMusicId,
      title: String(raw.title || "Untitled track").trim() || "Untitled track",
      volume: Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0.7,
      loop: raw.loop !== false && raw.loop !== 0 && raw.loop !== "0",
      order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : index
    };
  }

  function normalizeDoc(doc) {
    const base = empty();
    const tracks = Array.isArray(doc?.tracks) ? doc.tracks : [];
    base.tracks = tracks
      .map((t, i) => normalizeTrack(t, i))
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)
      .map((t, i) => ({ ...t, order: i }));
    return base;
  }

  function newSlotId() {
    return `mx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function loadLocal(campaignId) {
    try {
      const raw = localStorage.getItem(`${campaignId}-music-mixer`);
      if (!raw) return empty();
      return normalizeDoc(JSON.parse(raw));
    } catch {
      return empty();
    }
  }

  function saveLocal(campaignId, data) {
    try {
      localStorage.setItem(`${campaignId}-music-mixer`, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  function get(campaignId) {
    if (!mem.has(campaignId)) mem.set(campaignId, empty());
    return mem.get(campaignId);
  }

  function persist(campaignId) {
    const data = get(campaignId);
    if (useApi()) {
      LocalApiClient.putCampaignDocument(campaignId, DOC_KIND, data).catch((err) => {
        console.warn("music-mixer save failed:", err);
      });
    } else {
      saveLocal(campaignId, data);
    }
  }

  async function bootstrap(campaignId) {
    if (window.LocalApiClient) await LocalApiClient.ready();
    if (useApi()) {
      try {
        const doc = await LocalApiClient.getCampaignDocument(campaignId, DOC_KIND);
        mem.set(campaignId, normalizeDoc(doc));
        return get(campaignId);
      } catch (err) {
        console.warn("music-mixer API load failed:", err);
      }
    }
    mem.set(campaignId, loadLocal(campaignId));
    return get(campaignId);
  }

  function sortedTracks(campaignId) {
    return get(campaignId)
      .tracks.slice()
      .sort((a, b) => a.order - b.order);
  }

  function setTracks(campaignId, tracks) {
    const next = normalizeDoc({ tracks });
    mem.set(campaignId, next);
    persist(campaignId);
    return next;
  }

  function addTrack(campaignId, { catalogueMusicId, title, volume, loop } = {}) {
    const id = String(catalogueMusicId || "").trim();
    if (!id) return null;
    const tracks = sortedTracks(campaignId);
    const slot = normalizeTrack(
      {
        id: newSlotId(),
        catalogueMusicId: id,
        title: title || "Untitled track",
        volume: volume != null ? volume : 0.7,
        loop: loop !== false,
        order: tracks.length
      },
      tracks.length
    );
    tracks.push(slot);
    setTracks(campaignId, tracks);
    return slot;
  }

  function removeTrack(campaignId, slotId) {
    const tracks = sortedTracks(campaignId).filter((t) => t.id !== slotId);
    setTracks(campaignId, tracks);
    return true;
  }

  function updateTrack(campaignId, slotId, partial) {
    const tracks = sortedTracks(campaignId);
    const idx = tracks.findIndex((t) => t.id === slotId);
    if (idx < 0) return null;
    tracks[idx] = normalizeTrack({ ...tracks[idx], ...(partial || {}), id: slotId }, idx);
    setTracks(campaignId, tracks);
    return tracks[idx];
  }

  function reorderTracks(campaignId, orderedIds) {
    const byId = new Map(sortedTracks(campaignId).map((t) => [t.id, t]));
    const next = [];
    for (const id of orderedIds || []) {
      const hit = byId.get(id);
      if (hit) {
        next.push(hit);
        byId.delete(id);
      }
    }
    for (const leftover of byId.values()) next.push(leftover);
    setTracks(
      campaignId,
      next.map((t, i) => ({ ...t, order: i }))
    );
    return sortedTracks(campaignId);
  }

  return {
    DOC_KIND,
    bootstrap,
    get,
    persist,
    empty,
    sortedTracks,
    addTrack,
    removeTrack,
    updateTrack,
    reorderTracks,
    newSlotId
  };
})();
