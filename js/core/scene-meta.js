/**
 * Scene design metadata — entity cast + connections per section/scene.
 * Separate from CampaignState (play status/notes) and SectionEditor (prose).
 */
window.SceneMeta = (function () {
  "use strict";

  function storageKey(campaignId) {
    return `${campaignId}-scene-meta`;
  }

  function trayKey(campaignId) {
    return `${campaignId}-scene-tray-collapsed`;
  }

  function loadAll(campaignId) {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey(campaignId)) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch {
      return {};
    }
  }

  function saveAll(campaignId, data) {
    try {
      localStorage.setItem(storageKey(campaignId), JSON.stringify(data));
      return true;
    } catch (err) {
      console.warn("SceneMeta save failed:", err);
      return false;
    }
  }

  function normalizeEntity(raw) {
    if (!raw) return null;
    if (typeof raw === "string") {
      const id = raw.trim();
      return id ? { id } : null;
    }
    const id = String(raw.id || "").trim();
    if (!id) return null;
    const qty = raw.quantity == null || raw.quantity === "" ? null : Number(raw.quantity);
    const note = String(raw.note || "").trim();
    const out = { id };
    if (Number.isFinite(qty) && qty > 0) out.quantity = qty;
    if (note) out.note = note;
    /* type is inferred via EntityRegistry — not stored */
    return out;
  }

  function normalizeConnection(raw) {
    if (!raw) return null;
    if (typeof raw === "string") {
      const sceneId = raw.trim();
      return sceneId ? { sceneId } : null;
    }
    const sceneId = String(raw.sceneId || raw.to || raw.id || "").trim();
    if (!sceneId) return null;
    const label = String(raw.label || "").trim();
    const out = { sceneId };
    if (label) out.label = label;
    return out;
  }

  function normalizeMeta(raw) {
    const entities = Array.isArray(raw?.entities)
      ? raw.entities.map(normalizeEntity).filter(Boolean)
      : [];
    const connections = Array.isArray(raw?.connections)
      ? raw.connections.map(normalizeConnection).filter(Boolean)
      : [];
    return {
      locationId: String(raw?.locationId || "").trim(),
      entities,
      connections
    };
  }

  function defaultsFromSection(section) {
    if (!section) return normalizeMeta(null);
    /* Prefer nested section.scene; fall back to legacy top-level fields */
    const nested = section.scene && typeof section.scene === "object" ? section.scene : null;
    return normalizeMeta({
      locationId: nested?.locationId ?? section.locationId,
      entities: nested?.entities ?? section.entities,
      connections: nested?.connections ?? section.connections
    });
  }

  function entityKey(entity) {
    return String(entity?.id || "");
  }

  /** Merge booklet defaults with local overrides (overrides win per field when present). */
  function get(campaignId, sectionId, section) {
    const defaults = defaultsFromSection(section);
    const stored = normalizeMeta(loadAll(campaignId)[sectionId] || null);
    const hasStore = !!loadAll(campaignId)[sectionId];

    if (!hasStore) return defaults;

    /* Stored empty arrays intentionally clear defaults when user removed everything */
    const all = loadAll(campaignId);
    const raw = all[sectionId] || {};
    return {
      locationId:
        Object.prototype.hasOwnProperty.call(raw, "locationId") ? stored.locationId : defaults.locationId,
      entities: Object.prototype.hasOwnProperty.call(raw, "entities") ? stored.entities : defaults.entities,
      connections: Object.prototype.hasOwnProperty.call(raw, "connections")
        ? stored.connections
        : defaults.connections
    };
  }

  function patch(campaignId, sectionId, partial) {
    const all = loadAll(campaignId);
    const current = normalizeMeta(all[sectionId] || null);
    const next = {
      ...current,
      ...(partial || {})
    };
    if (partial && Object.prototype.hasOwnProperty.call(partial, "entities")) {
      next.entities = (partial.entities || []).map(normalizeEntity).filter(Boolean);
    }
    if (partial && Object.prototype.hasOwnProperty.call(partial, "connections")) {
      next.connections = (partial.connections || []).map(normalizeConnection).filter(Boolean);
    }
    if (partial && Object.prototype.hasOwnProperty.call(partial, "locationId")) {
      next.locationId = String(partial.locationId || "").trim();
    }
    all[sectionId] = {
      locationId: next.locationId,
      entities: next.entities,
      connections: next.connections,
      updatedAt: Date.now()
    };
    saveAll(campaignId, all);
    return get(campaignId, sectionId, null);
  }

  function setEntities(campaignId, sectionId, entities) {
    return patch(campaignId, sectionId, { entities });
  }

  function setLocationId(campaignId, sectionId, locationId, section) {
    const meta = get(campaignId, sectionId, section);
    return patch(campaignId, sectionId, {
      locationId: String(locationId || "").trim(),
      entities: meta.entities,
      connections: meta.connections
    });
  }

  function addEntity(campaignId, sectionId, entity, section) {
    const meta = get(campaignId, sectionId, section);
    const next = normalizeEntity(entity);
    if (!next) return meta;
    const without = meta.entities.filter((e) => entityKey(e) !== entityKey(next));
    return patch(campaignId, sectionId, {
      locationId: meta.locationId,
      entities: [...without, next],
      connections: meta.connections
    });
  }

  function removeEntity(campaignId, sectionId, entityId, _type, section) {
    const meta = get(campaignId, sectionId, section);
    const entities = meta.entities.filter((e) => e.id !== entityId);
    return patch(campaignId, sectionId, {
      locationId: meta.locationId,
      entities,
      connections: meta.connections
    });
  }

  function setConnections(campaignId, sectionId, connections) {
    return patch(campaignId, sectionId, { connections });
  }

  function addConnection(campaignId, sectionId, connection, section) {
    const meta = get(campaignId, sectionId, section);
    const next = normalizeConnection(connection);
    if (!next) return meta;
    const without = meta.connections.filter((c) => c.sceneId !== next.sceneId);
    return patch(campaignId, sectionId, {
      locationId: meta.locationId,
      entities: meta.entities,
      connections: [...without, next]
    });
  }

  function removeConnection(campaignId, sectionId, targetSceneId, section) {
    const meta = get(campaignId, sectionId, section);
    return patch(campaignId, sectionId, {
      locationId: meta.locationId,
      entities: meta.entities,
      connections: meta.connections.filter((c) => c.sceneId !== targetSceneId)
    });
  }

  function isTrayCollapsed(campaignId) {
    try {
      return localStorage.getItem(trayKey(campaignId)) === "1";
    } catch {
      return false;
    }
  }

  function setTrayCollapsed(campaignId, collapsed) {
    try {
      localStorage.setItem(trayKey(campaignId), collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  return {
    get,
    patch,
    setEntities,
    setLocationId,
    addEntity,
    removeEntity,
    setConnections,
    addConnection,
    removeConnection,
    isTrayCollapsed,
    setTrayCollapsed,
    normalizeEntity,
    normalizeConnection,
    defaultsFromSection
  };
})();
