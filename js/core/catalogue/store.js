/**
 * Catalogue CRUD — memory cache + file-backed API (falls back to localStorage offline).
 */
window.CatalogueStore = (function () {
  "use strict";

  const cache = new Map(); /* type → entries[] */
  let bootstrapped = false;
  let bootstrapPromise = null;

  function key(type) {
    return `catalogue-${type}`;
  }

  function types() {
    return window.CatalogueTypes?.ids?.() || [
      "pc",
      "npc",
      "item",
      "monster",
      "location",
      "race",
      "class",
      "spell",
      "skill",
      "feature"
    ];
  }

  function loadAllLocal(type) {
    try {
      const data = JSON.parse(localStorage.getItem(key(type)) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveAllLocal(type, entries) {
    try {
      localStorage.setItem(key(type), JSON.stringify(entries));
      return { ok: true };
    } catch (err) {
      const quota = err && (err.name === "QuotaExceededError" || err.code === 22 || err.code === 1014);
      return { ok: false, quota: !!quota, error: err };
    }
  }

  function getEntries(type) {
    if (!cache.has(type)) cache.set(type, loadAllLocal(type));
    return cache.get(type);
  }

  function setEntries(type, entries) {
    cache.set(type, entries);
  }

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  async function bootstrap(typeList) {
    if (bootstrapped) return;
    if (bootstrapPromise) return bootstrapPromise;
    bootstrapPromise = (async () => {
      if (window.LocalApiClient) await LocalApiClient.ready();
      const list = typeList || types();
      if (useApi()) {
        for (const type of list) {
          try {
            const entries = await LocalApiClient.listCatalogue(type);
            setEntries(type, Array.isArray(entries) ? entries.slice() : []);
          } catch (err) {
            console.warn("Catalogue bootstrap failed for", type, err);
            setEntries(type, loadAllLocal(type));
          }
        }
      } else {
        list.forEach((type) => setEntries(type, loadAllLocal(type)));
      }
      bootstrapped = true;
    })();
    return bootstrapPromise;
  }

  function generateId(type) {
    return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function list(type) {
    return getEntries(type)
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
  }

  function get(type, id) {
    return getEntries(type).find((e) => e.id === id) || null;
  }

  function loadAll(type) {
    return getEntries(type).slice();
  }

  async function persistEntry(type, entry) {
    if (useApi()) {
      await LocalApiClient.putCatalogue(type, entry.id, entry);
      return { ok: true };
    }
    return saveAllLocal(type, getEntries(type));
  }

  async function upsert(type, entry) {
    const entries = getEntries(type);
    const idx = entries.findIndex((e) => e.id === entry.id);
    const saved = { ...entry, updatedAt: Date.now() };
    if (idx === -1) entries.push(saved);
    else entries[idx] = { ...entries[idx], ...saved };
    setEntries(type, entries);
    if (useApi()) {
      await LocalApiClient.putCatalogue(type, saved.id, saved);
    } else {
      const result = saveAllLocal(type, entries);
      if (!result.ok) {
        const error = new Error(result.quota ? "quota" : "save-failed");
        error.quota = result.quota;
        throw error;
      }
    }
    return saved;
  }

  async function remove(type, id) {
    const entries = getEntries(type).filter((e) => e.id !== id);
    setEntries(type, entries);
    if (useApi()) {
      await LocalApiClient.deleteCatalogue(type, id);
    } else {
      const result = saveAllLocal(type, entries);
      if (!result.ok) {
        const error = new Error(result.quota ? "quota" : "save-failed");
        error.quota = result.quota;
        throw error;
      }
    }
  }

  function saveAll(type, entries) {
    setEntries(type, entries.slice());
    if (useApi()) {
      /* Write each entry — used by legacy image migrate */
      const jobs = entries.map((e) => LocalApiClient.putCatalogue(type, e.id, e));
      return Promise.all(jobs).then(() => ({ ok: true }));
    }
    return saveAllLocal(type, entries);
  }

  /** Add seed entries whose ids are not already present; fill empty ref fields from seeds */
  async function mergeSeeds(type, seeds) {
    if (!Array.isArray(seeds) || !seeds.length) return 0;
    const entries = getEntries(type);
    const byId = new Map(entries.map((e) => [e.id, { ...e }]));
    let changed = 0;
    const changedIds = [];

    seeds.forEach((seed) => {
      if (!seed?.id) return;
      if (!byId.has(seed.id)) {
        const next = { ...seed, updatedAt: Date.now() };
        byId.set(seed.id, next);
        changedIds.push(seed.id);
        changed += 1;
        return;
      }
      const existing = byId.get(seed.id);
      let patched = false;
      [
        "featureRefs",
        "skillRefs",
        "tags",
        "traitRefs",
        "actionRefs",
        "bonusActionRefs",
        "reactionRefs",
        "legendaryActionRefs",
        "legendaryRefs",
        "category",
        "entryKind",
        "subclassRefs",
        "parentClassRef",
        "subspeciesRefs",
        "parentSpeciesRef",
        "locationType",
        "parentLocationRef",
        "classRefs",
        "source",
        "itemType",
        "rarity"
      ].forEach((field) => {
        const seedVal = seed[field];
        const cur = existing[field];
        const empty = cur == null || (Array.isArray(cur) ? !cur.length : String(cur).trim() === "");
        if (empty && seedVal != null && !(Array.isArray(seedVal) && !seedVal.length)) {
          existing[field] = Array.isArray(seedVal) ? seedVal.slice() : seedVal;
          patched = true;
        }
      });
      if (patched) {
        existing.updatedAt = Date.now();
        changedIds.push(seed.id);
        changed += 1;
      }
    });

    if (!changed) return 0;
    const next = [...byId.values()];
    setEntries(type, next);
    if (useApi()) {
      for (const id of changedIds) {
        const entry = byId.get(id);
        if (entry) await LocalApiClient.putCatalogue(type, id, entry);
      }
    } else {
      saveAllLocal(type, next);
    }
    return changed;
  }

  function isReady() {
    return bootstrapped;
  }

  return {
    list,
    get,
    upsert,
    remove,
    generateId,
    loadAll,
    mergeSeeds,
    saveAll,
    bootstrap,
    isReady,
    persistEntry
  };
})();
