/**
 * User-created campaigns registry — file-backed via /api when available.
 */
window.CampaignRegistry = (function () {
  "use strict";

  const STORAGE_KEY = "dm-campaigns";
  const VERSION = 1;
  let cache = null;
  let readyPromise = null;

  function empty() {
    return { version: VERSION, campaigns: [] };
  }

  function normalize(raw) {
    if (!raw || typeof raw !== "object") return null;
    const id = String(raw.id || "").trim();
    const title = String(raw.title || "").trim();
    if (!id || !title) return null;
    return {
      id,
      title,
      description: String(raw.description || "").trim(),
      level: String(raw.level || "").trim(),
      createdAt: raw.createdAt || Date.now(),
      updatedAt: raw.updatedAt || Date.now()
    };
  }

  function loadLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw || typeof raw !== "object") return empty();
      const campaigns = Array.isArray(raw.campaigns)
        ? raw.campaigns.map(normalize).filter(Boolean)
        : [];
      return { version: VERSION, campaigns };
    } catch {
      return empty();
    }
  }

  function saveLocal(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn("CampaignRegistry save failed:", err);
      return false;
    }
  }

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  async function bootstrap() {
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      if (window.LocalApiClient) await LocalApiClient.ready();
      if (useApi()) {
        try {
          const list = await LocalApiClient.listCampaigns();
          cache = { version: VERSION, campaigns: (list || []).map(normalize).filter(Boolean) };
          return cache;
        } catch (err) {
          console.warn("CampaignRegistry API load failed:", err);
        }
      }
      cache = loadLocal();
      return cache;
    })();
    return readyPromise;
  }

  function ensure() {
    if (!cache) cache = loadLocal();
    return cache;
  }

  function slugify(title) {
    const base = String(title || "campaign")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return base || "campaign";
  }

  function list() {
    return ensure()
      .campaigns.slice()
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function get(id) {
    const key = String(id || "").trim();
    return ensure().campaigns.find((c) => c.id === key) || null;
  }

  function exists(id) {
    if (id === "stormwreck-isle") return true;
    return !!get(id);
  }

  function uniqueId(title) {
    let base = slugify(title);
    if (base === "stormwreck-isle") base = "campaign";
    let id = base;
    let n = 2;
    while (exists(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    return id;
  }

  async function create({ title, description, level } = {}) {
    const trimmed = String(title || "").trim();
    if (!trimmed) return null;
    await bootstrap();
    if (useApi()) {
      const entry = await LocalApiClient.createCampaign({
        title: trimmed,
        description: description || "",
        level: level || ""
      });
      const normalized = normalize(entry);
      if (normalized) {
        ensure().campaigns.push(normalized);
      }
      return normalized;
    }
    const entry = normalize({
      id: uniqueId(trimmed),
      title: trimmed,
      description: description || "",
      level: level || "",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    if (!entry) return null;
    ensure().campaigns.push(entry);
    saveLocal(ensure());
    return entry;
  }

  async function update(id, patch) {
    await bootstrap();
    if (useApi()) {
      const entry = await LocalApiClient.updateCampaign(id, patch || {});
      const normalized = normalize(entry);
      const state = ensure();
      const idx = state.campaigns.findIndex((c) => c.id === id);
      if (idx >= 0 && normalized) state.campaigns[idx] = normalized;
      return normalized;
    }
    const state = ensure();
    const idx = state.campaigns.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    const next = normalize({
      ...state.campaigns[idx],
      ...(patch || {}),
      id,
      updatedAt: Date.now()
    });
    if (!next) return null;
    state.campaigns[idx] = next;
    saveLocal(state);
    return next;
  }

  async function remove(id) {
    await bootstrap();
    if (useApi()) {
      await LocalApiClient.removeCampaign(id);
      ensure().campaigns = ensure().campaigns.filter((c) => c.id !== id);
      return true;
    }
    const state = ensure();
    const before = state.campaigns.length;
    state.campaigns = state.campaigns.filter((c) => c.id !== id);
    if (state.campaigns.length === before) return false;
    saveLocal(state);
    return true;
  }

  function sandboxUrl(id) {
    return `campaigns/sandbox/index.html?id=${encodeURIComponent(id)}`;
  }

  return {
    STORAGE_KEY,
    list,
    get,
    exists,
    create,
    update,
    remove,
    uniqueId,
    slugify,
    sandboxUrl,
    bootstrap
  };
})();
