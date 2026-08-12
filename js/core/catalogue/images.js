/** IndexedDB image store for catalogues — localStorage is too small for photos/maps */
window.CatalogueImages = (function () {
  "use strict";

  const DB_NAME = "stormwreck-catalogue-images";
  const DB_VERSION = 1;
  const STORE = "images";
  const MARKER = "__idb__";
  const IMAGE_FIELDS = ["portrait", "mapImage"];

  const memory = new Map();
  let dbPromise = null;

  function key(type, entryId, field) {
    return `${type}:${entryId}:${field}`;
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

  function isDataUrl(value) {
    return typeof value === "string" && value.startsWith("data:image");
  }

  function isMarker(value) {
    return value === MARKER;
  }

  function getSync(type, entryId, field) {
    return memory.get(key(type, entryId, field)) || "";
  }

  function putMemory(type, entryId, field, dataUrl) {
    const k = key(type, entryId, field);
    if (dataUrl) memory.set(k, dataUrl);
    else memory.delete(k);
  }

  async function set(type, entryId, field, dataUrl) {
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
      /* IndexedDB unavailable — fall back to whatever is in localStorage */
    }
  }

  function hydrate(type, entry) {
    if (!entry?.id) return entry;
    const out = { ...entry };
    IMAGE_FIELDS.forEach((field) => {
      const cached = getSync(type, entry.id, field);
      if (cached) {
        out[field] = cached;
        return;
      }
      if (isMarker(out[field])) out[field] = "";
    });
    return out;
  }

  function hydrateAll(type, entries) {
    return (entries || []).map((e) => hydrate(type, e));
  }

  /** Move legacy data-URL images out of localStorage into IndexedDB */
  async function migrateType(type) {
    if (!window.CatalogueStore) return 0;
    let moved = 0;
    const entries = CatalogueStore.loadAll(type);
    let changed = false;

    for (const entry of entries) {
      let entryChanged = false;
      for (const field of IMAGE_FIELDS) {
        const value = entry[field];
        if (!isDataUrl(value)) continue;
        try {
          await set(type, entry.id, field, value);
          entry[field] = MARKER;
          entryChanged = true;
          moved += 1;
        } catch {
          /* keep data URL in localStorage if IDB write fails */
        }
      }
      if (entryChanged) changed = true;
    }

    if (changed) {
      try {
        CatalogueStore.saveAll(type, entries);
      } catch {
        /* ignore */
      }
    }
    return moved;
  }

  async function migrateAll(types = ["pc", "npc", "item", "monster", "location"]) {
    let total = 0;
    for (const type of types) total += await migrateType(type);
    return total;
  }

  async function persistEntryImages(type, entry) {
    if (!entry?.id) return entry;
    const out = { ...entry };
    for (const field of IMAGE_FIELDS) {
      const value = out[field];
      if (isDataUrl(value)) {
        try {
          out[field] = await set(type, entry.id, field, value);
        } catch (err) {
          const error = new Error("idb-save-failed");
          error.cause = err;
          throw error;
        }
      } else if (value === "" || value == null) {
        await set(type, entry.id, field, "");
        out[field] = "";
      } else if (isMarker(value)) {
        out[field] = MARKER;
      }
    }
    return out;
  }

  return {
    MARKER,
    IMAGE_FIELDS,
    isDataUrl,
    isMarker,
    getSync,
    set,
    preload,
    hydrate,
    hydrateAll,
    migrateType,
    migrateAll,
    persistEntryImages
  };
})();
