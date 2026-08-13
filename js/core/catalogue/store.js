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

  /** Add seed entries whose ids are not already present; fill empty ref fields from seeds */
  function mergeSeeds(type, seeds) {
    if (!Array.isArray(seeds) || !seeds.length) return 0;
    const entries = loadAll(type);
    const byId = new Map(entries.map((e) => [e.id, { ...e }]));
    let changed = 0;

    seeds.forEach((seed) => {
      if (!seed?.id) return;
      if (!byId.has(seed.id)) {
        byId.set(seed.id, { ...seed, updatedAt: Date.now() });
        changed += 1;
        return;
      }
      const existing = byId.get(seed.id);
      let patched = false;
      ["featureRefs", "skillRefs", "tags"].forEach((key) => {
        const seedVal = seed[key];
        const cur = existing[key];
        const empty = cur == null || (Array.isArray(cur) ? !cur.length : String(cur).trim() === "");
        if (empty && seedVal != null && !(Array.isArray(seedVal) && !seedVal.length)) {
          existing[key] = Array.isArray(seedVal) ? seedVal.slice() : seedVal;
          patched = true;
        }
      });
      if (patched) {
        existing.updatedAt = Date.now();
        changed += 1;
      }
    });

    if (!changed) return 0;
    saveAll(type, [...byId.values()]);
    return changed;
  }

  return { list, get, upsert, remove, generateId, loadAll, mergeSeeds, saveAll };
})();
