/**
 * Catalogue images — file-backed assets via API (same /data tree as catalogue JSON).
 * IndexedDB is kept only for offline fallback + one-shot migration/import.
 */
window.CatalogueImages = (function () {
  "use strict";

  const DB_NAME = "stormwreck-catalogue-images";
  const DB_VERSION = 1;
  const STORE = "images";
  const MARKER = "__idb__";
  const IMAGE_FIELDS = ["portrait", "mapImage", "tokenImage"];

  const memory = new Map();
  let dbPromise = null;

  function key(type, entryId, field) {
    return `${type}:${entryId}:${field}`;
  }

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  function isDataUrl(value) {
    return typeof value === "string" && value.startsWith("data:image");
  }

  function isMarker(value) {
    return value === MARKER;
  }

  function isAssetUrl(value) {
    return typeof value === "string" && value.startsWith("/api/assets/");
  }

  function allTypes() {
    return (
      window.CatalogueTypes?.ids?.() || [
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
      ]
    );
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    if (typeof indexedDB === "undefined") {
      dbPromise = Promise.reject(new Error("no-idb"));
      return dbPromise;
    }
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("idb-open-failed"));
    });
    return dbPromise;
  }

  function getSync(type, entryId, field) {
    return memory.get(key(type, entryId, field)) || "";
  }

  function putMemory(type, entryId, field, dataUrl) {
    const k = key(type, entryId, field);
    if (dataUrl) memory.set(k, dataUrl);
    else memory.delete(k);
  }

  /** Legacy IDB write — used only when API unavailable */
  async function setIdb(type, entryId, field, dataUrl) {
    putMemory(type, entryId, field, dataUrl);
    if (!dataUrl) {
      try {
        const db = await openDb();
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE, "readwrite");
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.objectStore(STORE).delete(key(type, entryId, field));
        });
      } catch {
        /* memory still updated */
      }
      return MARKER;
    }
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put({
        id: key(type, entryId, field),
        type,
        entryId,
        field,
        dataUrl,
        updatedAt: Date.now()
      });
    });
    return MARKER;
  }

  async function set(type, entryId, field, dataUrl) {
    if (useApi()) {
      if (!dataUrl) {
        putMemory(type, entryId, field, "");
        await LocalApiClient.deleteCatalogueAsset(type, entryId, field);
        return "";
      }
      if (isDataUrl(dataUrl)) {
        putMemory(type, entryId, field, dataUrl);
        const result = await LocalApiClient.putCatalogueAsset(type, entryId, field, dataUrl);
        const url =
          result.url ||
          `/api/assets/${field === "mapImage" ? "maps" : field === "tokenImage" ? "tokens" : "portraits"}/${type}/${entryId}`;
        putMemory(type, entryId, field, url);
        return url;
      }
      if (isAssetUrl(dataUrl)) {
        putMemory(type, entryId, field, dataUrl);
        return dataUrl;
      }
      return dataUrl;
    }
    return setIdb(type, entryId, field, dataUrl);
  }

  /** Explicit remove (clear button). Never call this for blank form fields. */
  async function clear(type, entryId, field) {
    return set(type, entryId, field, "");
  }

  /**
   * Always load IndexedDB into memory so legacy images can migrate when the API is up.
   * File-backed `/api/assets/…` URLs still load from the server on demand.
   */
  async function preload(types) {
    const list = Array.isArray(types) ? types : [types];
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => {
          (req.result || []).forEach((row) => {
            if (!row?.id || !row.dataUrl) return;
            if (list.length && row.type && !list.includes(row.type)) return;
            memory.set(row.id, row.dataUrl);
          });
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      /* IndexedDB unavailable */
    }
  }

  function hydrate(type, entry) {
    if (!entry?.id) return entry;
    const out = { ...entry };
    IMAGE_FIELDS.forEach((field) => {
      if (isAssetUrl(out[field])) return;
      const cached = getSync(type, entry.id, field);
      if (cached) {
        out[field] = cached;
        return;
      }
      if (isMarker(out[field]) && useApi()) {
        const kind = field === "tokenImage" ? "tokens" : field === "mapImage" ? "maps" : "portraits";
        out[field] = `/api/assets/${kind}/${type}/${entry.id}`;
        return;
      }
    });
    return out;
  }

  function hydrateAll(type, entries) {
    return (entries || []).map((e) => hydrate(type, e));
  }

  async function migrateFieldFromCache(type, entryId, field) {
    const cached = getSync(type, entryId, field);
    if (!cached || !useApi()) return null;
    if (isDataUrl(cached)) return set(type, entryId, field, cached);
    if (isAssetUrl(cached)) return cached;
    return null;
  }

  /** Move legacy data-URL / IDB images into file assets when API is available */
  async function migrateType(type) {
    if (!window.CatalogueStore) return 0;
    let moved = 0;
    const entries = CatalogueStore.loadAll(type);

    for (const entry of entries) {
      let entryChanged = false;
      for (const field of IMAGE_FIELDS) {
        const value = entry[field];
        if (isAssetUrl(value)) continue;
        if (isDataUrl(value)) {
          try {
            entry[field] = await set(type, entry.id, field, value);
            entryChanged = true;
            moved += 1;
          } catch {
            /* keep prior value */
          }
          continue;
        }
        if (isMarker(value) || !value) {
          try {
            const migrated = await migrateFieldFromCache(type, entry.id, field);
            if (migrated) {
              entry[field] = migrated;
              entryChanged = true;
              moved += 1;
            }
          } catch {
            /* ignore */
          }
        }
      }
      if (entryChanged) {
        try {
          await CatalogueStore.upsert(type, entry);
        } catch {
          /* ignore */
        }
      }
    }
    return moved;
  }

  async function migrateAll(types) {
    const list = types || allTypes();
    let total = 0;
    for (const type of list) total += await migrateType(type);
    return total;
  }

  /**
   * Persist image fields for an entry.
   * Empty strings do NOT delete files — that was wiping portraits on ordinary text saves.
   * Pass `clearFields: ["portrait"]` (or use clear()) for intentional removes.
   */
  async function persistEntryImages(type, entry, options = {}) {
    if (!entry?.id) return entry;
    const clearFields = new Set(options.clearFields || []);
    const previous = window.CatalogueStore?.get?.(type, entry.id) || null;
    const out = { ...entry };

    for (const field of IMAGE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(out, field) && !clearFields.has(field)) {
        if (previous && Object.prototype.hasOwnProperty.call(previous, field)) {
          out[field] = previous[field];
        }
        continue;
      }

      const value = out[field];

      if (clearFields.has(field)) {
        try {
          await clear(type, entry.id, field);
          out[field] = "";
        } catch (err) {
          const error = new Error("asset-save-failed");
          error.cause = err;
          throw error;
        }
        continue;
      }

      if (isDataUrl(value)) {
        try {
          out[field] = await set(type, entry.id, field, value);
        } catch (err) {
          const error = new Error("asset-save-failed");
          error.cause = err;
          throw error;
        }
        continue;
      }

      if (isAssetUrl(value)) {
        out[field] = value;
        continue;
      }

      if (isMarker(value)) {
        const migrated = await migrateFieldFromCache(type, entry.id, field);
        out[field] = migrated || MARKER;
        continue;
      }

      if (value === "" || value == null) {
        const prevVal = previous?.[field];
        if (isAssetUrl(prevVal)) {
          out[field] = prevVal;
          continue;
        }
        if (isMarker(prevVal) || isDataUrl(prevVal)) {
          const migrated = await migrateFieldFromCache(type, entry.id, field);
          if (migrated) {
            out[field] = migrated;
            continue;
          }
          if (isMarker(prevVal) || isDataUrl(prevVal)) {
            out[field] = prevVal;
            continue;
          }
        }
        out[field] = "";
        continue;
      }
    }

    return out;
  }

  /** Dump all IndexedDB images for browser→file import */
  async function exportAllIdb() {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  return {
    MARKER,
    IMAGE_FIELDS,
    isDataUrl,
    isMarker,
    isAssetUrl,
    getSync,
    set,
    clear,
    preload,
    hydrate,
    hydrateAll,
    migrateType,
    migrateAll,
    persistEntryImages,
    exportAllIdb
  };
})();
