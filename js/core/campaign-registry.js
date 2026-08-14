/**
 * User-created campaigns registry (landing page).
 * Built-in booklet campaigns (e.g. Stormwreck) stay as static folders;
 * custom campaigns open the shared sandbox shell with ?id=.
 */
window.CampaignRegistry = (function () {
  "use strict";

  const STORAGE_KEY = "dm-campaigns";
  const VERSION = 1;

  function empty() {
    return { version: VERSION, campaigns: [] };
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw || typeof raw !== "object") return empty();
      const campaigns = Array.isArray(raw.campaigns)
        ? raw.campaigns
            .map(normalize)
            .filter(Boolean)
        : [];
      return { version: VERSION, campaigns };
    } catch {
      return empty();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn("CampaignRegistry save failed:", err);
      return false;
    }
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
    return load().campaigns.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function get(id) {
    const key = String(id || "").trim();
    return load().campaigns.find((c) => c.id === key) || null;
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

  function create({ title, description, level } = {}) {
    const trimmed = String(title || "").trim();
    if (!trimmed) return null;
    const state = load();
    const entry = normalize({
      id: uniqueId(trimmed),
      title: trimmed,
      description: description || "",
      level: level || "",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    if (!entry) return null;
    state.campaigns.push(entry);
    save(state);
    return entry;
  }

  function update(id, patch) {
    const state = load();
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
    save(state);
    return next;
  }

  function remove(id) {
    const state = load();
    const before = state.campaigns.length;
    state.campaigns = state.campaigns.filter((c) => c.id !== id);
    if (state.campaigns.length === before) return false;
    save(state);
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
    sandboxUrl
  };
})();
