/**
 * Scene design metadata — entity cast + connections per section/scene.
 * Separate from CampaignState (play status/notes) and SectionEditor (prose).
 *
 * Storage is partial overrides on top of booklet defaults (section.scene).
 * Missing override keys fall through to defaults; present empty values clear defaults.
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

  function hasOwn(obj, key) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
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

  function readOverride(campaignId, sectionId) {
    const raw = loadAll(campaignId)[sectionId];
    return raw && typeof raw === "object" ? raw : null;
  }

  /** Merge booklet defaults with local overrides (present keys win, including empties). */
  function get(campaignId, sectionId, section) {
    const defaults = defaultsFromSection(section);
    const raw = readOverride(campaignId, sectionId);
    if (!raw) return defaults;

    return {
      locationId: hasOwn(raw, "locationId") ? String(raw.locationId || "").trim() : defaults.locationId,
      entities: hasOwn(raw, "entities")
        ? (Array.isArray(raw.entities) ? raw.entities.map(normalizeEntity).filter(Boolean) : [])
        : defaults.entities,
      connections: hasOwn(raw, "connections")
        ? (Array.isArray(raw.connections) ? raw.connections.map(normalizeConnection).filter(Boolean) : [])
        : defaults.connections
    };
  }

  function getLocationId(campaignId, sectionId, section) {
    return get(campaignId, sectionId, section).locationId || "";
  }

  /**
   * Write only the keys present on `partial` as local overrides.
   * Does not snapshot unrelated effective fields — other dimensions keep falling
   * through to defaults (or their own overrides) via get().
   */
  function patch(campaignId, sectionId, partial, section) {
    const all = loadAll(campaignId);
    const existing = readOverride(campaignId, sectionId);
    const raw = existing ? { ...existing } : {};

    if (partial && hasOwn(partial, "locationId")) {
      raw.locationId = String(partial.locationId || "").trim();
    }
    if (partial && hasOwn(partial, "entities")) {
      raw.entities = (partial.entities || []).map(normalizeEntity).filter(Boolean);
    }
    if (partial && hasOwn(partial, "connections")) {
      raw.connections = (partial.connections || []).map(normalizeConnection).filter(Boolean);
    }

    raw.updatedAt = Date.now();
    all[sectionId] = raw;
    saveAll(campaignId, all);
    return get(campaignId, sectionId, section);
  }

  function setEntities(campaignId, sectionId, entities, section) {
    return patch(campaignId, sectionId, { entities }, section);
  }

  function setLocationId(campaignId, sectionId, locationId, section) {
    return patch(campaignId, sectionId, { locationId: String(locationId || "").trim() }, section);
  }

  function setConnections(campaignId, sectionId, connections, section) {
    return patch(campaignId, sectionId, { connections }, section);
  }

  function addEntity(campaignId, sectionId, entity, section) {
    const meta = get(campaignId, sectionId, section);
    const next = normalizeEntity(entity);
    if (!next) return meta;
    const without = meta.entities.filter((e) => entityKey(e) !== entityKey(next));
    return patch(campaignId, sectionId, { entities: [...without, next] }, section);
  }

  function removeEntity(campaignId, sectionId, entityId, _type, section) {
    const meta = get(campaignId, sectionId, section);
    return patch(
      campaignId,
      sectionId,
      { entities: meta.entities.filter((e) => e.id !== entityId) },
      section
    );
  }

  function addConnection(campaignId, sectionId, connection, section) {
    const meta = get(campaignId, sectionId, section);
    const next = normalizeConnection(connection);
    if (!next) return meta;
    const without = meta.connections.filter((c) => c.sceneId !== next.sceneId);
    return patch(campaignId, sectionId, { connections: [...without, next] }, section);
  }

  function removeConnection(campaignId, sectionId, targetSceneId, section) {
    const meta = get(campaignId, sectionId, section);
    return patch(
      campaignId,
      sectionId,
      { connections: meta.connections.filter((c) => c.sceneId !== targetSceneId) },
      section
    );
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
    getLocationId,
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
