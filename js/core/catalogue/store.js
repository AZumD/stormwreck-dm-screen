/** localStorage CRUD for global catalogues */
window.CatalogueStore = (function () {
  "use strict";

  function key(type) {
    return `catalogue-${type}`;
  }

  function loadAll(type) {
    try {
      const data = JSON.parse(localStorage.getItem(key(type)) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveAll(type, entries) {
    try {
      localStorage.setItem(key(type), JSON.stringify(entries));
      return { ok: true };
    } catch (err) {
      const quota = err && (err.name === "QuotaExceededError" || err.code === 22 || err.code === 1014);
      return {
        ok: false,
        quota: !!quota,
        error: err
      };
    }
  }

  function generateId(type) {
    return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function list(type) {
    return loadAll(type).sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
  }

  function get(type, id) {
    return loadAll(type).find((e) => e.id === id) || null;
  }

  function upsert(type, entry) {
    const entries = loadAll(type);
    const idx = entries.findIndex((e) => e.id === entry.id);
    const saved = { ...entry, updatedAt: Date.now() };
    if (idx === -1) entries.push(saved);
    else entries[idx] = { ...entries[idx], ...saved };
    const result = saveAll(type, entries);
    if (!result.ok) {
      const error = new Error(result.quota ? "quota" : "save-failed");
      error.quota = result.quota;
      throw error;
    }
    return saved;
  }

  function remove(type, id) {
    const entries = loadAll(type).filter((e) => e.id !== id);
    const result = saveAll(type, entries);
    if (!result.ok) {
      const error = new Error(result.quota ? "quota" : "save-failed");
      error.quota = result.quota;
      throw error;
    }
  }

  /** Add seed entries whose ids are not already present */
  function mergeSeeds(type, seeds) {
    if (!Array.isArray(seeds) || !seeds.length) return 0;
    const entries = loadAll(type);
    const ids = new Set(entries.map((e) => e.id));
    const added = seeds.filter((s) => s.id && !ids.has(s.id));
    if (!added.length) return 0;
    saveAll(type, [...entries, ...added.map((e) => ({ ...e, updatedAt: Date.now() }))]);
    return added.length;
  }

  return { list, get, upsert, remove, generateId, loadAll, mergeSeeds, saveAll };
})();
